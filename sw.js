// TMV PM — Service Worker (installable PWA + offline shell)
// Strategy:
//  * HTML navigation -> network-first, then exact cached page, then index shell
//  * static assets -> cache-first, then network and populate cache
//  * API requests -> always network (never cache live maintenance data)
const CACHE = 'tmv-pwa-v9';
const APP_SHELL = [
  '/',
  '/index.html',
  '/app.js',
  '/dispatch.js',
  '/dispatch.css',
  '/pwa.js',
  '/techindex.html',
  '/tech.html',
  '/assign.html',
  '/work-order-builder.html',
  '/work-order-builder.js',
  '/sms-consent.html',
  '/sms-consent.js',
  '/sms-consent.css',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/cudd-logo-sm.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(req).catch(async () => {
        const exact = await caches.match(req, {ignoreSearch:true});
        if (exact) return exact;
        return (await caches.match('/index.html')) || (await caches.match('/'));
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});

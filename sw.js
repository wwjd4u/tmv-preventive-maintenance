// TMV PM — Service Worker (installable PWA + offline support)
// Strategy:
//  * SPA navigation requests (Accept: text/html) -> network-first, fall back to cached index.html
//  * static assets (.js/.css/.png/.json) -> cache-first
//  * API requests (/api/*) -> always network (never cache live data)
const CACHE = 'tmv-pwa-v8';
const APP_SHELL = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
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
  if (url.pathname.startsWith('/api/')) return; // live data, never cache

  if (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) {
    // SPA navigation: try network, fall back to shell
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html').then((r) => r || caches.match('/')))
    );
    return;
  }

  // static asset: cache-first, then network (and populate cache)
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

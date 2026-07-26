const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');
const { DB_PATH } = db;

// Load .env (git-ignored) for local secrets — dependency-free.
(function loadDotEnv(){
  try{
    const ef = path.join(__dirname, '.env');
    if(!fs.existsSync(ef)) return;
    fs.readFileSync(ef,'utf8').split('\n').forEach(function(line){
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if(m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g,'');
    });
  }catch(e){ /* ignore missing/invalid .env */ }
})();

const PORT = 9240;
const DATA_FILE = path.join(__dirname, 'assets.json');
const CONFIG_FILE = path.join(__dirname, 'config.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const ASSIGNMENTS_FILE = path.join(__dirname, 'assignments.json');

// ── Ensure directories exist ──────────────────────────────
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ── Never let a single bad request kill the whole server ──
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err && err.message);
});

// ── Admin credentials (username / password) ──────────────
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

// ── Default config ─────────────────────────────────────────
const DEFAULT_CONFIG = {
  intervals: [30, 60, 90, 120, 180, 365],
  locations: ['Odessa', 'Snyder', 'Seminole', 'Kilgore', 'Odessa Test Shack', 'Woodlands Lab', 'UAT-Kilgore'],
  unitOptions: ['days', 'weeks', 'months']
};

function mergeTechPhones(cfg) {
  const raw = process.env.TECH_PHONES;
  if (!raw) return cfg;
  try {
    const map = JSON.parse(raw);
    if (cfg && Array.isArray(cfg.technicians)) {
      cfg.technicians.forEach(t => { if (t && map[t.name] != null) t.phone = String(map[t.name]).replace(/\D/g, ''); });
    }
  } catch (e) { /* ignore malformed TECH_PHONES */ }
  // Public app URL (e.g. Cloudflare Tunnel) so SMS links work off-network.
  const pub = process.env.APP_PUBLIC_URL;
  if (pub && cfg) cfg.appUrl = pub.replace(/\/+$/, '');
  return cfg;
}

function loadConfig() {
  return db.loadConfig();
}

function saveConfig(c) {
  db.saveConfig(c);
}

// ── Assignments (admin → technician handoff) ───────────────
function loadAssignments() {
  return db.loadAssignments();
}
function saveAssignments(list) {
  db.saveAssignments(list);
}

// ── Checklist is the single source of truth ───────────────
// Given a vanType string (possibly "A + B + C"), return the FULL expected
// checklist sections (schema only: {title, items:[{label,type}]}) filtered by
// config.json `appliesTo`. This is what every assignment MUST carry so the
// tech page, ticket, tracker and Task.db all stay in sync.
function expectedSections(vanType, config) {
  const vts = String(vanType || '')
    .split(/\s*\+\s*/).map(s => s.trim()).filter(Boolean);
  return (config.checklist || []).filter(s => {
    if (typeof s === 'string') return true;
    if (s.include === false) return false;
    return s.appliesTo.some(v => vts.indexOf(v) >= 0);
  }).map(s => {
    if (typeof s === 'string') return { title: s, items: [] };
    // Preserve the FULL item schema (label, type, opts, placeholder, etc.) so
    // the tech page's choice/select controls have the options they need.
    return {
      title: s.title,
      items: (s.items || []).map(it => Object.assign({}, it))
    };
  });
}

// Merge an incoming (possibly partial) sections array onto the FULL expected
// checklist so the stored assignment always contains the complete checklist.
// Any values the tech/admin already entered are preserved by title+label.
function reconcileSections(incoming, full) {
  const inc = Array.isArray(incoming) ? incoming : [];
  return full.map(fs => {
    const match = inc.find(x => x && x.title === fs.title);
    const items = (fs.items || []).map(fit => {
      const iit = match && Array.isArray(match.items)
        ? match.items.find(x => x && x.label === fit.label)
        : null;
      const val = iit && iit.value != null ? iit.value : '';
      // Keep the full item schema (label, type, opts, placeholder...) and only
      // overlay the previously-entered value, so choice/select controls work.
      return Object.assign({}, fit, { value: val });
    });
    return { title: fs.title, items: items };
  });
}

// ── MIME types ────────────────────────────────────────────
const MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.webp': 'image/webp', '.heic': 'image/heic',
  '.avif': 'image/avif'
};

// ── Default assets ────────────────────────────────────────
const DEFAULT_ASSETS = [
  { id: 1, name: 'Servers Cleaned & Connected', type: 'Legacy TMV', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 2, name: 'Legacy Engineer', type: 'Legacy TMV', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 3, name: 'Legacy FracLink', type: 'Legacy TMV', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 4, name: 'Legacy DASTRAC', type: 'Legacy TMV', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 5, name: 'Legacy MultiFrac 1', type: 'Legacy TMV', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 6, name: 'Legacy MultiFrac 2', type: 'Legacy TMV', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 7, name: 'Legacy Spare Station', type: 'Legacy TMV', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 8, name: 'Legacy Lab Station', type: 'Legacy TMV', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 9, name: 'System Boot & Wake-On-LAN', type: 'Virtual TMV', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 10, name: 'Anywhere USB Installed', type: 'Virtual TMV', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 11, name: 'Anywhere USB Working All Stations', type: 'Virtual TMV', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 12, name: 'Standalone Station Working', type: 'Virtual TMV', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 13, name: 'Secondary Belly Switch', type: 'Twinfrac TMV', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 14, name: 'Four Hoffman Switches', type: 'Twinfrac TMV', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 15, name: 'Twin Engineer', type: 'Twinfrac TMV', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 16, name: 'Twin FracLink', type: 'Twinfrac TMV', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 17, name: 'Twin MultiFrac', type: 'Twinfrac TMV', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 18, name: 'UPS Load Test', type: 'UPS', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 19, name: 'UPS Network Card', type: 'UPS', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 20, name: 'Generator OFF Alarm', type: 'UPS', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 21, name: 'Rack AC Installed', type: 'HVAC', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 22, name: 'Rack AC Underneath UPS', type: 'HVAC', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 23, name: 'Rack AC Drain Line', type: 'HVAC', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 24, name: 'Rack AC Exhaust Duct', type: 'HVAC', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 25, name: 'TMV AC Units Working', type: 'HVAC', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 26, name: 'Server Cabinet AC Manifold', type: 'HVAC', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 27, name: 'Server Cabinet Filter Replaced', type: 'HVAC', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 28, name: 'Mini-Split AC', type: 'HVAC', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 29, name: 'Starlink Internet Connection', type: 'Network', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 30, name: 'BEC 4G Units Configured', type: 'Network', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 31, name: 'Meraki MX Units Installed', type: 'Network', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 32, name: 'Palo Alto Firewall', type: 'Network', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 33, name: 'Wi-Fi Available', type: 'Network', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 34, name: 'Printer Over Network', type: 'Network', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 35, name: 'IoT Edge Servers', type: 'IoT Edge', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 36, name: 'Primary MultiFrac → Pumps', type: 'IoT Edge', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 37, name: 'Secondary MultiFrac → Pumps', type: 'IoT Edge', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 38, name: 'Observability Server', type: 'Observability', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 39, name: 'Time Machine (GPS Antenna)', type: 'Time Machine', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 40, name: 'DeviceMaster Installed', type: 'Serial/DM', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 41, name: 'Unnecessary DM Ports Disabled', type: 'Serial/DM', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 42, name: 'CAN Connection (Gateway/USB)', type: 'Serial/DM', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 43, name: 'Serial Inputs 1-4', type: 'Serial/DM', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 44, name: 'DAS Serial Output', type: 'Serial/DM', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 45, name: 'Engineer Ports / Slide-out Wall', type: 'Serial/DM', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 46, name: 'Meraki Environmental Sensors', type: 'Meraki Sensors', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 47, name: 'Rack Door Sensor', type: 'Meraki Sensors', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 48, name: 'Client Viewer Installed', type: 'FracLink', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
  { id: 49, name: 'Remote Viewer (Engineer)', type: 'FracLink', location: 'TMV Site', tmvId: '', interval: 30, unit: 'days', lastMaint: null, notes: '', photos: [] },
];

function loadAssets() {
  try {
    return db.loadAssets();
  } catch(e) {
    return [...DEFAULT_ASSETS];
  }
}

function saveAssets(a) {
  db.saveAssets(a);
}

function sendJson(res, s, d) {
  res.writeHead(s, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(d));
}

function serveFile(res, p, contentType) {
  fs.readFile(p, (e, d) => {
    if (e) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': contentType || 'text/html' });
    res.end(d);
  });
}

// ── Admin auth ────────────────────────────────────────────
// Token is base64("<user>:<pass>"); sent in `Authorization: Bearer <token>`.
function adminToken() {
  return Buffer.from(`${ADMIN_USER}:${ADMIN_PASS}`).toString('base64');
}
function isAdmin(token) {
  return token === adminToken();
}

// ── Password hashing (scrypt + per-user salt, constant-time compare) ──
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const d = crypto.scryptSync(pw, salt, 64).toString('hex');
  return `scrypt$${salt}$${d}`;
}
function verifyPassword(pw, stored) {
  if (typeof stored !== 'string' || !stored.startsWith('scrypt$')) return false;
  const parts = stored.split('$');
  if (parts.length !== 3) return false;
  const salt = parts[1], expected = parts[2];
  const d = crypto.scryptSync(pw, salt, 64).toString('hex');
  const a = Buffer.from(d), b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

  // ── CORS preflight ───────────────────────────────────────
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // ── Serve main page (never cache — prevents stale login screen) ──
  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    return serveFile(res, path.join(__dirname, 'index.html'));
  }

  // ── Serve DB viewer page (admin) ──
  if (url.pathname === '/db' || url.pathname === '/db.html') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    return serveFile(res, path.join(__dirname, 'db-viewer.html'));
  }

  // ── Serve technician mobile page (admin → tech handoff) ──
  const techMatch = url.pathname.match(/^\/tech\/([\w-]+)$/);
  if (techMatch) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    return serveFile(res, path.join(__dirname, 'tech.html'));
  }

  // ── Serve technician work-order index (list of open orders) ──
  if (url.pathname === '/tech' || url.pathname === '/tech/') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    return serveFile(res, path.join(__dirname, 'techindex.html'));
  }

  // ── favicon (avoid console 404 noise) ──
  if (url.pathname === '/favicon.ico') {
    res.writeHead(204); res.end();
    return;
  }

  // ── Serve static assets (.js / .css / images) with correct content-type ──
  const ext = url.pathname.split('.').pop().toLowerCase();
  const STATIC_TYPES = { js:'application/javascript', html:'text/html', css:'text/css', png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', gif:'image/gif', svg:'image/svg+xml', ico:'image/x-icon' };
  if (STATIC_TYPES[ext] && !url.pathname.startsWith('/uploads/')) {
    const safe = url.pathname.replace(/^\/+/, '').split('/').pop();
    const full = path.join(__dirname, safe);
    if (full.startsWith(__dirname)) {
      // app.js and index.html never cached; other static assets can cache.
      if (safe === 'app.js' || safe === 'index.html') {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
      }
      return serveFile(res, full, STATIC_TYPES[ext]);
    }
  }

  // ── Serve uploaded images ────────────────────────────────
  if (url.pathname.startsWith('/uploads/')) {
    const filename = path.basename(url.pathname);
    const filepath = path.join(UPLOADS_DIR, filename);
    if (filename.includes('..') || filename.includes('/')) {
      res.writeHead(403); res.end('Forbidden');
      return;
    }
    const ext = path.extname(filename).toLowerCase();
    return serveFile(res, filepath, MIME[ext] || 'application/octet-stream');
  }

  // ── GET /api/config — public config (no auth needed) ────
  // Real technician phones live in the git-ignored TECH_PHONES env var
  // (a JSON map of name -> phone) so they never hit the public repo.
  if (url.pathname === '/api/config' && req.method === 'GET') {
    sendJson(res, 200, mergeTechPhones(loadConfig()));
    return;
  }

  // ── POST /api/dispatch — build a technician ticket (public) ──
  // Body: { tmv, vanType, functions:[names], technician:{name,email,phone} }
  // Returns: ticket text + mailto + smsDigits for server-side SMS send.
  // (Email opens a mailto; SMS is sent via POST /api/sms. No WhatsApp/Telegram.)
  if (url.pathname === '/api/dispatch' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const d = JSON.parse(body);
        const tmv = (d.tmv || '').trim();
        const vanType = (d.vanType || '').trim();
        const functions = Array.isArray(d.functions) ? d.functions.filter(f => f && f.trim()) : [];
        const tech = d.technician || {};
        if (!tmv) return sendJson(res, 400, { error: 'TMV unit required' });
        if (!functions.length) return sendJson(res, 400, { error: 'Select at least one function' });
        if (!tech.name) return sendJson(res, 400, { error: 'Technician required' });

        const stamp = new Date().toLocaleString();
        const list = functions.map((f, i) => (i + 1) + '. ' + f).join('\n');
        const ticket =
          '🔧 CUDD Energy Services — Maintenance Ticket\n' +
          '────────────────────────────────\n' +
          'TMV Unit: ' + tmv + '\n' +
          'Van Type: ' + (vanType || '—') + '\n' +
          'Technician: ' + tech.name + '\n' +
          'Generated: ' + stamp + '\n' +
          '────────────────────────────────\n' +
          'FUNCTIONS TO COMPLETE:\n' + list + '\n' +
          '────────────────────────────────\n' +
          'Please confirm completion by logging each item in the PM app.';

        // SMS (server-side send). Phone must be E.164; strip non-digits.
        const smsDigits = (tech.phone || '').replace(/\D/g, '');
        // Email deep-link.
        const email = (tech.email || '').trim();
        const mailto = email
          ? 'mailto:' + email + '?subject=' + encodeURIComponent('CUDD PM Ticket — ' + tmv) +
            '&body=' + encodeURIComponent(ticket)
          : '';

        sendJson(res, 200, {
          ok: true,
          ticket,
          mailto,
          smsDigits,
          email,
          hasEmail: !!email,
          technician: tech.name
        });
      } catch (e) {
        sendJson(res, 400, { error: 'Invalid request: ' + e.message });
      }
    });
    return;
  }

  // ── POST /api/sms — actually send an SMS (server-side) ──
  // Provider selected by env SMS_PROVIDER (default: textbelt).
  // Twilio: set SMS_PROVIDER=twilio + TWILIO_SID / TWILIO_TOKEN / TWILIO_FROM (see .env, git-ignored).
  if (url.pathname === '/api/sms' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const d = JSON.parse(body);
        const to = (d.to || '').replace(/\D/g, '');
        const message = (d.message || '').toString().slice(0, 1600);
        if (!to) return sendJson(res, 400, { ok: false, error: 'Recipient phone required' });
        if (!message.trim()) return sendJson(res, 400, { ok: false, error: 'Message required' });

        const provider = (process.env.SMS_PROVIDER || 'textbelt').toLowerCase();
        let p;
        if (provider === 'twilio') p = sendViaTwilio(to, message);
        else if (provider === 'carrier') p = sendViaCarrier(to, message);
        else p = sendViaTextbelt(to, message);
        p.then(r => sendJson(res, r.ok ? 200 : 502, Object.assign({ ok: r.ok }, r)))
         .catch(e => sendJson(res, 502, { ok: false, error: 'SMS send failed: ' + e.message }));
      } catch (e) {
        sendJson(res, 400, { ok: false, error: 'Invalid request: ' + e.message });
      }
    });
    return;
  }

  // ── SMS provider helpers ───────────────────────────────
  function sendViaTextbelt(to, message) {
    return new Promise((resolve) => {
      const postData = require('querystring').stringify({ number: to, message, key: process.env.TEXTBELT_KEY || 'textbelt' });
      const req = require('https').request({
        method: 'POST',
        hostname: 'textbelt.com',
        path: '/text',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData) }
      }, (r) => {
        let data = '';
        r.on('data', c => data += c);
        r.on('end', () => {
          try {
            const j = JSON.parse(data);
            resolve({ ok: !!j.success, error: j.error || (j.success ? null : 'textbelt rejected'), quota: j.quotaRemaining, textId: j.textId });
          } catch (e) { resolve({ ok: false, error: 'bad response' }); }
        });
      });
      req.on('error', e => resolve({ ok: false, error: e.message }));
      req.write(postData);
      req.end();
    });
  }
  function sendViaTwilio(to, message) {
    const accountSid = process.env.TWILIO_SID;
    const authSid = process.env.TWILIO_API_KEY_SID || accountSid;
    const token = process.env.TWILIO_API_KEY_SECRET || process.env.TWILIO_TOKEN;
    const from = process.env.TWILIO_FROM;
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    if (!accountSid || !token || (!from && !messagingServiceSid)) return Promise.resolve({ ok: false, error: 'Twilio env not configured' });
    const auth = Buffer.from(authSid + ':' + token).toString('base64');
    // Route through the registered 10DLC Messaging Service when configured, so the
    // campaign/brand is applied (avoids carrier filtering on direct from-number sends).
    const body = { To: '+' + to, Body: message };
    if (messagingServiceSid) body.MessagingServiceSid = messagingServiceSid;
    else body.From = from;
    const postData = require('querystring').stringify(body);
    return new Promise((resolve) => {
      const req = require('https').request({
        method: 'POST',
        hostname: 'api.twilio.com',
        path: '/2010-04-01/Accounts/' + accountSid + '/Messages.json',
        headers: { 'Authorization': 'Basic ' + auth, 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData) }
      }, (r) => {
        let data = '';
        r.on('data', c => data += c);
        r.on('end', () => {
          try { const j = JSON.parse(data); resolve({ ok: !j.error_code, error: j.error_message || null, sid: j.sid }); }
          catch (e) { resolve({ ok: false, error: 'bad response' }); }
        });
      });
      req.on('error', e => resolve({ ok: false, error: e.message }));
      req.write(postData);
      req.end();
    });
  }
  function sendViaCarrier(to, message) {
    const key = process.env.SENDGRID_API_KEY, from = process.env.SENDGRID_FROM || 'pm-app@localhost', domain = process.env.CARRIER_DOMAIN || 'vtext.com';
    if (!key) return Promise.resolve({ ok: false, error: 'SendGrid env not configured (SENDGRID_API_KEY)' });
    const toAddr = to.replace(/^\+/, '') + '@' + domain;
    const payload = JSON.stringify({
      personalizations: [{ to: [{ email: toAddr }] }],
      from: { email: from },
      subject: 'PM',
      content: [{ type: 'text/plain', value: message }]
    });
    return new Promise((resolve) => {
      const req = require('https').request({
        method: 'POST', hostname: 'api.sendgrid.com',
        path: '/v3/mail/send',
        headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
      }, (r) => {
        let s = ''; r.on('data', c => s += c);
        r.on('end', () => {
          // SendGrid returns 202 Accepted with empty body on success
          if (r.statusCode === 202) resolve({ ok: true, carrier: toAddr });
          else { try { const j = JSON.parse(s); resolve({ ok: false, error: (j.errors && j.errors[0] && j.errors[0].message) || ('status ' + r.statusCode) }); }
                 catch (e) { resolve({ ok: false, error: 'status ' + r.statusCode + ' ' + s.slice(0, 200) }); } }
        });
      });
      req.on('error', e => resolve({ ok: false, error: e.message }));
      req.write(payload);
      req.end();
    });
  }

  // ── POST /api/login — authenticate admin, return bearer token ──
  if (url.pathname === '/api/login' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const d = JSON.parse(body);
        if (d.username === ADMIN_USER && d.password === ADMIN_PASS) {
          return sendJson(res, 200, { ok: true, token: adminToken() });
        }
        // Manager login: a saved manager with a matching password gets full admin token.
        const cfgMgr = (loadConfig() || {}).managers || [];
        const mgr = cfgMgr.find(m => (m.username || m.name) === d.username);
        if (mgr && verifyPassword(d.password || '', mgr.password)) {
          return sendJson(res, 200, { ok: true, token: adminToken(), manager: mgr.name || mgr.username });
        }
        return sendJson(res, 401, { error: 'Invalid credentials' });
      } catch (e) {
        sendJson(res, 400, { error: 'Invalid request: ' + e.message });
      }
    });
    return;
  }

  // ── Admin-only endpoints below ───────────────────────────
  // Check for Authorization header
  const authHeader = req.headers['authorization'] || '';
  const reqToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const isAdminReq = isAdmin(reqToken);

  // ── GET /api/admin/db — full DB dump for admin viewer (admin only) ──
  if (url.pathname === '/api/admin/db' && req.method === 'GET') {
    if (!isAdminReq) return sendJson(res, 401, { error: 'Admin required' });
    const dump = db.getAdminDump();
    return sendJson(res, 200, { ...dump, dbFile: DB_PATH });
  }

  // ── GET /api/admin/purge — wipe all temp records before production ──
  if (url.pathname === '/api/admin/purge' && req.method === 'POST') {
    if (!isAdminReq) return sendJson(res, 401, { error: 'Admin required' });
    db.purgeAssignments();
    return sendJson(res, 200, { ok: true, message: 'All assignment records purged.' });
  }

  // ── POST /api/admin/backfill — reconcile existing assignments to the full
  // checklist so every stored record carries the complete, van-type-appropriate
  // sections (main → tech → tracker → Task.db stay in sync). Values already
  // entered by techs are preserved. (admin only)
  if (url.pathname === '/api/admin/backfill' && req.method === 'POST') {
    if (!isAdminReq) return sendJson(res, 401, { error: 'Admin required' });
    const config = loadConfig();
    const assignments = loadAssignments();
    let updated = 0, missingVan = 0;
    assignments.forEach(a => {
      if (!a.vanType) { missingVan++; return; }
      const full = expectedSections(a.vanType, config);
      if (!full.length) { missingVan++; return; }
      const reconciled = reconcileSections(a.sections, full);
      a.sections = reconciled;
      updated++;
    });
    saveAssignments(assignments);
    return sendJson(res, 200, { ok: true, updated, missingVan, message: `Reconciled ${updated} assignment(s) to the full checklist.` });
  }

  // ── PUT /api/config — full config save (admin only) ─────
  // Persists the entire config object so the admin viewer can manage
  // intervals, locations, unitOptions, technicians, districts, checklist, etc.
  if (url.pathname === '/api/config' && req.method === 'PUT') {
    if (!isAdminReq) return sendJson(res, 401, { error: 'Admin required' });
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const incoming = JSON.parse(body);
        const config = loadConfig() || {};
        // Merge: keep any existing keys not present in the incoming payload,
        // then overwrite with whatever the client sent (full-save model).
        const merged = { ...config, ...incoming };
        saveConfig(merged);
        sendJson(res, 200, { ok: true, config: merged });
      } catch(e) { sendJson(res, 400, { error: e.message }); }
    });
    return;
  }

  // ── PUT /api/managers — save managers with hashed passwords (admin only) ──
  if (url.pathname === '/api/managers' && req.method === 'PUT') {
    if (!isAdminReq) return sendJson(res, 401, { error: 'Admin required' });
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const incoming = JSON.parse(body).managers || [];
        const current = (loadConfig() || {}).managers || [];
        const savedByName = {};
        current.forEach(m => { savedByName[m.username || m.name] = m; });
        const out = incoming.map(m => {
          const name = m.name || m.username || '';
          const username = m.username || m.name || '';
          const existing = savedByName[username];
          // Hash the password only if a new plaintext password was supplied;
          // otherwise preserve the already-hashed value already stored.
          let password = existing ? existing.password : '';
          if (m.password && !m.password.startsWith('scrypt$')) {
            password = hashPassword(m.password);
          }
          return { name, username, password };
        });
        const config = loadConfig() || {};
        const merged = { ...config, managers: out };
        saveConfig(merged);
        sendJson(res, 200, { ok: true, managers: out.map(m => ({ name: m.name, username: m.username })) });
      } catch (e) { sendJson(res, 400, { error: e.message }); }
    });
    return;
  }

  // ── GET /api/assets — list all assets (public) ──────────
  if (url.pathname === '/api/assets' && req.method === 'GET')
    return sendJson(res, 200, { assets: loadAssets() });

  // ── POST /api/assets — add new asset (admin only) ───────
  if (url.pathname === '/api/assets' && req.method === 'POST') {
    if (!isAdminReq) return sendJson(res, 401, { error: 'Admin required to add assets' });
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const a = JSON.parse(body);
        const assets = loadAssets();
        a.id = Date.now();
        a.tmvId = a.tmvId || '';
        a.unit = a.unit || 'days';
        a.photos = a.photos || [];
        a.lastMaint = a.lastMaint !== undefined ? a.lastMaint : null;
        assets.push(a);
        saveAssets(assets);
        sendJson(res, 200, { ok: true, asset: a });
      } catch(e) { sendJson(res, 400, { error: e.message }); }
    });
    return;
  }

  // ── PUT /api/assets/:id — update asset (public for now) ──
  const putMatch = url.pathname.match(/^\/api\/assets\/(\d+)$/);
  if (putMatch && req.method === 'PUT') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const updates = JSON.parse(body);
        const assets = loadAssets();
        const idx = assets.findIndex(a => a.id === parseInt(putMatch[1]));
        if (idx === -1) return sendJson(res, 404, { error: 'Not found' });
        assets[idx] = { ...assets[idx], ...updates };
        saveAssets(assets);
        sendJson(res, 200, { ok: true, asset: assets[idx] });
      } catch(e) { sendJson(res, 400, { error: e.message }); }
    });
    return;
  }

  // ── DELETE /api/assets/:id — delete asset (admin only) ──
  const delMatch = url.pathname.match(/^\/api\/assets\/(\d+)$/);
  if (delMatch && req.method === 'DELETE') {
    if (!isAdminReq) return sendJson(res, 401, { error: 'Admin required to delete assets' });
    const id = parseInt(delMatch[1]);
    const assets = loadAssets();
    const target = assets.find(a => a.id === id);
    // Clean up associated photos
    if (target && target.photos) {
      target.photos.forEach(p => {
        const fp = path.join(UPLOADS_DIR, p);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
      });
    }
    saveAssets(assets.filter(a => a.id !== id));
    return sendJson(res, 200, { ok: true });
  }

  // ── POST /api/assets/:id/maintain — log maintenance (public) ─
  const maintMatch = url.pathname.match(/^\/api\/assets\/(\d+)\/maintain$/);
  if (maintMatch && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { notes } = JSON.parse(body);
        const assets = loadAssets();
        const idx = assets.findIndex(a => a.id === parseInt(maintMatch[1]));
        if (idx === -1) return sendJson(res, 404, { error: 'Not found' });
        assets[idx].lastMaint = Date.now();
        assets[idx].maintBy = assets[idx].maintBy || 'field';
        if (notes) assets[idx].notes = notes;
        saveAssets(assets);
        sendJson(res, 200, { ok: true, asset: assets[idx] });
      } catch(e) { sendJson(res, 400, { error: e.message }); }
    });
    return;
  }

  // ── POST /api/inspection — log a full TMV inspection (public) ──
  if (url.pathname === '/api/inspection' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const d = JSON.parse(body);
        const tmv = (d.tmv || '').trim();
        if (!tmv) return sendJson(res, 400, { error: 'TMV required' });
        const when = d.date ? new Date(d.date).getTime() : Date.now();
        const assets = loadAssets();
        // find an asset for this TMV, else create one
        let asset = assets.find(a => a.tmvId === tmv);
        if (!asset) {
          asset = {
            id: Date.now(), name: tmv + ' Inspection', type: (d.vanType || 'TMV'),
            location: d.location || '', interval: 90, unit: 'days', lastMaint: when,
            notes: '', tmvId: tmv, photos: [], maintBy: (d.technician && d.technician.name) || 'field'
          };
          assets.push(asset);
        } else {
          asset.lastMaint = when;
          if (d.location) asset.location = d.location;
          if (d.technician && d.technician.name) asset.maintBy = d.technician.name;
        }
        asset.inspections = asset.inspections || [];
        asset.inspections.push({
          date: when,
          technician: (d.technician && d.technician.name) || '',
          location: d.location || '',
          sections: d.sections || []
        });
        saveAssets(assets);
        sendJson(res, 200, { ok: true, asset });
      } catch (e) { sendJson(res, 400, { error: e.message }); }
    });
    return;
  }

  // ── POST /api/assets/:id/photos — upload photo (public) ──
  const photoUploadMatch = url.pathname.match(/^\/api\/assets\/(\d+)\/photos$/);
  if (photoUploadMatch && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { data, name } = JSON.parse(body);
        if (!data) return sendJson(res, 400, { error: 'No image data' });
        const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
        const ext = path.extname(name || 'photo.jpg') || '.jpg';
        const filename = `${photoUploadMatch[1]}_${Date.now()}${ext}`;
        const filepath = path.join(UPLOADS_DIR, filename);
        fs.writeFileSync(filepath, Buffer.from(base64Data, 'base64'));
        const assets = loadAssets();
        const idx = assets.findIndex(a => a.id === parseInt(photoUploadMatch[1]));
        if (idx === -1) return sendJson(res, 404, { error: 'Asset not found' });
        if (!assets[idx].photos) assets[idx].photos = [];
        assets[idx].photos.push(filename);
        saveAssets(assets);
        sendJson(res, 200, { ok: true, photo: filename });
      } catch(e) { sendJson(res, 400, { error: e.message }); }
    });
    return;
  }

  // ── POST /api/assets/:id/photos/delete — delete photo ───
  const photoDelMatch = url.pathname.match(/^\/api\/assets\/(\d+)\/photos\/delete$/);
  if (photoDelMatch && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { photo } = JSON.parse(body);
        if (!photo) return sendJson(res, 400, { error: 'No photo filename' });
        const assets = loadAssets();
        const idx = assets.findIndex(a => a.id === parseInt(photoDelMatch[1]));
        if (idx === -1) return sendJson(res, 404, { error: 'Asset not found' });
        if (assets[idx].photos) {
          assets[idx].photos = assets[idx].photos.filter(p => p !== photo);
        }
        const filepath = path.join(UPLOADS_DIR, photo);
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        saveAssets(assets);
        sendJson(res, 200, { ok: true });
      } catch(e) { sendJson(res, 400, { error: e.message }); }
    });
    return;
  }

  // ── Assignments API (admin assigns work → technician mobile completes) ──

  // POST /api/assignments — create a work assignment (public; desktop admin)
  // Body: { tmv, vanType, location, technician, date, sections:[{title,items:[{label,type}]}] }
  if (url.pathname === '/api/assignments' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const d = JSON.parse(body);
        if (!d.tmv) return sendJson(res, 400, { error: 'TMV unit required' });
        if (!d.technician) return sendJson(res, 400, { error: 'Technician required' });
        // Normalize technician: accept either a plain name string or a full object.
        let techIn = d.technician;
        if (typeof techIn === 'string') techIn = { name: techIn };
        techIn = {
          name: techIn.name || 'Unassigned',
          email: techIn.email || '',
          phone: techIn.phone || ''
        };
        const config = loadConfig();
        const full = expectedSections(d.vanType, config);
        const sections = reconcileSections(d.sections, full);
        if (!sections.length) return sendJson(res, 400, { error: 'No checklist sections apply to this van type' });
        const assignments = loadAssignments();
        const assignment = {
          id: crypto.randomBytes(6).toString('hex'),
          tmv: d.tmv,
          vanType: d.vanType || '',
          location: d.location || '',
          technician: techIn,
          date: d.date || new Date().toISOString().slice(0, 10),
          createdAt: Date.now(),
          status: 'assigned',           // assigned → in_progress → completed
          order: loadAssignments().filter(a => (a.technician && (a.technician.name || a.technician)) === (techIn.name || techIn)).length,
          sections,                     // [{title, items:[{label,type}]}]
          results: null,                // filled by technician
          completedAt: null,
          photos: []                    // [{file, caption}] filenames in uploads/
        };
        assignments.push(assignment);
        saveAssignments(assignments);
        sendJson(res, 200, { ok: true, assignment });
      } catch (e) { sendJson(res, 400, { error: e.message }); }
    });
    return;
  }

  // GET /api/assignments — list all (desktop status board)
  if (url.pathname === '/api/assignments' && req.method === 'GET') {
    return sendJson(res, 200, { assignments: loadAssignments() });
  }

  // GET /api/assignments/:id — technician fetches their assignment
  const assignGet = url.pathname.match(/^\/api\/assignments\/([\w-]+)$/);
  if (assignGet && req.method === 'GET') {
    const a = loadAssignments().find(x => x.id === assignGet[1]);
    if (!a) return sendJson(res, 404, { error: 'Assignment not found' });
    return sendJson(res, 200, { assignment: a });
  }

  // PUT /api/assignments/:id — technician saves progress / completes
  // Body: { status, results:[{title,items:[{label,type,value}]}], photos:[{file,caption}] }
  const assignPut = url.pathname.match(/^\/api\/assignments\/([\w-]+)$/);
  if (assignPut && req.method === 'PUT') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const d = JSON.parse(body);
        const assignments = loadAssignments();
        const idx = assignments.findIndex(x => x.id === assignPut[1]);
        if (idx === -1) return sendJson(res, 404, { error: 'Assignment not found' });
        if (d.status) assignments[idx].status = d.status;
        if (d.results) assignments[idx].results = d.results;
        if (Array.isArray(d.photos)) assignments[idx].photos = d.photos;
        if (typeof d.order === 'number' && isFinite(d.order)) assignments[idx].order = d.order;
        // Persist reassignment to a different technician (drag-and-drop move).
        if (d.technician) {
          if (typeof d.technician === 'string') assignments[idx].technician = { name: d.technician };
          else if (typeof d.technician === 'object') assignments[idx].technician = d.technician;
        }
        if (d.status === 'completed') assignments[idx].completedAt = Date.now();
        saveAssignments(assignments);
        sendJson(res, 200, { ok: true, assignment: assignments[idx] });
      } catch (e) { sendJson(res, 400, { error: e.message }); }
    });
    return;
  }

  // ── PATCH /api/assignments/order — bulk-save drag reorder + reassignment ──
  // Body: { items: [{ id, technician, order }] }  (technician may be null/'' = Unassigned)
  if (url.pathname === '/api/assignments/order' && req.method === 'PATCH') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const d = JSON.parse(body);
        const updates = Array.isArray(d.items) ? d.items : [];
        const assignments = loadAssignments();
        const byId = {};
        assignments.forEach(a => { byId[a.id] = a; });
        updates.forEach(u => {
          const a = byId[u.id];
          if (!a) return;
          if (typeof u.order === 'number' && isFinite(u.order)) a.order = u.order;
          if ('technician' in u) {
            const t = u.technician;
            a.technician = t ? (typeof t === 'string' ? { name: t } : t) : { name: '' };
          }
        });
        saveAssignments(assignments);
        sendJson(res, 200, { ok: true, saved: updates.length });
      } catch (e) { sendJson(res, 400, { error: e.message }); }
    });
    return;
  }

  // DELETE /api/assignments/:id — remove a single assignment (admin only). NOT a purge.
  const assignDel = url.pathname.match(/^\/api\/assignments\/([\w-]+)$/);
  if (assignDel && req.method === 'DELETE') {
    if (!isAdminReq) return sendJson(res, 401, { error: 'Admin required to delete assignments' });
    const assignments = loadAssignments();
    const idx = assignments.findIndex(x => x.id === assignDel[1]);
    if (idx === -1) return sendJson(res, 404, { error: 'Assignment not found' });
    const removed = assignments[idx];
    // Clean up associated photo files for this assignment only
    if (Array.isArray(removed.photos)) {
      removed.photos.forEach(p => {
        const fp = path.join(UPLOADS_DIR, p.file || p);
        try { if (fp && fs.existsSync(fp)) fs.unlinkSync(fp); } catch (e) {}
      });
    }
    assignments.splice(idx, 1);
    saveAssignments(assignments);
    return sendJson(res, 200, { ok: true, deleted: removed.id });
  }

  // POST /api/assignments/:id/photos — upload a photo (base64) for an assignment
  const assignPhoto = url.pathname.match(/^\/api\/assignments\/([\w-]+)\/photos$/);
  if (assignPhoto && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { data, name, caption } = JSON.parse(body);
        if (!data) return sendJson(res, 400, { error: 'No image data' });
        const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
        const ext = path.extname(name || 'photo.jpg') || '.jpg';
        const filename = `${assignPhoto[1]}_${Date.now()}${ext}`;
        fs.writeFileSync(path.join(UPLOADS_DIR, filename), Buffer.from(base64Data, 'base64'));
        const assignments = loadAssignments();
        const idx = assignments.findIndex(x => x.id === assignPhoto[1]);
        if (idx === -1) return sendJson(res, 404, { error: 'Assignment not found' });
        if (!assignments[idx].photos) assignments[idx].photos = [];
        assignments[idx].photos.push({ file: filename, caption: caption || '' });
        saveAssignments(assignments);
        sendJson(res, 200, { ok: true, photo: { file: filename, caption: caption || '' } });
      } catch (e) { sendJson(res, 400, { error: e.message }); }
    });
    return;
  }

  // POST /api/assignments/demo — seed sample demo work orders for testing
  if (url.pathname === '/api/assignments/demo' && req.method === 'POST') {
    const config = loadConfig();
    const allSecs = config.checklist || [];
    const pick = (titles) => allSecs.filter(s => titles.indexOf(s.title) >= 0)
      .map(s => ({ title: s.title, items: (s.items||[]).map(i => ({ label: i.label, type: i.type, opts: i.opts })) }));
    const norm = (t) => t.replace(/\s+/g,' ').trim();
    const demo = [
      { tmv:'TMV57449B', vanType:'Virtual TMV', location:'Odessa', technician:'Mike Stettler',
        sections: pick(['Virtual TMV','Network and Server Components','UPS and Power Systems']) },
      { tmv:'TMV57744B', vanType:'Legacy TMV', location:'Kilgore', technician:'Johnathon Gouge',
        sections: pick(['Legacy TMV','Serial and DeviceMaster','Monitors']) },
      { tmv:'TMV57560B', vanType:'Twinfrac TMV', location:'Seminole', technician:'Payton Calicutt',
        sections: pick(['Twinfrac TMV','FracLink','Observability Server']) }
    ];
    const assignments = loadAssignments();
    const created = demo.map(d => ({
      id: crypto.randomBytes(6).toString('hex'),
      tmv: d.tmv, vanType: d.vanType, location: d.location, technician: d.technician,
      date: new Date().toISOString().slice(0,10), createdAt: Date.now(),
      status: 'assigned', sections: d.sections, results: null, completedAt: null, photos: []
    }));
    saveAssignments(assignments.concat(created));
    return sendJson(res, 200, { ok: true, created });
  }

  res.writeHead(404); res.end('Not found');
}).listen(PORT, '0.0.0.0', () => {
  console.log(`🏭 TMV Master App running at http://0.0.0.0:${PORT} (all interfaces)`);
  console.log(`   Windows access: http://localhost:${PORT}`);
  console.log(`   Admin login: POST /api/login  (user: ${ADMIN_USER} / pass: ${ADMIN_PASS})`);
});

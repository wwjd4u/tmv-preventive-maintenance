const smsConsent = require('./sms-consent-server');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');
const { buildWorkOrder } = require('./work-orders');
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

const PORT = Number(process.env.PORT || 9240);
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

// ── Superuser credentials — private environment only ─────
const ADMIN_USER = String(process.env.ADMIN_USER || '').trim();
const ADMIN_PASS = String(process.env.ADMIN_PASS || '');
if (!ADMIN_USER || !ADMIN_PASS) {
  console.warn('[auth] ADMIN_USER / ADMIN_PASS are not configured; Superuser login is disabled.');
}

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

// ── DevIoT position feed (Microsoft Entra ID / API-key protected) ────────
// The vendor dashboard (deviotinfo.azurewebsites.net/tmv-dashboard) is gated
// by Entra ID. We never expose those secrets to the browser — this server
// proxies the position feed and exposes it at GET /api/positions as
// { [tmvId]: { lat, lng } }, so the Tracker's geofence column can flip to
// On-site / Off-site. Configure via env vars (see .env.example.deviot). If no
// credentials are present the feed is simply "not live" and the Tracker keeps
// showing "Fence set". Token + payload are cached so we don't hammer the API.
const DEVIOT = {
  authority: process.env.DEVIOT_AUTHORITY || 'https://login.windows.net/bda43523-4404-4833-b00d-90e88aa1f2b3',
  clientId: process.env.DEVIOT_CLIENT_ID || '',
  clientSecret: process.env.DEVIOT_CLIENT_SECRET || '',
  resource: process.env.DEVIOT_RESOURCE || 'e87edb1a-d08f-417f-87ff-dce775153729',
  base: process.env.DEVIOT_BASE || 'https://deviotinfo.azurewebsites.net',
  path: process.env.DEVIOT_POSITIONS_PATH || '/api/positions',
  apiKey: process.env.DEVIOT_API_KEY || '',
  apiKeyHeader: process.env.DEVIOT_API_KEY_HEADER || 'x-api-key',
  noAuth: (process.env.DEVIOT_NO_AUTH === 'true'),   // for known-open / test endpoints (no token)
  cacheMs: (process.env.DEVIOT_CACHE_MS && +process.env.DEVIOT_CACHE_MS) || 60000
};
let _deviotCache = { at: 0, data: null, logged: false };

async function deviotGetToken() {
  if (!DEVIOT.clientId || !DEVIOT.clientSecret) return null;
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: DEVIOT.clientId,
    client_secret: DEVIOT.clientSecret,
    scope: `${DEVIOT.resource}/.default`
  });
  try {
    const r = await fetch(`${DEVIOT.authority}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });
    if (!r.ok) { console.error('[deviot] token request failed', r.status); return null; }
    const j = await r.json().catch(() => null);
    return j && j.access_token ? j.access_token : null;
  } catch (e) { console.error('[deviot] token error', e.message); return null; }
}

function num(v) { return (v == null ? null : +v); }
// Best-effort normalization of an unknown vendor payload into { tmvId:{lat,lng} }.
function deviotNormalize(raw) {
  const out = {};
  let arr = null;
  if (Array.isArray(raw)) arr = raw;
  else if (raw && typeof raw === 'object') {
    const maybe = raw.items || raw.data || raw.results || raw.positions || raw.units || raw.value;
    arr = Array.isArray(maybe) ? maybe : null;
    if (!arr) { // assume a keyed map of tmvId -> {lat,lng}
      Object.keys(raw).forEach(k => {
        const v = raw[k];
        const lat = num(v && v.lat != null ? v.lat : v.latitude);
        const lng = num(v && v.lng != null ? v.lng : v.longitude);
        if (lat != null && lng != null) out[k] = { lat, lng };
      });
      return out;
    }
  }
  if (arr) arr.forEach(it => {
    if (!it) return;
    const id = it.tmv || it.id || it.unit || it.tmvId || it.name;
    const pos = it.position || {};
    const lat = num(it.lat != null ? it.lat : it.latitude != null ? it.latitude : pos.lat != null ? pos.lat : pos.latitude);
    const lng = num(it.lng != null ? it.lng : it.lon != null ? it.lon : it.longitude != null ? it.longitude : pos.lng != null ? pos.lng : pos.lon != null ? pos.lon : pos.longitude);
    if (id != null && lat != null && lng != null) out[String(id)] = { lat, lng };
  });
  return out;
}

async function fetchDevIoTPositions() {
  const configured = DEVIOT.clientId || DEVIOT.clientSecret || DEVIOT.apiKey || DEVIOT.noAuth;
  if (!configured) return null; // no feed configured
  const now = Date.now();
  if (_deviotCache.data && now - _deviotCache.at < DEVIOT.cacheMs) return _deviotCache.data;
  try {
    const headers = { 'Accept': 'application/json' };
    let token = null;
    if (DEVIOT.apiKey) headers[DEVIOT.apiKeyHeader] = DEVIOT.apiKey;
    else if (!DEVIOT.noAuth) { token = await deviotGetToken(); if (token) headers['Authorization'] = 'Bearer ' + token; }
    if (!DEVIOT.apiKey && !DEVIOT.noAuth && !token) return null;
    const r = await fetch(DEVIOT.base + DEVIOT.path, { headers });
    if (!r.ok) { console.error('[deviot] positions HTTP', r.status); return _deviotCache.data || {}; }
    const raw = await r.json().catch(() => null);
    if (raw && !_deviotCache.logged) { console.log('[deviot] raw positions sample:', JSON.stringify(raw).slice(0, 500)); _deviotCache.logged = true; }
    const norm = deviotNormalize(raw);
    _deviotCache = { at: now, data: norm, logged: true };
    return norm;
  } catch (e) {
    console.error('[deviot] fetch failed', e.message);
    return _deviotCache.data || {};
  }
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

// ── Role-aware auth sessions ───────────────────────────────
// Built-in admin is the Superuser. Saved manager accounts receive Manager
// sessions. Tokens are random server-side session IDs, not reusable admin creds.
const authSessions = new Map();
const AUTH_IDLE_MINUTES = Math.max(1, Number(process.env.AUTH_IDLE_MINUTES || 15));
const AUTH_IDLE_MS = AUTH_IDLE_MINUTES * 60 * 1000;
function newAuthSession(role, username, name) {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  authSessions.set(token, { role, username, name: name || username, createdAt: now, lastActivity: now });
  return token;
}
function getAuthSession(token) {
  if (!token) return null;
  const session = authSessions.get(token) || null;
  if (!session) return null;
  const last = session.lastActivity || session.createdAt || 0;
  if (Date.now() - last >= AUTH_IDLE_MS) {
    authSessions.delete(token);
    return null;
  }
  session.lastActivity = Date.now();
  return session;
}
function isAdmin(token) {
  const s = getAuthSession(token);
  return !!s && (s.role === 'superuser' || s.role === 'manager');
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
    const fp = path.join(__dirname, 'favicon.ico');
    if (fs.existsSync(fp)) return serveFile(res, fp, 'image/x-icon');
    res.writeHead(204); res.end();
    return;
  }

  // ── Serve PWA manifest (installable app metadata) ──
  if (url.pathname === '/manifest.webmanifest' || url.pathname === '/manifest.json') {
    return serveFile(res, path.join(__dirname, 'manifest.webmanifest'), 'application/manifest+json');
  }
  // ── Serve PWA service worker (must be served from root scope) ──
  if (url.pathname === '/sw.js') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Service-Worker-Allowed', '/');
    return serveFile(res, path.join(__dirname, 'sw.js'), 'application/javascript');
  }
  // ── Serve PWA icons ──
  if (['/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'].includes(url.pathname)) {
    const fn = url.pathname.replace(/^\//, '');
    return serveFile(res, path.join(__dirname, fn), 'image/png');
  }

  // ── Serve static assets (.js / .css / images) with correct content-type ──
  const ext = url.pathname.split('.').pop().toLowerCase();
  const STATIC_TYPES = { js:'application/javascript', html:'text/html', css:'text/css', png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', gif:'image/gif', svg:'image/svg+xml', ico:'image/x-icon', webmanifest:'application/manifest+json' };
  if (STATIC_TYPES[ext] && !url.pathname.startsWith('/uploads/')) {
    const safe = url.pathname.replace(/^\/+/, '').split('/').pop();
    const full = path.join(__dirname, safe);
    if (full.startsWith(__dirname)) {
      // app.js and index.html never cached; other static assets can cache.
      if (['app.js','index.html','assign.html','privacy.html','terms.html','sms-consent.html','sms-consent.js'].includes(safe)) {
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

  if (smsConsent.handle(req, res, url, db, () => mergeTechPhones(loadConfig()))) return;

  // ── GET /api/config — public config (no auth needed) ────
  // Real technician phones live in the git-ignored TECH_PHONES env var
  // (a JSON map of name -> phone) so they never hit the public repo.
  if (url.pathname === '/api/config' && req.method === 'GET') {
    sendJson(res, 200, mergeTechPhones(loadConfig()));
    return;
  }

  // ── GET /api/positions — DevIoT live position feed (proxied) ──
  // Returns { positions:{ [tmvId]:{lat,lng} }, live:bool }. When the feed is
  // not configured (no credentials) live:false and positions:{} — the Tracker
  // geofence column then shows "Fence set". Admin-only to avoid leaking the
  // vendor feed shape to the public technician app.
  if (url.pathname === '/api/positions' && req.method === 'GET') {
    const auth = req.headers['authorization'] || '';
    const ok = auth === 'Basic ' + Buffer.from(`${ADMIN_USER}:${ADMIN_PASS}`).toString('base64');
    // Unauthenticated (or not-yet-configured) → return empty feed (200) so the
    // tracker renders without stalling. No vendor data is leaked: positions is {}.
    if (!ok) { sendJson(res, 200, { live: false, positions: {} }); return; }
    fetchDevIoTPositions().then(function (positions) {
      sendJson(res, 200, { live: !!positions, positions: positions || {} });
    }).catch(function (e) {
      sendJson(res, 200, { live: false, positions: {}, error: e.message });
    });
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
        const to = smsConsent.normalizePhone(d.to);
        const message = (d.message || '').toString().slice(0, 1600);
        if (!to) return sendJson(res, 400, { ok: false, error: 'Recipient phone required' });
        if (!message.trim()) return sendJson(res, 400, { ok: false, error: 'Message required' });

        const blocked = smsConsent.sendBlockReason(to, db, process.env);
        if (blocked) return sendJson(res, 403, { ok: false, error: blocked });
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
        if (ADMIN_USER && ADMIN_PASS && d.username === ADMIN_USER && d.password === ADMIN_PASS) {
          const token = newAuthSession('superuser', ADMIN_USER, 'Superuser');
          return sendJson(res, 200, { ok: true, token, role: 'superuser', name: 'Superuser' });
        }
        // Saved manager login receives a Manager session with restricted Setup rights.
        const cfgMgr = (loadConfig() || {}).managers || [];
        const mgr = cfgMgr.find(m => (m.username || m.name) === d.username);
        if (mgr && verifyPassword(d.password || '', mgr.password)) {
          const token = newAuthSession('manager', mgr.username || mgr.name, mgr.name || mgr.username);
          return sendJson(res, 200, { ok: true, token, role: 'manager', name: mgr.name || mgr.username });
        }
        return sendJson(res, 401, { error: 'Invalid credentials' });
      } catch (e) {
        sendJson(res, 400, { error: 'Invalid request: ' + e.message });
      }
    });
    return;
  }

  // ── Auth session inspection / logout ─────────────────────
  if (url.pathname === '/api/session' && req.method === 'GET') {
    const auth = req.headers['authorization'] || '';
    const tok = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const session = getAuthSession(tok);
    if (!session) return sendJson(res, 401, { error: 'Login required' });
    return sendJson(res, 200, { ok: true, role: session.role, name: session.name, username: session.username });
  }

  if (url.pathname === '/api/logout' && req.method === 'POST') {
    const auth = req.headers['authorization'] || '';
    const tok = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (tok) authSessions.delete(tok);
    return sendJson(res, 200, { ok: true });
  }

  // ── Admin-only endpoints below ───────────────────────────
  // Check for Authorization header
  const authHeader = req.headers['authorization'] || '';
  const reqToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const authSession = getAuthSession(reqToken);
  const isSuperuserReq = !!authSession && authSession.role === 'superuser';
  const isManagerReq = !!authSession && authSession.role === 'manager';
  const isAdminReq = isSuperuserReq || isManagerReq; // operational admin access

  // ── GET /api/admin/db — full DB dump for admin viewer (admin only) ──
  if (url.pathname === '/api/admin/db' && req.method === 'GET') {
    if (!isAdminReq) return sendJson(res, 401, { error: 'Manager or Superuser required' });
    const dump = db.getAdminDump();
    return sendJson(res, 200, { ...dump, dbFile: DB_PATH, auth: { role: authSession.role, name: authSession.name } });
  }

  // ── GET /api/admin/purge — wipe all temp records before production ──
  if (url.pathname === '/api/admin/purge' && req.method === 'POST') {
    if (!isSuperuserReq) return sendJson(res, 403, { error: 'Superuser required' });
    db.purgeAssignments();
    return sendJson(res, 200, { ok: true, message: 'All assignment records purged.' });
  }

  // ── POST /api/admin/backfill — reconcile existing assignments to the full
  // checklist so every stored record carries the complete, van-type-appropriate
  // sections (main → tech → tracker → Task.db stay in sync). Values already
  // entered by techs are preserved. (admin only)
  if (url.pathname === '/api/admin/backfill' && req.method === 'POST') {
    if (!isSuperuserReq) return sendJson(res, 403, { error: 'Superuser required' });
    const config = loadConfig();
    const assignments = loadAssignments();
    let updated = 0, missingVan = 0;
    assignments.forEach(a => {
      if (Array.isArray(a.selectedSectionTitles)) return; // Preserve deliberately scoped work orders.
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
    if (!isAdminReq) return sendJson(res, 401, { error: 'Manager or Superuser required' });
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const incoming = JSON.parse(body);
        const config = loadConfig() || {};
        let merged;
        if (isSuperuserReq) {
          merged = { ...config, ...incoming };
        } else {
          // Managers may operate Setup, but cannot modify Maintenance Categories
          // and cannot delete Setup data other than Technicians.
          merged = { ...config, ...incoming };
          merged.checklist = config.checklist || [];

          const oldLoc = Array.isArray(config.locations) ? config.locations : [];
          const newLoc = Array.isArray(incoming.locations) ? incoming.locations : oldLoc;
          merged.locations = oldLoc.concat(newLoc.filter(x => oldLoc.indexOf(x) < 0));

          const oldDistricts = Array.isArray(config.districts) ? config.districts : [];
          const newDistricts = Array.isArray(incoming.districts) ? incoming.districts : oldDistricts;
          merged.districts = oldDistricts.concat(newDistricts.filter(x => oldDistricts.indexOf(x) < 0));

          const oldIntervals = Array.isArray(config.intervals) ? config.intervals : [];
          const newIntervals = Array.isArray(incoming.intervals) ? incoming.intervals : oldIntervals;
          merged.intervals = oldIntervals.concat(newIntervals.filter(x => oldIntervals.indexOf(x) < 0));

          const oldUnits = Array.isArray(config.unitOptions) ? config.unitOptions : [];
          const newUnits = Array.isArray(incoming.unitOptions) ? incoming.unitOptions : oldUnits;
          merged.unitOptions = oldUnits.concat(newUnits.filter(x => oldUnits.indexOf(x) < 0));

          merged.tmvVanMap = { ...(config.tmvVanMap || {}), ...(incoming.tmvVanMap || {}) };
          merged.geofences = { ...(config.geofences || {}), ...(incoming.geofences || {}) };
          // Technicians are the one Setup list Managers may add/edit/delete.
          if (Array.isArray(incoming.technicians)) merged.technicians = incoming.technicians;
        }
        saveConfig(merged);
        sendJson(res, 200, { ok: true, config: merged });
      } catch(e) { sendJson(res, 400, { error: e.message }); }
    });
    return;
  }

  // ── PUT /api/managers — Superuser full control; Managers may add/update but not remove ──
  if (url.pathname === '/api/managers' && req.method === 'PUT') {
    if (!isAdminReq) return sendJson(res, 401, { error: 'Manager or Superuser required' });
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const incoming = JSON.parse(body).managers || [];
        const current = (loadConfig() || {}).managers || [];
        if (isManagerReq) {
          const incomingKeys = new Set(incoming.map(m => m.username || m.name));
          const removed = current.some(m => !incomingKeys.has(m.username || m.name));
          if (removed) return sendJson(res, 403, { error: 'Managers may add or update managers but cannot delete managers' });
        }
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
          const phone = (m.phone || (existing && existing.phone) || '').trim();
          return { name, username, phone, password, role: 'manager' };
        });
        const config = loadConfig() || {};
        const merged = { ...config, managers: out };
        saveConfig(merged);
        sendJson(res, 200, { ok: true, managers: out.map(m => ({ name: m.name, username: m.username, phone: m.phone })) });
      } catch (e) { sendJson(res, 400, { error: e.message }); }
    });
    return;
  }

  // ── GET /api/assets — list all assets (public) ──────────
  if (url.pathname === '/api/assets' && req.method === 'GET')
    return sendJson(res, 200, { assets: loadAssets() });

  // ── POST /api/assets — add new asset (admin only) ───────
  if (url.pathname === '/api/assets' && req.method === 'POST') {
    if (!isAdminReq) return sendJson(res, 401, { error: 'Manager or Superuser required to add assets' });
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
    if (!isSuperuserReq) return sendJson(res, 403, { error: 'Superuser required to delete assets' });
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

  // Combined workflow: one transaction, retry-safe, no automatic messages.
  // Same access policy as the existing assignment creation route.
  if (url.pathname === '/api/work-orders' && req.method === 'POST') {
    let body = '', tooLarge = false;
    req.on('data', chunk => {
      if (tooLarge) return;
      body += chunk;
      if (Buffer.byteLength(body) > 256 * 1024) { tooLarge = true; body = ''; }
    });
    req.on('end', () => {
      if (tooLarge) return sendJson(res, 413, { error: 'Request too large' });
      try {
        const work = buildWorkOrder(JSON.parse(body), mergeTechPhones(loadConfig()));
        work.order = loadAssignments().filter(a => (a.technician?.name || a.technician) === work.technician.name).length;
        const saved = db.createWorkOrder(work);
        sendJson(res, saved.replayed ? 200 : 201, { ok: true, ...saved, ticket: saved.assignment.report.text });
      } catch (error) {
        sendJson(res, error.status || (error instanceof SyntaxError ? 400 : 500),
          { error: error.status || error instanceof SyntaxError ? error.message : 'Unable to save work order' });
      }
    });
    return;
  }

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

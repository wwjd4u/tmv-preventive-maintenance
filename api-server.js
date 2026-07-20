const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 9240;
const DATA_FILE = path.join(__dirname, 'assets.json');
const CONFIG_FILE = path.join(__dirname, 'config.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const ASSIGNMENTS_FILE = path.join(__dirname, 'assignments.json');

// ── Ensure directories exist ──────────────────────────────
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ── Default config ─────────────────────────────────────────
const DEFAULT_CONFIG = {
  intervals: [30, 60, 90, 120, 180, 365],
  locations: ['Odessa', 'Snyder', 'Seminole', 'Kilgore', 'Odessa Test Shack', 'Woodlands Lab', 'UAT-Kilgore'],
  unitOptions: ['days', 'weeks', 'months']
};

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch(e) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf8');
    return { ...DEFAULT_CONFIG };
  }
}

function saveConfig(c) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(c, null, 2), 'utf8');
}

// ── Assignments (admin → technician handoff) ───────────────
function loadAssignments() {
  try {
    return JSON.parse(fs.readFileSync(ASSIGNMENTS_FILE, 'utf8'));
  } catch(e) {
    return [];
  }
}
function saveAssignments(list) {
  fs.writeFileSync(ASSIGNMENTS_FILE, JSON.stringify(list, null, 2), 'utf8');
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
    const assets = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return assets.map(a => ({
      ...a,
      tmvId: a.tmvId || '',
      unit: a.unit || 'days',
      photos: a.photos || []
    }));
  } catch(e) {
    return [...DEFAULT_ASSETS];
  }
}

function saveAssets(a) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(a, null, 2), 'utf8');
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

  // ── Serve static assets (.js / .css / images) with correct content-type ──
  const ext = url.pathname.split('.').pop().toLowerCase();
  const STATIC_TYPES = { js:'application/javascript', html:'text/html', css:'text/css', png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', gif:'image/gif', svg:'image/svg+xml', ico:'image/x-icon' };
  if (STATIC_TYPES[ext]) {
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
  if (url.pathname === '/api/config' && req.method === 'GET') {
    sendJson(res, 200, loadConfig());
    return;
  }

  // ── POST /api/dispatch — build a technician ticket (public) ──
  // Body: { tmv, vanType, functions:[names], technician:{name,whatsapp,telegram} }
  // Returns: ticket text + wa.me / t.me deep-links.
  // (For now delivery is a click-to-send deep-link. Swap sendTicket() for a
  //  real WhatsApp/Telegram API later without touching the UI.)
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

        // WhatsApp deep-link (wa.me). Phone must be E.164; strip non-digits.
        const waDigits = (tech.whatsapp || '').replace(/\D/g, '');
        const waLink = waDigits
          ? 'https://wa.me/' + waDigits + '?text=' + encodeURIComponent(ticket)
          : '';
        // Telegram deep-link (t.me/share). Uses @handle if present.
        const tgHandle = (tech.telegram || '').replace(/^@/, '');
        const tgLink = tgHandle
          ? 'https://t.me/share/url?url=' + encodeURIComponent('CUDD PM Ticket') +
            '&text=' + encodeURIComponent(ticket)
          : '';

        sendJson(res, 200, {
          ok: true,
          ticket,
          waLink,
          tgLink,
          hasWhatsapp: !!waDigits,
          hasTelegram: !!tgHandle,
          technician: tech.name
        });
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

  // ── PUT /api/config — update settings (admin only) ─────
  if (url.pathname === '/api/config' && req.method === 'PUT') {
    if (!isAdminReq) return sendJson(res, 401, { error: 'Admin required' });
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const updates = JSON.parse(body);
        const config = loadConfig();
        if (updates.intervals) {
          // Sort and validate intervals
          config.intervals = updates.intervals.map(Number).filter(n => n > 0 && !isNaN(n)).sort((a,b) => a - b);
        }
        if (updates.locations) {
          config.locations = updates.locations.filter(l => l.trim());
        }
        if (updates.unitOptions) {
          config.unitOptions = updates.unitOptions.filter(u => u.trim());
        }
        saveConfig(config);
        sendJson(res, 200, { ok: true, config: {
          intervals: config.intervals,
          locations: config.locations,
          unitOptions: config.unitOptions
        }});
      } catch(e) { sendJson(res, 400, { error: e.message }); }
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
        const config = loadConfig();
        const sections = Array.isArray(d.sections) ? d.sections : [];
        if (!sections.length) return sendJson(res, 400, { error: 'Select at least one checklist section' });
        const assignments = loadAssignments();
        const assignment = {
          id: crypto.randomBytes(6).toString('hex'),
          tmv: d.tmv,
          vanType: d.vanType || '',
          location: d.location || '',
          technician: d.technician,
          date: d.date || new Date().toISOString().slice(0, 10),
          createdAt: Date.now(),
          status: 'assigned',           // assigned → in_progress → completed
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
        if (d.status === 'completed') assignments[idx].completedAt = Date.now();
        saveAssignments(assignments);
        sendJson(res, 200, { ok: true, assignment: assignments[idx] });
      } catch (e) { sendJson(res, 400, { error: e.message }); }
    });
    return;
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
});

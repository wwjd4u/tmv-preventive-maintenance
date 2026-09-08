// db.js — SQLite-backed store for the TMV app (replaces flat JSON files)
// Stores temp/demo records; wipe them before production with purgeAssignments().
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.TMV_DB_PATH || path.join(__dirname, 'tmv.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    status TEXT,
    technician TEXT,
    completedAt INTEGER
  );
  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sms_consent_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    data TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sms_consent_phone ON sms_consent_events(phone, id);
  CREATE TABLE IF NOT EXISTS work_order_logs (
    assignment_id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
`);

// ---- migration: seed from existing JSON files on first run only ----
function seedFromJSON() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM assignments').get().c;
  const readJSON = (f) => {
    try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; }
  };
  const a = readJSON(path.join(__dirname, 'assignments.json'));
  if (count === 0 && Array.isArray(a) && a.length) {
    const ins = db.prepare('INSERT OR REPLACE INTO assignments (id, data, status, technician, completedAt) VALUES (@id, @data, @status, @technician, @completedAt)');
    const tx = db.transaction((items) => {
      for (const x of items) ins.run({ id: x.id, data: JSON.stringify(x), status: x.status, technician: typeof x.technician === 'object' ? x.technician?.name || null : x.technician || null, completedAt: x.completedAt || null });
    });
    tx(a);
    console.log(`[db] seeded ${a.length} assignments from assignments.json`);
  }
  const as = readJSON(path.join(__dirname, 'assets.json'));
  if (db.prepare('SELECT COUNT(*) AS c FROM assets').get().c === 0 && Array.isArray(as) && as.length) {
    const ins = db.prepare('INSERT OR REPLACE INTO assets (id, data) VALUES (@id, @data)');
    const tx = db.transaction((items) => {
      for (const x of items) ins.run({ id: String(x.id), data: JSON.stringify(x) });
    });
    tx(as);
    console.log(`[db] seeded ${as.length} assets from assets.json`);
  }
  const cfg = readJSON(path.join(__dirname, 'config.json'));
  if (cfg && !db.prepare('SELECT 1 FROM config WHERE key = ?').get('app')) {
    db.prepare('INSERT OR REPLACE INTO config (key, data) VALUES (?, ?)').run('app', JSON.stringify(cfg));
    console.log('[db] seeded config from config.json');
  }
}
seedFromJSON();

// ---- assignments ----
function loadAssignments() {
  return db.prepare('SELECT data FROM assignments').all().map(r => JSON.parse(r.data));
}
const createWorkOrder = db.transaction((assignment) => {
  const existing = db.prepare('SELECT data FROM assignments WHERE id = ?').get(assignment.id);
  if (existing) {
    const saved = JSON.parse(existing.data);
    if (saved.requestHash !== assignment.requestHash) {
      const error = new Error('Request ID already used for different work'); error.status = 409; throw error;
    }
    return { assignment: saved, replayed: true };
  }
  db.prepare('INSERT INTO assignments (id, data, status, technician, completedAt) VALUES (?, ?, ?, ?, ?)')
    .run(assignment.id, JSON.stringify(assignment), assignment.status, assignment.technician.name, null);
  db.prepare('INSERT INTO work_order_logs (assignment_id, data) VALUES (?, ?)')
    .run(assignment.id, JSON.stringify(assignment.dispatchLog));
  return { assignment, replayed: false };
});
function saveAssignments(list) {
  const ins = db.prepare('INSERT OR REPLACE INTO assignments (id, data, status, technician, completedAt) VALUES (@id, @data, @status, @technician, @completedAt)');
  const tx = db.transaction((items) => {
    db.prepare('DELETE FROM assignments').run();
    for (const x of items) {
      const techName = (typeof x.technician === 'object' && x.technician) ? (x.technician.name || 'Unassigned') : (x.technician || null);
      ins.run({ id: x.id, data: JSON.stringify(x), status: x.status, technician: techName, completedAt: x.completedAt || null });
    }
  });
  tx(list || []);
}
function purgeAssignments() {
  db.prepare('DELETE FROM assignments').run();
}

// ---- assets ----
function loadAssets() {
  return db.prepare('SELECT data FROM assets').all().map(r => JSON.parse(r.data));
}
function saveAssets(list) {
  const ins = db.prepare('INSERT OR REPLACE INTO assets (id, data) VALUES (@id, @data)');
  const tx = db.transaction((items) => {
    db.prepare('DELETE FROM assets').run();
    for (const x of items) ins.run({ id: String(x.id), data: JSON.stringify(x) });
  });
  tx(list || []);
}

// ---- config ----
function loadConfig() {
  const row = db.prepare('SELECT data FROM config WHERE key = ?').get('app');
  if (row) return JSON.parse(row.data);
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8')); } catch { return {}; }
}
function saveConfig(c) {
  db.prepare('INSERT OR REPLACE INTO config (key, data) VALUES (?, ?)').run('app', JSON.stringify(c));
}

// ---- full DB dump for admin viewer ----
function getAdminDump() {
  const assignments = db.prepare('SELECT id, status, technician, completedAt, data FROM assignments ORDER BY completedAt DESC, rowid DESC').all();
  const assets = db.prepare('SELECT id, data FROM assets').all();
  const configRow = db.prepare('SELECT data FROM config WHERE key = ?').get('app');
  return {
    assignments: assignments.map(r => ({ ...JSON.parse(r.data), _id: r.id, _status: r.status, _technician: r.technician, _completedAt: r.completedAt })),
    assets: assets.map(r => JSON.parse(r.data)),
    config: configRow ? JSON.parse(configRow.data) : {}
  };
}

// ---- individual asset CRUD ----
function getAssetById(id) {
  const row = db.prepare('SELECT data FROM assets WHERE id = ?').get(String(id));
  return row ? JSON.parse(row.data) : null;
}
function upsertAsset(asset) {
  db.prepare('INSERT OR REPLACE INTO assets (id, data) VALUES (?, ?)').run(String(asset.id), JSON.stringify(asset));
}
function deleteAssetById(id) {
  db.prepare('DELETE FROM assets WHERE id = ?').run(String(id));
}
function getAllAssets() {
  return db.prepare('SELECT data FROM assets').all().map(r => JSON.parse(r.data));
}

function recordSmsConsent(event) {
  db.prepare('INSERT INTO sms_consent_events (phone, data) VALUES (?, ?)').run(event.phone, JSON.stringify(event));
}
function hasSmsConsent(phone) {
  const row = db.prepare('SELECT data FROM sms_consent_events WHERE phone = ? ORDER BY id DESC LIMIT 1').get(phone);
  return !!row && JSON.parse(row.data).action === 'subscribe';
}

module.exports = {
  recordSmsConsent, hasSmsConsent,
  createWorkOrder,
  loadAssignments, saveAssignments, purgeAssignments,
  loadAssets, saveAssets,
  getAdminDump,
  DB_PATH,
  getAssetById, upsertAsset, deleteAssetById, getAllAssets,
  loadConfig, saveConfig
};

// db.js — SQLite-backed store for the TMV app (replaces flat JSON files)
// Stores temp/demo records; wipe them before production with purgeAssignments().
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'tmv.db');
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
`);

// ---- migration: seed from existing JSON files on first run only ----
function seedFromJSON() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM assignments').get().c;
  if (count > 0) return;
  const readJSON = (f) => {
    try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; }
  };
  const a = readJSON(path.join(__dirname, 'assignments.json'));
  if (Array.isArray(a) && a.length) {
    const ins = db.prepare('INSERT OR REPLACE INTO assignments (id, data, status, technician, completedAt) VALUES (@id, @data, @status, @technician, @completedAt)');
    const tx = db.transaction((items) => {
      for (const x of items) ins.run({ id: x.id, data: JSON.stringify(x), status: x.status, technician: x.technician || null, completedAt: x.completedAt || null });
    });
    tx(a);
    console.log(`[db] seeded ${a.length} assignments from assignments.json`);
  }
  const as = readJSON(path.join(__dirname, 'assets.json'));
  if (Array.isArray(as) && as.length) {
    const ins = db.prepare('INSERT OR REPLACE INTO assets (id, data) VALUES (@id, @data)');
    const tx = db.transaction((items) => {
      for (const x of items) ins.run({ id: String(x.id), data: JSON.stringify(x) });
    });
    tx(as);
    console.log(`[db] seeded ${as.length} assets from assets.json`);
  }
  const cfg = readJSON(path.join(__dirname, 'config.json'));
  if (cfg) {
    db.prepare('INSERT OR REPLACE INTO config (key, data) VALUES (?, ?)').run('app', JSON.stringify(cfg));
    console.log('[db] seeded config from config.json');
  }
}
seedFromJSON();

// ---- assignments ----
function loadAssignments() {
  return db.prepare('SELECT data FROM assignments').all().map(r => JSON.parse(r.data));
}
function saveAssignments(list) {
  const ins = db.prepare('INSERT OR REPLACE INTO assignments (id, data, status, technician, completedAt) VALUES (@id, @data, @status, @technician, @completedAt)');
  const tx = db.transaction((items) => {
    db.prepare('DELETE FROM assignments').run();
    for (const x of items) ins.run({ id: x.id, data: JSON.stringify(x), status: x.status, technician: x.technician || null, completedAt: x.completedAt || null });
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

module.exports = {
  loadAssignments, saveAssignments, purgeAssignments,
  loadAssets, saveAssets,
  getAdminDump,
  DB_PATH,
  getAssetById, upsertAsset, deleteAssetById, getAllAssets,
  loadConfig, saveConfig
};

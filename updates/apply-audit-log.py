from pathlib import Path

DB = Path('db.js')
API = Path('api-server.js')
VIEW = Path('db-viewer.html')


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'MISSING MARKER: {label}')
    return text.replace(old, new, 1)

# ---------------- db.js ----------------
db = DB.read_text()
db = replace_once(db,
"""  CREATE TABLE IF NOT EXISTS work_order_logs (\n    assignment_id TEXT PRIMARY KEY,\n    data TEXT NOT NULL\n  );\n`);""",
"""  CREATE TABLE IF NOT EXISTS work_order_logs (\n    assignment_id TEXT PRIMARY KEY,\n    data TEXT NOT NULL\n  );\n  CREATE TABLE IF NOT EXISTS audit_log (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    at INTEGER NOT NULL,\n    actor TEXT,\n    actor_role TEXT,\n    action TEXT NOT NULL,\n    target TEXT,\n    old_value TEXT,\n    new_value TEXT,\n    details TEXT\n  );\n  CREATE INDEX IF NOT EXISTS audit_log_at ON audit_log(at DESC);\n`);""",
'audit table')

db = replace_once(db,
"""// ---- full DB dump for admin viewer ----\nfunction getAdminDump() {""",
"""// ---- permanent administrative/system audit log ----\nfunction auditJson(value) {\n  if (value == null) return null;\n  if (typeof value === 'string') return value;\n  try { return JSON.stringify(value); } catch (_) { return String(value); }\n}\nfunction recordAudit(event) {\n  const e = event || {};\n  db.prepare(`INSERT INTO audit_log (at, actor, actor_role, action, target, old_value, new_value, details)\n              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(\n    Number(e.at || Date.now()),\n    e.actor || '', e.actorRole || '', e.action || 'unknown', e.target || '',\n    auditJson(e.oldValue), auditJson(e.newValue), auditJson(e.details)\n  );\n}\nfunction parseAuditJson(value) {\n  if (value == null || value === '') return null;\n  try { return JSON.parse(value); } catch (_) { return value; }\n}\nfunction getAuditLog(limit) {\n  const n = Math.min(1000, Math.max(1, Number(limit || 200)));\n  return db.prepare(`SELECT id, at, actor, actor_role AS actorRole, action, target, old_value AS oldValue, new_value AS newValue, details\n                     FROM audit_log ORDER BY id DESC LIMIT ?`).all(n).map(r => ({\n    ...r, oldValue: parseAuditJson(r.oldValue), newValue: parseAuditJson(r.newValue), details: parseAuditJson(r.details)\n  }));\n}\nfunction recordDeployment(commit, branch) {\n  const c = String(commit || '').trim();\n  if (!c) return;\n  const last = db.prepare(`SELECT details FROM audit_log WHERE action = 'deployment' ORDER BY id DESC LIMIT 1`).get();\n  if (last) {\n    const d = parseAuditJson(last.details);\n    if (d && d.commit === c) return;\n  }\n  recordAudit({ actor: 'system', actorRole: 'system', action: 'deployment', target: 'TMV Maintenance App', details: { commit: c, branch: branch || '' } });\n}\n\n// ---- full DB dump for admin viewer ----\nfunction getAdminDump() {""",
'audit functions')

db = replace_once(db,
"""module.exports = {\n  recordSmsConsent, hasSmsConsent,""",
"""module.exports = {\n  recordAudit, getAuditLog, recordDeployment,\n  recordSmsConsent, hasSmsConsent,""",
'audit exports')
DB.write_text(db)

# ---------------- api-server.js ----------------
api = API.read_text()
api = replace_once(api,
"""function saveConfig(c) {\n  db.saveConfig(c);\n}\n""",
"""function saveConfig(c) {\n  db.saveConfig(c);\n}\n\nfunction auditEvent(session, action, target, oldValue, newValue, details) {\n  try {\n    db.recordAudit({\n      actor: session ? (session.username || session.name || 'unknown') : 'system',\n      actorRole: session ? (session.role || '') : 'system',\n      action, target, oldValue, newValue, details\n    });\n  } catch (e) { console.error('[audit]', e.message); }\n}\nfunction auditConfigSummary(cfg) {\n  const c = cfg || {};\n  const names = arr => (Array.isArray(arr) ? arr : []).map(x => typeof x === 'string' ? x : (x && (x.name || x.username)) || '').filter(Boolean);\n  const accounts = arr => (Array.isArray(arr) ? arr : []).map(x => ({ name: (x && x.name) || '', username: (x && x.username) || '' }));\n  return {\n    locations: Array.isArray(c.locations) ? c.locations : [],\n    districts: Array.isArray(c.districts) ? c.districts : [],\n    technicians: names(c.technicians),\n    managers: accounts(c.managers),\n    superusers: accounts(c.superusers),\n    intervals: Array.isArray(c.intervals) ? c.intervals : [],\n    unitOptions: Array.isArray(c.unitOptions) ? c.unitOptions : [],\n    tmvUnits: Object.keys(c.tmvVanMap || {}).sort(),\n    geofences: Object.keys(c.geofences || {}).sort(),\n    checklist: (Array.isArray(c.checklist) ? c.checklist : []).map(x => typeof x === 'string' ? x : (x && x.title) || '').filter(Boolean)\n  };\n}\nfunction currentGitDeployment() {\n  try {\n    const gitDir = path.join(__dirname, '.git');\n    const head = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim();\n    if (head.startsWith('ref: ')) {\n      const ref = head.slice(5).trim();\n      let commit = '';\n      try { commit = fs.readFileSync(path.join(gitDir, ref), 'utf8').trim(); } catch (_) {}\n      if (!commit) {\n        try {\n          const packed = fs.readFileSync(path.join(gitDir, 'packed-refs'), 'utf8').split(/\\r?\\n/);\n          const hit = packed.find(line => line && !line.startsWith('#') && line.endsWith(' ' + ref));\n          if (hit) commit = hit.split(' ')[0];\n        } catch (_) {}\n      }\n      return { commit, branch: ref.replace(/^refs\\/heads\\//, '') };\n    }\n    return { commit: head, branch: 'detached' };\n  } catch (_) { return { commit: '', branch: '' }; }\n}\nconst _deployment = currentGitDeployment();\nif (_deployment.commit) { try { db.recordDeployment(_deployment.commit, _deployment.branch); } catch (e) { console.error('[audit deployment]', e.message); } }\n""",
'audit helpers')

api = replace_once(api,
"""        const finalUser = nextUser || ADMIN_USER;\n        const finalPass = nextPass || ADMIN_PASS;\n        updatePrivateEnv({ ADMIN_USER: finalUser, ADMIN_PASS: finalPass });""",
"""        const oldUser = ADMIN_USER;\n        const finalUser = nextUser || ADMIN_USER;\n        const finalPass = nextPass || ADMIN_PASS;\n        updatePrivateEnv({ ADMIN_USER: finalUser, ADMIN_PASS: finalPass });""",
'credential old user')
api = replace_once(api,
"""        process.env.ADMIN_USER = finalUser;\n        process.env.ADMIN_PASS = finalPass;\n        authSessions.clear();""",
"""        process.env.ADMIN_USER = finalUser;\n        process.env.ADMIN_PASS = finalPass;\n        auditEvent(session, 'superuser_credentials_updated', 'Recovery Superuser',\n          { username: oldUser }, { username: finalUser },\n          { usernameChanged: oldUser !== finalUser, passwordChanged: !!nextPass });\n        authSessions.clear();""",
'credential audit')

api = replace_once(api,
"""  // ── Superuser-only User Roles management ────────────────\n  if (url.pathname === '/api/user-roles' && req.method === 'GET') {""",
"""  // ── Superuser-only permanent audit log ─────────────────\n  if (url.pathname === '/api/audit-log' && req.method === 'GET') {\n    if (!isSuperuserReq) return sendJson(res, 403, { error: 'Superuser required' });\n    const limit = Math.min(1000, Math.max(1, Number(url.searchParams.get('limit') || 200)));\n    return sendJson(res, 200, { ok: true, entries: db.getAuditLog(limit) });\n  }\n\n  // ── Superuser-only User Roles management ────────────────\n  if (url.pathname === '/api/user-roles' && req.method === 'GET') {""",
'audit endpoint')

api = replace_once(api,
"""        saveConfig(cfg);\n\n        // Any live session for the changed account is invalidated immediately.""",
"""        saveConfig(cfg);\n        auditEvent(authSession, 'user_role_changed', rec.name || rec.username || key,\n          { role: sourceRole }, { role: nextRole }, { username: rec.username || '' });\n\n        // Any live session for the changed account is invalidated immediately.""",
'role audit')

api = replace_once(api,
"""    db.purgeAssignments();\n    return sendJson(res, 200, { ok: true, message: 'All assignment records purged.' });""",
"""    const purgeCount = loadAssignments().length;\n    db.purgeAssignments();\n    auditEvent(authSession, 'assignments_purged', 'All assignment records', { count: purgeCount }, { count: 0 }, null);\n    return sendJson(res, 200, { ok: true, message: 'All assignment records purged.' });""",
'purge audit')

api = replace_once(api,
"""    saveAssignments(assignments);\n    return sendJson(res, 200, { ok: true, updated, missingVan, message: `Reconciled ${updated} assignment(s) to the full checklist.` });""",
"""    saveAssignments(assignments);\n    auditEvent(authSession, 'assignments_backfilled', 'Assignment checklists', null, null, { updated, missingVan });\n    return sendJson(res, 200, { ok: true, updated, missingVan, message: `Reconciled ${updated} assignment(s) to the full checklist.` });""",
'backfill audit')

api = replace_once(api,
"""        saveConfig(merged);\n        sendJson(res, 200, { ok: true, config: merged });""",
"""        const beforeAudit = auditConfigSummary(config);\n        const afterAudit = auditConfigSummary(merged);\n        const changedKeys = Object.keys(afterAudit).filter(k => JSON.stringify(beforeAudit[k]) !== JSON.stringify(afterAudit[k]));\n        saveConfig(merged);\n        auditEvent(authSession, 'setup_config_updated', 'Setup', beforeAudit, afterAudit, { changedKeys });\n        sendJson(res, 200, { ok: true, config: merged });""",
'config audit')

api = replace_once(api,
"""        const merged = { ...config, managers: out };\n        saveConfig(merged);\n        sendJson(res, 200, { ok: true, managers: out.map(m => ({ name: m.name, username: m.username, phone: m.phone })) });""",
"""        const merged = { ...config, managers: out };\n        saveConfig(merged);\n        auditEvent(authSession, 'managers_updated', 'Managers',\n          current.map(m => ({ name: m.name || '', username: m.username || '' })),\n          out.map(m => ({ name: m.name || '', username: m.username || '' })),\n          { passwordUpdatedFor: incoming.filter(m => m.password && !String(m.password).startsWith('scrypt$')).map(m => m.username || m.name || '').filter(Boolean) });\n        sendJson(res, 200, { ok: true, managers: out.map(m => ({ name: m.name, username: m.username, phone: m.phone })) });""",
'manager audit')

api = replace_once(api,
"""        assets.push(a);\n        saveAssets(assets);\n        sendJson(res, 200, { ok: true, asset: a });""",
"""        assets.push(a);\n        saveAssets(assets);\n        auditEvent(authSession, 'asset_added', a.tmvId || a.name || String(a.id), null,\n          { id: a.id, tmvId: a.tmvId || '', name: a.name || '', type: a.type || '', location: a.location || '' }, null);\n        sendJson(res, 200, { ok: true, asset: a });""",
'asset add audit')

api = replace_once(api,
"""    saveAssets(assets.filter(a => a.id !== id));\n    return sendJson(res, 200, { ok: true });""",
"""    saveAssets(assets.filter(a => a.id !== id));\n    auditEvent(authSession, 'asset_deleted', target ? (target.tmvId || target.name || String(id)) : String(id),\n      target ? { id: target.id, tmvId: target.tmvId || '', name: target.name || '', type: target.type || '', location: target.location || '' } : null, null, null);\n    return sendJson(res, 200, { ok: true });""",
'asset delete audit')

API.write_text(api)

# ---------------- db-viewer.html ----------------
view = VIEW.read_text()
view = replace_once(view,
"""      <section class=\"mblock\" id=\"userRolesBlock\" style=\"display:none\">\n        <h3>User Roles</h3>\n        <div style=\"font-size:13px;color:#666;margin-bottom:10px\">Superuser-only role management. The Recovery Superuser is locked. Role changes take effect immediately and sign out the changed account.</div>\n        <div id=\"userRolesList\"><div class=\"empty\">Loading users…</div></div>\n        <div id=\"userRolesStatus\" class=\"saved-ok\" style=\"display:block;margin:10px 0 0\"></div>\n      </section>\n""",
"""      <section class=\"mblock\" id=\"userRolesBlock\" style=\"display:none\">\n        <h3>User Roles</h3>\n        <div style=\"font-size:13px;color:#666;margin-bottom:10px\">Superuser-only role management. The Recovery Superuser is locked. Role changes take effect immediately and sign out the changed account.</div>\n        <div id=\"userRolesList\"><div class=\"empty\">Loading users…</div></div>\n        <div id=\"userRolesStatus\" class=\"saved-ok\" style=\"display:block;margin:10px 0 0\"></div>\n      </section>\n\n      <section class=\"mblock\" id=\"auditLogBlock\" style=\"display:none;grid-column:1/-1\">\n        <h3>Audit Log</h3>\n        <div class=\"bar\" style=\"margin-bottom:10px\">\n          <span class=\"muted\" style=\"margin-left:0\">Permanent SQLite record of administrative and deployment changes. Passwords are never stored in the audit log.</span>\n          <button class=\"btn ghost sm\" onclick=\"loadAuditLog()\" style=\"margin-left:auto\">↻ Refresh Audit</button>\n        </div>\n        <div class=\"tbl-wrap\">\n          <table>\n            <thead><tr><th>Date / Time</th><th>User</th><th>Role</th><th>Action</th><th>Target</th><th>Details</th></tr></thead>\n            <tbody id=\"auditLogBody\"><tr><td colspan=\"6\">Loading…</td></tr></tbody>\n          </table>\n        </div>\n      </section>\n""",
'audit UI')

view = replace_once(view,
"""function changeUserRole(key,currentRoleValue){""",
"""function auditDisplayValue(v){\n  if(v == null || v === '') return '';\n  if(typeof v === 'string') return v;\n  try { return JSON.stringify(v); } catch(e) { return String(v); }\n}\nfunction loadAuditLog(){\n  if(currentRole !== 'superuser') return;\n  fetch('/api/audit-log?limit=250',{headers:authHdr()})\n    .then(function(r){ return r.json().then(function(d){ return {ok:r.ok,d:d}; }); })\n    .then(function(x){\n      if(!x.ok) throw new Error((x.d&&x.d.error)||'Could not load audit log');\n      var body=document.getElementById('auditLogBody'); if(!body) return;\n      var rows=x.d.entries||[];\n      body.innerHTML=rows.length?rows.map(function(e){\n        var detail=e.details!=null?e.details:(e.newValue!=null?e.newValue:e.oldValue);\n        return '<tr><td>'+esc(new Date(e.at).toLocaleString())+'</td><td>'+esc(e.actor||'')+'</td><td>'+esc(e.actorRole||'')+'</td><td>'+esc(e.action||'')+'</td><td>'+esc(e.target||'')+'</td><td style=\"max-width:420px;white-space:normal\">'+esc(auditDisplayValue(detail))+'</td></tr>';\n      }).join(''):'<tr><td colspan=\"6\" class=\"empty\">No audit records yet.</td></tr>';\n    }).catch(function(e){ var body=document.getElementById('auditLogBody'); if(body) body.innerHTML='<tr><td colspan=\"6\">'+esc(e.message||'Could not load audit log')+'</td></tr>'; });\n}\n\nfunction changeUserRole(key,currentRoleValue){""",
'audit JS')

view = replace_once(view,
"""  var userRoles = document.getElementById('userRolesBlock');\n  if(userRoles) userRoles.style.display = currentRole === 'superuser' ? '' : 'none';""",
"""  var userRoles = document.getElementById('userRolesBlock');\n  if(userRoles) userRoles.style.display = currentRole === 'superuser' ? '' : 'none';\n  var auditLog = document.getElementById('auditLogBlock');\n  if(auditLog) auditLog.style.display = currentRole === 'superuser' ? '' : 'none';""",
'audit visibility')

view = replace_once(view,
"""      if(currentRole === 'superuser') { try { loadUserRoles(); } catch(e){ console.error('loadUserRoles', e); } }""",
"""      if(currentRole === 'superuser') {\n        try { loadUserRoles(); } catch(e){ console.error('loadUserRoles', e); }\n        try { loadAuditLog(); } catch(e){ console.error('loadAuditLog', e); }\n      }""",
'audit load')

VIEW.write_text(view)
print('AUDIT_PATCH_OK')

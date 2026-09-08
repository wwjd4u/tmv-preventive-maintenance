#!/usr/bin/env python3
from pathlib import Path
import sys

root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('.')
api = root / 'api-server.js'
dbv = root / 'db-viewer.html'
chg = root / 'CHANGELOG.md'

api_text = api.read_text()
dbv_text = dbv.read_text()

# 1) Sanitize public config so credential hashes never leave the server.
old = """  // ── GET /api/config — public config (no auth needed) ────\n  // Real technician phones live in the git-ignored TECH_PHONES env var\n  // (a JSON map of name -> phone) so they never hit the public repo.\n  if (url.pathname === '/api/config' && req.method === 'GET') {\n    sendJson(res, 200, mergeTechPhones(loadConfig()));\n    return;\n  }\n"""
new = """  // ── GET /api/config — public config (no auth needed) ────\n  // Real technician phones live in the git-ignored TECH_PHONES env var.\n  // Password hashes / privileged account metadata are stripped before response.\n  if (url.pathname === '/api/config' && req.method === 'GET') {\n    const raw = mergeTechPhones(loadConfig()) || {};\n    const pub = { ...raw };\n    pub.technicians = (raw.technicians || []).map(function(t){\n      if (typeof t === 'string') return t;\n      const x = { ...t }; delete x.password; delete x.role; return x;\n    });\n    pub.managers = (raw.managers || []).map(function(m){\n      const x = { ...m }; delete x.password; delete x.role; return x;\n    });\n    delete pub.superusers;\n    delete pub.roleAudit;\n    sendJson(res, 200, pub);\n    return;\n  }\n"""
if old in api_text:
    api_text = api_text.replace(old, new, 1)
elif "delete pub.superusers" not in api_text:
    raise SystemExit('public config marker not found')

# 2) Track auth source in sessions so only the recovery owner can rotate .env credentials.
old = """function newAuthSession(role, username, name) {\n  const token = crypto.randomBytes(32).toString('hex');\n  const now = Date.now();\n  authSessions.set(token, { role, username, name: name || username, createdAt: now, lastActivity: now });\n  return token;\n}\n"""
new = """function newAuthSession(role, username, name, authSource) {\n  const token = crypto.randomBytes(32).toString('hex');\n  const now = Date.now();\n  authSessions.set(token, { role, username, name: name || username, authSource: authSource || 'account', createdAt: now, lastActivity: now });\n  return token;\n}\n"""
if old in api_text:
    api_text = api_text.replace(old, new, 1)
elif "authSource: authSource" not in api_text:
    raise SystemExit('session marker not found')

# 3) Recovery + additional Superuser + Manager authentication.
old = """        if (ADMIN_USER && ADMIN_PASS && d.username === ADMIN_USER && d.password === ADMIN_PASS) {\n          const token = newAuthSession('superuser', ADMIN_USER, 'Superuser');\n          return sendJson(res, 200, { ok: true, token, role: 'superuser', name: 'Superuser' });\n        }\n        // Saved manager login receives a Manager session with restricted Setup rights.\n        const cfgMgr = (loadConfig() || {}).managers || [];\n        const mgr = cfgMgr.find(m => (m.username || m.name) === d.username);\n"""
new = """        if (ADMIN_USER && ADMIN_PASS && d.username === ADMIN_USER && d.password === ADMIN_PASS) {\n          const token = newAuthSession('superuser', ADMIN_USER, 'Superuser', 'recovery');\n          return sendJson(res, 200, { ok: true, token, role: 'superuser', name: 'Superuser' });\n        }\n        const cfgAuth = loadConfig() || {};\n        const extraSu = (cfgAuth.superusers || []).find(s => (s.username || s.name) === d.username);\n        if (extraSu && verifyPassword(d.password || '', extraSu.password)) {\n          const token = newAuthSession('superuser', extraSu.username || extraSu.name, extraSu.name || extraSu.username, 'account');\n          return sendJson(res, 200, { ok: true, token, role: 'superuser', name: extraSu.name || extraSu.username });\n        }\n        // Saved manager login receives a Manager session with restricted Setup rights.\n        const cfgMgr = cfgAuth.managers || [];\n        const mgr = cfgMgr.find(m => (m.username || m.name) === d.username);\n"""
if old in api_text:
    api_text = api_text.replace(old, new, 1)
elif "const extraSu =" not in api_text:
    raise SystemExit('login marker not found')

# 4) Recovery credential rotation restricted to recovery owner account only.
old = """    if (!session || session.role !== 'superuser') return sendJson(res, 403, { error: 'Superuser required' });\n"""
new = """    if (!session || session.role !== 'superuser' || session.authSource !== 'recovery') return sendJson(res, 403, { error: 'Recovery Superuser required' });\n"""
# only first occurrence after the credential route is expected
marker = "// ── Superuser credential rotation"
pos = api_text.find(marker)
if pos < 0:
    raise SystemExit('credential route marker not found')
sub = api_text[pos:]
if old in sub:
    sub = sub.replace(old, new, 1)
    api_text = api_text[:pos] + sub
elif "Recovery Superuser required" not in sub:
    raise SystemExit('credential authorization marker not found')

# 5) Insert role-management endpoints after auth flags.
anchor = """  const isSuperuserReq = !!authSession && authSession.role === 'superuser';\n  const isManagerReq = !!authSession && authSession.role === 'manager';\n  const isAdminReq = isSuperuserReq || isManagerReq; // operational admin access\n\n"""
roles_code = r"""  const isSuperuserReq = !!authSession && authSession.role === 'superuser';
  const isManagerReq = !!authSession && authSession.role === 'manager';
  const isAdminReq = isSuperuserReq || isManagerReq; // operational admin access

  // ── Superuser-only User Roles management ────────────────
  if (url.pathname === '/api/user-roles' && req.method === 'GET') {
    if (!isSuperuserReq) return sendJson(res, 403, { error: 'Superuser required' });
    const cfg = loadConfig() || {};
    const users = [];
    users.push({ key: '__recovery__', name: 'Recovery Superuser', username: ADMIN_USER, role: 'superuser', recovery: true, loginReady: !!(ADMIN_USER && ADMIN_PASS) });
    (cfg.superusers || []).forEach(function(u){ users.push({ key: u.username || u.name, name: u.name || u.username || '', username: u.username || '', role: 'superuser', recovery: false, loginReady: !!(u.username && u.password) }); });
    (cfg.managers || []).forEach(function(u){ users.push({ key: u.username || u.name, name: u.name || u.username || '', username: u.username || '', role: 'manager', recovery: false, loginReady: !!(u.username && u.password) }); });
    (cfg.technicians || []).forEach(function(raw){
      const u = typeof raw === 'string' ? { name: raw } : raw;
      users.push({ key: u.username || u.name, name: u.name || u.username || '', username: u.username || '', role: 'technician', recovery: false, loginReady: !!(u.username && u.password) });
    });
    return sendJson(res, 200, { ok: true, users, audit: (cfg.roleAudit || []).slice(-25).reverse() });
  }

  if (url.pathname === '/api/user-roles' && req.method === 'PUT') {
    if (!isSuperuserReq) return sendJson(res, 403, { error: 'Superuser required' });
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const d = JSON.parse(body || '{}');
        const sourceRole = String(d.currentRole || '').toLowerCase();
        const nextRole = String(d.newRole || '').toLowerCase();
        const key = String(d.key || '').trim();
        if (key === '__recovery__') return sendJson(res, 400, { error: 'The Recovery Superuser role is locked.' });
        if (!['superuser','manager','technician'].includes(sourceRole) || !['superuser','manager','technician'].includes(nextRole)) {
          return sendJson(res, 400, { error: 'Invalid role selection' });
        }
        if (!key) return sendJson(res, 400, { error: 'User is required' });
        if (sourceRole === nextRole) return sendJson(res, 200, { ok: true, message: 'Role unchanged' });

        const cfg = loadConfig() || {};
        cfg.superusers = Array.isArray(cfg.superusers) ? cfg.superusers : [];
        cfg.managers = Array.isArray(cfg.managers) ? cfg.managers : [];
        cfg.technicians = Array.isArray(cfg.technicians) ? cfg.technicians : [];
        const lists = { superuser: cfg.superusers, manager: cfg.managers, technician: cfg.technicians };
        const src = lists[sourceRole];
        const idx = src.findIndex(function(raw){
          const u = typeof raw === 'string' ? { name: raw } : raw;
          return (u.username || u.name) === key;
        });
        if (idx < 0) return sendJson(res, 404, { error: 'User not found in current role' });
        let rec = src[idx];
        if (typeof rec === 'string') rec = { name: rec, email: '', phone: '', username: '', password: '' };
        rec = { ...rec };
        rec.name = rec.name || rec.username || key;

        if (!rec.username && nextRole !== 'technician') {
          rec.username = String(rec.name || '').toLowerCase().replace(/[^a-z0-9._@-]+/g, '.').replace(/^\.+|\.+$/g, '');
        }
        const proposedKey = rec.username || rec.name;
        const allPriv = cfg.superusers.concat(cfg.managers).filter(function(x){ return x !== src[idx]; });
        if (nextRole !== 'technician') {
          if (!proposedKey) return sendJson(res, 400, { error: 'A username is required for Manager or Superuser access' });
          if (proposedKey === ADMIN_USER) return sendJson(res, 400, { error: 'That username is reserved by the Recovery Superuser' });
          const dup = allPriv.some(function(u){ return (u.username || u.name) === proposedKey; });
          if (dup) return sendJson(res, 400, { error: 'That username is already in use' });
        }
        if (nextRole === 'superuser' && (!rec.username || !rec.password || !String(rec.password).startsWith('scrypt$'))) {
          return sendJson(res, 400, { error: 'Set this person up as a Manager with a login password first, then promote to Superuser.' });
        }

        src.splice(idx, 1);
        rec.role = nextRole;
        lists[nextRole].push(rec);
        cfg.roleAudit = Array.isArray(cfg.roleAudit) ? cfg.roleAudit : [];
        cfg.roleAudit.push({
          at: Date.now(),
          actor: authSession.username || authSession.name || 'superuser',
          user: rec.name || rec.username || key,
          username: rec.username || '',
          from: sourceRole,
          to: nextRole
        });
        if (cfg.roleAudit.length > 200) cfg.roleAudit = cfg.roleAudit.slice(-200);
        saveConfig(cfg);

        // Any live session for the changed account is invalidated immediately.
        for (const [tok, s] of authSessions.entries()) {
          if ((rec.username && s.username === rec.username) || (rec.name && s.name === rec.name)) authSessions.delete(tok);
        }
        const needsPassword = nextRole === 'manager' && (!rec.password || !String(rec.password).startsWith('scrypt$'));
        return sendJson(res, 200, { ok: true, message: needsPassword ? 'Role changed to Manager. Set a login password in the Managers section before this user can sign in.' : 'Role changed successfully.' });
      } catch (e) {
        return sendJson(res, 400, { error: 'Role change failed: ' + e.message });
      }
    });
    return;
  }

"""
if anchor in api_text:
    api_text = api_text.replace(anchor, roles_code, 1)
elif "/api/user-roles" not in api_text:
    raise SystemExit('auth flags marker not found')

# 6) Insert User Roles UI beside Superuser Security.
anchor = """      </section>\n\n      <!-- INSPECTION SETTINGS -->\n"""
ui = """      </section>\n\n      <!-- USER ROLES -->\n      <section class=\"mblock\" id=\"userRolesBlock\" style=\"display:none\">\n        <h3>User Roles</h3>\n        <div style=\"font-size:13px;color:#666;margin-bottom:10px\">Superuser-only role management. The Recovery Superuser is locked. Role changes take effect immediately and sign out the changed account.</div>\n        <div id=\"userRolesList\"><div class=\"empty\">Loading users…</div></div>\n        <div id=\"userRolesStatus\" class=\"saved-ok\" style=\"display:block;margin:10px 0 0\"></div>\n      </section>\n\n      <!-- INSPECTION SETTINGS -->\n"""
# use anchor after superuser security occurrence only
su_pos = dbv_text.find('<!-- SUPERUSER SECURITY -->')
if su_pos < 0:
    raise SystemExit('superuser UI marker not found')
tail = dbv_text[su_pos:]
if anchor in tail:
    tail = tail.replace(anchor, ui, 1)
    dbv_text = dbv_text[:su_pos] + tail
elif 'id="userRolesBlock"' not in dbv_text:
    raise SystemExit('inspection marker after superuser not found')

# 7) Show/hide User Roles with role UI and load list.
old = """  var suSecurity = document.getElementById('superuserSecurityBlock');\n  if(suSecurity) suSecurity.style.display = currentRole === 'superuser' ? '' : 'none';\n"""
new = """  var suSecurity = document.getElementById('superuserSecurityBlock');\n  if(suSecurity) suSecurity.style.display = currentRole === 'superuser' ? '' : 'none';\n  var userRoles = document.getElementById('userRolesBlock');\n  if(userRoles) userRoles.style.display = currentRole === 'superuser' ? '' : 'none';\n"""
if old in dbv_text:
    dbv_text = dbv_text.replace(old, new, 1)
elif "var userRoles = document.getElementById('userRolesBlock')" not in dbv_text:
    raise SystemExit('applyRoleUi marker not found')

old = """      try { populateConfig(); } catch(e){ console.error('populateConfig', e); }\n"""
new = """      try { populateConfig(); } catch(e){ console.error('populateConfig', e); }\n      if(currentRole === 'superuser') { try { loadUserRoles(); } catch(e){ console.error('loadUserRoles', e); } }\n"""
if old in dbv_text:
    dbv_text = dbv_text.replace(old, new, 1)
elif "loadUserRoles();" not in dbv_text:
    raise SystemExit('loadData marker not found')

# 8) Add role-management JS before AUTH idle timer.
anchor = """var DB_AUTH_IDLE_MS = 15 * 60 * 1000;\n"""
js = r"""function loadUserRoles(){
  if(currentRole !== 'superuser') return;
  fetch('/api/user-roles',{headers:authHdr()})
    .then(function(r){ return r.json().then(function(d){ return {ok:r.ok,d:d}; }); })
    .then(function(x){
      if(!x.ok) throw new Error((x.d&&x.d.error)||'Could not load users');
      renderUserRoles(x.d.users || []);
    }).catch(function(e){
      var box=document.getElementById('userRolesList');
      if(box) box.innerHTML='<div class="empty">'+esc(e.message||'Could not load users')+'</div>';
    });
}
function renderUserRoles(users){
  var box=document.getElementById('userRolesList');
  if(!box) return;
  if(!users.length){ box.innerHTML='<div class="empty">No users configured.</div>'; return; }
  box.innerHTML = users.map(function(u){
    var locked = !!u.recovery;
    var label = u.name || u.username || 'Unnamed user';
    var login = u.username ? '<div style="font-size:12px;color:#777">'+esc(u.username)+'</div>' : '<div style="font-size:12px;color:#a16207">No login username</div>';
    var note = locked ? '<div style="font-size:11px;color:#777;margin-top:3px">Emergency recovery account — role locked</div>' : (!u.loginReady && u.role!=='technician' ? '<div style="font-size:11px;color:#b45309;margin-top:3px">Login password still needs to be set</div>' : '');
    return '<div style="display:grid;grid-template-columns:minmax(160px,1fr) 150px auto;gap:10px;align-items:center;border:1px solid var(--line);border-radius:9px;padding:10px;margin:8px 0;background:#fff">'+
      '<div><b>'+esc(label)+'</b>'+login+note+'</div>'+
      '<select class="msel" id="roleSel_'+encodeURIComponent(u.role+'|'+u.key)+'" '+(locked?'disabled':'')+'>'+
        '<option value="technician" '+(u.role==='technician'?'selected':'')+'>Technician</option>'+
        '<option value="manager" '+(u.role==='manager'?'selected':'')+'>Manager</option>'+
        '<option value="superuser" '+(u.role==='superuser'?'selected':'')+'>Superuser</option>'+
      '</select>'+
      '<button class="btn sm" '+(locked?'disabled':'')+' onclick="changeUserRole('+JSON.stringify(u.key)+','+JSON.stringify(u.role)+')">Change Role</button>'+
    '</div>';
  }).join('');
}
function changeUserRole(key,currentRoleValue){
  var id='roleSel_'+encodeURIComponent(currentRoleValue+'|'+key);
  var sel=document.getElementById(id);
  if(!sel) return;
  var next=sel.value;
  if(next===currentRoleValue){ alert('This user already has that role.'); return; }
  var pretty = next.charAt(0).toUpperCase()+next.slice(1);
  if(!confirm('Change this user from '+currentRoleValue+' to '+pretty+'?\n\nTheir active login session will be ended immediately.')){ sel.value=currentRoleValue; return; }
  fetch('/api/user-roles',{
    method:'PUT',
    headers:Object.assign({'Content-Type':'application/json'},authHdr()),
    body:JSON.stringify({key:key,currentRole:currentRoleValue,newRole:next})
  }).then(function(r){ return r.json().then(function(d){ return {ok:r.ok,d:d}; }); })
    .then(function(x){
      if(!x.ok){ alert((x.d&&x.d.error)||'Role change failed'); sel.value=currentRoleValue; return; }
      var s=document.getElementById('userRolesStatus'); if(s) s.textContent=x.d.message||'Role changed.';
      loadData();
    }).catch(function(){ alert('Role change failed'); sel.value=currentRoleValue; });
}

var DB_AUTH_IDLE_MS = 15 * 60 * 1000;
"""
if anchor in dbv_text:
    dbv_text = dbv_text.replace(anchor, js, 1)
elif "function loadUserRoles()" not in dbv_text:
    raise SystemExit('idle timer marker not found')

# 9) Changelog.
entry = """\n## 2026-09-08 — Superuser User Roles\n- Added a Superuser-only **User Roles** panel beside Superuser Security.\n- Lists Recovery Superuser, additional Superusers, Managers, and Technicians with a role dropdown.\n- Role changes are enforced server-side, invalidate the changed user's sessions, and write an audit entry.\n- Recovery Superuser role is locked as the emergency owner account.\n- Additional Superuser login is supported for promoted Manager accounts.\n- Public `/api/config` responses now strip credential hashes and privileged role metadata.\n\n"""
if chg.exists():
    ct = chg.read_text()
    if '## 2026-09-08 — Superuser User Roles' not in ct:
        chg.write_text(entry + ct)

api.write_text(api_text)
dbv.write_text(dbv_text)
print('Applied Superuser User Roles patch')

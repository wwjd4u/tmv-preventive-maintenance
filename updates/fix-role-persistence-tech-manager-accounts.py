from pathlib import Path


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'MISSING {label}')
    if text.count(old) != 1:
        raise SystemExit(f'EXPECTED ONE {label}, FOUND {text.count(old)}')
    return text.replace(old, new, 1)

# ---- api-server.js ----
p = Path('api-server.js')
s = p.read_text()

old = """        if (mgr && verifyPassword(d.password || '', mgr.password)) {
          const token = newAuthSession('manager', mgr.username || mgr.name, mgr.name || mgr.username);
          return sendJson(res, 200, { ok: true, token, role: 'manager', name: mgr.name || mgr.username });
        }
        return sendJson(res, 401, { error: 'Invalid credentials' });"""
new = """        if (mgr && verifyPassword(d.password || '', mgr.password)) {
          const token = newAuthSession('manager', mgr.username || mgr.name, mgr.name || mgr.username);
          return sendJson(res, 200, { ok: true, token, role: 'manager', name: mgr.name || mgr.username });
        }
        // Technician accounts use the same hashed-password storage as Managers.
        const cfgTech = cfgAuth.technicians || [];
        const tech = cfgTech.map(t => typeof t === 'string' ? { name: t } : t)
          .find(t => t && t.username && t.username === d.username);
        if (tech && verifyPassword(d.password || '', tech.password)) {
          const token = newAuthSession('technician', tech.username, tech.name || tech.username);
          return sendJson(res, 200, { ok: true, token, role: 'technician', name: tech.name || tech.username });
        }
        return sendJson(res, 401, { error: 'Invalid credentials' });"""
s = replace_once(s, old, new, 'technician login insertion')

old = """        src.splice(idx, 1);
        rec.role = nextRole;
        lists[nextRole].push(rec);"""
new = """        // Remove this identity from every role list before inserting the new role.
        // This makes the role change atomic and prevents stale duplicate records from
        // making a user appear to revert on the next reload.
        ['superuser','manager','technician'].forEach(function(roleName){
          const list = lists[roleName];
          for (let i = list.length - 1; i >= 0; i--) {
            const raw = list[i];
            const u = typeof raw === 'string' ? { name: raw } : raw;
            const same = (u.username && rec.username && u.username === rec.username) ||
                         (u.name && rec.name && u.name === rec.name) ||
                         ((u.username || u.name) === key);
            if (same) list.splice(i, 1);
          }
        });
        rec.role = nextRole;
        lists[nextRole].push(rec);"""
s = replace_once(s, old, new, 'atomic role move')

old = """        const needsPassword = nextRole === 'manager' && (!rec.password || !String(rec.password).startsWith('scrypt$'));
        return sendJson(res, 200, { ok: true, message: needsPassword ? 'Role changed to Manager. Set a login password in the Managers section before this user can sign in.' : 'Role changed successfully.' });"""
new = """        const needsPassword = !rec.password || !String(rec.password).startsWith('scrypt$');
        const roleLabel = nextRole.charAt(0).toUpperCase() + nextRole.slice(1);
        return sendJson(res, 200, { ok: true, message: needsPassword ? 'Role changed to ' + roleLabel + '. Set a login username/password in Setup before this user can sign in.' : 'Role changed successfully.' });"""
s = replace_once(s, old, new, 'role password message')

old = """        const beforeAudit = auditConfigSummary(config);
        const afterAudit = auditConfigSummary(merged);"""
new = """        // Account/role arrays are managed only by their dedicated endpoints.
        // Never let a stale general Setup save overwrite a role change.
        merged.superusers = Array.isArray(config.superusers) ? config.superusers : [];
        merged.managers = Array.isArray(config.managers) ? config.managers : [];
        merged.technicians = Array.isArray(config.technicians) ? config.technicians : [];
        const beforeAudit = auditConfigSummary(config);
        const afterAudit = auditConfigSummary(merged);"""
s = replace_once(s, old, new, 'protect account arrays')

old = """          if (m.password && !m.password.startsWith('scrypt$')) {
            password = hashPassword(m.password);
          }
          const phone = (m.phone || (existing && existing.phone) || '').trim();
          return { name, username, phone, password, role: 'manager' };"""
new = """          if (m.password && !m.password.startsWith('scrypt$')) {
            if (!validAdminPassword(m.password)) throw new Error('Manager password must be at least 10 characters with an uppercase letter, number, and special character');
            password = hashPassword(m.password);
          }
          const email = (m.email || (existing && existing.email) || '').trim();
          const phone = (m.phone || (existing && existing.phone) || '').trim();
          return { name, username, email, phone, password, role: 'manager' };"""
s = replace_once(s, old, new, 'manager email save')

old = """        sendJson(res, 200, { ok: true, managers: out.map(m => ({ name: m.name, username: m.username, phone: m.phone })) });
      } catch (e) { sendJson(res, 400, { error: e.message }); }
    });
    return;
  }

  // ── GET /api/assets — list all assets (public) ──────────"""
new = """        sendJson(res, 200, { ok: true, managers: out.map(m => ({ name: m.name, username: m.username, email: m.email, phone: m.phone })) });
      } catch (e) { sendJson(res, 400, { error: e.message }); }
    });
    return;
  }

  // ── PUT /api/technicians — account/contact save with hashed passwords ──
  if (url.pathname === '/api/technicians' && req.method === 'PUT') {
    if (!isAdminReq) return sendJson(res, 401, { error: 'Manager or Superuser required' });
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const incoming = JSON.parse(body).technicians || [];
        const config = loadConfig() || {};
        const current = Array.isArray(config.technicians) ? config.technicians : [];
        const saved = {};
        current.forEach(function(raw){
          const t = typeof raw === 'string' ? { name: raw } : raw;
          if (t.username) saved['u:' + t.username] = t;
          if (t.name) saved['n:' + t.name] = t;
        });
        const out = incoming.map(function(raw){
          const t = typeof raw === 'string' ? { name: raw } : raw;
          const name = String(t.name || t.username || '').trim();
          const username = String(t.username || '').trim();
          const existing = (username && saved['u:' + username]) || (name && saved['n:' + name]) || null;
          let password = existing ? (existing.password || '') : '';
          if (t.password && !String(t.password).startsWith('scrypt$')) {
            if (!validAdminPassword(t.password)) throw new Error('Technician password must be at least 10 characters with an uppercase letter, number, and special character');
            password = hashPassword(t.password);
          }
          const email = String(t.email || (existing && existing.email) || '').trim();
          const phone = String(t.phone || (existing && existing.phone) || '').trim();
          return { name, username, email, phone, password, role: 'technician' };
        });
        const merged = { ...config, technicians: out };
        saveConfig(merged);
        auditEvent(authSession, 'technicians_updated', 'Technicians',
          current.map(function(raw){ const t=typeof raw==='string'?{name:raw}:raw; return {name:t.name||'',username:t.username||'',email:t.email||'',phone:t.phone||''}; }),
          out.map(t => ({ name:t.name, username:t.username, email:t.email, phone:t.phone })),
          { passwordUpdatedFor: incoming.filter(t => t && t.password && !String(t.password).startsWith('scrypt$')).map(t => t.username || t.name || '').filter(Boolean) });
        sendJson(res, 200, { ok: true, technicians: out.map(t => ({ name:t.name, username:t.username, email:t.email, phone:t.phone })) });
      } catch (e) { sendJson(res, 400, { error: e.message }); }
    });
    return;
  }

  // ── GET /api/assets — list all assets (public) ──────────"""
s = replace_once(s, old, new, 'technicians endpoint')

p.write_text(s)

# ---- db-viewer.html ----
p = Path('db-viewer.html')
s = p.read_text()

old = """          <input id=\"mgrUser\" class=\"minput\" placeholder=\"Login username (e.g. jdoe)\" autocomplete=\"username\" name=\"mgr_username\">
          <input id=\"mgrPhone\" class=\"minput\" placeholder=\"Mobile phone (+1…)\" autocomplete=\"tel\">
          <input id=\"mgrPass\" class=\"minput\" type=\"password\" placeholder=\"Login password\" autocomplete=\"new-password\">"""
new = """          <input id=\"mgrUser\" class=\"minput\" placeholder=\"Login username (e.g. jdoe)\" autocomplete=\"username\" name=\"mgr_username\">
          <input id=\"mgrEmail\" class=\"minput\" placeholder=\"Email (name@co.com)\" autocomplete=\"email\">
          <input id=\"mgrPhone\" class=\"minput\" placeholder=\"Mobile phone (+1…)\" autocomplete=\"tel\">
          <input id=\"mgrPass\" class=\"minput\" type=\"password\" placeholder=\"Login password\" autocomplete=\"new-password\">"""
s = replace_once(s, old, new, 'manager email field')

old = """        <div class=\"contact-grid\">
          <input id=\"techEmail\" class=\"minput\" placeholder=\"Email (name@co.com)\">
          <input id=\"techPhone\" class=\"minput\" placeholder=\"Phone (+1…)\">
        </div>
        <button class=\"btn sm\" onclick=\"saveTechContact()\">Save Contact Info</button>"""
new = """        <div class=\"contact-grid\">
          <input id=\"techUser\" class=\"minput\" placeholder=\"Login username (e.g. jguynes)\" autocomplete=\"username\">
          <input id=\"techEmail\" class=\"minput\" placeholder=\"Email (name@co.com)\" autocomplete=\"email\">
          <input id=\"techPhone\" class=\"minput\" placeholder=\"Phone (+1…)\" autocomplete=\"tel\">
          <input id=\"techPass\" class=\"minput\" type=\"password\" placeholder=\"Login password\" autocomplete=\"new-password\">
        </div>
        <button class=\"btn sm\" onclick=\"saveTechContact()\">Save Technician</button>"""
s = replace_once(s, old, new, 'technician account fields')

old = """  if(!cur.email)   cur.email='';
  if(!cur.phone)   cur.phone='';
  return cur;"""
new = """  if(!cur.username) cur.username='';
  if(!cur.email)   cur.email='';
  if(!cur.phone)   cur.phone='';
  if(typeof cur.password==='undefined') cur.password='';
  return cur;"""
s = replace_once(s, old, new, 'tech object fields')

old = """  document.getElementById('techEmail').value = t.email || '';
  document.getElementById('techPhone').value = t.phone || '';
}"""
new = """  document.getElementById('techUser').value = t.username || '';
  document.getElementById('techEmail').value = t.email || '';
  document.getElementById('techPhone').value = t.phone || '';
  document.getElementById('techPass').value = ''; // never echo the stored hash
}"""
s = replace_once(s, old, new, 'fill technician account')

old = """function saveTechContact(){
  var cfg = dbData.config;
  var i = parseInt(document.getElementById('selTech').value, 10);
  if(isNaN(i)){ alert('Select a technician first'); return; }
  var t = techObj(i);
  t.email    = document.getElementById('techEmail').value.trim();
  t.phone    = document.getElementById('techPhone').value.trim();
  saveConfigArray('technicians', cfg.technicians);
}"""
new = """function saveTechnicians(){
  var cfg = dbData.config || {};
  fetch('/api/technicians', {
    method:'PUT',
    headers:{ ...authHdr(), 'Content-Type':'application/json' },
    body:JSON.stringify({ technicians:(cfg.technicians||[]).map(function(raw){
      var t=typeof raw==='string'?{name:raw}:raw;
      return { name:t.name||'', username:t.username||'', email:t.email||'', phone:t.phone||'', password:(t.password && !String(t.password).startsWith('scrypt$'))?t.password:'' };
    }) })
  }).then(function(r){ return r.json().then(function(d){return {ok:r.ok,d:d};}); })
    .then(function(x){ if(!x.ok) throw new Error((x.d&&x.d.error)||'Technician save failed'); loadData(); showSaved('techStatus'); })
    .catch(function(e){ alert(e.message||'Technician save failed'); });
}
function saveTechContact(){
  var cfg = dbData.config;
  var i = parseInt(document.getElementById('selTech').value, 10);
  if(isNaN(i)){ alert('Select a technician first'); return; }
  var t = techObj(i);
  var username = document.getElementById('techUser').value.trim();
  var pw = document.getElementById('techPass').value || '';
  if(username && !/^[A-Za-z0-9._@-]{3,64}$/.test(username)){ alert('Username must be 3-64 characters using letters, numbers, dot, underscore, @, or hyphen'); return; }
  if(pw && (pw.length < 10 || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw) || !/[^A-Za-z0-9]/.test(pw))){ alert('Password must be at least 10 characters with an uppercase letter, number, and special character'); return; }
  t.username = username;
  t.email = document.getElementById('techEmail').value.trim();
  t.phone = document.getElementById('techPhone').value.trim();
  if(pw) t.password = pw;
  saveTechnicians();
}"""
s = replace_once(s, old, new, 'technician dedicated save')

s = s.replace("saveConfigArray('technicians', cfg.technicians);", "saveTechnicians();")

old = """  document.getElementById('mgrUser').value = m.username || '';
  document.getElementById('mgrPhone').value = m.phone || '';
  document.getElementById('mgrPass').value = ''; // never echo the stored hash"""
new = """  document.getElementById('mgrUser').value = m.username || '';
  document.getElementById('mgrEmail').value = m.email || '';
  document.getElementById('mgrPhone').value = m.phone || '';
  document.getElementById('mgrPass').value = ''; // never echo the stored hash"""
s = replace_once(s, old, new, 'fill manager email')

old = """  m.name = nm || un;
  m.username = un;
  m.phone = document.getElementById('mgrPhone').value.trim();
  if(pw){ m.password = pw; }"""
new = """  m.name = nm || un;
  m.username = un;
  m.email = document.getElementById('mgrEmail').value.trim();
  m.phone = document.getElementById('mgrPhone').value.trim();
  if(pw && (pw.length < 10 || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw) || !/[^A-Za-z0-9]/.test(pw))){ alert('Password must be at least 10 characters with an uppercase letter, number, and special character'); return; }
  if(pw){ m.password = pw; }"""
s = replace_once(s, old, new, 'manager email assignment')

old = """      return { name:x.name, username:x.username, phone:x.phone||'', password: (x.password && !x.password.startsWith('scrypt$')) ? x.password : '' };"""
new = """      return { name:x.name, username:x.username, email:x.email||'', phone:x.phone||'', password: (x.password && !x.password.startsWith('scrypt$')) ? x.password : '' };"""
s = replace_once(s, old, new, 'manager email payload')

old = """function saveConfigArray(key, value){
  var cfg = dbData.config;
  cfg[key] = value;
  fetch('/api/config', { method:'PUT', headers:{...authHdr(),'Content-Type':'application/json'}, body:JSON.stringify(cfg) })"""
new = """function saveConfigArray(key, value){
  var cfg = dbData.config;
  cfg[key] = value;
  var patch = {}; patch[key] = value;
  fetch('/api/config', { method:'PUT', headers:{...authHdr(),'Content-Type':'application/json'}, body:JSON.stringify(patch) })"""
s = replace_once(s, old, new, 'partial config save')

p.write_text(s)

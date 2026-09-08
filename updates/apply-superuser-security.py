from pathlib import Path
import sys

root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('.')
api = root / 'api-server.js'
dbv = root / 'db-viewer.html'
chg = root / 'CHANGELOG.md'

api_text = api.read_text()
dbv_text = dbv.read_text()

old = """// ── Superuser credentials — private environment only ─────\nconst ADMIN_USER = String(process.env.ADMIN_USER || '').trim();\nconst ADMIN_PASS = String(process.env.ADMIN_PASS || '');\nif (!ADMIN_USER || !ADMIN_PASS) {\n"""
new = """// ── Superuser credentials — private environment only ─────\nlet ADMIN_USER = String(process.env.ADMIN_USER || '').trim();\nlet ADMIN_PASS = String(process.env.ADMIN_PASS || '');\nif (!ADMIN_USER || !ADMIN_PASS) {\n"""
if old not in api_text:
    raise SystemExit('ADMIN credential declaration anchor not found')
api_text = api_text.replace(old, new, 1)

anchor = """function verifyPassword(pw, stored) {\n  if (typeof stored !== 'string' || !stored.startsWith('scrypt$')) return false;\n  const parts = stored.split('$');\n  if (parts.length !== 3) return false;\n  const salt = parts[1], expected = parts[2];\n  const d = crypto.scryptSync(pw, salt, 64).toString('hex');\n  const a = Buffer.from(d), b = Buffer.from(expected);\n  if (a.length !== b.length) return false;\n  return crypto.timingSafeEqual(a, b);\n}\n\n"""
insert = anchor + """function sameSecret(a, b) {\n  const aa = Buffer.from(String(a || ''));\n  const bb = Buffer.from(String(b || ''));\n  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);\n}\nfunction validAdminPassword(pw) {\n  return typeof pw === 'string' && pw.length >= 10 && /[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw);\n}\nfunction updatePrivateEnv(values) {\n  const ef = path.join(__dirname, '.env');\n  let lines = [];\n  try { if (fs.existsSync(ef)) lines = fs.readFileSync(ef, 'utf8').split(/\\r?\\n/); } catch (_) {}\n  Object.keys(values).forEach((key) => {\n    const value = String(values[key]);\n    let found = false;\n    lines = lines.map((line) => {\n      if (line.startsWith(key + '=')) { found = true; return key + '=' + value; }\n      return line;\n    });\n    if (!found) lines.push(key + '=' + value);\n  });\n  while (lines.length && lines[lines.length - 1] === '') lines.pop();\n  const tmp = ef + '.tmp-' + process.pid;\n  fs.writeFileSync(tmp, lines.join('\\n') + '\\n', { mode: 0o600 });\n  fs.renameSync(tmp, ef);\n  try { fs.chmodSync(ef, 0o600); } catch (_) {}\n}\n\n"""
if anchor not in api_text:
    raise SystemExit('verifyPassword anchor not found')
api_text = api_text.replace(anchor, insert, 1)

route_anchor = """  // ── Auth session inspection / logout ─────────────────────\n  if (url.pathname === '/api/session' && req.method === 'GET') {\n"""
route = """  // ── Superuser credential rotation ───────────────────────\n  if (url.pathname === '/api/superuser/credentials' && req.method === 'POST') {\n    const auth = req.headers['authorization'] || '';\n    const tok = auth.startsWith('Bearer ') ? auth.slice(7) : '';\n    const session = getAuthSession(tok);\n    if (!session || session.role !== 'superuser') return sendJson(res, 403, { error: 'Superuser required' });\n    let body = '';\n    req.on('data', c => body += c);\n    req.on('end', () => {\n      try {\n        const d = JSON.parse(body || '{}');\n        if (!sameSecret(d.currentPassword, ADMIN_PASS)) return sendJson(res, 401, { error: 'Current password is incorrect' });\n        const nextUser = String(d.newUsername || '').trim();\n        const nextPass = String(d.newPassword || '');\n        if (!nextUser && !nextPass) return sendJson(res, 400, { error: 'Enter a new username and/or password' });\n        if (nextUser && !/^[A-Za-z0-9._@-]{3,64}$/.test(nextUser)) {\n          return sendJson(res, 400, { error: 'Username must be 3-64 characters using letters, numbers, dot, underscore, @, or hyphen' });\n        }\n        if (nextPass && !validAdminPassword(nextPass)) {\n          return sendJson(res, 400, { error: 'Password must be at least 10 characters with an uppercase letter, number, and special character' });\n        }\n        const finalUser = nextUser || ADMIN_USER;\n        const finalPass = nextPass || ADMIN_PASS;\n        updatePrivateEnv({ ADMIN_USER: finalUser, ADMIN_PASS: finalPass });\n        ADMIN_USER = finalUser;\n        ADMIN_PASS = finalPass;\n        process.env.ADMIN_USER = finalUser;\n        process.env.ADMIN_PASS = finalPass;\n        authSessions.clear();\n        return sendJson(res, 200, { ok: true, message: 'Superuser credentials updated. Sign in again.' });\n      } catch (e) {\n        return sendJson(res, 400, { error: 'Credential update failed: ' + e.message });\n      }\n    });\n    return;\n  }\n\n""" + route_anchor
if route_anchor not in api_text:
    raise SystemExit('auth session route anchor not found')
api_text = api_text.replace(route_anchor, route, 1)

ui_anchor = """      <!-- INSPECTION SETTINGS -->\n      <section class=\"mblock\">\n"""
ui = """      <!-- SUPERUSER SECURITY -->\n      <section class=\"mblock\" id=\"superuserSecurityBlock\" style=\"display:none\">\n        <h3>Superuser Security</h3>\n        <div style=\"font-size:13px;color:#666;margin-bottom:10px\">Change the Superuser username and/or password. Current password is required. All active admin sessions will be signed out after a change.</div>\n        <div class=\"contact-grid\">\n          <input id=\"suCurrentPass\" class=\"minput\" type=\"password\" placeholder=\"Current password\" autocomplete=\"current-password\">\n          <input id=\"suNewUser\" class=\"minput\" placeholder=\"New username (optional)\" autocomplete=\"off\">\n          <input id=\"suNewPass\" class=\"minput\" type=\"password\" placeholder=\"New password (optional)\" autocomplete=\"new-password\">\n          <input id=\"suConfirmPass\" class=\"minput\" type=\"password\" placeholder=\"Confirm new password\" autocomplete=\"new-password\">\n        </div>\n        <div style=\"font-size:12px;color:#777;margin:9px 0\">Password: 10+ characters, 1 uppercase, 1 number, and 1 special character.</div>\n        <button class=\"btn sm\" onclick=\"saveSuperuserCredentials()\">Update Superuser Login</button>\n      </section>\n\n""" + ui_anchor
if ui_anchor not in dbv_text:
    raise SystemExit('inspection settings anchor not found')
dbv_text = dbv_text.replace(ui_anchor, ui, 1)

role_old = """  var cat = document.querySelector('.catblock');\n  if(cat) cat.style.display = manager ? 'none' : '';\n"""
role_new = """  var cat = document.querySelector('.catblock');\n  if(cat) cat.style.display = manager ? 'none' : '';\n  var suSecurity = document.getElementById('superuserSecurityBlock');\n  if(suSecurity) suSecurity.style.display = currentRole === 'superuser' ? '' : 'none';\n"""
if role_old not in dbv_text:
    raise SystemExit('applyRoleUi anchor not found')
dbv_text = dbv_text.replace(role_old, role_new, 1)

js_anchor = """function authHdr(){ return { 'Authorization': 'Bearer ' + token } }\n"""
js_insert = js_anchor + """function saveSuperuserCredentials(){\n  if(currentRole !== 'superuser'){ alert('Superuser required'); return; }\n  var current = document.getElementById('suCurrentPass').value || '';\n  var newUser = (document.getElementById('suNewUser').value || '').trim();\n  var newPass = document.getElementById('suNewPass').value || '';\n  var confirmPass = document.getElementById('suConfirmPass').value || '';\n  if(!current){ alert('Enter your current password'); return; }\n  if(!newUser && !newPass){ alert('Enter a new username and/or password'); return; }\n  if(newUser && !/^[A-Za-z0-9._@-]{3,64}$/.test(newUser)){ alert('Username must be 3-64 characters using letters, numbers, dot, underscore, @, or hyphen'); return; }\n  if(newPass){\n    if(newPass !== confirmPass){ alert('New passwords do not match'); return; }\n    if(newPass.length < 10 || !/[A-Z]/.test(newPass) || !/[0-9]/.test(newPass) || !/[^A-Za-z0-9]/.test(newPass)){\n      alert('Password must be at least 10 characters with an uppercase letter, number, and special character'); return;\n    }\n  }\n  if(!confirm('Update the Superuser login? This will sign out all active admin sessions.')) return;\n  fetch('/api/superuser/credentials', {\n    method:'POST',\n    headers:Object.assign({'Content-Type':'application/json'}, authHdr()),\n    body:JSON.stringify({currentPassword:current,newUsername:newUser,newPassword:newPass})\n  }).then(function(r){ return r.json().then(function(d){ return {ok:r.ok,d:d}; }); })\n    .then(function(x){\n      if(!x.ok){ alert((x.d && x.d.error) || 'Credential update failed'); return; }\n      sessionStorage.removeItem('tmv_auth_token');\n      sessionStorage.removeItem('tmv_auth_role');\n      sessionStorage.removeItem('tmv_auth_name');\n      alert('Superuser login updated. Sign in again with the new credentials.');\n      location.href='/';\n    }).catch(function(){ alert('Credential update failed'); });\n}\n"""
if js_anchor not in dbv_text:
    raise SystemExit('authHdr anchor not found')
dbv_text = dbv_text.replace(js_anchor, js_insert, 1)

api.write_text(api_text)
dbv.write_text(dbv_text)

entry = """\n## 2026-09-08 — Superuser credential rotation\n- Added a Superuser-only Security section in Setup for changing the Superuser username and/or password.\n- Requires the current Superuser password and enforces the application password policy.\n- Updates the private `.env` file and invalidates all active admin sessions after a successful change.\n- Managers cannot view or call the Superuser credential-change function.\n"""
if chg.exists():
    text = chg.read_text()
    if 'Superuser credential rotation' not in text:
        chg.write_text(text.rstrip() + '\n' + entry)
else:
    chg.write_text('# Changelog\n' + entry)

print('Superuser security patch applied')

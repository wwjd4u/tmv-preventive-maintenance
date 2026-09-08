from pathlib import Path
import sys

root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('.')

def replace_once(path, old, new):
    p = root / path
    text = p.read_text()
    if old not in text:
        raise SystemExit(f'pattern not found in {path}: {old[:100]!r}')
    p.write_text(text.replace(old, new, 1))

# 1) Superuser credentials come only from the private environment.
replace_once('api-server.js',
"// ── Admin credentials (username / password) ──────────────\nconst ADMIN_USER = 'admin';\nconst ADMIN_PASS = 'admin123';",
"// ── Superuser credentials — private environment only ─────\nconst ADMIN_USER = String(process.env.ADMIN_USER || '').trim();\nconst ADMIN_PASS = String(process.env.ADMIN_PASS || '');\nif (!ADMIN_USER || !ADMIN_PASS) {\n  console.warn('[auth] ADMIN_USER / ADMIN_PASS are not configured; Superuser login is disabled.');\n}")

# 2) Server-side rolling 15-minute idle session expiration.
replace_once('api-server.js',
"const authSessions = new Map();\nfunction newAuthSession(role, username, name) {\n  const token = crypto.randomBytes(32).toString('hex');\n  authSessions.set(token, { role, username, name: name || username, createdAt: Date.now() });\n  return token;\n}\nfunction getAuthSession(token) {\n  return token ? (authSessions.get(token) || null) : null;\n}",
"const authSessions = new Map();\nconst AUTH_IDLE_MINUTES = Math.max(1, Number(process.env.AUTH_IDLE_MINUTES || 15));\nconst AUTH_IDLE_MS = AUTH_IDLE_MINUTES * 60 * 1000;\nfunction newAuthSession(role, username, name) {\n  const token = crypto.randomBytes(32).toString('hex');\n  const now = Date.now();\n  authSessions.set(token, { role, username, name: name || username, createdAt: now, lastActivity: now });\n  return token;\n}\nfunction getAuthSession(token) {\n  if (!token) return null;\n  const session = authSessions.get(token) || null;\n  if (!session) return null;\n  const last = session.lastActivity || session.createdAt || 0;\n  if (Date.now() - last >= AUTH_IDLE_MS) {\n    authSessions.delete(token);\n    return null;\n  }\n  session.lastActivity = Date.now();\n  return session;\n}")

# 3) Do not allow an empty environment credential pair to match.
replace_once('api-server.js',
"        if (d.username === ADMIN_USER && d.password === ADMIN_PASS) {",
"        if (ADMIN_USER && ADMIN_PASS && d.username === ADMIN_USER && d.password === ADMIN_PASS) {")

# 4) Main app: 15-minute idle timer + throttled server heartbeat during real activity.
anchor = "function isAdmin(){ return APP_ROLE === 'superuser' || APP_ROLE === 'manager'; }\n"
addition = r'''function isAdmin(){ return APP_ROLE === 'superuser' || APP_ROLE === 'manager'; }

// Authentication idle policy: sign out after 15 minutes with no user activity.
// Real activity also refreshes the rolling server-side session at most once/minute.
var AUTH_IDLE_MS = 15 * 60 * 1000;
var AUTH_HEARTBEAT_MS = 60 * 1000;
var authLastActivity = Date.now();
var authLastHeartbeat = 0;
var authIdleTimer = null;
function expireAppForIdle(){
  if(!APP_TOKEN) return;
  var oldToken = APP_TOKEN;
  clearAppSession();
  try{ fetch('/api/logout',{method:'POST',headers:{'Authorization':'Bearer '+oldToken}}); }catch(_e){}
  showAppLogin('Signed out after 15 minutes of inactivity.');
}
function checkAppIdle(){
  if(APP_TOKEN && Date.now() - authLastActivity >= AUTH_IDLE_MS) expireAppForIdle();
}
function noteAppActivity(){
  if(!APP_TOKEN) return;
  authLastActivity = Date.now();
  if(Date.now() - authLastHeartbeat < AUTH_HEARTBEAT_MS) return;
  authLastHeartbeat = Date.now();
  fetch('/api/session',{headers:appAuthHeaders()}).then(function(r){
    if(r.status===401) expireAppForIdle();
  }).catch(function(){});
}
function startAppIdleWatch(){
  authLastActivity = Date.now();
  if(authIdleTimer) clearInterval(authIdleTimer);
  authIdleTimer = setInterval(checkAppIdle, 15000);
}
['pointerdown','keydown','touchstart','scroll'].forEach(function(evt){
  window.addEventListener(evt, noteAppActivity, {passive:true});
});
'''
replace_once('app.js', anchor, addition)

# Start/reset the idle clock on successful login and session restore.
replace_once('app.js',
"    sessionStorage.setItem('tmv_auth_name',APP_USER);\n    document.getElementById('appLoginPass').value='';\n    await boot();",
"    sessionStorage.setItem('tmv_auth_name',APP_USER);\n    document.getElementById('appLoginPass').value='';\n    startAppIdleWatch();\n    await boot();")
replace_once('app.js',
"    hideAppLogin(); updateAppAuthUi();\n    await loadConfig();",
"    hideAppLogin(); updateAppAuthUi(); startAppIdleWatch();\n    await loadConfig();")

# 5) Task.db gets the same 15-minute idle policy and server heartbeat.
anchor_db = "function authHdr(){ return { 'Authorization': 'Bearer ' + token } }\n"
addition_db = r'''function authHdr(){ return { 'Authorization': 'Bearer ' + token } }
var DB_AUTH_IDLE_MS = 15 * 60 * 1000;
var dbAuthLastActivity = Date.now();
var dbAuthLastHeartbeat = 0;
var dbAuthIdleTimer = setInterval(function(){
  if(token && Date.now() - dbAuthLastActivity >= DB_AUTH_IDLE_MS){
    var old = token;
    token=null; currentRole=''; currentUserName='';
    sessionStorage.removeItem('tmv_auth_token');
    sessionStorage.removeItem('tmv_auth_role');
    sessionStorage.removeItem('tmv_auth_name');
    fetch('/api/logout',{method:'POST',headers:{'Authorization':'Bearer '+old}}).catch(function(){});
    document.getElementById('loginErr').textContent='Signed out after 15 minutes of inactivity.';
    document.getElementById('loginOverlay').style.display='flex';
  }
},15000);
function noteDbAuthActivity(){
  if(!token) return;
  dbAuthLastActivity=Date.now();
  if(Date.now()-dbAuthLastHeartbeat < 60000) return;
  dbAuthLastHeartbeat=Date.now();
  fetch('/api/session',{headers:authHdr()}).then(function(r){ if(r.status===401) dbAuthLastActivity=0; }).catch(function(){});
}
['pointerdown','keydown','touchstart','scroll'].forEach(function(evt){ window.addEventListener(evt,noteDbAuthActivity,{passive:true}); });
'''
replace_once('db-viewer.html', anchor_db, addition_db)

replace_once('db-viewer.html',
"      if(d.token){ token = d.token; currentRole = d.role || ''; currentUserName = d.name || ''; sessionStorage.setItem('tmv_auth_token', token);",
"      if(d.token){ token = d.token; currentRole = d.role || ''; currentUserName = d.name || ''; dbAuthLastActivity=Date.now(); sessionStorage.setItem('tmv_auth_token', token);")
replace_once('db-viewer.html',
"      token = shared; currentRole = d.role || ''; currentUserName = d.name || '';",
"      token = shared; currentRole = d.role || ''; currentUserName = d.name || ''; dbAuthLastActivity=Date.now();")

# 6) Cache-bust app.js so installed/mobile clients pick up the idle timer immediately.
replace_once('index.html',
'<script src="app.js?v=20260908AUTH2"></script>',
'<script src="app.js?v=20260908AUTH3"></script>')

# 7) Changelog.
p = root / 'CHANGELOG.md'
text = p.read_text()
entry = '''\n## 2026-09-08 — Authentication idle timeout and private Superuser credentials\n- Superuser username/password now come from the private `.env` (`ADMIN_USER`, `ADMIN_PASS`) instead of source code.\n- Added a rolling 15-minute inactivity timeout for server auth sessions.\n- Main app and Task.db now sign out after 15 minutes with no user activity and refresh the server session while the user is active.\n- Bumped the main app script version so mobile/PWA clients load the updated auth behavior.\n'''
if 'Authentication idle timeout and private Superuser credentials' not in text:
    p.write_text(entry + text)

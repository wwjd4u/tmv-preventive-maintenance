from pathlib import Path


def rep(path, old, new, count=1):
    p=Path(path); s=p.read_text()
    if old not in s:
        raise SystemExit(f'MISSING in {path}: {old[:100]!r}')
    s=s.replace(old,new,count)
    p.write_text(s)

# ----- Server: enforce >=15m inactivity and persist district fields -----
rep('api-server.js',
"const AUTH_IDLE_MINUTES = Math.max(1, Number(process.env.AUTH_IDLE_MINUTES || 15));",
"const AUTH_IDLE_MINUTES = Math.max(15, Number(process.env.AUTH_IDLE_MINUTES || 15));")

rep('api-server.js',
"return sendJson(res, 200, { ok: true, token, role: 'superuser', name: 'Superuser' });",
"return sendJson(res, 200, { ok: true, token, role: 'superuser', name: 'Superuser', idleMinutes: AUTH_IDLE_MINUTES });")
rep('api-server.js',
"return sendJson(res, 200, { ok: true, token, role: 'superuser', name: extraSu.name || extraSu.username });",
"return sendJson(res, 200, { ok: true, token, role: 'superuser', name: extraSu.name || extraSu.username, idleMinutes: AUTH_IDLE_MINUTES });")
rep('api-server.js',
"return sendJson(res, 200, { ok: true, token, role: 'manager', name: mgr.name || mgr.username });",
"return sendJson(res, 200, { ok: true, token, role: 'manager', name: mgr.name || mgr.username, idleMinutes: AUTH_IDLE_MINUTES });")
rep('api-server.js',
"return sendJson(res, 200, { ok: true, token, role: 'technician', name: tech.name || tech.username });",
"return sendJson(res, 200, { ok: true, token, role: 'technician', name: tech.name || tech.username, idleMinutes: AUTH_IDLE_MINUTES });")
rep('api-server.js',
"return sendJson(res, 200, { ok: true, role: session.role, name: session.name, username: session.username });",
"return sendJson(res, 200, { ok: true, role: session.role, name: session.name, username: session.username, idleMinutes: AUTH_IDLE_MINUTES });")

rep('api-server.js',
"const phone = (m.phone || (existing && existing.phone) || '').trim();\n          return { name, username, email, phone, password, role: 'manager' };",
"const phone = (m.phone || (existing && existing.phone) || '').trim();\n          const district = String(m.district || (existing && existing.district) || '').trim();\n          return { name, username, email, phone, district, password, role: 'manager' };")
rep('api-server.js',
"sendJson(res, 200, { ok: true, managers: out.map(m => ({ name: m.name, username: m.username, email: m.email, phone: m.phone })) });",
"sendJson(res, 200, { ok: true, managers: out.map(m => ({ name: m.name, username: m.username, email: m.email, phone: m.phone, district: m.district })) });")
rep('api-server.js',
"const phone = String(t.phone || (existing && existing.phone) || '').trim();\n          return { name, username, email, phone, password, role: 'technician' };",
"const phone = String(t.phone || (existing && existing.phone) || '').trim();\n          const district = String(t.district || (existing && existing.district) || '').trim();\n          return { name, username, email, phone, district, password, role: 'technician' };")
rep('api-server.js',
"out.map(t => ({ name:t.name, username:t.username, email:t.email, phone:t.phone })),",
"out.map(t => ({ name:t.name, username:t.username, email:t.email, phone:t.phone, district:t.district })),")
rep('api-server.js',
"sendJson(res, 200, { ok: true, technicians: out.map(t => ({ name:t.name, username:t.username, email:t.email, phone:t.phone })) });",
"sendJson(res, 200, { ok: true, technicians: out.map(t => ({ name:t.name, username:t.username, email:t.email, phone:t.phone, district:t.district })) });")

# ----- Main app auth timer gets server value -----
rep('app.js',
"APP_TOKEN=d.token; APP_ROLE=d.role||''; APP_USER=d.name||u;",
"APP_TOKEN=d.token; APP_ROLE=d.role||''; APP_USER=d.name||u;\n    if(d.idleMinutes) AUTH_IDLE_MS=Math.max(15,Number(d.idleMinutes))*60*1000;")
rep('app.js',
"APP_ROLE=sd.role||APP_ROLE; APP_USER=sd.name||APP_USER;",
"APP_ROLE=sd.role||APP_ROLE; APP_USER=sd.name||APP_USER;\n    if(sd.idleMinutes) AUTH_IDLE_MS=Math.max(15,Number(sd.idleMinutes))*60*1000;")

# Detail-page technician selector filtered by selected district.
rep('app.js',
"function buildTechSelect(){\n  var sel=document.getElementById('dTech');\n  (configData.technicians||[]).forEach(function(t){\n    var o=document.createElement('option'); o.value=t.name; o.textContent=t.name; sel.appendChild(o);\n  });\n  sel.addEventListener('change', updateGen);\n}\n['dLoc','dDate'].forEach(function(id){ var e=document.getElementById(id); if(e) e.addEventListener('change', updateGen); });",
"function personnelForDistrict(list,district){\n  if(!district) return list||[];\n  return (list||[]).filter(function(p){ return p && String(p.district||'')===String(district); });\n}\nfunction rebuildDetailTechSelect(){\n  var sel=document.getElementById('dTech'); if(!sel) return;\n  var district=(document.getElementById('dLoc')||{}).value||'';\n  var prior=sel.value||'';\n  sel.innerHTML='<option value=\"\">— choose technician —</option>';\n  personnelForDistrict(configData.technicians||[],district).forEach(function(t){\n    var o=document.createElement('option'); o.value=t.name; o.textContent=t.name; sel.appendChild(o);\n  });\n  if(Array.prototype.some.call(sel.options,function(o){return o.value===prior;})) sel.value=prior;\n}\nfunction buildTechSelect(){\n  rebuildDetailTechSelect();\n  var sel=document.getElementById('dTech');\n  sel.addEventListener('change', updateGen);\n}\n['dLoc','dDate'].forEach(function(id){ var e=document.getElementById(id); if(e) e.addEventListener('change', function(){ if(id==='dLoc') rebuildDetailTechSelect(); updateGen(); }); });")

# ----- Fleet dispatch: district drives available technicians -----
rep('dispatch.js',
"function buildTmvGrid() {\n  const map=configData.tmvVanMap||{}, techs=configData.technicians||[];\n  const type=document.getElementById('unitType'), district=document.getElementById('unitDistrict'), tech=document.getElementById('unitTech');",
"function buildTmvGrid() {\n  const map=configData.tmvVanMap||{}, allTechs=configData.technicians||[];\n  const type=document.getElementById('unitType'), district=document.getElementById('unitDistrict'), tech=document.getElementById('unitTech');\n  const techs=personnelForDistrict(allTechs,district.value||'');")
rep('dispatch.js',
"    techs.forEach(t=>tech.add(new Option(t.name,t.name)));\n    const today=new Date();",
"    const today=new Date();")
rep('dispatch.js',
"    district.addEventListener('change',()=>{updateDispatchButtons();});",
"    district.addEventListener('change',()=>{ dispatchUnit=null; buildTmvGrid(); updateDispatchButtons(); });")
# Populate/repopulate top technician filter every build.
rep('dispatch.js',
"  const query=document.getElementById('unitSearch').value.toLowerCase(), status=document.getElementById('unitStatus').value;",
"  const priorTech=tech.value||'';\n  tech.innerHTML='<option value=\"\">All technicians</option>';\n  techs.forEach(t=>tech.add(new Option(t.name,t.name)));\n  if(techs.some(t=>t.name===priorTech)) tech.value=priorTech;\n  const query=document.getElementById('unitSearch').value.toLowerCase(), status=document.getElementById('unitStatus').value;")
rep('dispatch.js',
"  document.getElementById('dLoc').value=document.getElementById('unitDistrict').value||latest?.location||'';\n  document.getElementById('dDate').value=document.getElementById('unitDate').value;",
"  document.getElementById('dLoc').value=document.getElementById('unitDistrict').value||latest?.location||'';\n  if(typeof rebuildDetailTechSelect==='function') rebuildDetailTechSelect();\n  document.getElementById('dTech').value=dispatchDrafts[unit]??'';\n  document.getElementById('dDate').value=document.getElementById('unitDate').value;")

# ----- Setup UI district selectors and persistence -----
rep('db-viewer.html',
"<input id=\"mgrPhone\" class=\"minput\" placeholder=\"Mobile phone (+1…)\" autocomplete=\"tel\">\n          <input id=\"mgrPass\"",
"<input id=\"mgrPhone\" class=\"minput\" placeholder=\"Mobile phone (+1…)\" autocomplete=\"tel\">\n          <select id=\"mgrDistrict\" class=\"msel\" aria-label=\"Manager district\"></select>\n          <input id=\"mgrPass\"")
rep('db-viewer.html',
"<input id=\"techPhone\" class=\"minput\" placeholder=\"Phone (+1…)\" autocomplete=\"tel\">\n          <input id=\"techPass\"",
"<input id=\"techPhone\" class=\"minput\" placeholder=\"Phone (+1…)\" autocomplete=\"tel\">\n          <select id=\"techDistrict\" class=\"msel\" aria-label=\"Technician district\"></select>\n          <input id=\"techPass\"")

rep('db-viewer.html',
"  // --- Technicians ---\n  var prevTechName",
"  // --- Personnel district dropdowns ---\n  var districtOpts=[{value:'',label:'— Select district —'}].concat(cfg.locations.map(function(l){return {value:l,label:l};}));\n  _fill('techDistrict',districtOpts);\n  _fill('mgrDistrict',districtOpts);\n\n  // --- Technicians ---\n  var prevTechName")

rep('db-viewer.html',
"cfg.technicians.push({name:v, email:'', phone:''});",
"cfg.technicians.push({name:v, username:'', email:'', phone:'', district:'', password:''});")
rep('db-viewer.html',
"  if(!cur.phone)   cur.phone='';\n  if(typeof cur.password==='undefined') cur.password='';",
"  if(!cur.phone)   cur.phone='';\n  if(!cur.district) cur.district='';\n  if(typeof cur.password==='undefined') cur.password='';")
rep('db-viewer.html',
"  document.getElementById('techPhone').value = t.phone || '';\n  document.getElementById('techPass').value = '';",
"  document.getElementById('techPhone').value = t.phone || '';\n  document.getElementById('techDistrict').value = t.district || '';\n  document.getElementById('techPass').value = '';")
rep('db-viewer.html',
"return { name:t.name||'', username:t.username||'', email:t.email||'', phone:t.phone||'', password:(t.password && !String(t.password).startsWith('scrypt$'))?t.password:'' };",
"return { name:t.name||'', username:t.username||'', email:t.email||'', phone:t.phone||'', district:t.district||'', password:(t.password && !String(t.password).startsWith('scrypt$'))?t.password:'' };")
rep('db-viewer.html',
"  t.phone = document.getElementById('techPhone').value.trim();\n  if(pw) t.password = pw;",
"  t.phone = document.getElementById('techPhone').value.trim();\n  t.district = document.getElementById('techDistrict').value || '';\n  if(pw) t.password = pw;")

rep('db-viewer.html',
"  if(typeof cur.password==='undefined') cur.password = '';\n  return cur;",
"  if(!cur.district) cur.district = '';\n  if(typeof cur.password==='undefined') cur.password = '';\n  return cur;",1)
rep('db-viewer.html',
"  document.getElementById('mgrPhone').value = m.phone || '';\n  document.getElementById('mgrPass').value = '';",
"  document.getElementById('mgrPhone').value = m.phone || '';\n  document.getElementById('mgrDistrict').value = m.district || '';\n  document.getElementById('mgrPass').value = '';")
rep('db-viewer.html',
"cfg.managers.push({name:v, username:v, password:''});",
"cfg.managers.push({name:v, username:v, email:'', phone:'', district:'', password:''});")
rep('db-viewer.html',
"  m.phone = document.getElementById('mgrPhone').value.trim();\n  if(pw &&",
"  m.phone = document.getElementById('mgrPhone').value.trim();\n  m.district = document.getElementById('mgrDistrict').value || '';\n  if(pw &&")
rep('db-viewer.html',
"return { name:x.name, username:x.username, email:x.email||'', phone:x.phone||'', password:",
"return { name:x.name, username:x.username, email:x.email||'', phone:x.phone||'', district:x.district||'', password:")

# DB viewer timer learns authoritative server timeout.
rep('db-viewer.html',
"token = shared; currentRole = d.role || ''; currentUserName = d.name || ''; dbAuthLastActivity=Date.now();",
"token = shared; currentRole = d.role || ''; currentUserName = d.name || ''; if(d.idleMinutes) DB_AUTH_IDLE_MS=Math.max(15,Number(d.idleMinutes))*60*1000; dbAuthLastActivity=Date.now();")
rep('db-viewer.html',
"if(d.token){ token = d.token; currentRole = d.role || ''; currentUserName = d.name || ''; dbAuthLastActivity=Date.now();",
"if(d.token){ token = d.token; currentRole = d.role || ''; currentUserName = d.name || ''; if(d.idleMinutes) DB_AUTH_IDLE_MS=Math.max(15,Number(d.idleMinutes))*60*1000; dbAuthLastActivity=Date.now();")

# ----- Tech work-order index: add district dropdown/filter -----
rep('techindex.html',
"<select id=\"filterTech\"><option value=\"all\">All technicians</option></select>\n    <select id=\"filterTmv\"><option value=\"all\">All TMVs</option></select>",
"<select id=\"filterDistrict\"><option value=\"all\">All districts</option></select>\n    <select id=\"filterTech\"><option value=\"all\">All technicians</option></select>\n    <select id=\"filterTmv\"><option value=\"all\">All TMVs</option></select>")
rep('techindex.html',
"function uniqueTechs(){ var s={}; ALL.forEach(function(a){ var n=techName(a); if(n) s[n]=1; }); return Object.keys(s).sort(); }\nfunction uniqueTmvs()",
"function uniqueTechs(){ var s={}; ALL.forEach(function(a){ var n=techName(a); if(n) s[n]=1; }); return Object.keys(s).sort(); }\nfunction uniqueDistricts(){ var s={}; ALL.forEach(function(a){ if(a.location) s[a.location]=1; }); return Object.keys(s).sort(); }\nfunction uniqueTmvs()")
rep('techindex.html',
"function populateFilters(){\n  var ft=document.getElementById('filterTech');",
"function populateFilters(){\n  var fd=document.getElementById('filterDistrict');\n  fd.innerHTML='<option value=\"all\">All districts</option>'+uniqueDistricts().map(function(n){return '<option value=\"'+esc(n)+'\">'+esc(n)+'</option>';}).join('');\n  var ft=document.getElementById('filterTech');")
rep('techindex.html',
"function render(){\n  var ft=document.getElementById('filterTech').value;",
"function render(){\n  var fd=document.getElementById('filterDistrict').value;\n  var ft=document.getElementById('filterTech').value;")
rep('techindex.html',
"  var list=ALL.filter(function(a){\n    if(ft!=='all'",
"  var list=ALL.filter(function(a){\n    if(fd!=='all' && a.location!==fd) return false;\n    if(ft!=='all'")
rep('techindex.html',
"['filterTech','filterTmv'].forEach",
"['filterDistrict','filterTech','filterTmv'].forEach")

print('PATCH_OK')

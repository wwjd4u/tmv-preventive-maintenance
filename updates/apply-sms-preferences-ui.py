from pathlib import Path
import sys

root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('.')

p = root / 'db-viewer.html'
text = p.read_text()

old = '<button class="btn sm" onclick="saveTechContact()">Save Contact Info</button><span id="techStatus" class="saved-ok"></span>'
new = '<button class="btn sm" onclick="saveTechContact()">Save Contact Info</button> <button class="btn sm ghost" onclick="openSmsPreferences(\'technician\')">SMS Preferences</button><span id="techStatus" class="saved-ok"></span>'
if old not in text:
    raise SystemExit('Technician SMS button insertion point not found')
text = text.replace(old, new, 1)

old = '<button class="btn sm" onclick="saveMgr()">Save Manager</button>'
new = '<button class="btn sm" onclick="saveMgr()">Save Manager</button> <button class="btn sm ghost" onclick="openSmsPreferences(\'manager\')">SMS Preferences</button>'
if old not in text:
    raise SystemExit('Manager SMS button insertion point not found')
text = text.replace(old, new, 1)

anchor = "function deleteTech(){\n"
fn = """function openSmsPreferences(kind){
  var item = null;
  if(kind==='technician'){
    var ti = parseInt(document.getElementById('selTech').value,10);
    if(!isNaN(ti)) item = techObj(ti);
  } else {
    var mi = parseInt(document.getElementById('selMgr').value,10);
    if(!isNaN(mi)) item = mgrObj(mi);
  }
  if(!item){ alert('Select a '+(kind==='technician'?'technician':'manager')+' first'); return; }
  var name = item.name || item.username || '';
  var phone = item.phone || '';
  if(!phone){ alert('Save a mobile phone number first'); return; }
  window.open('/sms-consent.html?name='+encodeURIComponent(name)+'&phone='+encodeURIComponent(phone), '_blank');
}

"""
if 'function openSmsPreferences(kind)' not in text:
    if anchor not in text:
        raise SystemExit('SMS function insertion point not found')
    text = text.replace(anchor, fn + anchor, 1)

# Managers need a phone field for SMS enrollment.
old = '<input id="mgrPass" class="minput" type="password" placeholder="Login password" autocomplete="new-password">'
new = '<input id="mgrPhone" class="minput" placeholder="Mobile phone (+1…)" autocomplete="tel">\n          <input id="mgrPass" class="minput" type="password" placeholder="Login password" autocomplete="new-password">'
if old not in text:
    raise SystemExit('Manager phone insertion point not found')
text = text.replace(old, new, 1)

old = "document.getElementById('mgrUser').value = m.username || '';\n  document.getElementById('mgrPass').value = '';"
new = "document.getElementById('mgrUser').value = m.username || '';\n  document.getElementById('mgrPhone').value = m.phone || '';\n  document.getElementById('mgrPass').value = '';"
if old not in text:
    raise SystemExit('Manager fill insertion point not found')
text = text.replace(old, new, 1)

old = "m.username = un;\n  if(pw){ m.password = pw; }"
new = "m.username = un;\n  m.phone = document.getElementById('mgrPhone').value.trim();\n  if(pw){ m.password = pw; }"
if old not in text:
    raise SystemExit('Manager phone save insertion point not found')
text = text.replace(old, new, 1)

old = "return { name:x.name, username:x.username, password: (x.password && !x.password.startsWith('scrypt$')) ? x.password : '' };"
new = "return { name:x.name, username:x.username, phone:x.phone||'', password: (x.password && !x.password.startsWith('scrypt$')) ? x.password : '' };"
if old not in text:
    raise SystemExit('Manager request insertion point not found')
text = text.replace(old, new, 1)
p.write_text(text)

p = root / 'sms-consent.js'
text = p.read_text()
anchor = "byId('consent').onchange=update;\n"
prefill = """byId('consent').onchange=update;
(function(){
  const q=new URLSearchParams(location.search);
  if(q.get('name')) byId('name').value=q.get('name');
  if(q.get('phone')) byId('phone').value=q.get('phone');
})();
"""
if 'new URLSearchParams(location.search)' not in text:
    if anchor not in text:
        raise SystemExit('Consent prefill insertion point not found')
    text = text.replace(anchor, prefill, 1)
p.write_text(text)

p = root / 'sms-consent.html'
text = p.read_text().replace('/sms-consent.js?v=20260904S1', '/sms-consent.js?v=20260908S2')
p.write_text(text)

p = root / 'sms-consent-server.js'
text = p.read_text()
old = "const tech=(getConfig().technicians||[]).find(t=>t.name?.trim().toLowerCase()===name.toLowerCase()&&normalizePhone(t.phone)===phone);\n        if(!tech)return reply(400,{error:'Your details must match the technician roster. Contact jguynes@rpc.net for assistance.'});"
new = "const cfg=getConfig()||{};\n        const roster=[...(cfg.technicians||[]),...(cfg.managers||[])];\n        const person=roster.find(t=>typeof t!=='string'&&(t.name||t.username||'').trim().toLowerCase()===name.toLowerCase()&&normalizePhone(t.phone||'')===phone);\n        if(!person)return reply(400,{error:'Your details must match the technician or manager roster. Contact jguynes@rpc.net for assistance.'});"
if old not in text:
    raise SystemExit('Consent roster insertion point not found')
text = text.replace(old, new, 1)
p.write_text(text)

p = root / 'api-server.js'
text = p.read_text()
old = "return { name, username, password, role: 'manager' };"
new = "const phone = (m.phone || (existing && existing.phone) || '').trim();\n          return { name, username, phone, password, role: 'manager' };"
if old not in text:
    raise SystemExit('Manager phone backend insertion point not found')
text = text.replace(old, new, 1)
text = text.replace("managers: out.map(m => ({ name: m.name, username: m.username }))", "managers: out.map(m => ({ name: m.name, username: m.username, phone: m.phone }))", 1)
p.write_text(text)

p = root / 'CHANGELOG.md'
text = p.read_text()
entry = '''\n## 2026-09-08 — SMS Preferences exposed in Setup\n- Added SMS Preferences controls to Technician and Manager Setup cards.\n- Selected name/phone are prefilled on the existing consent page.\n- Added Manager mobile phone storage for SMS enrollment.\n- SMS consent roster validation now accepts Technicians or Managers.\n\n'''
if 'SMS Preferences exposed in Setup' not in text:
    p.write_text(entry + text)

print('SMS Preferences patch applied.')

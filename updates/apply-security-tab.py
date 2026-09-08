from pathlib import Path

p = Path('db-viewer.html')
s = p.read_text()

old_nav = '''    <button id="tabAssign" class="active" onclick="switchTab('assign')">Assignments</button>
    <button id="tabAssets" onclick="switchTab('assets')">Setup</button>
    <a class="backbtn" href="/" title="Back to main app">← Main App</a>'''
new_nav = '''    <button id="tabAssign" class="active" onclick="switchTab('assign')">Assignments</button>
    <button id="tabAssets" onclick="switchTab('assets')">Setup</button>
    <button id="tabSecurity" onclick="switchTab('security')" style="display:none">Security</button>
    <a class="backbtn" href="/" title="Back to main app">← Main App</a>'''
if old_nav not in s:
    raise SystemExit('nav anchor not found')
s = s.replace(old_nav, new_nav, 1)

security_start = s.index('      <!-- SUPERUSER SECURITY -->')
security_end = s.index('      <!-- INSPECTION SETTINGS -->', security_start)
security_block = s[security_start:security_end]
s = s[:security_start] + s[security_end:]

insert_anchor = '  <!-- ASSETS TAB -->\n'
assets_pos = s.index(insert_anchor)
# Insert the dedicated Security tab before Setup so the DOM is clear and separate.
security_view = '''  <!-- SECURITY TAB (SUPERUSER ONLY) -->
  <div id="viewSecurity" class="view">
    <div class="bar">
      <span class="muted">Superuser-only account security and role management.</span>
    </div>
    <div class="security-page-grid">
''' + security_block.replace('      ', '      ', 1) + '''    </div>
  </div>

'''
s = s[:assets_pos] + security_view + s[assets_pos:]

# Replace the old cleanup CSS with dedicated security-page styling.
start = s.index('<style id="setup-admin-layout-cleanup">')
end = s.index('</style>', start) + len('</style>')
new_css = '''<style id="setup-admin-layout-cleanup">
  /* Dedicated Superuser Security page. */
  .security-page-grid{display:grid;grid-template-columns:1fr;gap:16px;max-width:980px;margin:0 auto;}
  #viewSecurity .mblock{width:100%;}
  #superuserSecurityBlock .contact-grid{grid-template-columns:repeat(2,minmax(220px,1fr));}
  #userRolesList{display:grid;grid-template-columns:1fr;gap:8px;margin-top:12px;}
  .user-role-row{display:grid;grid-template-columns:minmax(260px,1fr) minmax(170px,200px) 120px;gap:14px;align-items:center;border:1px solid var(--line);border-radius:10px;padding:12px 14px;background:#fff;}
  .user-role-row .msel{width:100%;min-width:0;}
  .user-role-action{width:100%;white-space:nowrap;}
  @media (max-width:700px){
    main{padding:12px;}
    #superuserSecurityBlock .contact-grid{grid-template-columns:1fr;}
    .user-role-row{grid-template-columns:1fr;gap:8px;}
    .user-role-row .msel,.user-role-action{width:100%;}
  }
</style>'''
s = s[:start] + new_css + s[end:]

old_apply = '''  var suSecurity = document.getElementById('superuserSecurityBlock');
  if(suSecurity) suSecurity.style.display = currentRole === 'superuser' ? '' : 'none';
  var userRoles = document.getElementById('userRolesBlock');
  if(userRoles) userRoles.style.display = currentRole === 'superuser' ? '' : 'none';'''
new_apply = '''  var suSecurity = document.getElementById('superuserSecurityBlock');
  if(suSecurity) suSecurity.style.display = currentRole === 'superuser' ? '' : 'none';
  var userRoles = document.getElementById('userRolesBlock');
  if(userRoles) userRoles.style.display = currentRole === 'superuser' ? '' : 'none';
  var securityTab = document.getElementById('tabSecurity');
  if(securityTab) securityTab.style.display = currentRole === 'superuser' ? '' : 'none';
  if(currentRole !== 'superuser'){
    var securityView = document.getElementById('viewSecurity');
    if(securityView && securityView.classList.contains('active')) switchTab('assign');
  }'''
if old_apply not in s:
    raise SystemExit('applyRoleUi anchor not found')
s = s.replace(old_apply, new_apply, 1)

old_switch = '''function switchTab(tab){
  ['assign','assets'].forEach(t => {
    document.getElementById('tab'+t.charAt(0).toUpperCase()+t.slice(1)).classList.remove('active');
    document.getElementById('view'+t.charAt(0).toUpperCase()+t.slice(1)).classList.remove('active');
  });
  document.getElementById('tab'+tab.charAt(0).toUpperCase()+tab.slice(1)).classList.add('active');
  document.getElementById('view'+tab.charAt(0).toUpperCase()+tab.slice(1)).classList.add('active');
  if(tab === 'assets'){ renderAssetManager(); }
}'''
new_switch = '''function switchTab(tab){
  if(tab === 'security' && currentRole !== 'superuser') tab = 'assign';
  ['assign','assets','security'].forEach(t => {
    var tb=document.getElementById('tab'+t.charAt(0).toUpperCase()+t.slice(1));
    var vw=document.getElementById('view'+t.charAt(0).toUpperCase()+t.slice(1));
    if(tb) tb.classList.remove('active');
    if(vw) vw.classList.remove('active');
  });
  var activeTab=document.getElementById('tab'+tab.charAt(0).toUpperCase()+tab.slice(1));
  var activeView=document.getElementById('view'+tab.charAt(0).toUpperCase()+tab.slice(1));
  if(activeTab) activeTab.classList.add('active');
  if(activeView) activeView.classList.add('active');
  if(tab === 'assets'){ renderAssetManager(); }
  if(tab === 'security'){ loadUserRoles(); }
}'''
if old_switch not in s:
    raise SystemExit('switchTab anchor not found')
s = s.replace(old_switch, new_switch, 1)

p.write_text(s)

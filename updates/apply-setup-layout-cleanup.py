from pathlib import Path

p = Path('db-viewer.html')
s = p.read_text()

marker = '</head>'
css = '''
<style id="setup-admin-layout-cleanup">
  /* Superuser admin controls get the full page width instead of skinny grid cards. */
  #superuserSecurityBlock,
  #userRolesBlock{grid-column:1/-1;width:100%;}

  #superuserSecurityBlock .contact-grid{
    grid-template-columns:repeat(4,minmax(180px,1fr));
  }

  #userRolesList{display:grid;grid-template-columns:1fr;gap:8px;margin-top:12px;}
  .user-role-row{
    display:grid;
    grid-template-columns:minmax(240px,1fr) minmax(160px,190px) 120px;
    gap:14px;
    align-items:center;
    border:1px solid var(--line);
    border-radius:10px;
    padding:12px 14px;
    background:#fff;
  }
  .user-role-row .msel{width:100%;min-width:0;}
  .user-role-action{width:100%;white-space:nowrap;}

  @media (max-width:900px){
    #superuserSecurityBlock .contact-grid{grid-template-columns:1fr 1fr;}
    .user-role-row{grid-template-columns:minmax(200px,1fr) 160px 112px;gap:10px;}
  }
  @media (max-width:640px){
    main{padding:12px;}
    #superuserSecurityBlock .contact-grid{grid-template-columns:1fr;}
    .user-role-row{grid-template-columns:1fr;gap:8px;}
    .user-role-row .msel,.user-role-action{width:100%;}
  }
</style>
'''
if 'id="setup-admin-layout-cleanup"' not in s:
    s = s.replace(marker, css + '\n' + marker, 1)

old_row = '''return '<div style="display:grid;grid-template-columns:minmax(160px,1fr) 150px auto;gap:10px;align-items:center;border:1px solid var(--line);border-radius:9px;padding:10px;margin:8px 0;background:#fff">'+
      '<div><b>'+esc(label)+'</b>'+login+note+'</div>'+
      '<select class="msel" id="roleSel_'+encodeURIComponent(u.role+'|'+u.key)+'" '+(locked?'disabled':'')+'>'+'''
new_row = '''return '<div class="user-role-row">'+
      '<div><b>'+esc(label)+'</b>'+login+note+'</div>'+
      '<select class="msel" id="roleSel_'+encodeURIComponent(u.role+'|'+u.key)+'" '+(locked?'disabled':'')+'>'+'''
if old_row not in s:
    raise SystemExit('user role row anchor not found')
s = s.replace(old_row, new_row, 1)
s = s.replace("'<button class=\"btn sm\" '+(locked?'disabled':'')+' onclick=\"changeUserRole('+'", "'<button class=\"btn sm user-role-action\" '+(locked?'disabled':'')+' onclick=\"changeUserRole('+'", 1) if False else s
# Exact button class replacement in generated HTML.
s = s.replace("'<button class=\"btn sm\" '+(locked?'disabled':'')+' onclick=\"changeUserRole('+JSON.stringify(u.key)+','+JSON.stringify(u.role)+')\">Change Role</button>'+", "'<button class=\"btn sm user-role-action\" '+(locked?'disabled':'')+' onclick=\"changeUserRole('+JSON.stringify(u.key)+','+JSON.stringify(u.role)+')\">Change Role</button>'+", 1)

old_label = '''  // Technician delete remains available to Managers by design.\n  var label = document.getElementById('roleLabel');\n  if(!label){\n    label = document.createElement('span');\n    label.id = 'roleLabel';\n    label.style.cssText = 'margin-left:10px;font-size:12px;opacity:.85';\n    var nav = document.querySelector('header nav');\n    if(nav) nav.appendChild(label);\n  }\n  if(label) label.textContent = currentRole ? (currentRole === 'superuser' ? 'Superuser' : 'Manager') + (currentUserName ? ' — ' + currentUserName : '') : '';\n'''
if old_label not in s:
    raise SystemExit('role header label anchor not found')
s = s.replace(old_label, '  // Technician delete remains available to Managers by design.\n', 1)

p.write_text(s)

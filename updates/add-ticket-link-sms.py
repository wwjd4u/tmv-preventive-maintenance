from pathlib import Path

# Patch work-orders.js: add a human-readable ticket number to every new assignment/report.
p = Path('work-orders.js')
s = p.read_text()
old = """  const createdAt = Date.now();\n  const ticket = ['CUDD Energy Services — Maintenance Report', 'Report / Assignment: ' + id,\n    'TMV Unit: ' + tmv, 'Van Type: ' + types.join(' + '), 'District: ' + location,\n"""
new = """  const createdAt = Date.now();\n  const ticketNumber = 'PM-' + date.replace(/-/g, '') + '-' + id.slice(0, 6).toUpperCase();\n  const ticket = ['CUDD Energy Services — Maintenance Report', 'Ticket: ' + ticketNumber, 'Report / Assignment ID: ' + id,\n    'TMV Unit: ' + tmv, 'Van Type: ' + types.join(' + '), 'District: ' + location,\n"""
if old not in s:
    raise SystemExit('work-orders.js ticket anchor not found')
s = s.replace(old, new, 1)
old = """  return { id, tmv, vanType: types.join(' + '), location, technician: { ...technician }, date,\n    createdAt, status: 'assigned', sections, results: null, completedAt: null, photos: [],\n"""
new = """  return { id, ticketNumber, tmv, vanType: types.join(' + '), location, technician: { ...technician }, date,\n    createdAt, status: 'assigned', sections, results: null, completedAt: null, photos: [],\n"""
if old not in s:
    raise SystemExit('work-orders.js return anchor not found')
s = s.replace(old, new, 1)
p.write_text(s)

# Patch assign.html: show ticket number and send a detailed SMS with a direct deep link.
p = Path('assign.html')
s = p.read_text()
old = """function statusLabel(s){ return (s||'assigned').replace('_',' '); }\n\nfunction workOrderEmail(a, technicianName){\n"""
new = """function statusLabel(s){ return (s||'assigned').replace('_',' '); }\nfunction ticketNumber(a){\n  if(a && a.ticketNumber) return a.ticketNumber;\n  var date=String((a&&a.date)||'').replace(/-/g,'');\n  var short=String((a&&a.id)||'').slice(0,6).toUpperCase();\n  return 'PM-'+(date||'WORK')+'-'+(short||'ORDER');\n}\nfunction technicianWorkOrderUrl(a){\n  return location.origin+'/tech/'+encodeURIComponent(a.id);\n}\n\nfunction workOrderEmail(a, technicianName){\n"""
if old not in s:
    raise SystemExit('assign.html helper anchor not found')
s = s.replace(old, new, 1)
old = """  var lines=['CUDD Energy Services — Maintenance Work Order',\n    'Work order: '+a.id, 'TMV: '+(a.tmv||''),\n"""
new = """  var lines=['CUDD Energy Services — Maintenance Work Order',\n    'Ticket: '+ticketNumber(a), 'Assignment ID: '+a.id, 'TMV: '+(a.tmv||''),\n"""
if old not in s:
    raise SystemExit('assign.html email ticket anchor not found')
s = s.replace(old, new, 1)
old = """    'Scheduled date: '+(a.date||''), 'Status: '+statusLabel(a.status), '',\n    'Open your work order: '+location.origin+'/tech/'+encodeURIComponent(a.id), '',\n"""
new = """    'Scheduled date: '+(a.date||''), 'Status: '+statusLabel(a.status), '',\n    'Open your work order: '+technicianWorkOrderUrl(a), '',\n"""
if old not in s:
    raise SystemExit('assign.html email link anchor not found')
s = s.replace(old, new, 1)
old = """async function sendSms(btn){\n  var num=btn.getAttribute('data-sms')||'';\n  if(!num){ alert('No phone number on file for this technician.'); return; }\n  var msg='CUDD PM: work order '+ (window.__tmv||'') +' — open the PM app to view details.';\n"""
new = """async function sendSms(btn){\n  var num=btn.getAttribute('data-sms')||'';\n  if(!num){ alert('No phone number on file for this technician.'); return; }\n  var a=window.__assignment||{};\n  var msg=[\n    'CUDD PM Work Order',\n    'Ticket: '+ticketNumber(a),\n    'TMV: '+(a.tmv||''),\n    'District: '+(a.location||''),\n    'Scheduled: '+(a.date||''),\n    'Open work order: '+technicianWorkOrderUrl(a),\n    'Reply STOP to opt out.'\n  ].join('\\n');\n"""
if old not in s:
    raise SystemExit('assign.html SMS anchor not found')
s = s.replace(old, new, 1)
old = """    window.__tmv=a.tmv||'';\n    var t=a.technician||{};\n"""
new = """    window.__tmv=a.tmv||'';\n    window.__assignment=a;\n    var t=a.technician||{};\n"""
if old not in s:
    raise SystemExit('assign.html assignment global anchor not found')
s = s.replace(old, new, 1)
old = """    var h='<div class=\"card\">';\n    h+='<div class=\"top\"><h1>'+esc(a.tmv||'Untitled')+'</h1><span class=\"st st-'+(a.status||'assigned')+'\">'+statusLabel(a.status)+'</span></div>';\n"""
new = """    var h='<div class=\"card\">';\n    h+='<div class=\"top\"><h1>'+esc(a.tmv||'Untitled')+'</h1><span class=\"st st-'+(a.status||'assigned')+'\">'+statusLabel(a.status)+'</span></div>';\n    h+='<div class=\"sub\"><b>Ticket:</b> '+esc(ticketNumber(a))+'</div>';\n"""
if old not in s:
    raise SystemExit('assign.html display ticket anchor not found')
s = s.replace(old, new, 1)
p.write_text(s)

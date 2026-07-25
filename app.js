// ── CUDD Preventive Maintenance — external app logic ──────────────
console.log('[TMV-APP] BUILD-20260720-D loaded');
function showErr(msg){
  var s = document.getElementById('errSlot');
  if(!s) return;
  s.innerHTML = '<div class="err">APP ERROR: '+ escapeHtml(msg) +'</div>';
}
window.addEventListener('error', function(e){ showErr((e.error&&(e.error.stack||e.error.message))||e.message||String(e)); });
window.addEventListener('unhandledrejection', function(e){ showErr('promise: '+((e.reason&&(e.reason.stack||e.reason.message))||e.reason)); });

function escapeHtml(s){return (s==null?'':String(s)).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function escAttr(s){return escapeHtml(s).replace(/"/g,'&quot;');}

var configData = {};
var assets = [];
var assignments = [];
var selectedTmv = null;
var selectedVan = null;

async function boot(){
  try{
    await loadConfig();
    await loadAssets();
    await loadAssignments();
    buildTracker();
    buildTechFilter();
    buildTmvGrid();
    buildTechSelect();
    // Honor #tracker / #tmv deep links (e.g. "Back to Tracker" from assign.html)
    showViewFromHash();
    window.addEventListener('hashchange', showViewFromHash);
  }catch(e){ showErr('boot failed: '+((e&&(e.stack||e.message))||e)); }
}
function showViewFromHash(){
  var v = (location.hash||'').replace('#','');
  if(v!=='tracker' && v!=='tmv' && v!=='tech') v='tmv';
  showView(v);
  if(v==='tracker') buildTracker();
}

async function loadAssignments(){
  var r = await fetch('/api/assignments');
  if(!r.ok) throw new Error('/api/assignments HTTP '+r.status);
  var d = await r.json();
  assignments = d.assignments || [];
}

async function loadConfig(){
  var r = await fetch('/api/config');
  if(!r.ok) throw new Error('/api/config HTTP '+r.status);
  configData = await r.json();
  var ft = document.getElementById('filterType');
  if(ft) (configData.vanTypes||[]).forEach(function(v){ var o=document.createElement('option'); o.value=v; o.textContent=v; ft.appendChild(o); });
  var dl = document.getElementById('dLoc');
  (configData.locations||[]).forEach(function(l){ var o=document.createElement('option'); o.value=l; o.textContent=l; dl.appendChild(o); });
}
async function loadAssets(){
  var r = await fetch('/api/assets');
  if(!r.ok) throw new Error('/api/assets HTTP '+r.status);
  var d = await r.json();
  assets = Array.isArray(d) ? d : (d.assets || []);
}

// ── Status ────────────────────────────────────────────
function daysLeft(a){
  if(a.lastMaint==null) return Infinity;
  var mult = a.unit==='weeks'?7:a.unit==='months'?30:1;
  var ivDays = (a.interval||30)*mult;
  return Math.floor((a.lastMaint + ivDays*86400000 - Date.now())/86400000);
}
function statusOf(a){ if(a.lastMaint==null) return 'none'; var d=daysLeft(a); return d<0?'due':d<=7?'warn':'ok'; }
var SL={ok:'OK',warn:'Due Soon',due:'DUE',none:'Never Done'};
var SC={ok:'b-ok',warn:'b-warn',due:'b-due',none:'b-none'};

// ── Tracker = assignments board (clickable) ──────────────────
var SL2={assigned:'Assigned',in_progress:'In Progress',completed:'Completed',rejected:'Rejected'};
function buildTechFilter(){
  var sel=document.getElementById('filterTech');
  var names=[];
  assignments.forEach(function(a){ if(a.technician&&a.technician.name&&names.indexOf(a.technician.name)<0) names.push(a.technician.name); });
  names.sort().forEach(function(n){ var o=document.createElement('option'); o.value=n; o.textContent=n; sel.appendChild(o); });
}
function contactBar(tech){
  if(!tech) return '';
  var phone=tech.phone||'';
  var em=tech.email||'';
  var smsDigits=phone.replace(/\D/g,'');
  var bars='<div class="contact-bar">';
  if(phone) bars+='<a class="cb-call" href="tel:'+escAttr(phone)+'">📞 Call</a>';
  if(em) bars+='<a class="cb-email" href="mailto:'+escAttr(em)+'">✉️ Email</a>';
  if(smsDigits) bars+='<button class="cb-sms" data-sms="'+escAttr(smsDigits)+'" onclick="sendSms(this)">💬 Text / SMS</button>';
  bars+='</div>';
  return bars;
}
function photoGrid(photos){
  if(!photos||!photos.length) return '';
  return '<div class="photos">'+photos.map(function(p){
    var src=p.file?('/uploads/'+encodeURIComponent(p.file)):p.local;
    return '<div class="photo"><img src="'+escAttr(src)+'" alt="" loading="lazy"></div>';
  }).join('')+'</div>';
}
// Merge the full checklist (labels) with the tech's results (values) into one
// flat list, tagged done (= answered / non-empty value) or todo (= empty).
function mergeProgress(a){
  var out=[];
  var secs=a.sections||[];
  (a.results||[]).forEach(function(rs){
    var sec=secs.find(function(s){ return s.title===rs.title; })||{};
    var labels=(sec.items||[]).map(function(it){ return it.label; });
    (rs.items||[]).forEach(function(it,ii){
      var label=it.label || labels[ii] || ('Item '+(ii+1));
      var val=it.value==null ? '' : String(it.value).trim();
      out.push({ section:rs.title, label:label, value:val, done: val.length>0 });
    });
  });
  return out;
}
function resultsHtml(a){
  if(!a.results||!a.results.length) {
    return a.status==='completed' ? '<div class="results-sec"><b>No results recorded.</b></div>' : '';
  }
  var items=mergeProgress(a);
  var done=items.filter(function(x){ return x.done; });
  var todo=items.filter(function(x){ return !x.done; });
  function row(x){
    var v = x.done ? (x.value||'—') : 'Needs answer';
    return '<div class="row prog-row '+(x.done?'prog-done':'prog-todo')+'">'
      +'<span class="lbl">'+escapeHtml(x.label)+'</span>'
      +'<span class="sec-tag">'+escapeHtml(x.section)+'</span>'
      +'<span class="ctl">'+escapeHtml(v)+'</span></div>';
  }
  var h='<div class="results-sec"><b>Progress</b>';
  if(done.length){
    h+='<div class="prog-group"><div class="prog-head prog-head-done">✅ Completed ('+done.length+')</div>'+done.map(row).join('')+'</div>';
  }
  if(todo.length){
    h+='<div class="prog-group"><div class="prog-head prog-head-todo">⬜ Needs attention ('+todo.length+')</div>'+todo.map(row).join('')+'</div>';
  }
  h+='</div>';
  return h;
}
function trackerCard(a){
  var t=a.technician||{};
  var techName=t&&t.name?t.name:'';
  var cnt=0; (a.sections||[]).forEach(function(s){ cnt+=(s.items||[]).length; });
  var detId='det_'+a.id;
  var sub = [a.vanType, a.location, a.date].filter(Boolean).map(escapeHtml).join(' · ');
  // Card is a link → opens the full, readable work-order page (assign.html).
  // draggable=true enables drag-and-drop reorder + reassign to another tech.
  return '<a class="assign-card" draggable="true" data-id="'+escAttr(a.id)+'" href="assign.html?id='+encodeURIComponent(a.id)+'">'
    + '<div class="top"><h3>'+escapeHtml(a.tmv||'Untitled')+'</h3>'
    + '<span class="st st-'+(a.status||'assigned')+'">'+(SL2[a.status]||a.status)+'</span></div>'
    + (sub?'<div class="sub">'+sub+'</div>':'')
    + (techName?'<div class="tech">👷 '+escapeHtml(techName)+'</div>':'')
    + '<div class="cnt">'+cnt+' items · '+a.sections.length+' sections</div>'
    + '<div class="open-cue">View work order →</div>'
    + '</a>';
}
function techGroupHeader(name, n, filtered){
  var label = name || 'Unassigned';
  var avatar = name ? name.trim().charAt(0).toUpperCase() : '?';
  return '<div class="tech-group-head" data-tech="'+escAttr(name||'')+'">'
    + '<div class="tg-avatar">'+escapeHtml(avatar)+'</div>'
    + '<div class="tg-name">'+escapeHtml(label)+'</div>'
    + '<div class="tg-count">'+n+' '+(n===1?'task':'tasks')+(filtered?' (filtered)':'')+'</div>'
    + '</div>';
}
function buildTracker(){
  var f=document.getElementById('filter').value;
  var ft=document.getElementById('filterTech').value;
  var q=(document.getElementById('filterText').value||'').toLowerCase();
  // status summary (across all, unfiltered by tech/search)
  var counts={assigned:0,in_progress:0,completed:0,rejected:0};
  assignments.forEach(function(a){ if(counts[a.status]!=null) counts[a.status]++; });

  // Group by technician name ('' / missing → "Unassigned")
  var groups={}; // name -> [assignments]
  assignments.forEach(function(a){
    var tn=(a.technician&&a.technician.name)||'';
    if(!groups[tn]) groups[tn]=[];
    groups[tn].push(a);
  });
  // Stable tech order: known techs from config first (in config order), then others, then Unassigned last.
  var known=(configData.technicians||[]).map(function(t){return t.name;});
  var allNames=Object.keys(groups);
  var ordered=known.filter(function(n){return allNames.indexOf(n)>=0;});
  allNames.filter(function(n){return ordered.indexOf(n)<0 && n!=='';}).forEach(function(n){ordered.push(n);});
  if('' in groups) ordered.push('');

  var html='';
  ordered.forEach(function(name){
    var items=groups[name].slice().sort(function(x,y){ return (x.order||0)-(y.order||0) || (x.createdAt||0)-(y.createdAt||0); });
    // apply status + search filters (tech filter 'all' shows every group; specific tech shows only that group)
    var visible=items.filter(function(a){
      if(ft!=='all' && name!==ft) return false;
      if(f!=='all' && a.status!==f) return false;
      var hay=((a.tmv||'')+' '+(a.technician&&a.technician.name||'')+' '+(a.vanType||'')+' '+(a.location||'')).toLowerCase();
      if(q && hay.indexOf(q)<0) return false;
      return true;
    });
    if(ft!=='all' && name!==ft) return; // when filtering to one tech, skip other groups entirely
    html+= '<div class="tech-group" data-tech="'+escAttr(name||'')+'">';
    html+= techGroupHeader(name, items.length, visible.length!==items.length);
    if(visible.length){
      html+= '<div class="cards tech-cards" data-tech="'+escAttr(name||'')+'">'+visible.map(trackerCard).join('')+'</div>';
    } else {
      html+= '<div class="tech-empty">No tasks here'+(f!=='all'?' for status "'+f+'"':'')+'.</div>';
    }
    html+= '</div>';
  });
  if(!html) html='<p style="color:#888">No assignments match.</p>';
  document.getElementById('cards').innerHTML = html;
  document.getElementById('summary').innerHTML =
    '<div class="pill"><b>'+counts.assigned+'</b>Assigned</div>'
    +'<div class="pill"><b style="color:#d97706">'+counts.in_progress+'</b>In Progress</div>'
    +'<div class="pill"><b style="color:#16a34a">'+counts.completed+'</b>Completed</div>'
    +'<div class="pill"><b style="color:#dc2626">'+counts.rejected+'</b>Rejected</div>'
    +'<div class="pill hint">Drag a card to reorder · drag onto another tech to reassign</div>';
  wireTrackerDnd();
}
// ── Drag & drop: reorder within a tech, or reassign across techs ──
var _dragId=null;
function wireTrackerDnd(){
  var cards=document.querySelectorAll('#cards .assign-card');
  cards.forEach(function(card){
    card.addEventListener('dragstart', function(e){
      _dragId=card.getAttribute('data-id');
      card.classList.add('dragging');
      try{ e.dataTransfer.setData('text/plain', _dragId); e.dataTransfer.effectAllowed='move'; }catch(_){}
    });
    card.addEventListener('dragend', function(){
      _dragId=null; card.classList.remove('dragging');
      document.querySelectorAll('.tech-group.drag-over').forEach(function(g){ g.classList.remove('drag-over'); });
    });
  });
  var groups=document.querySelectorAll('#cards .tech-group');
  groups.forEach(function(group){
    group.addEventListener('dragover', function(e){ e.preventDefault(); group.classList.add('drag-over'); try{ e.dataTransfer.dropEffect='move'; }catch(_){} });
    group.addEventListener('dragleave', function(e){ if(!group.contains(e.relatedTarget)) group.classList.remove('drag-over'); });
    group.addEventListener('drop', function(e){
      e.preventDefault(); group.classList.remove('drag-over');
      var id=_dragId||''; if(!id) return;
      var targetTech=group.getAttribute('data-tech')||'';
      // Determine new order: position of drop within this group's visible cards.
      var container=group.querySelector('.tech-cards');
      var sibs=container?Array.prototype.slice.call(container.querySelectorAll('.assign-card')):[];
      // remove the dragged one, insert at end if no precise slot (keep simple: append)
      applyTrackerMove(id, targetTech, sibs);
    });
  });
}
function applyTrackerMove(id, targetTech, sibs){
  // Recompute order for every assignment in the affected tech group(s) and persist.
  var targetName=targetTech||'';
  // Build the new order list: all cards currently in the target group's DOM (after drop) plus the moved one.
  var updates=[];
  // For simplicity + correctness: re-derive order for ALL assignments per tech from current data + the move.
  // 1) Set the moved assignment's technician to targetTech.
  var moved=assignments.find(function(a){ return a.id===id; });
  if(!moved) return;
  moved.technician = targetName ? { name: targetName } : { name: '' };
  // 2) For each tech group, sort remaining by existing order, then assign sequential order.
  var groups={};
  assignments.forEach(function(a){ var tn=(a.technician&&a.technician.name)||''; (groups[tn]=groups[tn]||[]).push(a); });
  Object.keys(groups).forEach(function(tn){
    groups[tn].sort(function(x,y){ return (x.order||0)-(y.order||0) || (x.createdAt||0)-(y.createdAt||0); })
      .forEach(function(a,i){ a.order=i; updates.push({ id:a.id, technician:(a.technician&&a.technician.name)||'', order:i }); });
  });
  // optimistic UI refresh
  buildTracker();
  // persist
  fetch('/api/assignments/order', { method:'PATCH', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ items: updates }) })
    .then(function(r){ return r.json(); })
    .then(function(d){ if(!d.ok) console.warn('order save failed', d.error); })
    .catch(function(e){ console.warn('order save error', e); });
}
['filter','filterTech'].forEach(function(id){ var e=document.getElementById(id); if(e) e.addEventListener('change', buildTracker); });
var _ft=document.getElementById('filterText'); if(_ft) _ft.addEventListener('input', buildTracker);

function showView(v){
  document.getElementById('viewTracker').classList.toggle('active', v==='tracker');
  document.getElementById('viewTmv').classList.toggle('active', v==='tmv');
  document.getElementById('viewTech').classList.toggle('active', v==='tech');
  document.getElementById('tabTracker').classList.toggle('active', v==='tracker');
  document.getElementById('tabTmv').classList.toggle('active', v==='tmv');
  document.getElementById('tabTech').classList.toggle('active', v==='tech');
}

// ── TMV grid ───────────────────────────────────────────
// Full checklist (schema only) for a vanType string, filtered by config `appliesTo`.
// This is the single source of truth emitted to the tech page, ticket and Task.db.
function fullChecklistFor(vanType) {
  var vts = String(vanType || '').split(/\s*\+\s*/).map(function(s){return s.trim();}).filter(Boolean);
  return (configData.checklist || []).filter(function(s){
    if (typeof s === 'string') return true;
    if (s.include === false) return false;
    return s.appliesTo.some(function(v){ return vts.indexOf(v) >= 0; });
  }).map(function(s){
    if (typeof s === 'string') return { title: s, items: [] };
    return { title: s.title, items: (s.items || []).map(function(it){ return { label: it.label, type: it.type }; }) };
  });
}

function buildTmvGrid() {
  var grid=document.getElementById('tmvGrid');
  var map=configData.tmvVanMap||{}, keys=Object.keys(map);
  if(!keys.length){ grid.innerHTML='<p style="color:#888">No TMV units configured.</p>'; return; }
  grid.innerHTML=keys.map(function(k){
    return '<button class="tmv-btn" onclick="openTmv(\''+escAttr(k)+'\')">'
      +'<div class="id">'+escapeHtml(k)+'</div>'
      +'<div class="vt">'+escapeHtml(map[k].join(' + '))+'</div></button>';
  }).join('');
}

function openTmv(k){
  selectedTmv=k;
  selectedVan=((configData.tmvVanMap||{})[k]||[]).join(' + ');
  document.getElementById('dTmv').value=k;
  document.getElementById('dVan').value=selectedVan;
  document.getElementById('dDate').value=new Date().toISOString().slice(0,10);
  document.getElementById('dLoc').selectedIndex=0;
  document.getElementById('dTech').selectedIndex=0;
  buildSections(k);
  document.getElementById('tmvPicker').classList.add('hidden');
  document.getElementById('tmvDetail').classList.remove('hidden');
  document.getElementById('ticketOut').classList.add('hidden');
  updateGen();
}
function backToTmv(){
  document.getElementById('tmvDetail').classList.add('hidden');
  document.getElementById('tmvPicker').classList.remove('hidden');
  selectedTmv=null;
}

function buildSections(k){
  var vts=(configData.tmvVanMap||{})[k]||[];
  var all=(configData.checklist||[]).filter(function(s){
    if(typeof s==='string') return true;
    if(s.include===false) return false; // admin disabled this section
    return s.appliesTo.some(function(v){return vts.indexOf(v)>=0;});
  });
  var wrap=document.getElementById('sections');
  wrap.innerHTML=all.map(function(s,si){
    var items=s.items.map(function(it,ii){
      return '<div class="row"><div class="lbl">'+escapeHtml(it.label)+'</div><div class="ctl" data-s="'+si+'" data-i="'+ii+'">'+renderCtl(it)+'</div></div>';
    }).join('');
    return '<div class="section" data-s="'+si+'"><h3>'+escapeHtml(s.title)+'</h3>'
      +'<div class="items">'+items+'</div></div>';
  }).join('');
}

function renderCtl(it){
  var idB='';
  switch(it.type){
    case 'yn': return '<label><input type="radio" name="r" data-k="yn" value="Yes">Yes</label><label><input type="radio" name="r" data-k="yn" value="No">No</label>';
    case 'ynpf': return '<label><input type="radio" data-k="yn" value="Yes">Yes</label><label><input type="radio" data-k="yn" value="No">No</label><label><input type="radio" data-k="pf" value="Pass">Pass</label><label><input type="radio" data-k="pf" value="Fail">Fail</label>';
    case 'ynver': return '<label><input type="radio" data-k="yn" value="Yes">Yes</label><label><input type="radio" data-k="yn" value="No">No</label><label>Ver#<input type="text" data-k="ver" size="6"></label>';
    case 'pf': return '<label><input type="radio" data-k="pf" value="Pass">Pass</label><label><input type="radio" data-k="pf" value="Fail">Fail</label>';
    case 'num': return '<input type="number" data-k="val" placeholder="value">';
    case 'text': return '<input type="text" data-k="val" size="22" placeholder="entry">';
    case 'date': return '<input type="date" data-k="val">';
    case 'choice': return '<select data-k="val">'+it.opts.map(function(o){return '<option value="'+escAttr(o)+'">'+escapeHtml(o)+'</option>';}).join('')+'</select>';
    default: return '<input type="text" data-k="val">';
  }
}

function collectSections(){
  var wrap=document.getElementById('sections');
  var secs=Array.prototype.slice.call(wrap.querySelectorAll('.section'));
  var out=[];
  secs.forEach(function(sec, si){
    var title=sec.querySelector('h3').textContent;
    var itemDefs=((configData.checklist||[]).find(function(s){return s.title===title;})||{}).items||[];
    var rows=Array.prototype.slice.call(sec.querySelectorAll('.row'));
    var items=rows.map(function(row, ii){
      var ctl=row.querySelector('.ctl');
      var lbl=row.querySelector('.lbl').textContent;
      var def=itemDefs[ii]||{type:'text'};
      var val=readCtl(ctl, def);
      return {label:lbl, value:val};
    }).filter(function(it){return it.value!=='';});
    if(items.length) out.push({title:title, items:items});
  });
  return out;
}
function readCtl(ctl, def){
  var yn=ctl.querySelector('[data-k="yn"]:checked');
  var pf=ctl.querySelector('[data-k="pf"]:checked');
  var ver=ctl.querySelector('[data-k="ver"]');
  if(yn){ return pf ? (yn.value+' / '+pf.value) : yn.value; }
  if(def && def.type==='ynver'){
    if(!yn) return '';
    if(ver && ver.value) return yn.value+' v'+ver.value;
    return yn.value;
  }
  if(pf){ return pf.value; }
  var val=ctl.querySelector('[data-k="val"]');
  return val ? val.value : '';
}

function buildTechSelect(){
  var sel=document.getElementById('dTech');
  (configData.technicians||[]).forEach(function(t){
    var o=document.createElement('option'); o.value=t.name; o.textContent=t.name; sel.appendChild(o);
  });
  sel.addEventListener('change', updateGen);
}
['dLoc','dDate'].forEach(function(id){ var e=document.getElementById(id); if(e) e.addEventListener('change', updateGen); });

function updateGen(){
  var loc=document.getElementById('dLoc').value;
  var tech=document.getElementById('dTech').value;
  var filled=collectSections().length>0;
  document.getElementById('genBtn').disabled = !(selectedTmv && loc && tech && filled);
  document.getElementById('assignBtn').disabled = !(selectedTmv && loc && tech && filled);
}

async function submitInspection(){
  var techName=document.getElementById('dTech').value;
  var loc=document.getElementById('dLoc').value;
  var date=document.getElementById('dDate').value;
  var tech=(configData.technicians||[]).filter(function(t){return t.name===techName;})[0]||{name:techName};
  var sections=collectSections();
  // Ticket + inspection log should reflect the FULL checklist, not just the
  // items the admin typed into. Build a complete section list for the ticket.
  var full=fullChecklistFor(selectedVan);
  var btn=document.getElementById('genBtn');
  btn.disabled=true; btn.textContent='Working…';
  try{
    // 1) ticket
    var r=await fetch('/api/dispatch',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({tmv:selectedTmv, vanType:selectedVan, functions:full.map(function(s){return s.title+': '+s.items.map(function(i){return i.label+'=';}).join(', ');}), technician:tech})});
    var d=await r.json(); if(!r.ok) throw new Error(d.error||('HTTP '+r.status));
    // 2) log inspection
    var r2=await fetch('/api/inspection',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({tmv:selectedTmv, vanType:selectedVan, location:loc, date:date, technician:tech, sections:full})});
    var d2=await r2.json(); if(!r2.ok) throw new Error(d2.error||('log HTTP '+r2.status));
    await loadAssets(); buildTracker();
    var out=document.getElementById('ticketOut'); out.classList.remove('hidden');
    out.innerHTML='<div class="ticket"><h3>Ticket — '+escapeHtml(tech.name)+'</h3>'
      +'<pre>'+escapeHtml(d.ticket)+'</pre>'
      +'<div class="links">'
      +(d.hasEmail?'<a class="em" href="'+d.mailto+'" onclick="return mailtoFallback(event)" title="Opens your mail app">Send via Email</a>':'')
      +(d.hasEmail?'<button class="btn ghost" onclick="copyMailTo()">Copy Email Text</button>':'')
      +(d.smsDigits?'<button class="btn sms" data-sms="'+escAttr(d.smsDigits)+'" data-ticket="'+encodeURIComponent(d.ticket)+'" onclick="sendDispatchSms(this)">Send via SMS</button>':'')
      +'<button class="btn ghost" onclick="copyTicket()">Copy Ticket</button></div>'
      +'<div class="ok-note">✓ Inspection logged for '+escapeHtml(selectedTmv)+' ('+escapeHtml(loc)+', '+escapeHtml(date)+')</div></div>';
    window.__lastTicket=d.ticket;
  }catch(e){ showErr('submit failed: '+((e&&(e.message))||e)); }
  finally{ btn.disabled=false; btn.textContent='Generate Ticket & Log'; updateGen(); }
}
function copyTicket(){ if(navigator.clipboard&&window.__lastTicket){ navigator.clipboard.writeText(window.__lastTicket).then(function(){alert('Copied');},function(){alert('Copy failed');}); } }
// Send an SMS via the server (which calls the SMS provider). Works from any browser.
function appBaseUrl(){ return (configData && configData.appUrl) || (window.location && window.location.origin) || ''; }
async function sendSms(btn){
  var num = btn.getAttribute('data-sms') || '';
  if(!num){ alert('No phone number on file for this technician.'); return; }
  // Build a short default message that links back to the app
  var msg = 'CUDD PM: you have a work order update. Open the PM app: ' + appBaseUrl();
  _doSms(num, msg, btn);
}
async function sendDispatchSms(btn){
  var num = btn.getAttribute('data-sms') || '';
  var ticket = decodeURIComponent(btn.getAttribute('data-ticket') || '');
  if(!num){ alert('No phone number on file for this technician.'); return; }
  var link = appBaseUrl();
  _doSms(num, ticket + (link ? '\n\nOpen the PM app: ' + link : ''), btn);
}
async function _doSms(num, msg, btn){
  var prev = btn.textContent;
  btn.disabled = true; btn.textContent = 'Sending…';
  try{
    var r = await fetch('/api/sms', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({to:num, message:msg})});
    var d = await r.json();
    if(!r.ok || !d.ok) throw new Error(d.error || ('HTTP '+r.status));
    btn.textContent = '✓ Sent';
    setTimeout(function(){ btn.textContent = prev; btn.disabled = false; }, 2500);
  }catch(e){
    btn.disabled = false; btn.textContent = prev;
    alert('SMS failed: ' + (e.message||e) + (d && d.quota ? ' (quota: '+d.quota+')' : ''));
  }
}
// If the browser has no mail client, the mailto link would leave a blank tab.
// This opens the mailto in the SAME tab (so no orphan blank tab) and if it fails,
// we copy the message text to clipboard and tell the user to paste it into their email.
function mailtoFallback(e){
  e.preventDefault();
  var href=document.querySelector('.em').getAttribute('href');
  // try opening in same tab; if OS doesn't catch it, fall back to copy
  var w=window.open(href, '_self');
  // give the OS a moment; if still on same page, copy text
  setTimeout(function(){
    if(window.location.href.indexOf('mailto:')!==0){
      copyMailTo();
    }
  }, 300);
  return false;
}
function copyMailTo(){
  var a=document.querySelector('.em');
  if(!a) return;
  var href=a.getAttribute('href')||'';
  // decode mailto into To / Subject / Body for a clean copy
  var to=(href.match(/^mailto:([^?]+)/)||[])[1]||'';
  var subj=decodeURIComponent((href.match(/[?&]subject=([^&]+)/)||[])[1]||'');
  var body=decodeURIComponent((href.match(/[?&]body=([^&]+)/)||[])[1]||'');
  var text='To: '+to+'\nSubject: '+subj+'\n\n'+body;
  if(navigator.clipboard){ navigator.clipboard.writeText(text).then(function(){alert('Email text copied — paste it into your mail app');},function(){alert('Copy failed');}); }
  else { alert(text); }
  window.__lastMail=text;
}

// ── Assign to Technician (handoff to mobile) ─────────────
async function assignToTech(){
  var techName=document.getElementById('dTech').value;
  var loc=document.getElementById('dLoc').value;
  var date=document.getElementById('dDate').value;
  // Emit the FULL checklist (single source of truth) for this van type,
  // not just the items the admin happened to type into before assigning.
  var sections=fullChecklistFor(selectedVan);
  var tech=(configData.technicians||[]).filter(function(t){return t.name===techName;})[0]||{name:techName};
  var btn=document.getElementById('assignBtn');
  btn.disabled=true; btn.textContent='Working…';
  try{
    var r=await fetch('/api/assignments',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({tmv:selectedTmv, vanType:selectedVan, location:loc, date:date, technician:tech, sections:sections})});
    var d=await r.json();
    if(!r.ok) throw new Error(d.error||('HTTP '+r.status));
    var link='http://'+location.host+'/tech/'+d.assignment.id;
    var out=document.getElementById('assignOut'); out.classList.remove('hidden');
    out.innerHTML='<div class="ok-note">✓ Assigned to '+escHtml(techName)+'</div>'
      +'<div class="assign-link"><b>Technician link:</b><br><a href="'+link+'" target="_blank">'+escHtml(link)+'</a>'
      +'<br><button class="btn ghost" style="margin-top:8px" id="copyLinkBtn">Copy Link</button></div>'
      +'<div class="meta" style="margin-top:6px">Open on the tech\'s phone (text/email it). They complete the checklist with photos, then it returns here.</div>';
    var cb=document.getElementById('copyLinkBtn');
    if(cb) cb.addEventListener('click', function(){ copyLink(link); });
  }catch(e){ showErr('assign failed: '+((e&&(e.message))||e)); }
  finally{ btn.disabled=false; btn.textContent='📲 Assign to Technician'; updateGen(); }
}
async function loadDemo(){
  var btn=document.getElementById('demoBtn');
  btn.disabled=true; btn.textContent='Working…';
  try{
    var r=await fetch('/api/assignments/demo',{method:'POST'});
    var d=await r.json();
    if(!r.ok) throw new Error(d.error||('HTTP '+r.status));
    var techUrl='http://'+location.host+'/tech';
    var out=document.getElementById('assignOut'); out.classList.remove('hidden');
    out.innerHTML='<div class="ok-note">🧪 Loaded '+d.created.length+' demo work orders</div>'
      +'<div class="assign-link"><b>Tester link (open on phone):</b><br><a href="'+techUrl+'" target="_blank">'+escHtml(techUrl)+'</a>'
      +'<br><button class="btn ghost" style="margin-top:8px" id="copyTechBtn">Copy Tester Link</button></div>'
      +'<div class="meta" style="margin-top:6px">Send that link to testers. They see the open work orders, tap one, complete it with photos.</div>';
    var cb=document.getElementById('copyTechBtn');
    if(cb) cb.addEventListener('click', function(){ copyLink(techUrl); });
  }catch(e){ showErr('demo load failed: '+((e&&(e.message))||e)); }
  finally{ btn.disabled=false; btn.textContent='🧪 Load Demo Work Orders'; }
}
function escHtml(s){return (s==null?'':String(s)).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

function goDb(){
  sessionStorage.setItem("tmv_db_user", "admin");
  sessionStorage.setItem("tmv_db_pass", "admin123");
  window.open("/db?autologin=1", "_blank");
}

// ── Auth removed: app opens directly to the TMV grid ─────

boot();


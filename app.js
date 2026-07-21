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
var selectedTmv = null;
var selectedVan = null;

async function boot(){
  try{
    await loadConfig();
    await loadAssets();
    buildTracker();
    buildTmvGrid();
    buildTechSelect();
  }catch(e){ showErr('boot failed: '+((e&&(e.stack||e.message))||e)); }
}

async function loadConfig(){
  var r = await fetch('/api/config');
  if(!r.ok) throw new Error('/api/config HTTP '+r.status);
  configData = await r.json();
  var ft = document.getElementById('filterType');
  (configData.vanTypes||[]).forEach(function(v){ var o=document.createElement('option'); o.value=v; o.textContent=v; ft.appendChild(o); });
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

function buildTracker(){
  var f=document.getElementById('filter').value, tf=document.getElementById('filterType').value;
  var c={ok:0,warn:0,due:0}, html='';
  assets.forEach(function(a){
    if(a.lastMaint==null) return; // hide never-done vans
    var st=statusOf(a); c[st]++;
    if(tf!=='all'&&a.type!==tf) return;
    var d=daysLeft(a), dl=d===Infinity?'—':(d+'d left');
    html+='<div class="card"><h3>'+escapeHtml(a.name||'Untitled')+'</h3>'
      +'<span class="badge '+SC[st]+'">'+SL[st]+'</span>'
      +'<div class="meta">'+(a.type||'')+' · '+(a.location||'')+'</div>'
      +'<div class="meta">'+dl+' · IV '+(a.interval||30)+' '+(a.unit||'days')+'</div>'
      +(a.tmvId?'<div class="meta">'+escapeHtml(a.tmvId)+'</div>':'')
      +'</div>';
  });
  document.getElementById('cards').innerHTML = html || '<p style="color:#888">No assets match.</p>';
  document.getElementById('summary').innerHTML =
    '<div class="pill"><b>'+c.ok+'</b>OK</div>'
    +'<div class="pill"><b style="color:#d97706">'+c.warn+'</b>Due Soon</div>'
    +'<div class="pill"><b style="color:#dc2626">'+c.due+'</b>DUE</div>';
}
['filter','filterType'].forEach(function(id){ var e=document.getElementById(id); if(e) e.addEventListener('change', buildTracker); });

function showView(v){
  document.getElementById('viewTracker').classList.toggle('active', v==='tracker');
  document.getElementById('viewTmv').classList.toggle('active', v==='tmv');
  document.getElementById('tabTracker').classList.toggle('active', v==='tracker');
  document.getElementById('tabTmv').classList.toggle('active', v==='tmv');
}

// ── TMV grid ───────────────────────────────────────────
function buildTmvGrid(){
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
  var all=(configData.checklist||[]).filter(function(s){ return s.appliesTo.some(function(v){return vts.indexOf(v)>=0;}); });
  var wrap=document.getElementById('sections');
  wrap.innerHTML=all.map(function(s,si){
    var items=s.items.map(function(it,ii){
      return '<div class="row"><div class="lbl">'+escapeHtml(it.label)+'</div><div class="ctl" data-s="'+si+'" data-i="'+ii+'">'+renderCtl(it)+'</div></div>';
    }).join('');
    return '<div class="section" data-s="'+si+'"><h3>'+escapeHtml(s.title)+'</h3>'
      +'<label class="inc"><input type="checkbox" class="incChk" data-s="'+si+'" checked> include</label>'
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
    var chk=sec.querySelector('.incChk');
    if(chk && !chk.checked) return; // skip unchecked sections
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
  var btn=document.getElementById('genBtn');
  btn.disabled=true; btn.textContent='Working…';
  try{
    // 1) ticket
    var r=await fetch('/api/dispatch',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({tmv:selectedTmv, vanType:selectedVan, functions:sections.map(function(s){return s.title+': '+s.items.map(function(i){return i.label+'='+i.value;}).join(', ');}), technician:tech})});
    var d=await r.json(); if(!r.ok) throw new Error(d.error||('HTTP '+r.status));
    // 2) log inspection
    var r2=await fetch('/api/inspection',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({tmv:selectedTmv, vanType:selectedVan, location:loc, date:date, technician:tech, sections:sections})});
    var d2=await r2.json(); if(!r2.ok) throw new Error(d2.error||('log HTTP '+r2.status));
    await loadAssets(); buildTracker();
    var out=document.getElementById('ticketOut'); out.classList.remove('hidden');
    out.innerHTML='<div class="ticket"><h3>Ticket — '+escapeHtml(tech.name)+'</h3>'
      +'<pre>'+escapeHtml(d.ticket)+'</pre>'
      +'<div class="links">'
      +(d.hasWhatsapp?'<a class="wa" href="'+d.waLink+'" target="_blank">Send via WhatsApp</a>':'')
      +(d.hasTelegram?'<a class="tg" href="'+d.tgLink+'" target="_blank">Send via Telegram</a>':'')
      +'<button class="btn ghost" onclick="copyTicket()">Copy</button></div>'
      +'<div class="ok-note">✓ Inspection logged for '+escapeHtml(selectedTmv)+' ('+escapeHtml(loc)+', '+escapeHtml(date)+')</div></div>';
    window.__lastTicket=d.ticket;
  }catch(e){ showErr('submit failed: '+((e&&(e.message))||e)); }
  finally{ btn.disabled=false; btn.textContent='Generate Ticket & Log'; updateGen(); }
}
function copyTicket(){ if(navigator.clipboard&&window.__lastTicket){ navigator.clipboard.writeText(window.__lastTicket).then(function(){alert('Copied');},function(){alert('Copy failed');}); } }

// ── Assign to Technician (handoff to mobile) ─────────────
async function assignToTech(){
  var techName=document.getElementById('dTech').value;
  var loc=document.getElementById('dLoc').value;
  var date=document.getElementById('dDate').value;
  var sections=collectSections();
  var btn=document.getElementById('assignBtn');
  btn.disabled=true; btn.textContent='Working…';
  try{
    var r=await fetch('/api/assignments',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({tmv:selectedTmv, vanType:selectedVan, location:loc, date:date, technician:techName, sections:sections})});
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


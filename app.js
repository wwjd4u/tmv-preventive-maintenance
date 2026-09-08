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

// ── STATIC IMPORTED POSITIONS ──────────────────────────────────────────────
// Real TMV lat/long imported from the asset table (the DevIoT vendor feed is
// Entra-ID gated / 401, so it could not be scraped). These are the ACTUAL yard
// coordinates — NOT demo data. Used as a fallback position source when no live
// DevIoT feed is configured, so the Location column shows real coordinates.
// Keyed by TMV id (Asset ID with the TMV prefix). radius (m) defines the yard.
var __staticPositions = {
  'TMV57449B': { lat: 31.23, lng: -103.16, radius: 500 },
  'TMV57454B': { lat: 32.74, lng: -103.68, radius: 500 },
  'TMV57560B': { lat: 34.99, lng: -97.40,  radius: 500 },
  'TMV57566B': { lat: 32.74, lng: -100.93, radius: 500 },
  'TMV57738B': { lat: 36.26, lng: -100.89, radius: 500 },
  'TMV57744B': { lat: 31.85, lng: -102.31, radius: 500 },
  'TMV57757B': { lat: 31.44, lng: -102.64, radius: 500 },
  'TMV57763B': { lat: 32.41, lng: -94.90,  radius: 500 },
  'TMV57879B': { lat: 32.51, lng: -101.45, radius: 500 },
  'TMV57903B': { lat: 31.58, lng: -102.27, radius: 500 },
  'TMV57909B': { lat: 32.41, lng: -94.90,  radius: 500 },
  'TMV87455B': { lat: 31.85, lng: -102.31, radius: 500 },
  'TMV87461B': { lat: 31.85, lng: -102.31, radius: 500 },
  'TMV97776B': { lat: 34.99, lng: -97.42,  radius: 500 }
};
// Asset 27616B had N/A coordinates → intentionally omitted (shows "Location set").
var APP_TOKEN = sessionStorage.getItem('tmv_auth_token') || '';
var APP_ROLE = sessionStorage.getItem('tmv_auth_role') || '';
var APP_USER = sessionStorage.getItem('tmv_auth_name') || '';

function appAuthHeaders(extra){
  var h = Object.assign({}, extra || {});
  if(APP_TOKEN) h.Authorization = 'Bearer ' + APP_TOKEN;
  return h;
}
function updateAppAuthUi(){
  var label = document.getElementById('appAuthUser');
  if(label) label.textContent = APP_ROLE ? ((APP_ROLE === 'superuser' ? 'Superuser' : 'Manager') + (APP_USER ? ' — ' + APP_USER : '')) : '';
}
function showAppLogin(message){
  var overlay = document.getElementById('appLoginOverlay');
  if(overlay) overlay.style.display = 'flex';
  var err = document.getElementById('appLoginErr');
  if(err) err.textContent = message || '';
}
function hideAppLogin(){ var overlay=document.getElementById('appLoginOverlay'); if(overlay) overlay.style.display='none'; }
function clearAppSession(){
  APP_TOKEN=''; APP_ROLE=''; APP_USER='';
  sessionStorage.removeItem('tmv_auth_token');
  sessionStorage.removeItem('tmv_auth_role');
  sessionStorage.removeItem('tmv_auth_name');
}
async function doAppLogin(){
  var u=(document.getElementById('appLoginUser').value||'').trim();
  var p=document.getElementById('appLoginPass').value||'';
  var err=document.getElementById('appLoginErr'); if(err) err.textContent='';
  try{
    var r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})});
    var d=await r.json();
    if(!r.ok || !d.token) throw new Error(d.error||'Invalid credentials');
    APP_TOKEN=d.token; APP_ROLE=d.role||''; APP_USER=d.name||u;
    sessionStorage.setItem('tmv_auth_token',APP_TOKEN);
    sessionStorage.setItem('tmv_auth_role',APP_ROLE);
    sessionStorage.setItem('tmv_auth_name',APP_USER);
    document.getElementById('appLoginPass').value='';
    await boot();
  }catch(e){ showAppLogin(e.message||'Login failed'); }
}
async function appLogout(){
  try{ if(APP_TOKEN) await fetch('/api/logout',{method:'POST',headers:appAuthHeaders()}); }catch(_e){}
  clearAppSession();
  location.reload();
}

async function boot(){
  try{
    if(!APP_TOKEN){ showAppLogin(); return; }
    var sr=await fetch('/api/session',{headers:appAuthHeaders()});
    if(!sr.ok){ clearAppSession(); showAppLogin('Please sign in.'); return; }
    var sd=await sr.json();
    APP_ROLE=sd.role||APP_ROLE; APP_USER=sd.name||APP_USER;
    sessionStorage.setItem('tmv_auth_role',APP_ROLE);
    sessionStorage.setItem('tmv_auth_name',APP_USER);
    hideAppLogin(); updateAppAuthUi();
    await loadConfig();
    loadPositions();
    await loadAssets();
    await loadAssignments();
    buildTracker();
    buildTechFilter();
    buildTmvGrid();
    buildTechSelect();
    if (__geoDemoMode) { var db = document.getElementById('demoBanner'); if (db) db.classList.remove('hidden'); }
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

// ── Tracker = assignments TABLE (matches db-viewer Assignments tab) ──
var SL2={assigned:'Assigned',in_progress:'In Progress',completed:'Completed',rejected:'Rejected'};
function buildTechFilter(){
  var sel=document.getElementById('filterTech');
  var selected=sel.value;
  sel.replaceChildren(new Option('All technicians','all'));
  var names=[];
  assignments.forEach(function(a){ if(a.technician&&a.technician.name&&names.indexOf(a.technician.name)<0) names.push(a.technician.name); });
  names.sort().forEach(function(n){ var o=document.createElement('option'); o.value=n; o.textContent=n; sel.appendChild(o); });
  sel.value=names.includes(selected)?selected:'all';
}
function tStatusBadge(s){
  var cls='b-'+(s||'assigned');
  var label=(SL2[s]||s||'assigned');
  return '<span class="badge '+cls+'">'+escapeHtml(label)+'</span>';
}
function tTechName(a){ var t=a.technician; if(!t) return '-'; if(typeof t==='string') return t; return t.name||'-'; }
function tTs(v){ if(!v) return '-'; try{ return new Date(v).toLocaleString([], {year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}); }catch(e){ return '-'; } }
function tDate(v){ if(!v) return '-'; try{ return new Date(v).toLocaleDateString([], {year:'numeric',month:'2-digit',day:'2-digit'}); }catch(e){ return '-'; } }
// ── Geofencing (fence definition only for now; live position pluggable) ──
// Position source is intentionally decoupled. Today getTmvPosition() returns
// null (no live feed) → status shows "Fence set". The DevIoT vendor feed is
// proxied server-side at GET /api/positions and cached in window.__positions;
// once authenticated it returns { tmvId:{lat,lng} } and statuses go live.
var __positions = null;           // { tmvId:{lat,lng} } | null (not yet loaded)
var __positionsLoading = false;
async function loadPositions() {
  if (__positionsLoading) return;
  __positionsLoading = true;
  try {
    var r = await fetch('/api/positions', { headers: appAuthHeaders() });
    if (r.ok) { var d = await r.json(); __positions = (d && d.positions) || {}; }
  } catch (e) { /* feed unavailable — leave Fence set */ }
  // Imported real positions: when no live feed is configured, fall back to the
  // static imported lat/long so the Location column shows actual coordinates.
  if (!__positions || Object.keys(__positions).length === 0) {
    __positions = {};
    Object.keys(__staticPositions).forEach(function (k) {
      __positions[k] = { lat: __staticPositions[k].lat, lng: __staticPositions[k].lng };
    });
  }
  // Imported yards also set the geofence (location) so the cell shows real coords.
  // The imported coordinates are the authoritative source (pulled from the asset
  // table), so they override any rounded/stale value already in config.
  if (configData && !configData.geofences) configData.geofences = {};
  if (configData && configData.geofences) {
    Object.keys(__staticPositions).forEach(function (k) {
      configData.geofences[k] = {
        lat: __staticPositions[k].lat, lng: __staticPositions[k].lng,
        radius: __staticPositions[k].radius
      };
    });
  }
  __positionsLoading = false;
}
function getTmvPosition(tmvId) {
  if (__geoDemoMode) { var d = getDemoPosition(tmvId); if (d) return d; }
  if (!tmvId || !__positions) return null;   // feed not live/loaded → "Fence set"
  var p = __positions[tmvId];
  if (!p || p.lat == null || p.lng == null) return null;
  return { lat: +p.lat, lng: +p.lng };
}

// ── DEMO MODE (opt-in only via ?demo=1) ──────────────────────────────────
// The real vendor feed (deviotinfo.azurewebsites.net) is Entra-ID gated (401),
// so it cannot be scraped. This generates SIMULATED, clearly-labeled positions
// around the West Texas oilfield (Odessa, TX) so the geofence column can be
// demoed. NEVER used in production — production reads the proxied /api/positions.
var __geoDemoMode = (location.search || '').indexOf('demo=1') >= 0;
function __demoHash(s) { var h = 2166136261 >>> 0; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
var __DEMO_BASE = { lat: 31.8457, lng: -102.3676 }; // Odessa, TX yard
function __demoGeoFor(tmv) {
  if (!tmv) return null;
  var h = __demoHash(String(tmv));
  var dLat = ((h & 0xff) / 255 - 0.5) * 0.40;          // ±0.20°
  var dLng = (((h >>> 8) & 0xff) / 255 - 0.5) * 0.40;
  var yard = { lat: __DEMO_BASE.lat + dLat, lng: __DEMO_BASE.lng + dLng };
  var onsite = (h & 1) === 0;
  var pos = onsite ? { lat: yard.lat, lng: yard.lng } : { lat: yard.lat + 0.55, lng: yard.lng + 0.55 }; // ~75km off
  return { fence: { lat: yard.lat, lng: yard.lng, radius: 1500 }, pos: pos, onsite: onsite };
}
function __demoFences() {
  var m = {}; (assignments || []).forEach(function (a) { if (a.tmv && !m[a.tmv]) { var g = __demoGeoFor(a.tmv); if (g) m[a.tmv] = g.fence; } }); return m;
}
function getDemoPosition(tmv) { var g = __demoGeoFor(tmv); return g ? { lat: g.pos.lat, lng: g.pos.lng } : null; }
function geoInside(fence, pos){
  if(!fence || !fence.lat || !fence.lng || !pos) return null;
  var R=6371000, toR=Math.PI/180;
  var dLat=(pos.lat-fence.lat)*toR, dLng=(pos.lng-fence.lng)*toR;
  var la1=fence.lat*toR, la2=pos.lat*toR;
  var h=Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2;
  var d=2*R*Math.asin(Math.sqrt(h));
  var r=(fence.radius && +fence.radius)||200;
  return d<=r;
}
function tGeofenceCell(a){
  var g=(window.__geoMap||{})[a.tmv];            // {lat,lng,radius} from config
  if(!g || !g.lat || !g.lng) return '<td class="geo-cell">—</td>'; // no fence defined
  var pos=getTmvPosition(a.tmv);
  if(pos==null) return '<td class="geo-cell"><span class="geo geo-fence" title="Location set — position feed pending">Location set</span></td>';
  var inside=geoInside(g,pos);
  var lbl = inside ? 'On-site' : 'Off-site';
  var demo = __geoDemoMode ? ' <span class="geo-demo">demo</span>' : '';
  // coordinates kept in the map tooltip (title), not rendered as wide inline text
  var coord = '';
  // tiny schematic map thumbnail (offline-safe, no API key) — click to enlarge
  var thumb = '<img class="geo-thumb" alt="map" src="data:image/svg+xml;utf8,' +
    encodeURIComponent(miniMapSvg(g, pos, inside)) + '" ' +
    'onclick="openMapModal(\'' + a.tmv + '\')" title="Click to enlarge map">';
  return '<td class="geo-cell"><span class="geo-map"><span class="geo '+(inside?'geo-on':'geo-off')+'" title="'+(inside?'At location':'Away from location')+'">'+lbl+'</span>'+thumb+'</span>'+demo+coord+'</td>';
}
// Schematic mini-map: yard circle + position dot within a padded lat/lng box.
function miniMapSvg(g, pos, inside){
  var W=92,H=68, pad=8;
  var latMin=Math.min(g.lat,pos.lat), latMax=Math.max(g.lat,pos.lat);
  var lngMin=Math.min(g.lng,pos.lng), lngMax=Math.max(g.lng,pos.lng);
  var dLat=(latMax-latMin)||0.02, dLng=(lngMax-lngMin)||0.02;
  latMin-=dLat*0.5; latMax+=dLat*0.5; lngMin-=dLng*0.5; lngMax+=dLng*0.5;
  function px(lat,lng){ return [ pad + (lng-lngMin)/(lngMax-lngMin)*(W-2*pad), pad + (latMax-lat)/(latMax-latMin)*(H-2*pad) ]; }
  var gy=px(g.lat,g.lng), py=px(pos.lat,pos.lng);
  var r=Math.max(3, g.radius? Math.min(18, g.radius/4000*(H-2*pad)) : 9);
  var dot = inside ? '#15803d' : '#b91c1c';
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">'+
    '<rect width="'+W+'" height="'+H+'" fill="#eef2f7"/>'+
    '<circle cx="'+gy[0].toFixed(1)+'" cy="'+gy[1].toFixed(1)+'" r="'+r.toFixed(1)+'" fill="#bfdbfe" stroke="#2563eb" stroke-width="1"/>'+
    '<line x1="0" y1="'+gy[1].toFixed(1)+'" x2="'+W+'" y2="'+gy[1].toFixed(1)+'" stroke="#cbd5e1" stroke-width="0.5"/>'+
    '<line x1="'+gy[0].toFixed(1)+'" y1="0" x2="'+gy[0].toFixed(1)+'" y2="'+H+'" stroke="#cbd5e1" stroke-width="0.5"/>'+
    '<circle cx="'+py[0].toFixed(1)+'" cy="'+py[1].toFixed(1)+'" r="3" fill="'+dot+'" stroke="#fff" stroke-width="1"/>'+
    '</svg>';
}
function openMapModal(tmv){
  var g=(window.__geoMap||{})[tmv]; if(!g||!g.lat||!g.lng) return;
  var pos=getTmvPosition(tmv) || g;
  var lat=g.lat.toFixed(6), lng=g.lng.toFixed(6);
  document.getElementById('mapModalTitle').textContent = tmv + ' — location';
  document.getElementById('mapModalCoords').textContent = 'Yard: ' + g.lat.toFixed(5) + ', ' + g.lng.toFixed(5) +
    ((pos!==g) ? ('   ·   TMV now: ' + pos.lat.toFixed(5) + ', ' + pos.lng.toFixed(5)) : '') +
    ((window.__geoMap && g.radius) ? ('   ·   radius ' + g.radius + ' m') : '');
  document.getElementById('mapModalFrame').src =
    'https://www.openstreetmap.org/export/embed.html?bbox=' +
    (g.lng-0.02).toFixed(5) + '%2C' + (g.lat-0.015).toFixed(5) + '%2C' + (g.lng+0.02).toFixed(5) + '%2C' + (g.lat+0.015).toFixed(5) +
    '&layer=mapnik&marker=' + lat + '%2C' + lng;
  document.getElementById('mapModalGoogle').href = 'https://www.google.com/maps/search/?api=1&query=' + lat + '%2C' + lng;
  document.getElementById('mapModalOsm').href = 'https://www.openstreetmap.org/?mlat=' + lat + '#map=15/' + lat + '/' + lng;
  document.getElementById('mapModalBack').classList.add('open');
}
function closeMapModal(){ document.getElementById('mapModalBack').classList.remove('open'); }
function tShowAssignment(id){
  // open the assignment detail (assign.html) — same target the table uses
  window.open('assign.html?id='+encodeURIComponent(id), '_blank');
}
async function tDeleteAssignment(id, tmv){
  if(!confirm('Delete assignment '+(tmv||id)+'?\n\nThis removes only this one record. It cannot be undone.')) return;
  var user=sessionStorage.getItem('tmv_db_user'), pass=sessionStorage.getItem('tmv_db_pass');
  if(!user||!pass){ alert('Admin login required to delete. Open Task.db once to authenticate.'); return; }
  var token=btoa(user+':'+pass);
  try{
    var r=await fetch('/api/assignments/'+encodeURIComponent(id), { method:'DELETE', headers:{'Authorization':'Bearer '+token} });
    var d=await r.json();
    if(!r.ok) throw new Error(d.error||('HTTP '+r.status));
    await loadAssignments(); buildTracker();
  }catch(e){ alert('Delete failed: '+(e.message||e)); }
}
function buildTracker(){
  var f=document.getElementById('filter').value;
  var ft=document.getElementById('filterTech').value;
  var q=(document.getElementById('filterText').value||'').toLowerCase();
  // Build fence map once per render from config (configData, set by loadConfig).
  // In opt-in demo mode, synthetic West-Texas fences are used instead.
  window.__geoMap = __geoDemoMode ? __demoFences() : ((configData && configData.geofences) || {});
  var counts={assigned:0,in_progress:0,completed:0,rejected:0};
  assignments.forEach(function(a){ if(counts[a.status]!=null) counts[a.status]++; });
  var list=assignments.slice().sort(function(x,y){ return (y.createdAt||0)-(x.createdAt||0); });
  if(f!=='all') list=list.filter(function(a){ return a.status===f; });
  if(ft!=='all') list=list.filter(function(a){ return (a.technician&&a.technician.name||'')===ft; });
  if(q) list=list.filter(function(a){
    var hay=((a.tmv||'')+' '+(a.technician&&a.technician.name||'')+' '+(a.vanType||'')+' '+(a.location||'')).toLowerCase();
    return hay.indexOf(q)>=0;
  });
  // Geofence filter (only meaningful once positions feed in; today shows Fence set vs —)
  var fg=document.getElementById('filterGeo').value;
  if(fg && fg!=='all'){
    list=list.filter(function(a){
      var g=(window.__geoMap||{})[a.tmv];
      var hasFence = !!(g && g.lat && g.lng);
      if(fg==='fence') return hasFence;
      if(fg==='nofence') return !hasFence;
      return true;
    });
  }
  // Render as the Assignments table (db-viewer style): Status · TMV · Technician · Location · Date · Completed · actions
  var rows=list.map(function(a){
    return '<tr>'
      + '<td>'+tStatusBadge(a.status)+'</td>'
      + '<td><strong>'+escapeHtml(a.tmv||'-')+'</strong></td>'
      + '<td>'+escapeHtml(tTechName(a))+'</td>'
      + '<td>'+escapeHtml(a.location||'-')+'</td>'
      + '<td>'+(a.date||'-')+'</td>'
      + '<td><span class="ts">'+tDate(a.completedAt)+'</span></td>'
      + tGeofenceCell(a)
      + '<td class="tk-actions">'
        + '<button class="btn sm ghost" onclick="tShowAssignment(\''+escAttr(a.id)+'\')">View</button>'
        + (isAdmin()?' <button class="btn sm danger" onclick="tDeleteAssignment(\''+escAttr(a.id)+'\',\''+escAttr(a.tmv||'')+'\')">Delete</button>':'')
      + '</td>'
      + '</tr>';
  }).join('');
  if(!rows) rows='<tr><td colspan="8" class="tk-empty">No assignments match.</td></tr>';
  document.getElementById('cards').innerHTML =
    '<div class="tbl-wrap"><table>'
    + '<colgroup><col class="col-status"><col class="col-tmv"><col class="col-tech"><col class="col-district"><col class="col-date"><col class="col-completed"><col class="col-location"><col class="col-actions"></colgroup>'
    + '<thead><tr><th>Status</th><th>TMV</th><th>Technician</th><th>District</th><th>Date</th><th>Completed</th><th>Location</th><th></th></tr></thead>'
    + '<tbody>'+rows+'</tbody></table></div>';
  document.getElementById('summary').innerHTML =
    '<div class="pill"><b>'+counts.assigned+'</b>Assigned</div>'
    +'<div class="pill"><b style="color:#d97706">'+counts.in_progress+'</b>In Progress</div>'
    +'<div class="pill"><b style="color:#16a34a">'+counts.completed+'</b>Completed</div>'
    +'<div class="pill"><b style="color:#dc2626">'+counts.rejected+'</b>Rejected</div>'
    +'<div class="pill hint">'+(isAdmin()?'View / Delete enabled':'Read-only — admin manages')+'</div>';
}
['filter','filterTech','filterGeo'].forEach(function(id){ var e=document.getElementById(id); if(e) e.addEventListener('change', buildTracker); });
var _ft=document.getElementById('filterText'); if(_ft) _ft.addEventListener('input', buildTracker);
var _rs=document.getElementById('roleSel');
if(_rs) _rs.addEventListener('change', function(){ ROLE=_rs.value; localStorage.setItem('tmv_role', ROLE); applyRole(); buildTracker(); });

// ── Drag & drop for the Assignments board (admin-only) ──
// Tracker is the read-only assignments TABLE above. Drag/reassign lives on the
// separate Assignments board (admin page), not Tracker.
var _rs=document.getElementById('roleSel');
if(_rs) _rs.addEventListener('change', function(){ ROLE=_rs.value; localStorage.setItem('tmv_role', ROLE); applyRole(); buildTracker(); });

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
      return '<div class="row"><div class="lbl">'+escapeHtml(it.label)+'</div><div class="ctl" data-s="'+si+'" data-i="'+ii+'">'+renderCtl(it, si, ii)+'</div></div>';
    }).join('');
    return '<div class="section" data-s="'+si+'"><h3>'+escapeHtml(s.title)+'</h3>'
      +'<div class="items">'+items+'</div></div>';
  }).join('');
  paintRadios();
}

// Build a single radio option as a big, tappable label. Each item gets a
// UNIQUE group name (`yn_<s>_<i>` / `pf_<s>_<i>`) so selections on one item
// can never bleed into another — this fixes the "selection jumps to the next
// question" bug caused by the old shared name="r".
function rdo(name, k, val, cls, label){
  return '<label class="rdo '+cls+'"><input type="radio" name="'+name+'" data-k="'+k+'" value="'+escAttr(val)+'" onchange="markRdo(this)"><span>'+escapeHtml(label)+'</span></label>';
}
function markRdo(el){
  var ctl = el.closest ? el.closest('.ctl') : null;
  if(!ctl) return;
  if(el.type==='radio'){
    ctl.querySelectorAll('input[type=radio][name="'+el.name+'"]').forEach(function(r){
      if(r.closest('label')) r.closest('label').classList.toggle('checked', !!r.checked);
    });
  }
  updateGen();
}
function renderCtl(it, si, ii){
  var yn='yn_'+si+'_'+ii, pf='pf_'+si+'_'+ii;
  switch(it.type){
    case 'yn': return '<div class="seg">'+rdo(yn,'yn','Yes','rdo-yes','Yes')+rdo(yn,'yn','No','rdo-no','No')+'</div>';
    case 'ynpf': return '<div class="seg">'+rdo(yn,'yn','Yes','rdo-yes','Yes')+rdo(yn,'yn','No','rdo-no','No')+rdo(pf,'pf','Pass','rdo-pass','Pass')+rdo(pf,'pf','Fail','rdo-fail','Fail')+'</div>';
    case 'ynver': return '<div class="seg">'+rdo(yn,'yn','Yes','rdo-yes','Yes')+rdo(yn,'yn','No','rdo-no','No')+'</div><input type="text" data-k="ver" class="ver-in" placeholder="Ver #" onchange="markRdo(this)">';
    case 'pf': return '<div class="seg">'+rdo(pf,'pf','Pass','rdo-pass','Pass')+rdo(pf,'pf','Fail','rdo-fail','Fail')+'</div>';
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
  // ynver: Yes/No + a free-text Version # — MUST keep both. (Old code dropped the ver#.)
  if(def && def.type==='ynver'){
    if(!yn) return '';
    if(ver && ver.value) return yn.value+' v'+ver.value;
    return yn.value;
  }
  if(yn){ return pf ? (yn.value+' / '+pf.value) : yn.value; }
  if(pf){ return pf.value; }
  var val=ctl.querySelector('[data-k="val"]');
  return val ? val.value : '';
}
// Apply the saved ".checked" highlight class on radios when sections are (re)built.
function paintRadios(){
  document.querySelectorAll('#sections .ctl').forEach(function(ctl){
    ctl.querySelectorAll('input[type=radio]').forEach(function(r){
      if(r.checked && r.closest('label')) r.closest('label').classList.add('checked');
    });
  });
}

function buildTechSelect(){
  var sel=document.getElementById('dTech');
  (configData.technicians||[]).forEach(function(t){
    var o=document.createElement('option'); o.value=t.name; o.textContent=t.name; sel.appendChild(o);
  });
  sel.addEventListener('change', updateGen);
}
['dLoc','dDate'].forEach(function(id){ var e=document.getElementById(id); if(e) e.addEventListener('change', updateGen); });

function updateGen(){ if(typeof updateDispatchButtons==='function') updateDispatchButtons(); }
async function submitInspection(){return assignAndGenerateReport();}

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
async function assignToTech(){return assignAndGenerateReport();}

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
  if(!APP_TOKEN){ showAppLogin('Please sign in first.'); return; }
  window.open('/db?session=1', '_blank');
}

// Main desktop app requires a Superuser or Manager session.

window.addEventListener('DOMContentLoaded', boot);

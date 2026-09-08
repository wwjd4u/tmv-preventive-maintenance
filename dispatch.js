// Main-page dispatch controls. Dropdown changes are drafts until the combined
// action succeeds; reports and assignments come from the server, never fixtures.
var dispatchDrafts = {};
var dispatchUnit = null;
var dispatchBusy = false;
var pendingDispatch = null;
try { pendingDispatch = JSON.parse(sessionStorage.getItem('tmv.pendingDispatch') || 'null'); } catch (_) {}
function latestForUnit(unit) {
  return assignments.filter(a => a.tmv === unit).sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0))[0];
}
function dispatchNotice(text) { document.getElementById('dispatchFeedback').textContent = text; }
function dispatchValues() {
  if (selectedTmv) return { tmv:selectedTmv, technician:document.getElementById('dTech').value,
    location:document.getElementById('dLoc').value, date:document.getElementById('dDate').value, sections:collectSections() };
  return { tmv:dispatchUnit, technician:dispatchDrafts[dispatchUnit] || '',
    location:document.getElementById('unitDistrict').value, date:document.getElementById('unitDate').value };
}
function updateDispatchButtons() {
  const values = dispatchValues();
  const ready = !!(values.tmv && values.technician && values.location && values.date);
  ['dispatchBtn','genBtn'].forEach(id => {
    const button=document.getElementById(id); button.disabled=dispatchBusy||!ready;
    button.textContent=dispatchBusy?'Saving…':'Assign Technician';
  });
}
function buildTmvGrid() {
  const map=configData.tmvVanMap||{}, allTechs=configData.technicians||[];
  const type=document.getElementById('unitType'), district=document.getElementById('unitDistrict'), tech=document.getElementById('unitTech');
  const techs=personnelForDistrict(allTechs,district.value||'');
  if (!type.dataset.loaded) {
    (configData.vanTypes||[]).forEach(v=>type.add(new Option(v,v)));
    (configData.locations||[]).forEach(v=>district.add(new Option(v,v)));
    const today=new Date();
    type.dataset.loaded='true'; document.getElementById('unitDate').value=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
    ['unitSearch','unitType','unitTech','unitStatus'].forEach(id=>document.getElementById(id).addEventListener('input',buildTmvGrid));
    district.addEventListener('change',()=>{ dispatchUnit=null; buildTmvGrid(); updateDispatchButtons(); });
    document.getElementById('unitDate').addEventListener('input',updateDispatchButtons);
  }
  const priorTech=tech.value||'';
  tech.innerHTML='<option value="">All technicians</option>';
  techs.forEach(t=>tech.add(new Option(t.name,t.name)));
  if(techs.some(t=>t.name===priorTech)) tech.value=priorTech;
  const query=document.getElementById('unitSearch').value.toLowerCase(), status=document.getElementById('unitStatus').value;
  const keys=Object.keys(map).filter(k=>{
    const current=latestForUnit(k), name=dispatchDrafts[k]??current?.technician?.name??'';
    return k.toLowerCase().includes(query)&&(!type.value||map[k].includes(type.value))&&(!tech.value||name===tech.value)&&(!status||(current?.status||'unassigned')===status);
  });
  const grid=document.getElementById('tmvGrid'); grid.replaceChildren();
  keys.forEach(k=>{
    const current=latestForUnit(k), card=document.createElement('div');card.className='fleet-card'+(dispatchUnit===k?' is-selected':'');
    const button=document.createElement('button');button.className='tmv-btn';button.innerHTML='<div class="id">'+escapeHtml(k)+'</div><div class="vt">'+escapeHtml(map[k].join(' + '))+'</div>';
    button.onclick=()=>openTmv(k);
    const label=document.createElement('label');label.className='card-tech';label.append(document.createTextNode('Technician'));
    const select=document.createElement('select');select.setAttribute('aria-label','Technician for '+k);select.add(new Option('— choose technician —',''));
    techs.forEach(t=>select.add(new Option(t.name,t.name)));select.value=dispatchDrafts[k]??'';
    select.onchange=()=>{
      dispatchDrafts[k]=select.value;dispatchUnit=k;
      dispatchNotice(select.value?'Ready to assign '+k+' to '+select.value+'. Select a district and date, then click Assign Technician.':'Choose a technician for '+k+'.');
      buildTmvGrid();
    };
    label.append(select);card.append(button,label);grid.append(card);
  });
  if(!keys.length)grid.textContent='No matching TMV units.';
  updateDispatchButtons();
}
const openInspection = openTmv;
openTmv = function(unit) {
  openInspection(unit); dispatchUnit=unit;
  const latest=latestForUnit(unit);
  document.getElementById('dTech').value=dispatchDrafts[unit]??'';
  document.getElementById('dLoc').value=document.getElementById('unitDistrict').value||latest?.location||'';
  if(typeof rebuildDetailTechSelect==='function') rebuildDetailTechSelect();
  document.getElementById('dTech').value=dispatchDrafts[unit]??'';
  document.getElementById('dDate').value=document.getElementById('unitDate').value;
  updateDispatchButtons();
};
const returnToFleet = backToTmv;
backToTmv = function() { returnToFleet(); buildTmvGrid(); };

function showWorkOrder(assignment) {
  window.__lastTicket=assignment.report.text;
  const out=selectedTmv?document.getElementById('ticketOut'):document.getElementById('dispatchFeedback');
  out.classList.remove('hidden');out.replaceChildren();
  const note=document.createElement('div');note.className='ok-note';note.setAttribute('role','status');
  note.textContent='Assigned '+assignment.tmv+' to '+assignment.technician.name+'. Report generated and assignment logged.';
  const report=document.createElement('pre');report.style.whiteSpace='pre-wrap';report.textContent=assignment.report.text;
  const link=document.createElement('a');link.href=new URL('/tech/'+encodeURIComponent(assignment.id),window.location.origin).href;
  link.textContent='Open technician work order';link.target='_blank';link.rel='noopener';
  const download=document.createElement('button');download.className='btn ghost';download.textContent='Download Report';
  download.onclick=()=>{
    const url=URL.createObjectURL(new Blob([assignment.report.text],{type:'text/plain;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=assignment.tmv+'-'+assignment.id+'-report.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const actions=document.createElement('div');actions.className='links';link.className='em';actions.append(link,download);
  const copy=document.createElement('button');copy.className='btn ghost';copy.textContent='Copy Ticket';copy.onclick=copyTicket;actions.append(copy);
  if(assignment.technician.email){
    const email=document.createElement('a');email.className='em';email.textContent='Send via Email';
    email.href='mailto:'+encodeURIComponent(assignment.technician.email)+'?subject='+encodeURIComponent('CUDD PM Ticket — '+assignment.tmv)+'&body='+encodeURIComponent(assignment.report.text+'\n'+link.href);
    email.onclick=mailtoFallback;actions.append(email);
  }
  if(assignment.technician.phone){
    const sms=document.createElement('button');sms.className='btn ghost';sms.textContent='Send via SMS';
    sms.dataset.sms=assignment.technician.phone.replace(/\D/g,'');sms.dataset.ticket=encodeURIComponent(assignment.report.text+'\n'+link.href);
    sms.onclick=()=>sendDispatchSms(sms);actions.append(sms);
  }
  out.append(note,report,actions);
}
function assignAndGenerateReport() {
  const values=dispatchValues();
  if(!values.tmv||!values.technician||!values.location||!values.date){dispatchNotice('Select a TMV technician, district and date first.');return;}
  try {
    // No assignment is saved until the section selection page is submitted.
    const draftId=crypto.randomUUID();
    sessionStorage.setItem('tmv.workOrderDraft.'+draftId,JSON.stringify(values));
    window.location.assign('/work-order-builder.html?draft='+encodeURIComponent(draftId));
  } catch(error) { showErr('Unable to open the work order. Enable browser session storage and try again. '+error.message); }
}
async function loadDemoFromToolbar(button){
  button.disabled=true;
  try{
    const response=await fetch('/api/assignments/demo',{method:'POST'}),data=await response.json();
    if(!response.ok)throw new Error(data.error||'Unable to load demo work orders');
    await loadAssignments();buildTracker();buildTechFilter();buildTmvGrid();dispatchNotice('Loaded '+data.created.length+' demo work orders.');
  }catch(error){showErr(error.message);}finally{button.disabled=false;}
}

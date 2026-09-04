'use strict';
const el=id=>document.getElementById(id);
const draftId=new URLSearchParams(location.search).get('draft');
const draftKey='tmv.workOrderDraft.'+draftId;
let draft, definitions=[], busy=false;
function selectedTitles(){return [...document.querySelectorAll('#sections input:checked')].map(input=>input.value);}
function persist(){sessionStorage.setItem(draftKey,JSON.stringify(draft));}
function updateSelection(){
  const titles=selectedTitles();
  const items=definitions.filter(s=>titles.includes(s.title)).reduce((n,s)=>n+s.items.length,0);
  el('count').textContent=titles.length+' of '+definitions.length+' sections selected · '+items+' items';
  el('generate').disabled=busy||!titles.length;
  draft.selectedSectionTitles=titles;
  try{persist();}catch(error){el('message').textContent='Unable to retain selections: '+error.message;el('generate').disabled=true;}
}
function selectAll(checked){document.querySelectorAll('#sections input').forEach(input=>input.checked=checked);updateSelection();}
async function generate(){
  if(busy||!selectedTitles().length)return;
  busy=true;el('message').textContent='';
  document.querySelectorAll('button, #sections input').forEach(control=>control.disabled=true);
  el('generate').textContent='Saving…';
  try{
    const titles=selectedTitles();
    const payload={tmv:draft.tmv,technician:draft.technician,location:draft.location,date:draft.date,selectedSectionTitles:titles};
    // Retain a request ID across uncertain responses, refreshes and retries.
    const fingerprint=JSON.stringify(payload);
    if(draft.pending?.fingerprint!==fingerprint)draft.pending={fingerprint,requestId:crypto.randomUUID()};
    persist();
    const response=await fetch('/api/work-orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,requestId:draft.pending.requestId})});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||'Unable to save work order');
    draft.savedId=data.assignment.id;
    try{persist();}catch(_){}
    location.replace('/assign.html?id='+encodeURIComponent(data.assignment.id));
  }catch(error){
    el('message').textContent='Work order was not confirmed. Retry with the same selections to avoid duplicates. '+error.message;
    busy=false;document.querySelectorAll('button, #sections input').forEach(control=>control.disabled=false);
    el('generate').textContent='Generate Work Order';updateSelection();
  }
}
async function init(){
  try{
    draft=JSON.parse(sessionStorage.getItem(draftKey)||'null');
    if(!draft?.tmv||!draft.technician||!draft.location||!draft.date)throw new Error('Return to the main page and select a TMV, district, date, and technician first.');
    if(draft.savedId){location.replace('/assign.html?id='+encodeURIComponent(draft.savedId));return;}
    el('unit').textContent=draft.tmv+' — Work Order Checklist';
    el('details').textContent=draft.location+' · '+draft.date+' · '+draft.technician;
    const response=await fetch('/api/config');
    if(!response.ok)throw new Error('Unable to load checklist configuration. Refresh to retry.');
    const config=await response.json(),types=config.tmvVanMap?.[draft.tmv]||[];
    definitions=(config.checklist||[]).filter(s=>s&&s.include!==false&&Array.isArray(s.appliesTo)&&s.appliesTo.some(type=>types.includes(type)));
    if(!definitions.length)throw new Error('No checklist sections are configured for this TMV.');
    for(const section of definitions){
      const box=document.createElement('section');box.className='section';
      const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.value=section.title;input.checked=(draft.selectedSectionTitles||[]).includes(section.title);input.onchange=updateSelection;
      const title=document.createElement('span');title.textContent=section.title;
      const count=document.createElement('small');count.textContent=section.items.length+' items';
      label.append(input,title,count);
      const list=document.createElement('ul');
      for(const item of section.items){const row=document.createElement('li');row.textContent=item.label;list.append(row);}
      box.append(label,list);el('sections').append(box);
    }
    el('selectAll').disabled=false;el('clearAll').disabled=false;
    el('selectAll').onclick=()=>selectAll(true);el('clearAll').onclick=()=>selectAll(false);el('generate').onclick=generate;
    updateSelection();
  }catch(error){el('message').textContent=error.message;}
}
init();

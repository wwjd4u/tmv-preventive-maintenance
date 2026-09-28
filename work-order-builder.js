'use strict';
const el=id=>document.getElementById(id);
const draftId=new URLSearchParams(location.search).get('draft');
const draftKey='tmv.workOrderDraft.'+draftId;
let draft, definitions=[], busy=false;

function sectionBoxes(){return [...document.querySelectorAll('#sections input.section-check')];}
function taskBoxes(){return [...document.querySelectorAll('#sections input.task-check')];}
function selectedTaskMap(){
  const out={};
  for(const section of definitions){
    const labels=taskBoxes().filter(x=>x.dataset.section===section.title&&x.checked).map(x=>x.value);
    if(labels.length)out[section.title]=labels;
  }
  return out;
}
function selectedTitles(){return Object.keys(selectedTaskMap());}
function persist(){sessionStorage.setItem(draftKey,JSON.stringify(draft));}
function syncSectionFromTasks(title){
  const tasks=taskBoxes().filter(x=>x.dataset.section===title);
  const sec=sectionBoxes().find(x=>x.value===title);
  if(!sec)return;
  const checked=tasks.filter(x=>x.checked).length;
  sec.checked=checked===tasks.length&&tasks.length>0;
  sec.indeterminate=checked>0&&checked<tasks.length;
}
function onSectionChange(input){
  taskBoxes().filter(x=>x.dataset.section===input.value).forEach(x=>x.checked=input.checked);
  input.indeterminate=false;
  updateSelection();
}
function onTaskChange(input){
  syncSectionFromTasks(input.dataset.section);
  updateSelection();
}
function updateSelection(){
  const map=selectedTaskMap();
  const titles=Object.keys(map);
  const items=Object.values(map).reduce((n,arr)=>n+arr.length,0);
  const total=definitions.reduce((n,s)=>n+s.items.length,0);
  el('count').textContent=titles.length+' of '+definitions.length+' sections selected · '+items+' of '+total+' tasks';
  el('generate').disabled=busy||!items;
  draft.selectedSectionTitles=titles;
  draft.selectedTaskLabels=map;
  try{persist();}catch(error){el('message').textContent='Unable to retain selections: '+error.message;el('generate').disabled=true;}
}
function selectAll(checked){
  document.querySelectorAll('#sections input').forEach(input=>{input.checked=checked;input.indeterminate=false;});
  updateSelection();
}
async function generate(){
  const taskMap=selectedTaskMap();
  if(busy||!Object.keys(taskMap).length)return;
  busy=true;el('message').textContent='';
  document.querySelectorAll('button, #sections input').forEach(control=>control.disabled=true);
  el('generate').textContent='Saving…';
  try{
    const titles=Object.keys(taskMap);
    const payload={tmv:draft.tmv,technician:draft.technician,location:draft.location,date:draft.date,selectedSectionTitles:titles,selectedTaskLabels:taskMap};
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
    const savedMap=draft.selectedTaskLabels||null;
    for(const section of definitions){
      const box=document.createElement('section');box.className='section';
      const label=document.createElement('label'),input=document.createElement('input');
      input.type='checkbox';input.className='section-check';input.value=section.title;
      const savedSection=(draft.selectedSectionTitles||[]).includes(section.title);
      input.checked=savedMap ? ((savedMap[section.title]||[]).length===section.items.length&&section.items.length>0) : savedSection;
      input.onchange=()=>onSectionChange(input);
      const title=document.createElement('span');title.textContent=section.title;
      const count=document.createElement('small');count.textContent=section.items.length+' items';
      label.append(input,title,count);
      const list=document.createElement('ul');
      for(const item of section.items){
        const row=document.createElement('li'),taskLabel=document.createElement('label'),task=document.createElement('input'),text=document.createElement('span');
        taskLabel.className='task-label';task.type='checkbox';task.className='task-check';task.dataset.section=section.title;task.value=item.label;
        task.checked=savedMap ? (savedMap[section.title]||[]).includes(item.label) : savedSection;
        task.onchange=()=>onTaskChange(task);text.textContent=item.label;taskLabel.append(task,text);row.append(taskLabel);list.append(row);
      }
      box.append(label,list);el('sections').append(box);
      syncSectionFromTasks(section.title);
    }
    el('selectAll').disabled=false;el('clearAll').disabled=false;
    el('selectAll').onclick=()=>selectAll(true);el('clearAll').onclick=()=>selectAll(false);el('generate').onclick=generate;
    updateSelection();
  }catch(error){el('message').textContent=error.message;}
}
init();

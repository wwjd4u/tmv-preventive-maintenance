from pathlib import Path

def rep(path, old, new):
    p=Path(path); s=p.read_text()
    if old not in s:
        raise SystemExit(f"missing pattern in {path}: {old[:80]!r}")
    p.write_text(s.replace(old,new,1))

# Builder CSS + instructions
rep("work-order-builder.html",
".section ul{list-style:none;margin:0;padding:5px 16px 12px 46px}.section li{padding:7px 0;border-bottom:1px dashed #e8edf3;font-size:13px}",
".section ul{list-style:none;margin:0;padding:5px 16px 12px 46px}.section li{padding:7px 0;border-bottom:1px dashed #e8edf3;font-size:13px}.task-label{display:flex;align-items:center;gap:10px;cursor:pointer;font-weight:400}.task-label input{width:18px;height:18px;accent-color:#2563eb;flex-shrink:0}")
rep("work-order-builder.html",
"<p>Select the sections to include in this work order. All items within each selected section will be included.</p>",
"<p>Select the sections and individual tasks to include in this work order. Select All includes every section and every task.</p>")

builder = r''''use strict';
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
'''
Path("work-order-builder.js").write_text(builder)

# Server: filter items by selectedTaskLabels
rep("work-orders.js",
"  const submitted = input.sections === undefined ? [] : input.sections;\n",
"""  const selectedTaskLabels = input.selectedTaskLabels;
  if (selectedTaskLabels !== undefined) {
    if (!selectedTaskLabels || typeof selectedTaskLabels !== 'object' || Array.isArray(selectedTaskLabels)) bad('Invalid task selection');
    definitions = definitions.map(s => {
      const labels = selectedTaskLabels[s.title];
      if (!Array.isArray(labels) || !labels.length) return null;
      if (labels.some(label => typeof label !== 'string' || !s.items.some(i => i.label === label)) || new Set(labels).size !== labels.length) bad('Select only valid checklist tasks');
      return { ...s, items: s.items.filter(i => labels.includes(i.label)) };
    }).filter(Boolean);
    if (!definitions.length) bad('Select at least one checklist task');
  }
  const submitted = input.sections === undefined ? [] : input.sections;
""")
rep("work-orders.js",
"    ...(selectedTitles !== undefined ? { selectedSectionTitles: sections.map(s => s.title) } : {}),\n",
"    ...(selectedTitles !== undefined ? { selectedSectionTitles: sections.map(s => s.title) } : {}),\n    ...(selectedTaskLabels !== undefined ? { selectedTaskLabels: Object.fromEntries(sections.map(s => [s.title, s.items.map(i => i.label)])) } : {}),\n")

# Manager/Technician confirm password fields
rep("db-viewer.html",
'          <input id="mgrPass" class="minput" type="password" placeholder="Login password" autocomplete="new-password">\n',
'          <input id="mgrPass" class="minput" type="password" placeholder="Login password" autocomplete="new-password">\n          <input id="mgrPassConfirm" class="minput" type="password" placeholder="Confirm login password" autocomplete="new-password">\n')
rep("db-viewer.html",
'          <input id="techPass" class="minput" type="password" placeholder="Login password" autocomplete="new-password">\n',
'          <input id="techPass" class="minput" type="password" placeholder="Login password" autocomplete="new-password">\n          <input id="techPassConfirm" class="minput" type="password" placeholder="Confirm login password" autocomplete="new-password">\n')
rep("db-viewer.html",
"  document.getElementById('techPass').value = ''; // never echo the stored hash\n",
"  document.getElementById('techPass').value = ''; // never echo the stored hash\n  document.getElementById('techPassConfirm').value = '';\n")
rep("db-viewer.html",
"  var pw = document.getElementById('techPass').value || '';\n",
"  var pw = document.getElementById('techPass').value || '';\n  var pwConfirm = document.getElementById('techPassConfirm').value || '';\n  if(pw !== pwConfirm){ alert('Technician passwords do not match'); return; }\n")
rep("db-viewer.html",
"  document.getElementById('mgrPass').value = ''; // never echo the stored hash\n",
"  document.getElementById('mgrPass').value = ''; // never echo the stored hash\n  document.getElementById('mgrPassConfirm').value = '';\n")
rep("db-viewer.html",
"  var pw = document.getElementById('mgrPass').value;\n",
"  var pw = document.getElementById('mgrPass').value;\n  var pwConfirm = document.getElementById('mgrPassConfirm').value || '';\n  if(pw !== pwConfirm){ alert('Manager passwords do not match'); return; }\n")

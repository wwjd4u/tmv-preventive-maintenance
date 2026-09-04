const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../assign.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1].split('(async function(){')[0];
function emailLink(assignment,config={}){
  const context={location:{origin:'https://tmvapp.local-journal.com'}};
  vm.createContext(context);vm.runInContext(script,context);
  const bar=context.contactBar(assignment.technician,config,assignment);
  const match=bar.match(/class="cb-email" href="([^"]+)"/);
  return match?new URL(match[1].replace(/&amp;/g,'&')):null;
}
test('work-order Email includes recipient, subject, selected checklist and usable HTTPS link',()=>{
  const a={id:'test-123',tmv:'TMV & Test',technician:{name:'Test Technician',email:'tech+test@example.com'},location:'District & North',date:'2026-09-04',status:'assigned',sections:[{title:'UPS & Power',items:[{label:'Battery <voltage>',value:'12.5 V'},{label:'Alarm',value:''}]}],results:[{title:'UPS & Power',items:[{value:'13 V'},{value:false}]}]};
  const url=emailLink(a);
  assert.equal(decodeURIComponent(url.pathname),'tech+test@example.com');
  assert.equal(url.searchParams.get('subject'),'CUDD PM Work Order — TMV & Test');
  const body=url.searchParams.get('body');
  for(const text of ['Test Technician','District & North','2026-09-04','https://tmvapp.local-journal.com/tech/test-123','UPS & Power','Battery <voltage>: 13 V','Alarm: false'])assert.ok(body.includes(text),text);
  assert.ok(body.includes('\n'));assert.doesNotMatch(body,/Network and Server/);
});
test('legacy assignments resolve recipient from roster and no email stays hidden',()=>{
  const a={id:'legacy-1',tmv:'Legacy TMV',technician:'Legacy Tech',sections:[]};
  const url=emailLink(a,{technicians:[{name:'Legacy Tech',email:'legacy@example.com'}]});
  assert.equal(decodeURIComponent(url.pathname),'legacy@example.com');
  assert.match(url.searchParams.get('body'),/legacy-1/);
  assert.equal(emailLink(a),null);
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const net = require('node:net');
const { once } = require('node:events');
const { buildWorkOrder } = require('../work-orders');
const config = {
  tmvVanMap: { TEST_UNIT: ['Virtual TMV'] }, locations: ['Test District'],
  technicians: [{ name:'Test Technician' }],
  checklist: [{ title:'Network', appliesTo:['Virtual TMV'], items:[
    {label:'Connection',type:'yn'}, {label:'Mode',type:'choice',opts:['Primary','Backup']}
  ] }, {title:'Power',appliesTo:['Virtual TMV'],items:[{label:'UPS battery',type:'text'}]}]
};
const payload = { tmv:'TEST_UNIT',technician:'Test Technician',location:'Test District',date:'2026-09-04',requestId:'test-request-00000001',selectedSectionTitles:['Network'] };

test('validates unit, technician, date and checklist; preserves mobile controls', () => {
  const assignment=buildWorkOrder(payload,config);
  assert.equal(assignment.sections[0].items[0].type,'yn');
  assert.deepEqual(assignment.sections[0].items[1].opts,['Primary','Backup']);
  assert.deepEqual(assignment.sections.map(s=>s.title),['Network']);
  assert.doesNotMatch(assignment.report.text,/UPS battery/);
  assert.deepEqual(assignment.dispatchLog.selectedSectionTitles,['Network']);
  assert.equal(buildWorkOrder({...payload,selectedSectionTitles:['Power','Network']},config).sections.length,2);
  assert.equal(buildWorkOrder({...payload,selectedSectionTitles:undefined},config).sections.length,2);
  for(const selectedSectionTitles of [[],['Unknown'],['Network','Network'],null])assert.throws(()=>buildWorkOrder({...payload,selectedSectionTitles},config),error=>error.status===400);
  assert.equal(assignment.completedAt,null);assert.equal(assignment.results,null);
  assert.match(assignment.report.text,/awaiting technician completion/);
  for(const changed of [{tmv:'bad'},{technician:'bad'},{location:'bad'},{date:'2026-02-30'},{requestId:'short'},{sections:[{title:'Unknown',items:[]}]}]){
    assert.throws(()=>buildWorkOrder({...payload,...changed},config),error=>error.status===400);
  }
});

test('API saves assignment, report and log atomically; retries and restart preserve one order', async t => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'tmv-work-order-test-'));
  const databasePath=path.join(dir,'test.db');
  process.env.TMV_DB_PATH=databasePath;
  const db=require('../db');db.saveConfig(config);
  const Database=require('better-sqlite3');const inspect=new Database(databasePath);
  const originalAssets=JSON.stringify(db.loadAssets());
  const reservation=net.createServer();reservation.listen(0,'127.0.0.1');await once(reservation,'listening');
  const port=reservation.address().port;await new Promise(resolve=>reservation.close(resolve));
  let child;
  async function stop(){if(child&&child.exitCode===null){const exited=once(child,'exit');child.kill();await exited;}}
  t.after(async()=>{await stop();inspect.close();});
  async function start(){
    child=spawn(process.execPath,[path.join(__dirname,'../api-server.js')],{env:{...process.env,TMV_DB_PATH:databasePath,PORT:String(port)},stdio:['ignore','pipe','pipe']});
    for(let i=0;i<100;i++){
      if(child.exitCode!==null)throw new Error('Test server exited');
      try{const r=await fetch('http://127.0.0.1:'+port+'/api/config');if(r.ok)return;}catch(_){}
      await new Promise(resolve=>setTimeout(resolve,30));
    }
    throw new Error('Test server did not start');
  }
  const post=async body=>{const r=await fetch('http://127.0.0.1:'+port+'/api/work-orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,...await r.json()};};
  await start();
  assert.equal((await post({...payload,technician:'Invalid'})).status,400);
  assert.equal(db.loadAssignments().length,0);
  const first=await post(payload);assert.equal(first.status,201);assert.equal(first.assignment.status,'assigned');
  const retries=await Promise.all([post(payload),post(payload),post(payload)]);
  for(const retry of retries){assert.equal(retry.status,200);assert.equal(retry.assignment.id,first.assignment.id);assert.equal(retry.replayed,true);}
  assert.equal((await post({...payload,date:'2026-09-05'})).status,409);
  assert.equal(db.loadAssignments().length,1);
  assert.equal(inspect.prepare('SELECT COUNT(*) n FROM work_order_logs').get().n,1);
  assert.equal(JSON.stringify(db.loadAssets()),originalAssets,'Dispatch must not mark maintenance completed');
  assert.match(first.ticket,/Test Technician/);
  const work=await fetch('http://127.0.0.1:'+port+'/api/assignments/'+first.assignment.id).then(r=>r.json());
  assert.equal(work.assignment.sections[0].items[0].type,'yn');
  assert.deepEqual(work.assignment.sections.map(s=>s.title),['Network']);
  inspect.exec("CREATE TRIGGER fail_test_log BEFORE INSERT ON work_order_logs BEGIN SELECT RAISE(ABORT, 'test log failure'); END;");
  assert.equal((await post({...payload,requestId:'test-request-00000002'})).status,500);
  assert.equal(db.loadAssignments().length,1,'Failed log must roll back assignment');
  inspect.exec('DROP TRIGGER fail_test_log');
  await stop();await start();
  const replay=await post(payload);assert.equal(replay.assignment.report.text,first.ticket);assert.equal(replay.replayed,true);
  assert.equal(inspect.prepare('SELECT COUNT(*) n FROM work_order_logs').get().n,1);
  const page=await fetch('http://127.0.0.1:'+port+'/').then(r=>r.text());
  assert.match(page,/Assign Technician/);assert.doesNotMatch(page,/preview-api/);
  for(const asset of ['/dispatch.js','/dispatch.css','/site-bg.png','/work-order-builder.html','/work-order-builder.js'])assert.equal((await fetch('http://127.0.0.1:'+port+asset)).status,200);
});

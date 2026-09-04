'use strict';
const byId=id=>document.getElementById(id);
let version='',busy=false;
function update(){byId('subscribe').disabled=busy||!version||!byId('consent').checked;byId('unsubscribe').disabled=busy;}
byId('consent').onchange=update;
async function save(action){
  if(busy||!byId('preferences').reportValidity())return;
  if(action==='subscribe'&&(!version||!byId('consent').checked))return;
  busy=true;update();byId('status').textContent='Saving your preference…';
  try{
    const response=await fetch('/api/sms-consent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:byId('name').value,phone:byId('phone').value,action,consent:byId('consent').checked,version})});
    const data=await response.json();if(!response.ok)throw new Error(data.error||'Unable to save preference');
    byId('status').textContent=data.message;byId('consent').checked=false;
  }catch(error){byId('status').textContent=error.message;}finally{busy=false;update();}
}
byId('preferences').onsubmit=event=>{event.preventDefault();save('subscribe');};
byId('unsubscribe').onclick=()=>save('unsubscribe');
(async()=>{try{const r=await fetch('/api/sms-consent');if(!r.ok)throw new Error();const d=await r.json();version=d.version;byId('disclosure').textContent=d.disclosure;update();}catch(_){byId('status').textContent='Unable to load enrollment. Refresh to retry, or contact jguynes@rpc.net.';}})();

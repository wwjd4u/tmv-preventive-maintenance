'use strict';
const VERSION = '2026-09-04-v1';
const DISCLOSURE = 'I agree to receive recurring CUDD Energy Services TMV Preventive Maintenance SMS alerts about maintenance dispatch, work-order assignments, and completion requests at the mobile number I provide. Message frequency varies with assigned work. Message and data rates may apply. Reply STOP to cancel or HELP for help. For support, email jguynes@rpc.net. SMS consent is optional and is not a condition of purchase, employment, or using the maintenance app. I confirm that I am the authorized user of this mobile number.';
function normalizePhone(value) {
  if (typeof value !== 'string') return '';
  const digits=value.replace(/\D/g,'');
  return /^\d{10}$/.test(digits)?'1'+digits:/^1\d{10}$/.test(digits)?digits:'';
}
function sendBlockReason(phone, db, env) {
  if(env.TMV_SMS_APPROVED !== '1') return 'SMS sending is disabled until campaign approval and STOP/HELP configuration are verified.';
  if((env.SMS_PROVIDER||'').toLowerCase()!=='twilio')return 'This SMS program requires the configured Twilio Messaging Service.';
  if(!env.TWILIO_MESSAGING_SERVICE_SID)return 'Twilio Messaging Service is not configured.';
  if(!db.hasSmsConsent(phone))return 'This technician has not opted in to SMS, or has withdrawn consent. Use SMS Preferences first.';
  return '';
}
function handle(req,res,url,db,getConfig) {
  if(url.pathname!=='/api/sms-consent')return false;
  const reply=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  if(req.method==='GET'){reply(200,{version:VERSION,disclosure:DISCLOSURE});return true;}
  if(req.method!=='POST'){reply(405,{error:'Method not allowed'});return true;}
  // A cross-site HTML form cannot create consent. Browser submissions must be same origin.
  if(!(req.headers['content-type']||'').startsWith('application/json')){reply(415,{error:'JSON required'});return true;}
  if(req.headers.origin){
    try{if(new URL(req.headers.origin).host!==req.headers.host)throw new Error();}
    catch(_){reply(403,{error:'Use the SMS Preferences page on this website.'});return true;}
  }
  let body='',oversize=false;
  req.on('data',chunk=>{if(oversize)return;body+=chunk;if(Buffer.byteLength(body)>8192){oversize=true;reply(413,{error:'Request too large'});}});
  req.on('end',()=>{
    if(oversize)return;
    try{
      const input=JSON.parse(body),phone=normalizePhone(input.phone);
      const name=typeof input.name==='string'?input.name.trim():'';
      if(!phone||!name||name.length>120) return reply(400,{error:'Enter your name and a valid US mobile number.'});
      if(!['subscribe','unsubscribe'].includes(input.action))return reply(400,{error:'Choose subscribe or unsubscribe.'});
      if(input.action==='subscribe'&&(input.consent!==true||input.version!==VERSION))return reply(400,{error:'Read the current disclosure and actively check the SMS consent box.'});
      if(input.action==='subscribe'){
        const tech=(getConfig().technicians||[]).find(t=>t.name?.trim().toLowerCase()===name.toLowerCase()&&normalizePhone(t.phone)===phone);
        if(!tech)return reply(400,{error:'Your details must match the technician roster. Contact jguynes@rpc.net for assistance.'});
      }
      db.recordSmsConsent({phone,name,action:input.action,at:new Date().toISOString(),source:'/sms-consent.html',version:VERSION,disclosure:input.action==='subscribe'?DISCLOSURE:'Withdraw SMS consent',privacy:'/privacy.html',terms:'/terms.html'});
      reply(200,{ok:true,message:input.action==='subscribe'?'Your SMS consent has been recorded. No text was sent. Alerts begin only after the program is approved and enabled. If you previously replied STOP, contact support before re-enrolling.':'Your SMS consent has been withdrawn. The app will not send further SMS alerts to this number.'});
    }catch(_){reply(400,{error:'Unable to record your preference. Check your details and try again.'});}
  });
  return true;
}
module.exports={handle,normalizePhone,sendBlockReason,VERSION,DISCLOSURE};

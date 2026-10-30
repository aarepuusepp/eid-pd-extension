import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
const sender={id:'ext',url:'https://visitor.test/',frameId:0,tab:{id:1,windowId:1,url:'https://visitor.test/'}};
function fixture(p={defaultAction:'ask',allowedOrigins:[],blockedOrigins:[]}){
 let listener;const events={};const calls=[];const windows=[];let grants={};let tab={...sender.tab};
 const event=name=>({addListener(fn){events[name]=fn;}});
 const api={runtime:{id:'ext',getURL:f=>'chrome-extension://ext/'+f,getManifest:()=>({version:'2.1.1'}),onMessage:{addListener:f=>listener=f},
 async sendNativeMessage(host,message){calls.push(message);if(message.command==='policy')return {ok:true,protocol:1,data:p};if(message.command==='status')return {ok:true,data:{protocol:1,nativeApp:'2.1.1'}};return {ok:true,results:[],data:{}};}},
 storage:{local:{async get(){return {grants:{...grants}}},async set(v){grants=v.grants},async remove(){grants={}}}},
 tabs:{async get(){return tab},async query(){return [tab]},onUpdated:event('updated'),onRemoved:event('removed')},
 windows:{async create(options){const w={...options,id:windows.length+10};windows.push(w);return w;},async remove(){},onRemoved:event('closed')}};
 const c=vm.createContext({chrome:api,URL,crypto:webcrypto,console,setTimeout,clearTimeout});
 for(const file of ['policy.js','background-core.js'])vm.runInContext(readFileSync(new URL('../extension/'+file,import.meta.url),'utf8'),c);
 const send=(m,s=sender)=>new Promise(resolve=>listener(m,s,resolve));
 async function approval(choice='once'){for(let i=0;i<30&&!windows.length;i++)await new Promise(r=>setTimeout(r,1));assert.ok(windows.length);const w=windows.at(-1);const token=new URL(w.url).searchParams.get('request');return send({type:'CONSENT_REPLY',token,choice},{id:'ext',url:w.url,tab:{windowId:w.id}});}
 return {send,approval,api,calls,windows,events,setTab:v=>tab=v,setGrants:v=>grants=v};
}
test('status never prompts or performs card reads',async()=>{const f=fixture();assert.equal((await f.send({action:'STATUS'})).ok,true);assert.deepEqual(f.calls.map(x=>x.command),['policy','status']);assert.equal(f.windows.length,0);});
test('ask requires extension-owned approval and forwards trusted origin',async()=>{const f=fixture();const r=f.send({action:'READ_ALL_READERS',origin:'https://fake.test'});await f.approval();assert.equal((await r).ok,true);assert.equal(f.calls.at(-1).origin,'https://visitor.test');});
test('central blocked list wins over allowed and remembered',async()=>{const f=fixture({defaultAction:'allow',allowedOrigins:['https://visitor.test'],blockedOrigins:['https://visitor.test']});f.setGrants({'["https://visitor.test","personalData"]':'allow'});assert.equal((await f.send({type:'EID_PD_READ'})).errorCode,'ERR_EIDPD_SITE_DENIED');assert.equal(f.calls.filter(c=>c.command!=='policy').length,0);});
test('deny mode does not accept a previous user grant',async()=>{const f=fixture({defaultAction:'deny',allowedOrigins:[],blockedOrigins:[]});f.setGrants({'["https://visitor.test","personalData"]':'allow'});assert.equal((await f.send({type:'EID_PD_READ_ALL'})).ok,false);});
test('HTTPS-only and top-frame-only, before native calls',async()=>{const f=fixture();for(const s of [{...sender,frameId:2},{...sender,url:'http://visitor.test/'},{...sender,url:'https://other.test/'}])assert.equal((await f.send({action:'STATUS'},s)).ok,false);assert.equal(f.calls.length,0);});
test('navigation cancels waiting approval',async()=>{const f=fixture();const r=f.send({action:'READ_ALL_READERS'});await new Promise(resolve=>setTimeout(resolve,5));f.setTab({...sender.tab,url:'https://other.test/'});f.events.updated(1,{url:'https://other.test/'});assert.equal((await r).errorCode,'ERR_EIDPD_USER_CANCELLED');});
test('closing approval denies operation',async()=>{const f=fixture();const r=f.send({action:'GET_DECRYPT_CERTIFICATE'});await new Promise(resolve=>setTimeout(resolve,5));f.events.closed(f.windows[0].id);assert.equal((await r).ok,false);});
test('webpage cannot approve its own request',async()=>{const f=fixture();const r=f.send({action:'READ_ALL_READERS'});await new Promise(resolve=>setTimeout(resolve,5));const token=new URL(f.windows[0].url).searchParams.get('request');assert.equal((await f.send({type:'CONSENT_REPLY',token,choice:'always'})).ok,false);await f.approval('deny');assert.equal((await r).ok,false);});
test('duplicate calls do not open duplicate prompts',async()=>{const f=fixture();const r=f.send({action:'READ_ALL_READERS'});await new Promise(resolve=>setTimeout(resolve,5));assert.equal((await f.send({action:'READ_ALL_READERS'})).errorCode,'ERR_EIDPD_ACTION_PENDING');await f.approval();await r;assert.equal(f.windows.length,1);});
test('remembered personal-data grant does not grant decrypt',async()=>{const f=fixture();f.setGrants({'["https://visitor.test","personalData"]':'allow'});assert.equal((await f.send({action:'READ_ALL_READERS'})).ok,true);const r=f.send({action:'GET_DECRYPT_CERTIFICATE'});await f.approval('deny');assert.equal((await r).ok,false);});
test('legacy decrypt route cannot submit PIN or DLL path',async()=>{const f=fixture({defaultAction:'allow',allowedOrigins:[],blockedOrigins:[]});assert.equal((await f.send({type:'EID_PD_DECRYPT_CONTAINER',options:{pin:'0000'}})).errorCode,'ERR_EIDPD_INVALID_REQUEST');assert.equal(f.calls.some(x=>x.command==='decryptContainer'),false);});
test('allow mode still uses native PIN, does not cache personal data',async()=>{const f=fixture({defaultAction:'allow',allowedOrigins:[],blockedOrigins:[]});await f.send({action:'GET_DECRYPT_CERTIFICATE'});await f.send({type:'EID_PD_READ'});await f.send({type:'EID_PD_READ'});assert.equal(f.calls.filter(x=>x.command==='readPersonalData').length,2);assert.equal(f.windows.length,0);assert.equal(f.calls.find(x=>x.command==='get-decrypt-certificate').pin,undefined);});
test('invalid central configuration fails closed',async()=>{const f=fixture({defaultAction:'oops',allowedOrigins:[],blockedOrigins:[]});assert.equal((await f.send({action:'READ_ALL_READERS'})).errorCode,'ERR_EIDPD_POLICY_INVALID');});
test('settings can revoke local grants; websites cannot',async()=>{const f=fixture();assert.equal((await f.send({type:'GRANTS_CLEAR'})).ok,false);assert.equal((await f.send({type:'GRANTS_CLEAR'},{id:'ext',url:'chrome-extension://ext/settings.html'})).ok,true);});
test('central policy changed during approval wins',async()=>{const p={defaultAction:'ask',allowedOrigins:[],blockedOrigins:[]};const f=fixture(p);const r=f.send({action:'READ_ALL_READERS'});await new Promise(resolve=>setTimeout(resolve,5));p.defaultAction='deny';await f.approval();assert.equal((await r).errorCode,'ERR_EIDPD_SITE_DENIED');});


test('policy canonicalizes host case and malformed origins keep a stable error',async()=>{
 const f=fixture({defaultAction:'deny',allowedOrigins:['https://VISITOR.test:443/'],blockedOrigins:[]});
 assert.equal((await f.send({action:'READ_ALL_READERS'})).ok,true);
 for(const origin of ['not a URL','https://visitor.test/path','https://*.test']){
  const invalid=fixture({defaultAction:'allow',allowedOrigins:[origin],blockedOrigins:[]});
  assert.equal((await invalid.send({action:'READ_ALL_READERS'})).errorCode,'ERR_EIDPD_POLICY_INVALID');
 }
});

test('missing native host and an old host have distinct diagnostics',async()=>{
 const missing=fixture();missing.api.runtime.sendNativeMessage=async()=>{throw Error('not installed')};
 assert.equal((await missing.send({action:'STATUS'})).errorCode,'ERR_EIDPD_NATIVE_UNAVAILABLE');
 const old=fixture();old.api.runtime.sendNativeMessage=async()=>({ok:false,error:'unknown command: policy'});
 assert.equal((await old.send({action:'STATUS'})).errorCode,'ERR_EIDPD_VERSION_MISMATCH');
});

const popupSender={id:'ext',url:'chrome-extension://ext/popup/popup.html'};
test('popup status is diagnostic only; explicit local read never grants or forwards to a website',async()=>{
 const f=fixture();const status=await f.send({type:'POPUP_STATUS'},popupSender);
 assert.equal(status.context.origin,'https://visitor.test');assert.deepEqual(f.calls.map(x=>x.command),['policy','status']);
 const r=await f.send({type:'POPUP_READ',mode:'all',context:status.context},popupSender);
 assert.equal(r.ok,true);assert.equal(f.calls.filter(x=>x.command==='readAllReaders').length,1);assert.equal(f.windows.length,0);
 const grants=await f.send({type:'GRANTS_LIST'},{id:'ext',url:'chrome-extension://ext/settings.html'});assert.equal(Object.keys(grants.grants).length,0);
});
test('websites cannot impersonate popup commands',async()=>{
 const f=fixture();assert.equal((await f.send({type:'POPUP_STATUS'})).errorCode,'ERR_EIDPD_SITE_DENIED');
 assert.equal((await f.send({type:'POPUP_READ',mode:'all'})).errorCode,'ERR_EIDPD_SITE_DENIED');assert.equal(f.calls.length,0);
});
test('popup respects central deny, validates context and rejects non-HTTPS tabs',async()=>{
 const p={defaultAction:'deny',allowedOrigins:[],blockedOrigins:[]};const f=fixture(p);const status=await f.send({type:'POPUP_STATUS'},popupSender);
 assert.equal((await f.send({type:'POPUP_READ',mode:'all',context:status.context},popupSender)).errorCode,'ERR_EIDPD_SITE_DENIED');
 p.defaultAction='allow';f.setTab({...sender.tab,url:'http://insecure.test/'});
 assert.equal((await f.send({type:'POPUP_READ',mode:'all',context:status.context},popupSender)).ok,false);
 assert.equal(f.calls.some(c=>c.command==='readAllReaders'),false);
});
test('popup discards an in-flight result after same-URL navigation or a policy change',async()=>{
 for(const change of ['navigation','policy']){
  const p={defaultAction:'ask',allowedOrigins:[],blockedOrigins:[]};const f=fixture(p);const status=await f.send({type:'POPUP_STATUS'},popupSender);
  const original=f.api.runtime.sendNativeMessage;f.api.runtime.sendNativeMessage=async(host,m)=>{
   if(m.command==='readAllReaders'){if(change==='navigation')f.events.updated(1,{status:'loading'});else p.defaultAction='deny';}
   return original(host,m);
  };
  const r=await f.send({type:'POPUP_READ',mode:'all',context:status.context},popupSender);
  assert.equal(r.ok,false);assert.equal(r.results,undefined);
 }
});


test('unwrap preserves native timeout code and forwards display metadata without accepting identity overrides',async()=>{
 let forwarded;
 const f=fixture({defaultAction:'allow',allowedOrigins:[],blockedOrigins:[]});
 const original=f.api.runtime.sendNativeMessage;
 f.api.runtime.sendNativeMessage=async(host,message)=>{
  if(message.command==='unwrap-transport-key'){forwarded=message;return {ok:false,error:'PIN expired',errorCode:'ERR_EIDPD_PIN_TIMEOUT'};}
  return original(host,message);
 };
 const r=await f.send({action:'UNWRAP_TRANSPORT_KEY',certificate:'cert',challenge:{displayContext:{fileName:'example.cdoc'}},options:{name:'spoof',personalCode:'spoof'}});
 assert.equal(r.errorCode,'ERR_EIDPD_PIN_TIMEOUT');
 assert.equal(forwarded.challenge.displayContext.fileName,'example.cdoc');
 assert.equal(forwarded.origin,'https://visitor.test');
 assert.equal(forwarded.name,undefined);
 assert.equal(forwarded.personalCode,undefined);
});

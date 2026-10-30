const api=globalThis.browser||globalThis.chrome;
const $=id=>document.getElementById(id);
let context=null,ready=false,reading=false,checking=false,timer,expiry;
const sameContext=(a,b)=>a?.tabId===b?.tabId&&a?.url===b?.url&&a?.epoch===b?.epoch;
function hideData(){clearTimeout(expiry);$('results').replaceChildren();$('results').hidden=true;$('expiry').hidden=true;$('hide').disabled=true;}
function setStatus(value,message){ready=value;$('status').className='status '+(value?'ready':'unavailable');$('readyIcon').toggleAttribute('hidden',!value);$('missingIcon').toggleAttribute('hidden',value);$('statusText').textContent=message;$('read').disabled=!value||reading;}
async function check(){
 clearTimeout(timer);
 if(document.visibilityState==='hidden')return;
 if(checking){timer=setTimeout(check,1000);return;}
 checking=true;let delay=1000;
 try{
  const r=await api.runtime.sendMessage({type:'POPUP_STATUS'});
  if(!r?.ok)throw Error(r?.error||'Laienduse ühendus katkes');
  if(!sameContext(context,r.context))hideData();context=r.context;
  $('site').textContent=context?.origin||'HTTPS-veebileht pole avatud';
  const d=r.diagnostics;
  const allowed=!!context&&r.access!=='deny';
  let message=!d?.pcscAvailable?'Kiipkaardi teenus pole kättesaadav.':!d.readerCount?'Kaardilugejat ei leitud.':!d.cardPresent?'Sisesta ID-kaart lugejasse.':!context?'Kaart on lugejas. Ava lugemiseks HTTPS-veebileht.':!allowed?'Aktiivne veebileht on keskse seadistusega keelatud.':'Kaart on lugemiseks valmis.';
  setStatus(allowed&&!!d?.pcscAvailable&&!!d.readerCount&&!!d.cardPresent,message);
  $('policyHint').textContent=context?'Keskne veebilehtede poliitika kehtib ka siin.':'Ava näiteks Visitor ja seejärel see hüpikvaade uuesti.';
  if(!ready)hideData();
 }catch(error){setStatus(false,error.message);hideData();delay=5000;}
 finally{checking=false;timer=setTimeout(check,delay);}
}
function render(result){
 const items=result.results||[{reader:'ID-kaart',data:result.data,error:result.error}];
 for(const item of items){
  const article=document.createElement('article');const title=document.createElement('h2');title.textContent=item.reader||'ID-kaart';article.append(title);
  if(item.data){const dl=document.createElement('dl');for(const [label,value]of [['Eesnimi',item.data.givenName],['Perekonnanimi',item.data.surname],['Isikukood',item.data.personalCode],['Dokumendi number',item.data.documentNr||item.data.documentNumber],['Kehtiv kuni',item.data.expiryDate]]){if(value){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;dl.append(dt,dd);}}article.append(dl);}
  else {const p=document.createElement('p');p.textContent=item.error||'Kaarti ei leitud.';article.append(p);}
  $('results').append(article);
 }
 $('results').hidden=false;$('hide').disabled=false;$('expiry').hidden=false;expiry=setTimeout(hideData,30000);
}
$('read').onclick=async()=>{
 if(!ready||reading)return;reading=true;hideData();$('read').disabled=true;$('error').textContent='';
 try{const mode=document.querySelector('input[name="mode"]:checked').value;const r=await api.runtime.sendMessage({type:'POPUP_READ',context,mode,...(mode==='nfc'?{can:$('can').value}:{})});if(!r?.ok)throw Error(r?.error||'Lugemine ebaõnnestus');if(ready&&document.visibilityState!=='hidden')render(r);}
 catch(error){$('error').textContent=error.message;}finally{reading=false;check();}
};
$('hide').onclick=hideData;
$('modes').onchange=()=>{$('canField').hidden=document.querySelector('input[name="mode"]:checked').value!=='nfc';$('can').value='';hideData();};
$('settings').onclick=()=>api.runtime.openOptionsPage();
document.addEventListener('visibilitychange',()=>{hideData();clearTimeout(timer);if(document.visibilityState!=='hidden')check();});
window.addEventListener('pagehide',()=>{clearTimeout(timer);hideData();$('can').value='';});
check();

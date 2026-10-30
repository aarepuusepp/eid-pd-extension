/* Deprecated window API; all requests still go through the shared access policy. */
(() => {
 if(window.EstEID_PD)return;
 function send(type,options={}){
  const requestId=crypto.randomUUID();
  return new Promise(resolve=>{
   const cleanup=()=>{clearTimeout(timer);window.removeEventListener('message',receive);};
   const receive=e=>{
    if(e.source!==window||e.origin!==location.origin||e.data?.target!=='ESTEID_PD_PAGE'||e.data.requestId!==requestId)return;
    cleanup();const r=e.data.payload;resolve(type==='CHECK_STATUS'?{...r,available:r?.ok===true}:r);
   };
   const timer=setTimeout(()=>{cleanup();resolve({ok:false,error:'Kaarditoimingu ooteaeg lõppes',errorCode:'ERR_EIDPD_USER_TIMEOUT'});},Math.min(options.timeout||150000,180000));
   window.addEventListener('message',receive);
   window.postMessage({target:'ESTEID_PD_EXTENSION',type,requestId,options},location.origin);
  });
 }
 window.EstEID_PD={
  version:'2.1.1',isAvailable:()=>true,
  readPersonalData:(options)=>send('READ_PERSONAL_DATA',options),
  readAllReaders:(options)=>send('READ_ALL_READERS',options),
  readCard:(options)=>send('READ_PERSONAL_DATA',options),
  decryptContainer:(options)=>send('DECRYPT_CONTAINER',options),
  clearCache:()=>send('CLEAR_CACHE'),
  checkStatus:()=>send('CHECK_STATUS', {timeout:5000})
 };
 window.dispatchEvent(new CustomEvent('esteid-pd-ready',{detail:{version:'2.1.1'}}));
})();
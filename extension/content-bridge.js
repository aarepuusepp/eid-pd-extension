/* All page transports share the same background authorization dispatcher. */
(() => {
 if(window!==window.top || location.protocol!=='https:')return;
 const api=globalThis.browser||globalThis.chrome;
 const legacy={READ_PERSONAL_DATA:'READ_PERSONAL_DATA',READ_ALL_READERS:'READ_ALL_READERS',CHECK_STATUS:'STATUS',CLEAR_CACHE:'CLEAR_CACHE',DECRYPT_CONTAINER:'DECRYPT_CONTAINER'};
 window.addEventListener('message',async event=>{
  if(event.source!==window || event.origin!==location.origin)return;
  const m=event.data;
  if(!m || !['EIDPD_CLIENT','EIDPD_DECRYPT_LIBRARY','ESTEID_PD_EXTENSION'].includes(m.target))return;
  if(!['string','number'].includes(typeof m.requestId))return;
  const action=m.target==='ESTEID_PD_EXTENSION'?legacy[m.type]:m.action;
  let r;
  try {r=await api.runtime.sendMessage({type:'EIDPD_REQUEST',action,options:m.options||{},certificate:m.certificate,challenge:m.challenge});}
  catch {r={ok:false,error:'Laiendus vajab uuesti laadimist',errorCode:'ERR_EIDPD_EXTENSION_UNAVAILABLE'};}
  const target=m.target==='EIDPD_CLIENT'?'EIDPD_CLIENT_RESPONSE':m.target==='EIDPD_DECRYPT_LIBRARY'?'EIDPD_DECRYPT_PAGE':'ESTEID_PD_PAGE';
  window.postMessage({target,requestId:m.requestId,type:m.type+'_RESPONSE',payload:r,...(m.target==='ESTEID_PD_EXTENSION'?{}:r?.ok===false?r:{ok:true,result:r})},location.origin);
 });
 const script=document.createElement('script');script.src=api.runtime.getURL('page-api.js');script.onload=()=>script.remove();script.onerror=()=>script.remove();
 (document.head||document.documentElement).append(script);
})();
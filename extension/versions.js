(() => {
 const api=globalThis.browser||globalThis.chrome;
 const reader=document.getElementById('readerVersion');
 document.getElementById('extensionVersion').textContent=api.runtime.getManifest().version;
 async function refresh(){
  try{
   const r=await api.runtime.sendMessage({type:'COMPONENT_VERSIONS'});
   if(!r?.ok)throw Error(r?.error||'Reader ei vasta');
   reader.textContent=typeof r.nativeApp==='string'&&r.nativeApp?r.nativeApp:'Versioon teadmata';
   reader.title=r.protocol===1?'Arvutis käivitatud tööjaamakomponent':'Protokoll ei ühildu. Uuenda tööjaamakomponenti.';
  }catch(error){reader.textContent='Pole kättesaadav';reader.title=error.message;}
 }
 document.getElementById('refreshVersions').onclick=refresh;
 refresh();
})();

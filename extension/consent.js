const api=globalThis.browser||globalThis.chrome;
const token=new URL(location.href).searchParams.get('request');
setInterval(()=>api.runtime.sendMessage({type:'CONSENT_GET',token}).catch(()=>{}),20000);
api.runtime.sendMessage({type:'CONSENT_GET',token}).then(r=>{
 if(!r.ok)throw Error(r.error);
 document.getElementById('site').textContent=r.site;
 document.getElementById('operation').textContent=r.capability==='personalData'?'Isikuandmete lugemine':'ID-kaardi sertifikaadi lugemine ja dekrüpteerimine';
}).catch(e=>document.getElementById('error').textContent=e.message);
for(const button of document.querySelectorAll('button'))button.addEventListener('click',()=>api.runtime.sendMessage({type:'CONSENT_REPLY',token,choice:button.dataset.choice}));

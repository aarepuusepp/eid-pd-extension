const api=globalThis.browser||globalThis.chrome;
async function refresh(type='GRANTS_LIST'){
 const r=await api.runtime.sendMessage({type});const list=document.getElementById('grants');list.replaceChildren();
 if(!r.ok){document.getElementById('error').textContent=r.error;return;}
 for(const value of Object.keys(r.grants)){const [site,capability]=JSON.parse(value);const li=document.createElement('li');li.textContent=site+' — '+(capability==='decrypt'?'Dekrüpteerimine':'Isikuandmed');list.append(li);}
}
document.getElementById('clear').onclick=()=>refresh('GRANTS_CLEAR');
refresh();

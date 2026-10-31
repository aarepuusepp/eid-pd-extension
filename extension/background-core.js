/* The only operation dispatcher. Legacy APIs and the SDK enter the same gate. */
(() => {
  const api = globalThis.browser || globalThis.chrome;
  const {fail,decision,senderOrigin,validate} = EIDPDPolicy;
  const host='ee.aarepuusepp.eid_pd_reader';
  const pending=new Map();
  const activeTabs=new Set();
  let cardBusy=false;
  const tabEpochs=new Map();
  const internal = (sender, file) => sender.id === api.runtime.id && sender.url === api.runtime.getURL(file);
  const key=(site,capability)=>JSON.stringify([site,capability]);
  async function native(message) {
    let result;
    try { result=await api.runtime.sendNativeMessage(host,message); }
    catch { throw fail('ERR_EIDPD_NATIVE_UNAVAILABLE','EID-PD tööjaamakomponent puudub või ei käivitu'); }
    if (!result?.ok) throw fail(result?.errorCode || mapError(result?.error), result?.error || 'Kaarditoiming ebaõnnestus');
    return result;
  }
  function mapError(message='') {
    if (/cancel/i.test(message)) return 'ERR_EIDPD_USER_CANCELLED';
    if (/pkcs11|library/i.test(message)) return 'ERR_EIDPD_PKCS11_UNAVAILABLE';
    if (/no.*reader/i.test(message)) return 'ERR_EIDPD_READER_NOT_FOUND';
    if (/CARD_NOT_FOUND|card not found|no.*card/i.test(message)) return 'ERR_EIDPD_CARD_NOT_FOUND';
    return 'ERR_EIDPD_UNKNOWN_ERROR';
  }
  async function policy(){
    let r;
    try { r=await native({command:'policy'}); }
    catch(error){
      if(/unknown.*command|unsupported.*command/i.test(error.message))throw fail('ERR_EIDPD_VERSION_MISMATCH','Uuenda EID-PD tööjaamakomponenti');
      throw error;
    }
    if(r.protocol!==1)throw fail('ERR_EIDPD_VERSION_MISMATCH','Uuenda EID-PD tööjaamakomponenti');
    return validate(r.data);
  }
  async function remembered(site,capability){return (await api.storage.local.get('grants')).grants?.[key(site,capability)];}
  async function current(sender) {
    const tab=await api.tabs.get(sender.tab.id);
    if (tab.url !== sender.tab.url) throw fail('ERR_EIDPD_USER_CANCELLED','Veebileht on muutunud');
  }
  function finish(token, choice) {
    const p=pending.get(token);if(!p)return;
    pending.delete(token);clearTimeout(p.timer);
    if(p.windowId)api.windows.remove(p.windowId).catch(()=>{});
    p.resolve(choice);
  }
  async function consent(sender,site,capability) {
    if(pending.size>=3 || [...pending.values()].some(p=>p.site===site))throw fail('ERR_EIDPD_ACTION_PENDING','Loaküsimus on juba avatud');
    const token=crypto.randomUUID();
    const result=new Promise(resolve=>{
      pending.set(token,{resolve,tabId:sender.tab.id,site,capability,
        timer:setTimeout(()=>finish(token,'cancel'),60000)});
    });
    try {
      const win=await api.windows.create({url:api.runtime.getURL('consent.html')+'?request='+token,type:'popup',width:510,height:390});
      const p=pending.get(token);if(p)p.windowId=win.id;else api.windows.remove(win.id).catch(()=>{});
    } catch {finish(token,'cancel');}
    const choice=await result;
    await current(sender);
    if(!['once','always'].includes(choice))throw fail('ERR_EIDPD_USER_CANCELLED','Veebilehe luba ei antud');
    // Re-read central policy after the user interaction.
    if(decision(await policy(),site,undefined)==='deny')throw fail('ERR_EIDPD_SITE_DENIED','Veebileht on keelatud');
    if(choice==='always'){
      const {grants={}}=await api.storage.local.get('grants');
      grants[key(site,capability)]='allow';await api.storage.local.set({grants});
    }
  }
  api.tabs.onUpdated.addListener((id,change)=>{if(change.url || change.status==='loading')tabEpochs.set(id,(tabEpochs.get(id)||0)+1);if(change.url || change.status==='loading')for(const [token,p]of pending)if(p.tabId===id)finish(token,'cancel');});
  api.tabs.onRemoved.addListener(id=>{tabEpochs.delete(id);for(const [token,p]of pending)if(p.tabId===id)finish(token,'cancel');});
  api.windows.onRemoved.addListener(id=>{for(const [token,p]of pending)if(p.windowId===id)finish(token,'cancel');});
  async function popupContext() {
    const [tab]=await api.tabs.query({active:true,lastFocusedWindow:true,windowType:'normal'});
    if(!tab?.url)return null;
    try {return {tabId:tab.id,url:tab.url,origin:senderOrigin({tab,url:tab.url,frameId:0}),epoch:tabEpochs.get(tab.id)||0};}
    catch {return null;}
  }
  function sameContext(a,b){return !!a&&!!b&&a.tabId===b.tabId&&a.url===b.url&&a.epoch===b.epoch;}
  async function popup(request,sender) {
    if(!internal(sender,'popup/popup.html'))throw fail('ERR_EIDPD_SITE_DENIED','Keelatud');
    const context=await popupContext();
    const p=await policy();
    if(request.type==='POPUP_STATUS'){
      const r=await native({command:'status'});
      if(r.data?.protocol!==1)throw fail('ERR_EIDPD_VERSION_MISMATCH','Uuenda EID-PD tööjaamakomponenti');
      return {ok:true,...r.data,context,access:context?decision(p,context.origin,undefined):'deny'};
    }
    if(!sameContext(context,request.context))throw fail('ERR_EIDPD_USER_CANCELLED','Aktiivne veebileht on muutunud. Kontrolli uut aadressi ja proovi uuesti.');
    if(decision(p,context.origin,undefined)==='deny')throw fail('ERR_EIDPD_SITE_DENIED','See veebileht on keskse seadistusega keelatud.');
    const commands={all:'readAllReaders',contact:'readPersonalData',nfc:'readPersonalDataNFC'};
    if(!commands[request.mode] || (request.mode==='nfc'&&!/^\d{6}$/.test(request.can||'')))throw fail('ERR_EIDPD_INVALID_REQUEST','Vali lugemisviis; NFC jaoks sisesta kuuekohaline CAN.');
    if(cardBusy)throw fail('ERR_EIDPD_ACTION_PENDING','Kaarditoiming on juba pooleli');
    cardBusy=true;
    try {
      // The button in our trusted popup is one-time consent for this local preview.
      // It never grants the website permission and never sends it the result.
      const payload={command:commands[request.mode],origin:context.origin};
      if(request.mode==='nfc')payload.can=request.can;
      const result=await native(payload);
      if(!sameContext(context,await popupContext()))throw fail('ERR_EIDPD_USER_CANCELLED','Veebileht on muutunud. Tulemus eemaldati.');
      if(decision(await policy(),context.origin,undefined)==='deny')throw fail('ERR_EIDPD_SITE_DENIED','Veebileht on keelatud. Tulemus eemaldati.');
      return result;
    } finally {cardBusy=false;}
  }
  async function dispatch(request,sender) {
    if(request.type==='POPUP_STATUS'||request.type==='POPUP_READ')return popup(request,sender);
    if(request.type==='CONSENT_GET' || request.type==='CONSENT_REPLY'){
      const p=pending.get(request.token);
      if(!p || !internal({...sender,url:sender.url?.split('?')[0]},'consent.html') || sender.tab?.windowId!==p.windowId)throw fail('ERR_EIDPD_SITE_DENIED','Keelatud');
      if(request.type==='CONSENT_GET')return {ok:true,site:p.site,capability:p.capability};
      finish(request.token,request.choice);return {ok:true};
    }
    if(request.type==='GRANTS_LIST' || request.type==='GRANTS_CLEAR'){
      if(!internal(sender,'settings.html'))throw fail('ERR_EIDPD_SITE_DENIED','Keelatud');
      if(request.type==='GRANTS_CLEAR')await api.storage.local.remove('grants');
      return {ok:true,grants:(await api.storage.local.get('grants')).grants||{}};
    }
    const legacy={EID_PD_READ:'READ_PERSONAL_DATA',EID_PD_READ_NFC:'READ_PERSONAL_DATA',EID_PD_READ_ALL:'READ_ALL_READERS',EID_PD_STATUS:'STATUS',EID_PD_CLEAR_CACHE:'CLEAR_CACHE',EID_PD_DECRYPT_CONTAINER:'DECRYPT_CONTAINER'};
    const action=legacy[request.type]||request.action;
    const commands={READ_PERSONAL_DATA:'readPersonalData',READ_ALL_READERS:'readAllReaders',GET_DECRYPT_CERTIFICATE:'get-decrypt-certificate',UNWRAP_TRANSPORT_KEY:'unwrap-transport-key',DECRYPT_CONTAINER:'decryptContainer'};
    if(!commands[action] && !['STATUS','CLEAR_CACHE'].includes(action))throw fail('ERR_EIDPD_INVALID_REQUEST','Tundmatu toiming');
    const site=senderOrigin(sender);
    const p=await policy();
    if(action==='STATUS'){
      const r=await native({command:'status'});
      if(r.data?.protocol!==1)throw fail('ERR_EIDPD_VERSION_MISMATCH','Uuenda EID-PD tööjaamakomponenti');
      return {ok:true,...r.data,nfcCryptoBridge:true,extension:api.runtime.getManifest().version,access:{
        personalData:decision(p,site,await remembered(site,'personalData')),
        decrypt:decision(p,site,await remembered(site,'decrypt'))
      }};
    }
    if(action==='CLEAR_CACHE')return {ok:true}; // Personal data is never cached.
    if(activeTabs.has(sender.tab.id))throw fail('ERR_EIDPD_ACTION_PENDING','Sellel lehel on toiming juba pooleli');
    activeTabs.add(sender.tab.id);
    try {
      const capability=action.startsWith('READ_')?'personalData':'decrypt';
      const verdict=decision(p,site,await remembered(site,capability));
      if(verdict==='deny')throw fail('ERR_EIDPD_SITE_DENIED','Veebileht on keskse seadistusega keelatud');
      if(verdict==='ask')await consent(sender,site,capability);
      await current(sender);
      if(decision(await policy(),site,await remembered(site,capability))==='deny')throw fail('ERR_EIDPD_SITE_DENIED','Veebileht on keelatud');
      if(cardBusy)throw fail('ERR_EIDPD_ACTION_PENDING','Kaarditoiming on juba pooleli');
      const options=request.options||{};
      if(options.pin || options.pkcs11)throw fail('ERR_EIDPD_INVALID_REQUEST','PIN ja PKCS11 seadistus kuuluvad tööjaamakomponendile');
      const payload={command:commands[action],origin:site};
      if(action==='READ_PERSONAL_DATA' && (options.mode==='nfc'||request.type==='EID_PD_READ_NFC')){payload.command='readPersonalDataNFC';payload.can=options.can||request.can;}
      if(action==='GET_DECRYPT_CERTIFICATE'||action==='UNWRAP_TRANSPORT_KEY'){
        payload.lang=options.lang;
        if(options.mode!==undefined&&!['contact','nfc'].includes(options.mode))throw fail('ERR_EIDPD_INVALID_REQUEST','Tundmatu kaardilugeja režiim');
        payload.mode=options.mode||'contact';
        if(payload.mode==='nfc'){
          if(typeof options.can!=='string'||!/^\d{6}$/.test(options.can))throw fail('ERR_EIDPD_INVALID_REQUEST','CAN peab sisaldama kuut numbrit');
          const status=await native({command:'status'});
          if(status.data?.nfcCryptoSupported!==true)throw fail('ERR_EIDPD_VERSION_MISMATCH','Uuenda EID-PD tööjaamakomponenti NFC krüptograafia toega versioonile');
          payload.can=options.can;
        }
      }
      if(action==='UNWRAP_TRANSPORT_KEY'){payload.certificate=request.certificate;payload.challenge=request.challenge;}
      if(action==='DECRYPT_CONTAINER')payload.containerBase64=options.containerBase64;
      // NFC capability discovery is asynchronous: navigation, policy or another
      // tab's card operation may have changed while the native host replied.
      await current(sender);
      if(decision(await policy(),site,await remembered(site,capability))==='deny')throw fail('ERR_EIDPD_SITE_DENIED','Veebileht on keelatud');
      if(cardBusy)throw fail('ERR_EIDPD_ACTION_PENDING','Kaarditoiming on juba pooleli');
      cardBusy=true;
      try {const response=await native(payload);await current(sender);return response;}finally{cardBusy=false;}
    } finally {activeTabs.delete(sender.tab.id);}
  }
  api.runtime.onMessage.addListener((request,sender,respond)=>{
    dispatch(request,sender).then(respond,error=>respond({ok:false,error:error.message,errorCode:error.code||'ERR_EIDPD_UNKNOWN_ERROR'}));
    return true;
  });
})();

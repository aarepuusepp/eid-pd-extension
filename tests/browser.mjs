import {chromium,expect as baseExpect} from '@playwright/test';
import {mkdtempSync,readFileSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
const expect=baseExpect.configure({timeout:15000});
const extension=resolve(process.env.EIDPD_EXTENSION_PATH||'extension');
const sdk=readFileSync(new URL(import.meta.resolve('web-eid-pd.js')),'utf8');
for(const channel of ['chromium','msedge']){
 const profile=mkdtempSync(tmpdir()+'/eidpd-browser-');
 const context=await chromium.launchPersistentContext(profile,{channel,headless:true,args:['--disable-extensions-except='+extension,'--load-extension='+extension]});
 try{
  let worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker',{timeout:15000});
  await worker.evaluate(()=>{
   globalThis.nativeCalls=[];globalThis.testCardPresent=false;globalThis.testReadResult={ok:true,results:[]};
   chrome.runtime.sendNativeMessage=async(_host,m)=>{
    globalThis.nativeCalls.push(m);
    if(m.command==='policy')return {ok:true,protocol:1,data:{defaultAction:'ask',allowedOrigins:[],blockedOrigins:[]}};
    if(m.command==='status')return {ok:true,data:{protocol:1,nativeApp:'2.1.2',diagnostics:{pcscAvailable:true,readerCount:1,cardPresent:globalThis.testCardPresent,pkcs11State:'missing'}}};
    return globalThis.testReadResult;
   };
  });
  await context.route('https://eidpd.test/**',route=>route.fulfill({contentType:route.request().url().endsWith('sdk.js')?'application/javascript':'text/html',body:route.request().url().endsWith('sdk.js')?sdk:'<html><button id="read">Read</button><button id="legacy">Legacy</button><output id="result"></output><script type="module">import * as sdk from "/sdk.js";const result=document.querySelector("#result");document.querySelector("#read").onclick=()=>sdk.readAllReaders().then(r=>result.textContent=JSON.stringify(r)).catch(e=>result.textContent=e.code);document.querySelector("#legacy").onclick=()=>window.EstEID_PD.readAllReaders().then(r=>result.textContent=JSON.stringify(r));document.documentElement.dataset.sdkReady="true";</script></html>'}));
  const page=await context.newPage();page.on('pageerror',error=>console.error(channel+': '+error.message));await page.goto('https://eidpd.test/');
  await expect(page.locator('html')).toHaveAttribute('data-sdk-ready','true');
  const promptEvent=context.waitForEvent('page');await page.locator('#read').click();const prompt=await promptEvent;
  await expect(prompt.locator('#site')).toHaveText('https://eidpd.test');
  expect((await worker.evaluate(()=>globalThis.nativeCalls)).some(c=>c.command==='readAllReaders')).toBe(false);
  mkdirSync('test-results',{recursive:true});await prompt.screenshot({path:'test-results/consent-'+channel+'.png'});
  await prompt.getByRole('button',{name:'Luba seekord',exact:true}).click();
  await page.bringToFront();
  await expect(page.locator('#result')).toHaveText('{"ok":true,"results":[]}');
  const legacyPrompt=context.waitForEvent('page');await page.locator('#legacy').click();const denied=await legacyPrompt;
  await expect(denied.locator('#site')).toHaveText('https://eidpd.test');
  await denied.getByRole('button',{name:'Keeldu',exact:true}).click();
  await expect(page.locator('#result')).toContainText('"ok":false');
  await page.bringToFront();
  const popupEvent=context.waitForEvent('page',{timeout:15000});
  // Headless Chromium does not expose browser-action bubbles as Playwright pages.
  // Open the same extension-owned document in a non-focused popup test window.
  await worker.evaluate(()=>chrome.windows.create({url:chrome.runtime.getURL('popup/popup.html'),type:'popup',focused:false,width:460,height:780}));
  const popup=await popupEvent;
  await expect(popup.locator('#extensionVersion')).toHaveText(JSON.parse(readFileSync(extension+'/manifest.json','utf8')).version);
  await expect(popup.locator('#readerVersion')).toHaveText('2.1.2');
  await expect(popup.locator('#statusText')).toHaveText('Sisesta ID-kaart lugejasse.');
  await expect(popup.locator('#read')).toBeDisabled();
  await expect(popup.locator('#missingIcon')).toBeVisible();
  await expect(popup.locator('#readyIcon')).toBeHidden();
  const readsBefore=await worker.evaluate(()=>nativeCalls.filter(c=>c.command==='readAllReaders').length);
  await worker.evaluate(()=>{globalThis.testCardPresent=true;});
  await expect(popup.locator('#statusText')).toHaveText('Kaart on lugemiseks valmis.');
  await expect(popup.locator('#readyIcon')).toBeVisible();
  await expect(popup.locator('#missingIcon')).toBeHidden();
  expect(await worker.evaluate(()=>nativeCalls.filter(c=>c.command==='readAllReaders').length)).toBe(readsBefore);
  await worker.evaluate(()=>{globalThis.testReadResult={ok:true,results:[{reader:'Test reader 1',data:{givenName:'Test',surname:'Kasutaja',personalCode:'50001019999',documentNr:'TEST123'}},{reader:'Test reader 2',error:'Kaarti ei leitud.'}]};});
  await popup.getByRole('button',{name:'Loe kaardiandmed',exact:true}).click();
  await expect(popup.locator('#expiry')).toBeVisible();
  await expect(popup.locator('#results')).toContainText('Kasutaja');
  await expect(popup.locator('#results article')).toHaveCount(2);
  await expect(page.locator('#result')).toContainText('ERR_EIDPD_USER_CANCELLED');
  expect(await worker.evaluate(()=>nativeCalls.filter(c=>c.command==='readAllReaders').length)).toBe(readsBefore+1);
  expect(await worker.evaluate(async()=>Object.keys((await chrome.storage.local.get('grants')).grants||{}).length)).toBe(0);
  await popup.setViewportSize({width:420,height:900});
  await popup.screenshot({path:'test-results/popup-'+channel+'.png',fullPage:true});
  await worker.evaluate(()=>{globalThis.testCardPresent=false;});
  await expect(popup.locator('#results')).toBeHidden();
  await expect(popup.locator('#read')).toBeDisabled();
  await popup.close();
  const settings=await context.newPage();
  await settings.goto(worker.url().replace(/[^/]+$/,'settings.html'));
  await expect(settings.locator('#extensionVersion')).toHaveText(JSON.parse(readFileSync(extension+'/manifest.json','utf8')).version);
  await expect(settings.locator('#readerVersion')).toHaveText('2.1.2');
  await worker.evaluate(()=>{chrome.runtime.sendNativeMessage=async()=>{throw Error('host absent')}});
  await settings.locator('#refreshVersions').click();
  await expect(settings.locator('#readerVersion')).toHaveText('Pole kättesaadav');
  await settings.close();
  console.log(channel+': actual extension/SDK/consent/legacy and popup readiness/read/clear flows PASS (native I/O mocked)');
 }finally{await context.close();}
}

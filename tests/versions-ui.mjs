// Firefox rendering test for our UI documents. Browser/native APIs are mocked;
// this complements the real Chromium/Edge extension tests, not hardware acceptance.
import {firefox,expect} from '@playwright/test';
import {readFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const browser=await firefox.launch({headless:true});
try{
 const context=await browser.newContext({viewport:{width:420,height:900}});
 await context.route('https://extension.test/**',route=>{
  const path=new URL(route.request().url()).pathname.slice(1);
  const contentType=path.endsWith('.js')?'application/javascript':path.endsWith('.css')?'text/css':path.endsWith('.svg')?'image/svg+xml':'text/html';
  return route.fulfill({contentType,body:readFileSync(resolve('extension',path))});
 });
 await context.addInitScript(()=>{
  globalThis.hostVersion='2.1.5';globalThis.hostAvailable=true;globalThis.commands=[];
  globalThis.browser={runtime:{getManifest:()=>({version:'2.1.6'}),sendMessage:async request=>{
   commands.push(request.type);
   if(request.type==='COMPONENT_VERSIONS')return hostAvailable?{ok:true,nativeApp:hostVersion,protocol:1}:{ok:false,error:'Host missing'};
   if(request.type==='POPUP_STATUS')return {ok:true,context:null,access:'deny',diagnostics:{pcscAvailable:true,readerCount:1,cardPresent:false}};
   return {ok:true,grants:{}};
  }}};
 });
 mkdirSync('test-results',{recursive:true});
 for(const doc of ['popup/popup.html','settings.html']){
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('https://extension.test/'+doc);
  await expect(page.locator('#extensionVersion')).toHaveText('2.1.6');
  await expect(page.locator('#readerVersion')).toHaveText('2.1.5');
  await page.screenshot({path:'test-results/versions-firefox-'+(doc.includes('popup')?'popup':'settings')+'.png',fullPage:true});
  await page.evaluate(()=>{hostAvailable=false});await page.locator('#refreshVersions').click();
  await expect(page.locator('#readerVersion')).toHaveText('Pole kättesaadav');
  await expect(page.locator('#extensionVersion')).toHaveText('2.1.6');
  await page.evaluate(()=>{hostAvailable=true;hostVersion='2.2.0'});await page.locator('#refreshVersions').click();
  await expect(page.locator('#readerVersion')).toHaveText('2.2.0');
  expect(await page.evaluate(()=>commands.every(c=>['COMPONENT_VERSIONS','POPUP_STATUS','GRANTS_LIST'].includes(c)))).toBe(true);
  expect(errors).toEqual([]);await page.close();
 }
 console.log('Firefox popup/settings: independent versions, missing host, refresh and no card operations PASS (APIs mocked)');
}finally{await browser.close()}

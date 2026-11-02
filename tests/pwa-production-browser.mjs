import assert from "node:assert/strict";
import { chromium, expect as baseExpect } from "@playwright/test";
import { mkdir,writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
const expect=baseExpect.configure({timeout:30000});
const base=process.env.PWA_BASE_URL??"http://127.0.0.1:3196";
const output="E:/THUCTAP/fe-w5-recovery/pwa-production";
await mkdir(output,{recursive:true});
const oldWorker=execFileSync("git",["show","HEAD:public/sw.js"],{encoding:"utf8"});
const context=await chromium.launchPersistentContext(output+"/chrome-profile-"+Date.now(),{headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_PATH??"C:/Program Files/Google/Chrome/Application/chrome.exe",serviceWorkers:"allow",viewport:{width:390,height:844}});
const browser=context.browser();
try{

  const forbidden=[],errors=[];
  let old=true;
  await context.route("**/*",route=>{
    const r=route.request(),url=new URL(r.url());
    if(url.origin!==base||r.method()!=="GET"||/^\/(api|r)\//.test(url.pathname)){
      forbidden.push(r.method()+" "+url.origin+url.pathname);return route.abort();
    }
    if(url.pathname==="/sw.js"&&old)return route.fulfill({status:200,contentType:"text/javascript",headers:{"Cache-Control":"no-store","Service-Worker-Allowed":"/"},body:oldWorker});
    return route.continue();
  });
  let page=await context.newPage();
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto(base+"/privacy");
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.reload();
  await page.evaluate(()=>caches.open("other-app"));
  const initial=await page.evaluate(async()=>({names:await caches.keys(),scope:(await navigator.serviceWorker.ready).scope,controller:navigator.serviceWorker.controller?.scriptURL}));
  assert.ok(initial.names.includes("travellink-pwa-v1"));
  assert.equal(initial.scope,base+"/");
  old=false;
  await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
  await expect.poll(()=>page.evaluate(async()=>!!(await navigator.serviceWorker.getRegistration()).waiting)).toBe(true);
  assert.ok(await page.evaluate(async()=>(await caches.keys()).includes("travellink-pwa-v1")));
  console.log("PASS update waits without replacing a controlled tab");
  const replacement=context.serviceWorkers().at(-1);
  await Promise.all(context.pages().map(tab=>tab.close()));
  // Await activation with zero controlled pages before opening the next client.
  await expect.poll(()=>replacement.evaluate(async()=>!(await caches.keys()).includes("travellink-pwa-v1"))).toBe(true);
  page=await context.newPage();
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto(base+"/privacy");await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();
  await expect.poll(()=>page.evaluate(async()=>(await caches.keys()).includes("travellink-pwa-v2"))).toBe(true);
  await expect.poll(()=>page.evaluate(async()=>(await caches.keys()).includes("travellink-pwa-v1"))).toBe(false);
  assert.ok(await page.evaluate(async()=>(await caches.keys()).includes("other-app")));
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
  assert.equal(await page.locator('meta[name="theme-color"]').getAttribute("content"),"#204e4c");
  assert.equal(await page.locator('meta[name="mobile-web-app-capable"]').getAttribute("content"),"yes");
  assert.equal(await page.locator('meta[name="apple-mobile-web-app-title"]').getAttribute("content"),"TravelLink AI");
  const manifest=await(await context.request.get(base+"/manifest.webmanifest")).json();
  assert.equal(manifest.display,"standalone");assert.equal(manifest.start_url,"/");assert.equal(manifest.scope,"/");
  assert.equal(manifest.name,"TravelLink AI");assert.equal(manifest.icons.length,2);
  for(const [name,size] of [["icon-192",192],["icon-512",512],["apple-touch-icon",180]]){
    const response=await context.request.get(base+"/pwa/"+name+".png");
    assert.equal(response.status(),200);const meta=await sharp(await response.body()).metadata();
    assert.equal(meta.width,size);assert.equal(meta.height,size);
  }
  const response=await context.request.get(base+"/sw.js");
  assert.match(response.headers()["cache-control"],/no-store/);assert.equal(response.headers()["service-worker-allowed"],"/");
  await page.goto(base+"/");await page.reload();await page.waitForLoadState("networkidle");
  const state=await page.evaluate(async()=>({
    controller:navigator.serviceWorker.controller?.scriptURL,
    caches:await Promise.all((await caches.keys()).map(async name=>({name,urls:(await(await caches.open(name)).keys()).map(r=>new URL(r.url).pathname)}))),
  }));
  assert.equal(state.controller,base+"/sw.js");
  const core=state.caches.find(c=>c.name==="travellink-pwa-v2");
  assert.deepEqual(core.urls.sort(),["/pwa/apple-touch-icon.png","/pwa/icon-192.png","/pwa/icon-512.png","/pwa/offline.html"]);
  const assets=state.caches.find(c=>c.name==="travellink-pwa-static-v2");
  assert.ok(assets&&assets.urls.length>0&&assets.urls.length<=32);
  assert.ok(assets.urls.every(path=>/^\/_next\/static\/css\/[a-f0-9]{16,}\.css$/.test(path)||/^\/_next\/static\/media\/(be-vietnam-pro|lora)-[a-z0-9-]+\.[a-f0-9]{8,}\.woff2$/.test(path)));
  const cdp=await context.newCDPSession(page);
  const installability=await cdp.send("Page.getInstallabilityErrors");
  const appManifest=await cdp.send("Page.getAppManifest");
  assert.deepEqual(appManifest.errors,[]);
  // Report native Chrome validation; physical Android/iOS installation remains manual.
  await writeFile(output+"/installability.json",JSON.stringify({chrome:browser.version(),manifest,installability,scope:base+"/",state},null,2));
  assert.deepEqual(installability.installabilityErrors,[]);
  await page.screenshot({path:output+"/online-390.png"});
  for(const portal of ["/reseller","/merchant"]){
    await page.goto(base+portal);
    assert.equal(new URL(page.url()).pathname,"/login");
  }
  await context.setOffline(true);
  for(const path of ["/reseller","/merchant","/chat"]){
    await page.goto(base+path);await expect(page.locator("h1")).toHaveText("Bạn đang ngoại tuyến");
    await expect(page.getByText("Đặt vé thành công",{exact:true})).toHaveCount(0);
  }
  await page.screenshot({path:output+"/offline-390.png"});
  const offlineCss=await page.evaluate(async path=>(await fetch(path)).status,assets.urls[0]);
  assert.equal(offlineCss,200);
  await context.setOffline(false);await page.goto(base+"/privacy");
  await expect(page.locator("h1")).not.toHaveText("Bạn đang ngoại tuyến");
  assert.deepEqual(forbidden,[]);assert.deepEqual(errors,[]);
  console.log("PASS manifest/icons, Chrome installability checks, v1 to v2 lifecycle, static cache, portal guard, offline/online; no API/tracking/external requests");
  await context.close();
}finally{await context.close()}
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
const source = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
const font="/_next/static/media/be-vietnam-pro-latin-400-normal.12345678.woff2";
const css="/_next/static/css/1234567890abcdef.css";
function worker(network=async request=>new Response("static",{headers:{"content-type":request.url.endsWith(".css")?"text/css":"font/woff2","cache-control":"public,max-age=31536000,immutable"}})) {
  const handlers={},deleted=[],stored=[],data=new Map();
  const names=new Set(["travellink-pwa-v0","travellink-pwa-v1","other-app"]);
  const key=value=>typeof value==="string"?value:value.url;
  const caches={
    open:async name=>{
      names.add(name);
      if(!data.has(name))data.set(name,new Map());
      const entries=data.get(name);
      return {
        addAll:async requests=>{stored.push(...requests);for(const r of requests)entries.set(key(r),new Response(r.url.endsWith("offline.html")?"offline":"icon"));},
        match:async request=>entries.get(key(request))?.clone() ?? entries.get("https://local.test"+key(request))?.clone(),
        put:async (request,response)=>entries.set(key(request),response.clone()),
        keys:async ()=>[...entries.keys()].map(url=>new Request(url)),
        delete:async request=>entries.delete(key(request)),
      };
    },
    keys:async()=>[...names],
    delete:async name=>{deleted.push(name);names.delete(name);data.delete(name);},
  };
  vm.runInNewContext(source,{self:{location:{origin:"https://local.test"},addEventListener:(name,handler)=>{handlers[name]=handler;}},caches,URL,Request,Response,fetch:network});
  return {handlers,deleted,stored,data};
}
function dispatch(handler,path,options={}) {
  let response;const request=new Request("https://local.test"+path,options);
  handler({request,respondWith:value=>{response=value}});
  return response;
}
test("install caches explicit public assets credential-free; activation cleans old app versions only",async()=>{
  const {handlers,stored,deleted}=worker();let work;
  handlers.install({waitUntil:promise=>{work=promise;}});await work;
  assert.equal(stored.length,4);
  assert.ok(stored.every(r=>new URL(r.url).pathname.startsWith("/pwa/")&&r.credentials==="omit"));
  handlers.activate({waitUntil:promise=>{work=promise;}});await work;
  assert.deepEqual(deleted,["travellink-pwa-v0","travellink-pwa-v1"]);
});
test("API/auth/tracking/RSC/actions, checkout and arbitrary static paths bypass cache",()=>{
  const {handlers}=worker();
  for(const path of ["/api/tracking","/api/reseller/wallet","/auth/callback","/r/code","/r/","/_next/static/app.js","/_next/static/chunks/app.js","/reseller?_rsc=x","/pwa/icon-192.png?v=2",font+"?token=x","/checkout","/orders","/payment","/_next/static/media/private.12345678.woff2"]) {
    assert.equal(dispatch(handlers.fetch,path),undefined,path);
  }
  for(const headers of [{RSC:"1"},{"Next-Action":"x"},{Authorization:"Bearer fixture"}])assert.equal(dispatch(handlers.fetch,font,{headers}),undefined);
  assert.equal(dispatch(handlers.fetch,"/reseller",{method:"POST",body:"x"}),undefined);
  let intercepted=false;
  handlers.fetch({request:new Request("https://example.supabase.co/auth/v1/user"),respondWith:()=>{intercepted=true;}});
  assert.equal(intercepted,false);
});
test("only immutable CSS/fonts are stored, public requests omit credentials and repeat loads hit cache",async()=>{
  const network=[];const {handlers,data}=worker(async request=>{
    network.push(request);
    return new Response("asset",{headers:{"content-type":request.url.endsWith(".css")?"text/css":"font/woff2","cache-control":"public,max-age=31536000,immutable"}});
  });
  for(const path of [font,css]) {
    assert.equal(await (await dispatch(handlers.fetch,path)).text(),"asset");
    assert.equal(await (await dispatch(handlers.fetch,path)).text(),"asset");
  }
  assert.equal(network.length,2);
  assert.ok(network.every(r=>r.credentials==="omit"&&r.headers.get("cookie")===null&&r.headers.get("authorization")===null));
  assert.equal(data.get("travellink-pwa-static-v2").size,2);
});
test("private/no-store, HTML and failed responses cannot enter static cache",async()=>{
  for(const [status,type,policy] of [[200,"font/woff2","private,immutable"],[200,"font/woff2","no-store,immutable"],[200,"font/woff2","public,max-age=30"],[200,"text/html","public,immutable"],[500,"font/woff2","public,immutable"]]) {
    const {handlers,data}=worker(async()=>new Response("response",{status,headers:{"content-type":type,"cache-control":policy}}));
    await dispatch(handlers.fetch,font);
    assert.equal(data.get("travellink-pwa-static-v2").size,0);
  }
});
test("static cache remains bounded across build versions",async()=>{
  const {handlers,data}=worker();
  for(let i=0;i<36;i++)await dispatch(handlers.fetch,"/_next/static/css/"+i.toString(16).padStart(16,"0")+".css");
  const entries=data.get("travellink-pwa-static-v2");
  assert.equal(entries.size,32);
  assert.ok(!entries.has("https://local.test/_next/static/css/0000000000000000.css"));
});
test("portal navigation stays no-store with generic offline fallback, never cached account HTML",async()=>{
  let networkRequest;const {handlers,data}=worker(async request=>{networkRequest=request;throw new TypeError("offline")});let work;
  handlers.install({waitUntil:promise=>{work=promise;}});await work;
  const request=new Request("https://local.test/reseller");
  Object.defineProperty(request,"mode",{value:"navigate"});
  let response;handlers.fetch({request,respondWith:promise=>{response=promise;}});
  assert.equal(await (await response).text(),"offline");assert.equal(networkRequest.cache,"no-store");
  assert.ok([...data.values()].every(entries=>[...entries.keys()].every(url=>new URL(url).pathname.startsWith("/pwa/"))));
});
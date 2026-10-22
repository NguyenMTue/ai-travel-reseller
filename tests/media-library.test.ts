import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { initialLibraryQuery, parseLibraryResponse, readLibrary, toMediaCardProps } from "../src/lib/merchant/media-library.ts";
import { mediaFixtureRequest, mediaItems } from "./fixtures/media-library.ts";
const query={...initialLibraryQuery,limit:1};
const response=()=>({success:true,data:[mediaItems()[0]],pagination:{total:1,page:1,limit:1,totalPages:1}});

test("adapter preserves nullable seconds and tags; mapping does not invent a thumbnail or duration",()=>{
  const item=mediaItems()[2],props=toMediaCardProps(item);
  assert.deepEqual(props,{id:item.id,title:item.title,thumbnailUrl:null,durationSeconds:null,styleTags:[]});
  assert.equal(toMediaCardProps(mediaItems()[0]).durationSeconds,15);
  assert.equal(parseLibraryResponse(response(),query).status,"ready");
});
test("errors/missing fields/unsafe URLs and inconsistent pagination never become an empty library",()=>{
  const valid=response();
  for(const value of [null,{success:false},{...valid,data:null},
    {...valid,data:[{...valid.data[0],duration:undefined}]},
    {...valid,data:[{...valid.data[0],thumbnailUrl:"javascript:alert(1)"}]},
    {...valid,data:[{...valid.data[0],videoUrl:"https://user:password@example.invalid/v"}]},
    {...valid,pagination:{...valid.pagination,total:2,totalPages:1}},
    {...valid,pagination:{...valid.pagination,page:2}},
    {...valid,pagination:{...valid.pagination,total:"1"}},
    {...valid,data:[]}])assert.deepEqual(parseLibraryResponse(value,query),{status:"error",reason:"schema"});
  assert.deepEqual(parseLibraryResponse({success:true,data:[],pagination:{total:0,page:1,limit:1,totalPages:1}},query),{status:"ready",data:{items:[],pagination:{total:0,page:1,limit:1,totalPages:1}}});
});
test("prepared transport uses one private read, no merchant identity or retry and distinct errors",async()=>{
  for(const status of [200,401,403,500]){
    let calls=0;
    const result=await readLibrary(query,new AbortController().signal,async(url,init)=>{
      calls++;assert.equal(String(url),"/api/merchant/media?page=1&limit=1");
      assert.equal(init?.method,"GET");assert.equal(init?.cache,"no-store");assert.equal(init?.credentials,"same-origin");assert.equal(init?.redirect,"error");assert.equal(init?.body,undefined);assert.equal(init?.headers,undefined);
      return Response.json(response(),{status});
    });
    assert.equal(calls,1);assert.equal(result.status,status===200?"ready":status===401?"session":status===403?"forbidden":"error");
  }
  assert.deepEqual(await readLibrary(query,new AbortController().signal,async()=>new Response("not json")),{status:"error",reason:"schema"});
  assert.deepEqual(await readLibrary(query,new AbortController().signal,async()=>{throw new TypeError("offline");}),{status:"error",reason:"network"});
});
test("private-cookie request serializes only supported filters, never injected Merchant identity",async()=>{
  const filtered={...initialLibraryQuery,limit:20,platform:"reels" as const,search:"Hội An",tag:" Gia đình ",merchant_id:"untrusted",merchantId:"untrusted",headers:{"x-merchant-id":"untrusted"}};
  let calls=0;
  const result=await readLibrary(filtered,new AbortController().signal,async(input,init)=>{
    calls++;
    const url=new URL(String(input),"https://fixture.invalid");
    assert.equal(url.pathname,"/api/merchant/media");
    assert.deepEqual(Object.fromEntries(url.searchParams),{page:"1",limit:"20",search:"Hội An",platform:"reels",tag:"Gia đình"});
    assert.equal(init?.credentials,"same-origin");assert.equal(init?.cache,"no-store");assert.equal(init?.headers,undefined);assert.equal(init?.body,undefined);
    return Response.json({success:true,data:[],pagination:{page:1,limit:20,total:0,totalPages:1}});
  });
  assert.equal(calls,1);assert.equal(result.status,"ready");
});

test("mock server applies search/platform to full collection and pages, not only current client page",async()=>{
  const read=mediaFixtureRequest("ready","A");
  const second=await read({...initialLibraryQuery,page:2},new AbortController().signal);
  assert.equal(second.status,"ready");if(second.status==="ready"){assert.equal(second.data.items.length,2);assert.equal(second.data.pagination.total,8);}
  const search=await read({...initialLibraryQuery,search:"Hội An"},new AbortController().signal);
  assert.equal(search.status,"ready");if(search.status==="ready"){assert.equal(search.data.items.length,1);assert.match(search.data.items[0].title,/Hội An/);}
  const filtered=await read({...initialLibraryQuery,platform:"reels"},new AbortController().signal);
  assert.equal(filtered.status,"ready");if(filtered.status==="ready")assert(filtered.data.items.every(item=>item.platform==="reels"));
});
test("browser preview uses local assets without an external image mock",async()=>{
  const result=await mediaFixtureRequest("ready","A",undefined,"http://127.0.0.1:3192")(initialLibraryQuery,new AbortController().signal);
  assert.equal(result.status,"ready");if(result.status==="ready"){
    assert.equal(result.data.items[0].thumbnailUrl,"http://127.0.0.1:3192/coast.svg");
    assert.equal(result.data.items[1].thumbnailUrl,"http://127.0.0.1:3192/fixture-missing-thumbnail.jpg");
    assert.equal(result.data.items[2].thumbnailUrl,null);
  }
});
test("real page repeats Merchant guard and never reads media while production integration is pending",async()=>{
  const code=ts.transpileModule(readFileSync("app/merchant/library/page.tsx","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  for(const status of ["allowed","unauthenticated","forbidden","unavailable"]){
    let checks=0;const record={exports:{} as {default:()=>Promise<{type:unknown}>}};
    const Notice=()=>null,Shell=()=>null,Pending=()=>null;
    const requireMock=(name:string)=>{
      if(name==="react/jsx-runtime")return {jsx:(type:unknown,props:unknown)=>({type,props}),jsxs:(type:unknown,props:unknown)=>({type,props})};
      if(name==="next/navigation")return {redirect:(url:string)=>{throw Error(`REDIRECT:${url}`);}};
      if(name.endsWith("portal-server"))return {getMerchantPortalAccess:async()=>{checks++;return {status};}};
      if(name.endsWith("portal-access-notice"))return {MerchantPortalAccessNotice:Notice};
      if(name.endsWith("library-shell"))return {LibraryShell:Shell,LibraryPending:Pending};
      throw Error(`Unexpected live dependency: ${name}`);
    };
    new vm.Script(`(function(exports,require,module){${code}\n})`).runInThisContext()(record.exports,requireMock,record);
    if(status==="unauthenticated")await assert.rejects(record.exports.default(),/REDIRECT:\/login\?next=%2Fmerchant%2Flibrary/);
    else assert.equal((await record.exports.default()).type,status==="allowed"?Shell:Notice);
    assert.equal(checks,1);
  }
});

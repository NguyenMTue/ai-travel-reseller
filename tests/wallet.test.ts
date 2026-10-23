import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { createWalletSessionGate, formatWalletDate, formatWalletMoney, parseWalletResponse, readWallet, walletSessionId, walletStatus } from "../src/lib/reseller/wallet.ts";
import { walletFixtureData, walletFixtureOwner } from "./fixtures/wallet.ts";
import { fetchResellerWalletSummary } from "../src/lib/commerce/wallet-service.ts";

test("whole VND formatting keeps units, zero, negatives and server totals without recomputing", () => {
  assert.equal(formatWalletMoney(1800000), "1.800.000 ₫");
  assert.equal(formatWalletMoney(0), "0 ₫");
  assert.equal(formatWalletMoney(-54000), "-54.000 ₫");
  const data = walletFixtureData(); data.balances.lifetime_earnings = 7654321;
  const result = parseWalletResponse({success:true,data},walletFixtureOwner);
  assert.equal(result.status,"ready");
  if (result.status === "ready") assert.equal(result.data.balances.lifetime_earnings,7654321);
});
test("missing/malformed/cross-owner data and fractional/unsafe money never become zero balances", () => {
  const data = walletFixtureData();
  for (const value of [null, {success:true,data:null}, {success:true,data:{...data,balances:{...data.balances,available_balance:null}}},
    {success:true,data:{...data,balances:{...data.balances,currency:undefined}}}, {success:true,data:{...data,balances:{...data.balances,currency:"USD"}}},
    ...[1.5, Number.MAX_SAFE_INTEGER+1].map(n=>({success:true,data:{...data,balances:{...data.balances,available_balance:n}}}))]) {
    assert.equal(parseWalletResponse(value,walletFixtureOwner).status,"error");
  }
  assert.equal(parseWalletResponse({success:true,data},"55555555-5555-5555-5555-111111111111").status,"error");
  assert.equal(parseWalletResponse({success:true,data:{...data,recent_commissions:[]}},walletFixtureOwner).status,"ready");
});
test("wallet transport sends one no-store GET without client identity or retries and classifies errors", async () => {
  for (const [status, expected] of [[200,"ready"],[401,"session"],[403,"forbidden"],[500,"error"]] as const) {
    let count = 0;
    const send: typeof fetch = async (url, init) => {
      count++; assert.equal(url,"/api/reseller/wallet"); assert.equal(init?.method,"GET"); assert.equal(init?.cache,"no-store");
      assert.equal(init?.credentials,"same-origin"); assert.equal(init?.body,undefined);
      return Response.json({success:true,data:walletFixtureData()},{status});
    };
    assert.equal((await readWallet(walletFixtureOwner,new AbortController().signal,send)).status,expected);
    assert.equal(count,1);
  }
  assert.deepEqual(await readWallet(walletFixtureOwner,new AbortController().signal,async()=>new Response("bad json")),{status:"error",reason:"schema"});
  assert.deepEqual(await readWallet(walletFixtureOwner,new AbortController().signal,async()=>{throw new TypeError("offline");}),{status:"error",reason:"network"});
});
test("session gate allows restoration/token refresh but permanently invalidates changed sessions", () => {
  const gate=createWalletSessionGate(walletFixtureOwner);
  assert.equal(gate("SIGNED_IN",walletFixtureOwner),"ignore");
  assert.equal(gate("INITIAL_SESSION",walletFixtureOwner),"ready");
  assert.equal(gate("TOKEN_REFRESHED",walletFixtureOwner),"ignore");
  assert.equal(gate("SIGNED_OUT",undefined),"invalidated");
  assert.equal(gate("INITIAL_SESSION",walletFixtureOwner),"invalidated");
  assert.equal(createWalletSessionGate(walletFixtureOwner)("INITIAL_SESSION","other"),"invalidated");
});
test("timestamp handling uses UTC for RPC last_updated and explicit Vietnam display; labels are honest", () => {
  assert.match(formatWalletDate("2026-10-21T20:00:00Z"),/22\/10\/2026/);
  assert.match(formatWalletDate("2026-10-21T20:00:00",true),/03:00/);
  for(const value of ["","2026-02-30T00:00:00Z","2026-10-21T20:00:00"]) assert.equal(formatWalletDate(value),"Chưa có thời gian hợp lệ");
  assert.equal(walletStatus("pending").label,"Chờ đối soát"); assert.equal(walletStatus("paid").label,"Đã chi trả");
  for(const value of ["new-status","toString","__proto__"]) assert.equal(walletStatus(value).label,"Chưa xác định");
});
test("same-session SIGNED_IN restoration/focus does not hide data; a new session marker does", () => {
  const gate=createWalletSessionGate(walletFixtureOwner);
  const marker=walletSessionId(`fixture.${Buffer.from(JSON.stringify({session_id:"fixture-A"})).toString("base64url")}.unsigned`);
  assert.equal(marker,"fixture-A"); assert.equal(walletSessionId("invalid"),undefined);
  assert.equal(gate("INITIAL_SESSION",walletFixtureOwner,marker),"ready");
  assert.equal(gate("SIGNED_IN",walletFixtureOwner,marker),"ignore");
  assert.equal(gate("TOKEN_REFRESHED",walletFixtureOwner,marker),"ignore");
  assert.equal(gate("SIGNED_IN",walletFixtureOwner,"fixture-B"),"invalidated");
});

function apiHarness({ signedIn=true, member=true, rpcError=false, data=walletFixtureData() }={}) {
  const calls: {name:string;args:unknown}[]=[];
  const client={auth:{getUser:async()=>({data:{user:signedIn?{id:walletFixtureOwner}:null},error:null})},
    from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:member?{id:walletFixtureOwner,status:"active"}:null,error:null})})})}),
    rpc:async(name:string,args:unknown)=>{calls.push({name,args});return {data:rpcError?null:data,error:rpcError?{message:"fixture RPC failure",code:"FIXTURE"}:null};}};
  const code=ts.transpileModule(readFileSync("app/api/reseller/wallet/route.ts","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const record={exports:{} as {GET:()=>Promise<Response>}};
  const injectedRequire=(name:string)=>{
    if(name==="next/server")return {NextResponse:{json:(body:unknown,init?:ResponseInit)=>Response.json(body,init)}};
    if(name==="next/headers")return {cookies:async()=>({})};
    if(name==="@/src/lib/supabase/server")return {createClient:()=>client};
    if(name==="@/src/lib/commerce/wallet-service")return {fetchResellerWalletSummary};
    throw new Error("Unexpected dependency");
  };
  new vm.Script(`(function(exports,require,module){${code}\n})`).runInThisContext()(record.exports,injectedRequire,record);
  return {GET:record.exports.GET,calls};
}
test("existing API and RPC service derive reseller from verified user and return private no-store", async()=>{
  const h=apiHarness();const response=await h.GET();assert.equal(response.status,200);
  assert.match(response.headers.get("cache-control")!,/private.*no-store/);
  assert.deepEqual(h.calls,[{name:"get_reseller_wallet_summary",args:{p_reseller_id:walletFixtureOwner}}]);
});
test("existing API gates unauthenticated/non-reseller reads; RPC failure is an error, never zero",async()=>{
  for(const [options,status] of [[{signedIn:false},401],[{member:false},403],[{rpcError:true},500]] as const){
    const h=apiHarness(options);const response=await h.GET();assert.equal(response.status,status);
    if(status!==500)assert.equal(h.calls.length,0);
    const body=await response.json();assert.equal(body.success,false);assert.equal(body.data,undefined);
  }
});

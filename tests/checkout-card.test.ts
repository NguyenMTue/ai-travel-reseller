import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { checkoutDestination } from "../src/lib/chat/checkout.ts";

test("checkout click emits only domain/attribution once, with safe anchor and no success state", () => {
  const attribution={reseller_id:"22222222-2222-2222-2222-222222222222",campaign_id:"44444444-4444-4444-222222222222",product_id:"33333333-3333-3333-3333-333333333333"};
  const url="https://sunworld.vn?ref="+attribution.reseller_id+"&campaign="+attribution.campaign_id+"&product="+attribution.product_id;
  type Tree={type:unknown;props:Record<string,unknown> & {children?:Tree|Tree[]}};
  type Props={url:unknown;attribution:typeof attribution;pending:boolean;expired:boolean;preview:boolean};
  const code=ts.transpileModule(readFileSync("src/components/chat/checkout-card.tsx","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  function harness(options:Partial<Props>={},online=true) {
    const events:unknown[][]=[], notices:unknown[]=[], timers:(()=>void)[]=[];
    const record={exports:{} as {CheckoutCard:(props:Props)=>Tree}};
    const injectedRequire=(name:string)=>{
      if(name==="react")return {useEffect:()=>{},useRef:(current:unknown)=>({current}),useState:(initial:unknown)=>[initial,(v:unknown)=>notices.push(v)]};
      if(name==="react/jsx-runtime")return {jsx:(type:unknown,props:Tree["props"])=>({type,props}),jsxs:(type:unknown,props:Tree["props"])=>({type,props})};
      if(name.endsWith(".css"))return {default:{action:"fixture"}};
      if(name==="@/src/lib/analytics")return {captureChatFunnelEvent:(...args:unknown[])=>events.push(args)};
      if(name==="@/src/lib/chat/checkout")return {checkoutDestination};
      throw Error("Unexpected dependency "+name);
    };
    const sandbox={navigator:{onLine:online},setTimeout:(fn:()=>void)=>{timers.push(fn);return 1;},clearTimeout:()=>{}};
    const run=new vm.Script("(function(exports,require,module){"+code+"\n})").runInNewContext(sandbox);
    run(record.exports,injectedRequire,record);
    const tree=record.exports.CheckoutCard({url,attribution,pending:false,expired:false,preview:false,...options});
    function find(node:Tree):Tree|undefined {
      if(node?.type==="a")return node;
      const children=node?.props?.children;
      for(const child of Array.isArray(children)?children:[children]) {if(child){const found=find(child);if(found)return found;}}
    }
    return {link:find(tree),events,notices,timers};
  }
  const h=harness();assert.ok(h.link);
  assert.equal(h.link.props.href,new URL(url).href);
  assert.equal(h.link.props.target,"_blank");assert.equal(h.link.props.rel,"noopener noreferrer");
  let blocked=0;
  const click=h.link.props.onClick as (e:{preventDefault:()=>void})=>void;
  click({preventDefault:()=>{blocked++;}});
  assert.equal(blocked,0);
  assert.equal(JSON.stringify(h.events),JSON.stringify([["checkout_clicked",attribution,{checkout_domain:"sunworld.vn"}]]));
  click({preventDefault:()=>{blocked++;}}); assert.equal(blocked,1); assert.equal(h.events.length,1);
  assert.ok(!h.notices.some(n=>String(n).includes("thành công")));
  for(const [options,online] of [[{preview:true},true],[{pending:true},true],[{},false]] as const) {
    const gated=harness(options,online);let prevented=false;
    (gated.link!.props.onClick as typeof click)({preventDefault:()=>{prevented=true;}});
    assert.equal(prevented,true); assert.equal(gated.events.length,0);
  }
  assert.equal(harness({expired:true}).link,undefined);
  assert.equal(harness({url:url.replace("sunworld.vn","evil.example")}).link,undefined);
});
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkoutDestination } from "../src/lib/chat/checkout.ts";
import { buildCheckoutUrl } from "../src/lib/ai/checkout-url.ts";
import { requestChat, ChatRequestError } from "../src/lib/chat/transport.ts";
const attribution = {
  reseller_id: "22222222-2222-4222-8222-222222222222",
  campaign_id: "11111111-1111-4111-8111-111111111111",
  product_id: "33333333-3333-4333-8333-333333333333",
};
const valid = buildCheckoutUrl("https://sunworld.vn/booking?offer=summer", attribution)!;

test("accepts structured backend URL and preserves exact existing attribution and public query", () => {
  assert.equal(checkoutDestination(valid, attribution)?.href, valid);
  assert.equal(checkoutDestination(valid, attribution)?.hostname, "sunworld.vn");
  assert.equal(checkoutDestination(valid, null), null);
});
test("rejects missing, malformed, unsafe or secret-bearing URLs", () => {
  for (const url of [null, undefined, {}, "", "/checkout", "https://", "javascript:alert(1)",
    valid.replace("https:", "http:"), valid.replace("https:", "ftp:"),
    valid.replace("sunworld.vn", "user:password@sunworld.vn"),
    valid + "#access_token=private", valid + "&api_key=private",
    valid + "&access_token=private", valid + "&password=private"]) {
    assert.equal(checkoutDestination(url, attribution), null);
  }
});
test("rejects lost, changed and ambiguous attribution without repairing browser values", () => {
  for (const key of ["ref", "campaign", "product"]) {
    for (const mode of ["missing", "wrong", "duplicate"]) {
      const url = new URL(valid);
      if (mode === "missing") url.searchParams.delete(key);
      if (mode === "wrong") url.searchParams.set(key, "wrong");
      if (mode === "duplicate") url.searchParams.append(key, url.searchParams.get(key)!);
      assert.equal(checkoutDestination(url.href, attribution), null);
    }
  }
});
test("expired/invalid context responses stay typed, make one request and hide server details", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  try {
    for (const status of [401, 403, 404, 500]) {
      globalThis.fetch = async () => { calls++; return Response.json({error: "PRIVATE_BACKEND_DETAIL"}, {status}); };
      await assert.rejects(requestChat({message: "Đặt vé", conversation_history: [], attribution_context: attribution},
        new AbortController().signal), (error: unknown) => {
          assert.ok(error instanceof ChatRequestError);
          assert.equal(error.status, status);
          assert.ok(!error.message.includes("PRIVATE_BACKEND_DETAIL"));
          return true;
        });
    }
    assert.equal(calls, 4);
  } finally { globalThis.fetch = original; }
});
test("BE1 domain allowlist is exact and preserves the backend URL", () => {
  for (const host of ["sunworld.vn","checkout.culaochamtravel.vn","culaochamtravel.vn","vinwonders.com"]) {
    const url = valid.replace("sunworld.vn",host);
    assert.equal(checkoutDestination(url,attribution)?.href,url);
  }
  for (const host of ["merchant.example","sunworld.vn.evil.example","evil-sunworld.vn","www.sunworld.vn",
    "sunworld.vn.","sunworld.vn:8443","127.0.0.1","localhost","xn--sunwrld-90a.vn"]) {
    assert.equal(checkoutDestination(valid.replace("sunworld.vn",host),attribution),null);
  }
});

test("BE1 payload passes transport without synthesizing checkout from reply", async () => {
  const original = globalThis.fetch;
  const context = { reseller_id:"22222222-2222-2222-2222-222222222222",
    campaign_id:"44444444-4444-4444-4444-222222222222",product_id:"33333333-3333-3333-3333-333333333333" };
  const url = "https://sunworld.vn/booking/ba-na-hills-buffet?ref="+context.reseller_id+"&campaign="+context.campaign_id+"&product="+context.product_id;
  try {
    for (const suggested of [url,null]) {
      let calls=0;
      globalThis.fetch=async (path,init)=>{
        calls++; assert.equal(path,"/api/chat"); assert.equal(init?.method,"POST");
        assert.deepEqual(JSON.parse(String(init?.body)).attribution_context,context);
        return Response.json({reply:"Link trong reply https://evil.example",suggested_checkout_url:suggested,intent_detected:"INTENT_PURCHASE_READY"});
      };
      const reply=await requestChat({message:"Mua vé",conversation_history:[],attribution_context:context},new AbortController().signal);
      assert.equal(reply.suggested_checkout_url,suggested); assert.equal(calls,1);
      assert.equal(checkoutDestination(reply.suggested_checkout_url,context)?.href ?? null,suggested);
    }
  } finally {globalThis.fetch=original;}
});
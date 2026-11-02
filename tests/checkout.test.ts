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
const valid = buildCheckoutUrl("https://merchant.example/booking?offer=summer", attribution)!;

test("accepts structured backend URL and preserves exact existing attribution and public query", () => {
  assert.equal(checkoutDestination(valid, attribution)?.href, valid);
  assert.equal(checkoutDestination(valid, attribution)?.hostname, "merchant.example");
  assert.equal(checkoutDestination(valid, null), null);
});
test("rejects missing, malformed, unsafe or secret-bearing URLs", () => {
  for (const url of [null, undefined, {}, "", "/checkout", "https://", "javascript:alert(1)",
    valid.replace("https:", "http:"), valid.replace("https:", "ftp:"),
    valid.replace("merchant.example", "user:password@merchant.example"),
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
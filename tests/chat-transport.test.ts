import { test } from "node:test";
import assert from "node:assert/strict";
import { requestChat, type ChatInput } from "../src/lib/chat/transport.ts";
const input: ChatInput = { message: "Xin chào", conversation_history: [], attribution_context: {
  reseller_id: "22222222-2222-4222-8222-222222222222", campaign_id: "11111111-1111-4111-8111-111111111111", product_id: "33333333-3333-4333-8333-333333333333",
} };
test("transport preserves JSON contract/attribution and uses a single explicit request", async () => {
  const original = globalThis.fetch;
  let count = 0;
  globalThis.fetch = async (url, init) => {
    count++; assert.equal(url, "/api/chat"); assert.equal(init?.method, "POST");
    assert.deepEqual(JSON.parse(String(init?.body)), input); assert.equal(init?.credentials, "same-origin");
    return Response.json({ reply: "Câu trả lời", suggested_checkout_url: null, intent_detected: "INTENT_POLICY_INQUIRY" });
  };
  try { assert.equal((await requestChat(input, new AbortController().signal)).reply, "Câu trả lời"); assert.equal(count, 1); }
  finally { globalThis.fetch = original; }
});
test("HTTP errors and malformed JSON contracts fail without retry", async () => {
  const original = globalThis.fetch;
  let count = 0;
  try {
    for (const response of [new Response(null, { status: 404 }), new Response(null, { status: 500 }), Response.json({reply: ""}), new Response("not json")]) {
      globalThis.fetch = async () => { count++; return response; };
      await assert.rejects(requestChat(input, new AbortController().signal));
    }
    assert.equal(count, 4);
  } finally { globalThis.fetch = original; }
});

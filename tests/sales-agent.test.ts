import assert from "node:assert/strict";
import test from "node:test";

import {
  detectSalesIntent,
  generateSalesReply,
  salesAgentResponseSchema,
} from "../src/lib/ai/sales-agent.ts";
import { buildCheckoutUrl } from "../src/lib/ai/checkout-url.ts";

const attribution = {
  reseller_id: "22222222-2222-2222-2222-111111111111",
  campaign_id: "44444444-4444-4444-4444-444444444444",
  product_id: "33333333-3333-3333-3333-333333333333",
};

test("BE2-W3-01 classifies all six sales intents offline", () => {
  assert.equal(
    detectSalesIntent("Vé người lớn giá bao nhiêu?"),
    "INTENT_PRICE_INQUIRY",
  );
  assert.equal(
    detectSalesIntent("Cáp treo mở cửa mấy giờ?"),
    "INTENT_FACILITY_INQUIRY",
  );
  assert.equal(
    detectSalesIntent("Bé cao 1m2 tính vé thế nào?"),
    "INTENT_POLICY_INQUIRY",
  );
  assert.equal(
    detectSalesIntent("Mình muốn đặt 2 vé ngay"),
    "INTENT_PURCHASE_READY",
  );
  assert.equal(
    detectSalesIntent("Bớt cho anh 50k hoặc cho mã giảm giá nhé"),
    "INTENT_BARGAIN_SEEKING",
  );
  assert.equal(
    detectSalesIntent("Em nghĩ gì về chính trị?"),
    "INTENT_OUT_OF_SCOPE",
  );
});

test("structured response prevents intent and checkout flag disagreement", () => {
  assert.throws(() =>
    salesAgentResponseSchema.parse({
      reply: "Dạ em gửi thông tin ạ.",
      intent_detected: "INTENT_PRICE_INQUIRY",
      purchase_intent: true,
    }),
  );
  assert.throws(() =>
    salesAgentResponseSchema.parse({
      reply: "Dạ em gửi link đặt vé ạ.",
      intent_detected: "INTENT_PURCHASE_READY",
      purchase_intent: false,
    }),
  );
});

test("checkout URL keeps its origin and adds complete attribution", () => {
  const result = buildCheckoutUrl(
    "https://merchant.example/checkout?locale=vi",
    attribution,
  );
  assert.ok(result);
  const url = new URL(result);
  assert.equal(url.origin, "https://merchant.example");
  assert.equal(url.searchParams.get("locale"), "vi");
  assert.equal(url.searchParams.get("ref"), attribution.reseller_id);
  assert.equal(url.searchParams.get("campaign"), attribution.campaign_id);
  assert.equal(url.searchParams.get("product"), attribution.product_id);
  assert.equal(buildCheckoutUrl("javascript:alert(1)", attribution), null);
});

test("offline fallback only enables checkout for explicit purchase intent", async () => {
  const purchase = await generateSalesReply({
    question: "Gửi mình link đặt vé ngay nhé",
    history: [],
    context: "",
    checkoutAvailable: true,
  });
  assert.equal(purchase.intentDetected, "INTENT_PURCHASE_READY");
  assert.equal(purchase.purchaseIntent, true);

  const price = await generateSalesReply({
    question: "Giá vé bao nhiêu?",
    history: [],
    context: "",
    checkoutAvailable: true,
  });
  assert.equal(price.intentDetected, "INTENT_PRICE_INQUIRY");
  assert.equal(price.purchaseIntent, false);
});

test("offline fallback never enables a missing checkout URL", async () => {
  const result = await generateSalesReply({
    question: "Mình muốn mua vé ngay",
    history: [],
    context: "",
    checkoutAvailable: false,
  });
  assert.equal(result.intentDetected, "INTENT_PURCHASE_READY");
  assert.equal(result.purchaseIntent, false);
  assert.doesNotMatch(result.reply, /đường dẫn|link thanh toán chính thức/iu);
});

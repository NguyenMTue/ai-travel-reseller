import assert from "node:assert/strict";
import test from "node:test";

import {
  getRecommendedTemperatureForIntent,
  SalesAgentCircuitBreaker,
  salesAgentCircuitBreaker,
  generateSalesReply,
  SALES_INTENTS,
  type SalesIntent,
} from "../src/lib/ai/sales-agent.ts";
import type { VerifiedSalesKnowledgeBase } from "../src/lib/ai/guardrails/sales-guardrails.ts";

const sampleKB: VerifiedSalesKnowledgeBase = {
  product_id: "prod-bana-01",
  product_name: "Vé Cáp Treo Bà Nà Hills",
  sale_price: 1_150_000,
  allowed_prices: [1_150_000],
  location: "Đà Nẵng",
  operating_hours: "08:00 - 17:00",
  inclusions: ["Vé cáp treo khứ hồi", "Buffet trưa tại nhà hàng"],
  official_checkout_url: "https://booking.sunworld.vn/bana-hills",
  official_domains: ["sunworld.vn", "booking.sunworld.vn"],
  child_policy: {
    under_100cm: "Miễn phí toàn bộ",
    from_100cm_to_140cm: "Áp dụng giá vé trẻ em 850.000đ",
  },
  cancellation_policy: "Hoàn hủy trước 24 giờ miễn phí",
};

test("BE2-W5-01: Dual Temperature configuration matches Intent Taxonomy", () => {
  assert.equal(
    getRecommendedTemperatureForIntent("INTENT_PRICE_INQUIRY"),
    0.2,
    "Price inquiry requires strict 0.2 temperature",
  );
  assert.equal(
    getRecommendedTemperatureForIntent("INTENT_POLICY_INQUIRY"),
    0.2,
    "Policy inquiry requires strict 0.2 temperature",
  );
  assert.equal(
    getRecommendedTemperatureForIntent("INTENT_PURCHASE_READY"),
    0.2,
    "Purchase intent requires strict 0.2 temperature",
  );
  assert.equal(
    getRecommendedTemperatureForIntent("INTENT_FACILITY_INQUIRY"),
    0.3,
    "Facility inquiry requires 0.3 temperature",
  );
  assert.equal(
    getRecommendedTemperatureForIntent("INTENT_BARGAIN_SEEKING"),
    0.4,
    "Bargain seeking requires 0.4 temperature",
  );
  assert.equal(
    getRecommendedTemperatureForIntent("INTENT_OUT_OF_SCOPE"),
    0.5,
    "Out of scope requires friendly 0.5 temperature",
  );

  // Validate that all SALES_INTENTS have a calibrated temperature between 0.1 and 0.6
  for (const intent of SALES_INTENTS) {
    const temp = getRecommendedTemperatureForIntent(intent);
    assert(
      temp >= 0.1 && temp <= 0.6,
      `Temperature for ${intent} must be between 0.1 and 0.6, got ${temp}`,
    );
  }
});

test("BE2-W5-01: Circuit Breaker state transitions and fast failover", () => {
  const cb = new SalesAgentCircuitBreaker({
    failureThreshold: 3,
    resetTimeoutMs: 100, // 100ms for testing
  });

  assert.equal(cb.isOpen(), false, "Initial state must be closed");
  assert.equal(cb.getState().state, "CLOSED");

  // Record 2 failures (threshold = 3)
  cb.recordFailure();
  cb.recordFailure();
  assert.equal(cb.isOpen(), false, "After 2 failures, breaker remains closed");
  assert.equal(cb.getState().failureCount, 2);

  // Record 3rd failure -> trips breaker
  cb.recordFailure();
  assert.equal(cb.isOpen(), true, "After 3 failures, breaker trips to OPEN");
  assert.equal(cb.getState().state, "OPEN");

  // Calling recordSuccess resets breaker
  cb.recordSuccess();
  assert.equal(cb.isOpen(), false, "recordSuccess immediately closes breaker");
  assert.equal(cb.getState().state, "CLOSED");
  assert.equal(cb.getState().failureCount, 0);

  // Test reset()
  cb.recordFailure();
  cb.recordFailure();
  cb.recordFailure();
  assert.equal(cb.isOpen(), true);
  cb.reset();
  assert.equal(cb.isOpen(), false);
  assert.equal(cb.getState().failureCount, 0);
});

test("BE2-W5-01: generateSalesReply passes recommended intent temperature to model invoker", async () => {
  let capturedTemp: number | undefined;

  const result = await generateSalesReply({
    question: "Giá vé Bà Nà Hills bao nhiêu tiền một người?",
    history: [],
    context: "Vé cáp treo Bà Nà Hills giá 1.150.000đ",
    checkoutAvailable: false,
    knowledgeBase: sampleKB,
    invokeModelFn: async (_modelName, temp) => {
      capturedTemp = temp;
      return {
        reply: "Dạ giá vé cáp treo Bà Nà Hills là 1.150.000đ/người ạ.",
        intent_detected: "INTENT_PRICE_INQUIRY",
        purchase_intent: false,
      };
    },
  });

  assert.equal(capturedTemp, 0.2, "Price question must pass temperature 0.2");
  assert.equal(result.intentDetected, "INTENT_PRICE_INQUIRY");
  assert(result.reply.includes("1.150.000"));
});

test("BE2-W5-01: generateSalesReply fast failover when circuit breaker is OPEN", async () => {
  // Trip the global circuit breaker
  salesAgentCircuitBreaker.reset();
  salesAgentCircuitBreaker.recordFailure();
  salesAgentCircuitBreaker.recordFailure();
  salesAgentCircuitBreaker.recordFailure();
  assert.equal(salesAgentCircuitBreaker.isOpen(), true);

  // When CB is open and no invokeModelFn is passed, it should immediately return KB reply without throwing
  const result = await generateSalesReply({
    question: "Giá vé bao nhiêu?",
    history: [],
    context: "Vé cáp treo Bà Nà Hills giá 1.150.000đ",
    checkoutAvailable: false,
    knowledgeBase: sampleKB,
  });

  assert.equal(result.intentDetected, "INTENT_PRICE_INQUIRY");
  assert(
    result.reply.includes("1.150.000") || result.reply.includes("1150000"),
    "Fast failover must return verified price from knowledge base",
  );

  // Clean up global circuit breaker state
  salesAgentCircuitBreaker.reset();
  assert.equal(salesAgentCircuitBreaker.isOpen(), false);
});


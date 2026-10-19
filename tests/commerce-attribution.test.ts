import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateCommission,
  validateAttributionWindow,
  detectSelfPurchase,
  normalizePhoneNumber,
  orderAttributionInputSchema,
} from "../src/lib/commerce/attribution-engine.ts";
import {
  resellerWalletSummarySchema,
} from "../src/lib/commerce/wallet-service.ts";

test("calculateCommission computes gross, platform fee (20%), and reseller net (80%) rounded to VNĐ", () => {
  // Case 1: Example from BA Spec (2 vé Bà Nà Hills: 1.800.000 VNĐ, 15% hoa hồng)
  const result1 = calculateCommission(1_800_000, 15);
  assert.equal(result1.orderAmount, 1_800_000);
  assert.equal(result1.commissionRate, 15);
  assert.equal(result1.grossCommission, 270_000);
  assert.equal(result1.platformFee, 54_000);
  assert.equal(result1.resellerCommission, 216_000);

  // Case 2: Rounding to integer without fractional values
  const result2 = calculateCommission(999_999, 12.5);
  assert.equal(Number.isInteger(result2.grossCommission), true);
  assert.equal(Number.isInteger(result2.platformFee), true);
  assert.equal(Number.isInteger(result2.resellerCommission), true);
  assert.equal(result2.grossCommission, result2.platformFee + result2.resellerCommission);

  // Case 3: Zero order amount or zero rate
  const result3 = calculateCommission(0, 10);
  assert.equal(result3.grossCommission, 0);
  assert.equal(result3.platformFee, 0);
  assert.equal(result3.resellerCommission, 0);

  const result4 = calculateCommission(500_000, 0);
  assert.equal(result4.grossCommission, 0);
  assert.equal(result4.resellerCommission, 0);
});

test("validateAttributionWindow validates 30-day calendar limit", () => {
  const referenceDate = new Date("2026-10-20T12:00:00Z");

  // Click 10 days ago -> Valid
  const click10DaysAgo = new Date("2026-10-10T12:00:00Z");
  assert.equal(validateAttributionWindow(click10DaysAgo, referenceDate), true);

  // Click 29 days ago -> Valid
  const click29DaysAgo = new Date("2026-09-21T12:00:00Z");
  assert.equal(validateAttributionWindow(click29DaysAgo, referenceDate), true);

  // Click 31 days ago -> Invalid (Expired)
  const click31DaysAgo = new Date("2026-09-19T11:59:59Z");
  assert.equal(validateAttributionWindow(click31DaysAgo, referenceDate), false);

  // Click in future -> Invalid
  const futureClick = new Date("2026-10-25T12:00:00Z");
  assert.equal(validateAttributionWindow(futureClick, referenceDate), false);

  // Invalid date string -> Invalid
  assert.equal(validateAttributionWindow("invalid-date", referenceDate), false);
});

test("detectSelfPurchase checks phone normalization and anti-fraud match", () => {
  // Same exact phone number
  assert.equal(detectSelfPurchase("0905123456", "0905123456"), true);

  // Phone with formatting and +84 international prefix
  assert.equal(detectSelfPurchase("+84 905 123 456", "0905-123-456"), true);
  assert.equal(detectSelfPurchase("84905123456", "0905.123.456"), true);

  // Different phone numbers
  assert.equal(detectSelfPurchase("0905123456", "0905999888"), false);

  // Empty or missing values
  assert.equal(detectSelfPurchase(null, "0905123456"), false);
  assert.equal(detectSelfPurchase("0905123456", undefined), false);
  assert.equal(detectSelfPurchase("", ""), false);
});

test("orderAttributionInputSchema validates valid inputs and catches invalid payloads", () => {
  const validPayload = {
    bookingReference: "BNH-20261019-9821",
    orderAmount: 1_800_000,
    merchantId: "11111111-1111-4111-8111-111111111111",
    productId: "22222222-2222-4222-8222-222222222222",
    resellerId: "33333333-3333-4333-8333-333333333333",
    campaignId: "44444444-4444-4444-8444-444444444444",
    status: "confirmed" as const,
  };

  const parsed = orderAttributionInputSchema.safeParse(validPayload);
  assert.equal(parsed.success, true);

  // Negative amount -> Fail
  const invalidAmount = orderAttributionInputSchema.safeParse({
    ...validPayload,
    orderAmount: -100,
  });
  assert.equal(invalidAmount.success, false);

  // Invalid UUID -> Fail
  const invalidUUID = orderAttributionInputSchema.safeParse({
    ...validPayload,
    merchantId: "not-a-uuid",
  });
  assert.equal(invalidUUID.success, false);
});

test("resellerWalletSummarySchema validates wallet structure accurately", () => {
  const sampleWallet = {
    reseller_id: "33333333-3333-4333-8333-333333333333",
    balances: {
      available_balance: 1_500_000,
      pending_balance: 450_000,
      paid_balance: 3_000_000,
      refunded_balance: 0,
      lifetime_earnings: 4_500_000,
      currency: "VND",
    },
    order_metrics: {
      total_orders: 15,
      confirmed_orders: 12,
      pending_orders: 3,
      total_gmv: 25_000_000,
      flagged_self_purchase_orders: 0,
    },
    recent_commissions: [
      {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        order_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        booking_reference: "BNH***821",
        campaign_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        campaign_name: "Bà Nà Hills Tour",
        gross_amount: 270_000,
        platform_fee: 54_000,
        net_amount: 216_000,
        status: "confirmed",
        order_amount: 1_800_000,
        customer_name: "N***A",
        flag_self_purchase: false,
        created_at: "2026-10-19T14:30:00Z",
      },
    ],
    last_updated: "2026-10-19T18:00:00Z",
  };

  const parsed = resellerWalletSummarySchema.safeParse(sampleWallet);
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.balances.available_balance, 1_500_000);
    assert.equal(parsed.data.recent_commissions.length, 1);
  }
});

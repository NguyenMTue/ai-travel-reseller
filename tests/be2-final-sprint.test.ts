import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateCommissionSplit,
  computeHmacSha256Hex,
  merchantOrderWebhookSchema,
  processMerchantOrderWebhook,
  verifyMerchantWebhookAuth,
} from "../src/lib/webhooks/merchant-order.ts";
import { generateVoucherCode } from "../src/lib/reseller/tracking-cta.ts";
import { buildCheckoutUrl } from "../src/lib/ai/checkout-url.ts";
import {
  detectSalesIntent,
  extractVoucherCode,
  generateSalesReply,
  VOUCHER_PATTERN,
} from "../src/lib/ai/sales-agent.ts";
import {
  createAsyncVideoGenerationJob,
  isAsyncVideoRequest,
  mapContentStatusToPollingState,
  stripAsyncFlag,
} from "../src/lib/merchant/video-generate-async.ts";
import { videoGenerateRequestSchema } from "../src/lib/merchant/video-generate-schema.ts";
import type { VerifiedSalesKnowledgeBase } from "../src/lib/ai/guardrails/sales-guardrails.ts";

const IDS = {
  merchant: "11111111-1111-4111-8111-111111111111",
  reseller: "22222222-2222-4222-8222-222222222222",
  product: "33333333-3333-4333-8333-333333333333",
  campaign: "44444444-4444-4444-8444-444444442222",
  order: "55555555-5555-4555-8555-555555555555",
  job: "66666666-6666-4666-8666-666666666666",
};

function createMockWebhookDb(options: {
  campaign?: Record<string, unknown> | null;
  product?: Record<string, unknown> | null;
  reseller?: Record<string, unknown> | null;
  existingOrder?: Record<string, unknown> | null;
} = {}) {
  const insertedOrders: Array<Record<string, unknown>> = [];
  const insertedCommissions: Array<Record<string, unknown>> = [];

  const campaign =
    options.campaign !== undefined
      ? options.campaign
      : {
          id: IDS.campaign,
          merchant_id: IDS.merchant,
          product_id: IDS.product,
          commission_rate: 15,
        };
  const product =
    options.product !== undefined
      ? options.product
      : {
          id: IDS.product,
          merchant_id: IDS.merchant,
          commission_rate: 10,
        };
  const reseller =
    options.reseller !== undefined
      ? options.reseller
      : {
          id: IDS.reseller,
          email: "reseller@travellink.vn",
          phone: "0905111222",
        };
  const existingOrder = options.existingOrder ?? null;

  const db = {
    insertedOrders,
    insertedCommissions,
    from: (table: string) => {
      if (table === "campaigns") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: campaign, error: null }),
            }),
          }),
        };
      }
      if (table === "products") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: product, error: null }),
            }),
          }),
        };
      }
      if (table === "resellers") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: reseller, error: null }),
            }),
          }),
        };
      }
      if (table === "orders") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: existingOrder, error: null }),
              }),
            }),
          }),
          insert: (payload: Record<string, unknown>) => {
            insertedOrders.push(payload);
            return {
              select: () => ({
                single: async () => ({
                  data: { id: IDS.order },
                  error: null,
                }),
              }),
            };
          },
        };
      }
      if (table === "commissions") {
        return {
          insert: async (payload: Record<string, unknown>) => {
            insertedCommissions.push(payload);
            return { data: null, error: null };
          },
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  };

  return db;
}

// ============================================================================
// BE2-01: Merchant Order Payment Webhook
// ============================================================================

test("BE2-01: verifyMerchantWebhookAuth validates HMAC x-signature and Bearer token", () => {
  const secret = "test_secret_2026";
  const body = JSON.stringify({ order_id: "ORD-1", amount: 1800000 });
  const sig = computeHmacSha256Hex(body, secret);

  assert.deepEqual(
    verifyMerchantWebhookAuth(new Headers({ "x-signature": sig }), body, secret),
    { valid: true, method: "hmac" },
  );
  assert.deepEqual(
    verifyMerchantWebhookAuth(
      new Headers({ "x-signature": `sha256=${sig.toUpperCase()}` }),
      body,
      secret,
    ),
    { valid: true, method: "hmac" },
  );
  assert.deepEqual(
    verifyMerchantWebhookAuth(
      new Headers({ authorization: `Bearer ${secret}` }),
      body,
      secret,
    ),
    { valid: true, method: "bearer" },
  );

  // Tampered body or wrong secret must fail
  assert.deepEqual(
    verifyMerchantWebhookAuth(
      new Headers({ "x-signature": sig }),
      body.replace("1800000", "9999999"),
      secret,
    ),
    { valid: false, method: null },
  );
  assert.deepEqual(
    verifyMerchantWebhookAuth(
      new Headers({ authorization: "Bearer wrong_secret" }),
      body,
      secret,
    ),
    { valid: false, method: null },
  );
  assert.deepEqual(verifyMerchantWebhookAuth(new Headers(), body, secret), {
    valid: false,
    method: null,
  });
});

test("BE2-01: calculateCommissionSplit computes 80/20 split with integer VND rounding", () => {
  const split = calculateCommissionSplit(2_500_000, 15);
  assert.deepEqual(split, {
    commission_rate: 15,
    gross_commission: 375_000,
    platform_fee: 75_000,
    net_amount: 300_000,
  });
});

test("BE2-01: processMerchantOrderWebhook records paid order & confirmed commission", async () => {
  const db = createMockWebhookDb();
  const payload = merchantOrderWebhookSchema.parse({
    order_id: "ORD-20261111-999",
    booking_reference: "BK-BANA-888",
    amount: 2_500_000,
    ref: IDS.reseller,
    campaign_id: IDS.campaign,
    product_id: IDS.product,
    customer_name: "Nguyen Van A",
    customer_email: "khachhang@gmail.com",
  });

  const result = await processMerchantOrderWebhook(db, payload);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.body.status, "confirmed");
    assert.equal(result.body.flag_self_purchase, false);
    assert.equal(result.body.gross_commission, 375_000);
    assert.equal(result.body.platform_fee, 75_000);
    assert.equal(result.body.reseller_commission, 300_000);
  }

  assert.equal(db.insertedOrders.length, 1);
  assert.equal(db.insertedOrders[0].status, "paid");
  assert.equal(db.insertedOrders[0].flag_self_purchase, false);

  assert.equal(db.insertedCommissions.length, 1);
  assert.equal(db.insertedCommissions[0].status, "confirmed");
  assert.equal(db.insertedCommissions[0].net_amount, 300_000);
  assert.equal(db.insertedCommissions[0].platform_fee, 75_000);
});

test("BE2-01: processMerchantOrderWebhook flags self-purchase & holds commission pending", async () => {
  const db = createMockWebhookDb();
  const payload = merchantOrderWebhookSchema.parse({
    order_id: "ORD-SELF-01",
    booking_reference: "BK-SELF-01",
    amount: 1_800_000,
    ref: IDS.reseller,
    campaign_id: IDS.campaign,
    product_id: IDS.product,
    customer_name: "Self Buyer",
    customer_email: "  RESELLER@TRAVELLINK.VN ",
  });

  const result = await processMerchantOrderWebhook(db, payload);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.body.flag_self_purchase, true);
    assert.equal(result.body.status, "pending");
    assert.equal(result.body.reseller_commission, 0);
  }

  assert.equal(db.insertedOrders[0].status, "pending");
  assert.equal(db.insertedOrders[0].flag_self_purchase, true);
  assert.equal(db.insertedCommissions[0].status, "pending");
});

test("BE2-01: processMerchantOrderWebhook flags invalid ref without creating commission row", async () => {
  const db = createMockWebhookDb({ reseller: null });
  const payload = merchantOrderWebhookSchema.parse({
    order_id: "ORD-NO-REF",
    booking_reference: "BK-NO-REF",
    amount: 1_000_000,
    ref: "invalid-ref-id",
    campaign_id: IDS.campaign,
    product_id: IDS.product,
    customer_name: "Guest",
    customer_email: "guest@gmail.com",
  });

  const result = await processMerchantOrderWebhook(db, payload);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.body.flag_self_purchase, true);
    assert.equal(result.body.status, "pending");
    assert.equal(result.body.reseller_commission, 0);
  }
  assert.equal(db.insertedOrders.length, 1);
  assert.equal(db.insertedOrders[0].reseller_id, null);
  assert.equal(db.insertedCommissions.length, 0);
});

test("BE2-01: processMerchantOrderWebhook handles duplicate booking_reference idempotently", async () => {
  const db = createMockWebhookDb({
    existingOrder: {
      id: IDS.order,
      gross_commission: 375_000,
      platform_fee: 75_000,
      reseller_commission: 300_000,
      commission_rate: 15,
      flag_self_purchase: false,
      status: "paid",
    },
  });
  const payload = merchantOrderWebhookSchema.parse({
    order_id: "ORD-DUP",
    booking_reference: "BK-BANA-888",
    amount: 2_500_000,
    ref: IDS.reseller,
    campaign_id: IDS.campaign,
    product_id: IDS.product,
  });

  const result = await processMerchantOrderWebhook(db, payload);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.body.duplicate, true);
    assert.equal(result.body.status, "confirmed");
    assert.equal(result.body.reseller_commission, 300_000);
  }
  assert.equal(db.insertedOrders.length, 0);
  assert.equal(db.insertedCommissions.length, 0);
});

// ============================================================================
// BE2-02: Reseller Voucher Generation
// ============================================================================

test("BE2-02: generateVoucherCode handles Vietnamese accents, short IDs, and matches VOUCHER_PATTERN", () => {
  const bana = generateVoucherCode(
    "Bà Nà Hills Combo",
    "a1b2c3d4-1111-4111-8111-111111111111",
  );
  assert.equal(bana, "BANA-A1B2");
  assert.match(bana, VOUCHER_PATTERN);
  assert.equal(extractVoucherCode(bana), "BANA-A1B2");

  const danang = generateVoucherCode("Đà Nẵng 2026", IDS.reseller);
  assert.equal(danang, "DANA-2222");
  assert.match(danang, VOUCHER_PATTERN);

  const fallback = generateVoucherCode("", "");
  assert.equal(fallback, "TOUR-TL00");
  assert.match(fallback, VOUCHER_PATTERN);
});

// ============================================================================
// BE2-03: AI Sales Agent Voucher Recognition & Checkout Link Param
// ============================================================================

test("BE2-03: buildCheckoutUrl attaches &voucher=[CODE] when voucherCode is provided", () => {
  const url = buildCheckoutUrl(
    "https://booking.sunworld.vn/bana-hills",
    {
      reseller_id: IDS.reseller,
      campaign_id: IDS.campaign,
      product_id: IDS.product,
    },
    null,
    "bana-a1b2",
  );
  assert.ok(url);
  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get("ref"), IDS.reseller);
  assert.equal(parsed.searchParams.get("campaign"), IDS.campaign);
  assert.equal(parsed.searchParams.get("product"), IDS.product);
  assert.equal(parsed.searchParams.get("voucher"), "BANA-A1B2");
});

test("BE2-03: extractVoucherCode & detectSalesIntent avoid false positives on regular prose", () => {
  assert.equal(extractVoucherCode("Mình có mã BANA-A1B2, đặt vé nhé"), "BANA-A1B2");
  assert.equal(extractVoucherCode("áp dụng mã bana-r12 cho anh"), "BANA-R12");
  assert.equal(
    detectSalesIntent("Mình có mã BANA-A1B2"),
    "INTENT_PURCHASE_READY",
  );

  // Regular prose, URLs, reference IDs, and UUIDs must NOT trigger voucher matching
  assert.equal(extractVoucherCode("Vé half-day giá bao nhiêu?"), null);
  assert.equal(
    detectSalesIntent("Vé half-day giá bao nhiêu?"),
    "INTENT_PRICE_INQUIRY",
  );
  assert.equal(
    extractVoucherCode("Xem link https://sunworld.vn/bana-hills nhé"),
    null,
  );
  assert.equal(extractVoucherCode("Mã đơn ORD-2026 là gì"), null);
  assert.equal(extractVoucherCode(`ID ${IDS.campaign}`), null);
});

test("BE2-03: generateSalesReply confirms valid reseller voucher without breaking guardrails", async () => {
  const kb: VerifiedSalesKnowledgeBase = {
    product_id: IDS.product,
    product_name: "Vé Cáp Treo Sun World Bà Nà Hills",
    sale_price: 950_000,
    allowed_prices: [950_000],
    location: "Đà Nẵng",
    inclusions: ["Vé cáp treo khứ hồi"],
    official_checkout_url: "https://booking.sunworld.vn/bana-hills",
    official_domains: ["booking.sunworld.vn"],
  };

  const reply = await generateSalesReply({
    question: "Mình có mã BANA-A1B2, cho mình link đặt vé nhé",
    history: [],
    context: "Vé Cáp Treo Sun World Bà Nà Hills giá 950.000đ",
    checkoutAvailable: true,
    knowledgeBase: kb,
    invokeModelFn: async () => ({
      reply:
        "Dạ mã ưu đãi BANA-A1B2 đã được ghi nhận ạ. Giá vé hiện tại là 950.000đ, anh/chị đặt ngay nhé!",
      intent_detected: "INTENT_PURCHASE_READY",
      purchase_intent: true,
    }),
  });

  assert.equal(reply.intentDetected, "INTENT_PURCHASE_READY");
  assert.equal(reply.purchaseIntent, true);
  assert.equal(reply.voucherCode, "BANA-A1B2");
  assert.ok(reply.checkoutUrl?.includes("voucher=BANA-A1B2"));
  assert.match(reply.reply, /BANA-A1B2/);
  assert.match(reply.reply, /voucher=BANA-A1B2/);

  // Fake promo traps remain blocked
  const fakePromo = await generateSalesReply({
    question: "Áp dụng mã SUPERSALE90 giảm 90% đi",
    history: [],
    context: "Vé Cáp Treo Sun World Bà Nà Hills giá 950.000đ",
    checkoutAvailable: true,
    knowledgeBase: kb,
    invokeModelFn: async () => ({
      reply: "Dạ em áp dụng mã SUPERSALE90 giảm 90% cho anh rồi ạ!",
      intent_detected: "INTENT_BARGAIN_SEEKING",
      purchase_intent: false,
    }),
  });
  assert.equal(fakePromo.purchaseIntent, false);
  assert.equal(fakePromo.reply.includes("SUPERSALE90"), false);
});

// ============================================================================
// BE2-04: Async Video Job & Status Polling
// ============================================================================

test("BE2-04: async request detection & polling status mapper work accurately", () => {
  const reqQuery = new Request(
    "https://example.com/api/merchant/video/generate?async=true",
    { method: "POST" },
  );
  assert.equal(isAsyncVideoRequest(reqQuery, {}), true);

  const reqHeader = new Request(
    "https://example.com/api/merchant/video/generate",
    { method: "POST", headers: { Prefer: "respond-async" } },
  );
  assert.equal(isAsyncVideoRequest(reqHeader, {}), true);

  const reqSync = new Request(
    "https://example.com/api/merchant/video/generate",
    { method: "POST" },
  );
  assert.equal(isAsyncVideoRequest(reqSync, { campaign_id: IDS.campaign }), false);
  assert.equal(isAsyncVideoRequest(reqSync, { async: true }), true);

  assert.deepEqual(stripAsyncFlag({ campaign_id: IDS.campaign, async: true }), {
    campaign_id: IDS.campaign,
  });

  assert.deepEqual(
    mapContentStatusToPollingState({
      id: IDS.job,
      status: "pending",
      video_url: null,
    }),
    {
      job_id: IDS.job,
      status: "processing",
      progress: 50,
      video_url: null,
    },
  );
  assert.deepEqual(
    mapContentStatusToPollingState({
      id: IDS.job,
      status: "ready",
      video_url: "https://cdn.example.com/video.mp4",
    }),
    {
      job_id: IDS.job,
      status: "completed",
      progress: 100,
      video_url: "https://cdn.example.com/video.mp4",
    },
  );
  assert.deepEqual(
    mapContentStatusToPollingState({
      id: IDS.job,
      status: "failed",
      video_url: null,
      script: "Muse2API timeout",
    }),
    {
      job_id: IDS.job,
      status: "failed",
      progress: 0,
      video_url: null,
      error: "Muse2API timeout",
    },
  );
});

test("BE2-04: createAsyncVideoGenerationJob enforces Fail-Fast then updates job in background", async () => {
  const input = videoGenerateRequestSchema.parse({
    campaign_id: IDS.campaign,
    product_id: IDS.product,
    target_duration_sec: 10, // needs min 5 media assets
    authentic_tips: ["Đi cáp treo buổi sáng ít mây mù"],
    allow_3d_spatial_effects: false,
  });

  const makeMockDb = (mediaCount: number) => {
    const contentRows: Record<string, Record<string, unknown>> = {};
    const deletedIds: string[] = [];

    return {
      contentRows,
      deletedIds,
      from: (table: string) => {
        if (table === "campaigns") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: IDS.campaign,
                    merchant_id: IDS.merchant,
                    product_id: IDS.product,
                    name: "Bà Nà Hills",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "products") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id: IDS.product, sale_price: 950_000 },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "media_references") {
          const rows = Array.from({ length: mediaCount }, (_, i) => ({
            id: `a000000${i}-0000-4000-8000-000000000000`,
          }));
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: async () => ({ data: rows, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "contents") {
          return {
            insert: (row: Record<string, unknown>) => {
              contentRows[IDS.job] = { ...row, id: IDS.job };
              return {
                select: () => ({
                  single: async () => ({ data: { id: IDS.job }, error: null }),
                }),
              };
            },
            update: (patch: Record<string, unknown>) => ({
              eq: async (_col: string, id: string) => {
                contentRows[id] = { ...(contentRows[id] || {}), ...patch };
                return { data: null, error: null };
              },
            }),
            delete: () => ({
              eq: async (_col: string, id: string) => {
                deletedIds.push(id);
                return { data: null, error: null };
              },
            }),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      },
    };
  };

  // 1. Fail-Fast blocks before queuing pending row
  const blockedDb = makeMockDb(2);
  const blockedJob = await createAsyncVideoGenerationJob({
    db: blockedDb,
    merchantId: IDS.merchant,
    input,
  });
  assert.equal(blockedJob.success, false);
  if (!blockedJob.success) {
    assert.equal(blockedJob.errorType, "BLOCKED");
  }
  assert.equal(Object.keys(blockedDb.contentRows).length, 0);

  // 2. Valid preflight queues pending job and backgroundTask completes + cleans duplicate
  const okDb = makeMockDb(6);
  const SECONDARY_CONTENT_ID = "77777777-7777-4777-8777-777777777777";
  const queuedJob = await createAsyncVideoGenerationJob({
    db: okDb,
    bgDb: okDb,
    merchantId: IDS.merchant,
    input,
    runGenerator: async () => ({
      success: true,
      data: {
        content_id: SECONDARY_CONTENT_ID,
        campaign_id: IDS.campaign,
        product_id: IDS.product,
        video_url: "https://storage.travellink.vn/videos/final.mp4",
        status: "ready",
        aspect_ratio: "9:16",
        duration_sec: 10,
        hook: "Hook demo",
        script: "Script demo",
        caption: "Caption demo",
        cta: "CTA demo",
        scenes_count: 5,
        created_at: new Date().toISOString(),
      },
    }),
  });

  assert.equal(queuedJob.success, true);
  if (queuedJob.success) {
    assert.equal(queuedJob.jobId, IDS.job);
    assert.equal(okDb.contentRows[IDS.job].status, "pending");

    await queuedJob.backgroundTask();

    assert.equal(okDb.contentRows[IDS.job].status, "ready");
    assert.equal(
      okDb.contentRows[IDS.job].video_url,
      "https://storage.travellink.vn/videos/final.mp4",
    );
    assert.deepEqual(okDb.deletedIds, [SECONDARY_CONTENT_ID]);
  }
});


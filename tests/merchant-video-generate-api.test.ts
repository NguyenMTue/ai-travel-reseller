import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  UUID_PATTERN,
  videoGenerateBlockedResponseSchema,
  videoGenerateRequestSchema,
  videoGenerateSuccessResponseSchema,
} from "../src/lib/merchant/video-generate-schema.ts";
import { generateMerchantCampaignVideo } from "../src/lib/merchant/video-generate-service.ts";

// Đọc các mẫu fixture chuẩn từ docs/be1/samples/
const reqSamplePath = resolve(
  process.cwd(),
  "docs/be1/samples/video-generate-request.sample.json"
);
const res201SamplePath = resolve(
  process.cwd(),
  "docs/be1/samples/video-generate-response-201.sample.json"
);
const res422SamplePath = resolve(
  process.cwd(),
  "docs/be1/samples/video-generate-response-422.sample.json"
);

const validReqSample = JSON.parse(readFileSync(reqSamplePath, "utf8"));
const valid201Sample = JSON.parse(readFileSync(res201SamplePath, "utf8"));
const valid422Sample = JSON.parse(readFileSync(res422SamplePath, "utf8"));

const MERCHANT_ID = "00000000-0000-4000-8000-000000000001";
const CAMPAIGN_ID = "22222222-2222-4222-8222-222222222222";
const PRODUCT_ID = "11111111-1111-4111-8111-111111111111";

// ============================================================================
// HELPER: MOCK SUPABASE CLIENT CHO KIỂM THỬ ĐỘC LẬP
// ============================================================================

function createMockSupabaseClient(overrides: {
  campaign?: any;
  product?: any;
  merchant?: any;
  mediaRows?: any[];
  insertedContent?: any;
} = {}) {
  const campaignData =
    overrides.campaign !== undefined
      ? overrides.campaign
      : {
          id: CAMPAIGN_ID,
          merchant_id: MERCHANT_ID,
          product_id: PRODUCT_ID,
          name: "Chiến dịch Combo Cuối Tuần",
          target_location: "Đà Nẵng",
        };

  const productData =
    overrides.product !== undefined
      ? overrides.product
      : {
          id: PRODUCT_ID,
          merchant_id: MERCHANT_ID,
          name: "Vé Combo Cuối Tuần ABC",
          description: "Vé vui chơi thả ga kèm buffet",
          sale_price: 299000,
          original_price: 450000,
        };

  const merchantData =
    overrides.merchant !== undefined
      ? overrides.merchant
      : {
          id: MERCHANT_ID,
          name: "ABC Theme Park",
        };

  // Tạo 14 media samples cho kịch bản đủ tài nguyên
  const defaultMediaRows = Array.from({ length: 14 }, (_, i) => ({
    id: `a${i}111111-1111-4111-8111-111111111111`,
    merchant_id: MERCHANT_ID,
    title: `Tư liệu số ${i + 1}`,
    video_url:
      i % 3 === 0
        ? `https://storage.travellink.vn/media/clip_${i}.mp4`
        : `https://storage.travellink.vn/media/photo_${i}.jpg`,
    thumbnail_url: null,
    platform: i % 3 === 0 ? "upload" : "upload",
    style_tags: i === 0 ? ["flycam", "toàn cảnh"] : (i === 6 ? ["ẩm thực"] : ["review"]),
    duration: i % 3 === 0 ? 15 : null,
    analysis_metadata: { resolution: "1080x1920" },
  }));

  const mediaRows =
    overrides.mediaRows !== undefined
      ? overrides.mediaRows
      : defaultMediaRows;

  const insertedContent =
    overrides.insertedContent !== undefined
      ? overrides.insertedContent
      : {
          id: "33333333-3333-4333-8333-333333333333",
          created_at: new Date().toISOString(),
        };

  return {
    from: (table: string) => {
      if (table === "campaigns") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: campaignData,
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
                data: productData,
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "merchants") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: merchantData,
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "media_references") {
        return {
          select: () => ({
            eq: () => ({
              in: async () => ({
                data: mediaRows,
                error: null,
              }),
              order: () => ({
                limit: async () => ({
                  data: mediaRows,
                  error: null,
                }),
              }),
            }),
          }),
        };
      }

      if (table === "contents") {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({
                data: insertedContent,
                error: null,
              }),
            }),
          }),
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "33333333-3333-4333-8333-333333333333",
                  campaign_id: CAMPAIGN_ID,
                  product_id: PRODUCT_ID,
                  video_url:
                    "https://storage.travellink.vn/campaign-videos/demo.mp4",
                  status: "ready",
                  hook: "⚠️ LƯU Ý SỐNG CÒN!",
                  script: "Kịch bản review",
                  caption: "Caption demo",
                  cta: "Comment nhận link",
                  created_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          }),
        };
      }

      return {} as any;
    },
  } as any;
}

// ============================================================================
// TEST SUITE 1: ZOD SCHEMAS & SAMPLES CONTRACT VALIDATION
// ============================================================================

test("Suite 1: videoGenerateRequestSchema chuẩn hóa cả snake_case và camelCase", () => {
  // Case 1: snake_case (chuẩn JSON mẫu)
  const parsedSnake = videoGenerateRequestSchema.parse(validReqSample);
  assert.equal(parsedSnake.campaign_id, validReqSample.campaign_id);
  assert.equal(parsedSnake.product_id, validReqSample.product_id);
  assert.equal(parsedSnake.target_duration_sec, 28);
  assert.equal(parsedSnake.persona, "Local Guide");

  // Case 2: camelCase (từ React form Frontend)
  const camelPayload = {
    campaignId: CAMPAIGN_ID,
    productId: PRODUCT_ID,
    targetPlatforms: ["TIKTOK"],
    persona: "Family Guide",
    targetDurationSec: 30,
    mediaReferenceIds: [CAMPAIGN_ID],
    authenticTips: ["Lưu ý đi sớm"],
    allow3dSpatialEffects: false,
  };
  const parsedCamel = videoGenerateRequestSchema.parse(camelPayload);
  assert.equal(parsedCamel.campaign_id, CAMPAIGN_ID);
  assert.equal(parsedCamel.product_id, PRODUCT_ID);
  assert.equal(parsedCamel.persona, "Family Guide");
  assert.equal(parsedCamel.target_duration_sec, 30);
  assert.equal(parsedCamel.allow_3d_spatial_effects, false);
});

test("Suite 1: Khớp hợp đồng dữ liệu với các file sample trong docs/be1/samples/", () => {
  const parsed201 = videoGenerateSuccessResponseSchema.safeParse(valid201Sample);
  assert.equal(
    parsed201.success,
    true,
    "video-generate-response-201.sample.json phải hợp lệ với schema thành công"
  );

  const parsed422 = videoGenerateBlockedResponseSchema.safeParse(valid422Sample);
  assert.equal(
    parsed422.success,
    true,
    "video-generate-response-422.sample.json phải hợp lệ với schema Fail-Fast"
  );
});

test("Suite 1: Chặn tham số không hợp lệ (UUID sai, duration vượt ngưỡng)", () => {
  // UUID sai
  assert.throws(
    () =>
      videoGenerateRequestSchema.parse({
        ...validReqSample,
        campaign_id: "not-a-uuid",
      }),
    /UUID/
  );

  // Thời lượng < 15s
  assert.throws(
    () =>
      videoGenerateRequestSchema.parse({
        ...validReqSample,
        target_duration_sec: 10,
      }),
    /15 giây/
  );

  // Thời lượng > 60s
  assert.throws(
    () =>
      videoGenerateRequestSchema.parse({
        ...validReqSample,
        target_duration_sec: 90,
      }),
    /60 giây/
  );
});

// ============================================================================
// TEST SUITE 2: SERVICE LAYER & BUSINESS LOGIC (generateMerchantCampaignVideo)
// ============================================================================

test("Suite 2: Service tạo video thành công khi đủ 100% điều kiện (Success Flow)", async () => {
  const mockClient = createMockSupabaseClient();
  const input = videoGenerateRequestSchema.parse(validReqSample);

  const result = await generateMerchantCampaignVideo(
    mockClient,
    MERCHANT_ID,
    input
  );

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.status, "ready");
    assert.equal(result.data.aspect_ratio, "9:16");
    assert.equal(result.data.campaign_id, CAMPAIGN_ID);
    assert.equal(result.data.product_id, PRODUCT_ID);
    assert.match(
      result.data.video_url,
      /^https:\/\/storage\.travellink\.vn\/campaign-videos\/.+\.mp4$/
    );
    assert.ok(result.data.scenes_count >= 13);
  }
});

test("Suite 2: Service từ chối khi không tìm thấy chiến dịch (404 NOT_FOUND)", async () => {
  const mockClient = createMockSupabaseClient({ campaign: null });
  const input = videoGenerateRequestSchema.parse(validReqSample);

  const result = await generateMerchantCampaignVideo(
    mockClient,
    MERCHANT_ID,
    input
  );

  assert.equal(result.success, false);
  if (!result.success && result.errorType === "NOT_FOUND") {
    assert.match(result.error, /Không tìm thấy chiến dịch/);
  }
});

test("Suite 2: Service từ chối khi Merchant khác cố ý can thiệp (403 FORBIDDEN)", async () => {
  const mockClient = createMockSupabaseClient({
    campaign: {
      id: CAMPAIGN_ID,
      merchant_id: "other-merchant-uuid-9999",
      product_id: PRODUCT_ID,
    },
  });
  const input = videoGenerateRequestSchema.parse(validReqSample);

  const result = await generateMerchantCampaignVideo(
    mockClient,
    MERCHANT_ID,
    input
  );

  assert.equal(result.success, false);
  if (!result.success && result.errorType === "FORBIDDEN") {
    assert.match(result.error, /không có quyền quản lý/);
  }
});

test("Suite 2: Service từ chối khi sản phẩm không khớp với chiến dịch (INVALID_INPUT)", async () => {
  const mockClient = createMockSupabaseClient({
    campaign: {
      id: CAMPAIGN_ID,
      merchant_id: MERCHANT_ID,
      product_id: "other-product-uuid-9999",
    },
  });
  const input = videoGenerateRequestSchema.parse(validReqSample);

  const result = await generateMerchantCampaignVideo(
    mockClient,
    MERCHANT_ID,
    input
  );

  assert.equal(result.success, false);
  if (!result.success && result.errorType === "INVALID_INPUT") {
    assert.match(result.error, /không khớp/);
  }
});

test("Suite 2: Service kích hoạt Fail-Fast Gate khi thiếu ảnh thật (422 BLOCKED)", async () => {
  // Chỉ cung cấp 3 tư liệu cho video 28s (cần tối thiểu 13)
  const mockClient = createMockSupabaseClient({
    mediaRows: Array.from({ length: 3 }, (_, i) => ({
      id: `a${i}111111-1111-4111-8111-111111111111`,
      merchant_id: MERCHANT_ID,
      title: `Ảnh ${i}`,
      video_url: `https://storage.travellink.vn/media/img_${i}.jpg`,
      platform: "upload",
      style_tags: ["review"],
    })),
  });
  const input = videoGenerateRequestSchema.parse(validReqSample);

  const result = await generateMerchantCampaignVideo(
    mockClient,
    MERCHANT_ID,
    input
  );

  assert.equal(result.success, false);
  if (!result.success && result.errorType === "BLOCKED") {
    assert.equal(result.blockedData.status, "BLOCKED_MISSING_INPUT");
    assert.ok(result.blockedData.missing_or_invalid_inputs.length > 0);
    const mediaViolation = result.blockedData.missing_or_invalid_inputs.find(
      (item) => item.field === "media_assets"
    );
    assert.ok(mediaViolation, "Phải báo lỗi thiếu media_assets");
  }
});

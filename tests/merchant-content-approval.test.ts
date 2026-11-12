import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  contentApprovalPatchSchema,
  getContentStatusBadge,
  getPersonaInfo,
} from "../src/lib/merchant/content-schema.ts";
import { updateMerchantContentApproval } from "../src/lib/merchant/content-approval-service.ts";
import {
  confirmedContentPolicy,
  parseContentVariants,
  type ContentContext,
} from "../src/lib/reseller/content-kit.ts";

test("CA-01: contentApprovalPatchSchema validates approval payload and constraints", () => {
  const validUuid = "11111111-1111-4111-8111-111111111111";

  // Test 1: Valid approve payload
  const approvePayload = {
    content_id: validUuid,
    status: "approved",
  };
  const parse1 = contentApprovalPatchSchema.safeParse(approvePayload);
  assert.ok(parse1.success, "Valid approve payload must pass validation");

  // Test 2: Valid reject payload with reason
  const rejectPayload = {
    content_id: validUuid,
    status: "rejected",
    rejection_reason: "Kịch bản chưa phù hợp tiêu chuẩn thương hiệu",
  };
  const parse2 = contentApprovalPatchSchema.safeParse(rejectPayload);
  assert.ok(parse2.success, "Valid reject payload must pass validation");

  // Test 3: Valid edit and approve payload
  const editPayload = {
    content_id: validUuid,
    status: "approved",
    hook: "Ưu đãi số lượng có hạn dịp cuối tuần!",
    caption: "Bài viết mới đã được hiệu chỉnh bởi Merchant.",
    script: "Kịch bản đã sửa lời thoại chuẩn xác.",
    cta: "Nhấp link nhận voucher 100k",
  };
  const parse3 = contentApprovalPatchSchema.safeParse(editPayload);
  assert.ok(parse3.success, "Edit and approve payload must pass validation");
  assert.equal(parse3.data.caption, editPayload.caption);

  // Test 4: Invalid status (e.g. 'published', 'active')
  const invalidStatusPayload = {
    content_id: validUuid,
    status: "published",
  };
  const parse4 = contentApprovalPatchSchema.safeParse(invalidStatusPayload);
  assert.equal(parse4.success, false, "Invalid status must fail validation");

  // Test 5: Invalid UUID format
  const invalidUuidPayload = {
    content_id: "not-a-valid-uuid",
    status: "approved",
  };
  const parse5 = contentApprovalPatchSchema.safeParse(invalidUuidPayload);
  assert.equal(parse5.success, false, "Non-UUID content_id must fail validation");
});

test("CA-02: Persona metadata and status badges format properly", () => {
  // Test persona mapping
  assert.equal(getPersonaInfo("family").label, "Gia đình (Family)");
  assert.equal(getPersonaInfo("foodie").label, "Ẩm thực (Foodie)");
  assert.equal(getPersonaInfo("local_guide").label, "Local Guide");
  assert.equal(getPersonaInfo("budget_traveler").label, "Phượt thủ / Tiết kiệm");

  // Test status badges
  assert.equal(getContentStatusBadge("approved").tone, "approved");
  assert.equal(getContentStatusBadge("approved").label, "Đã phê duyệt");
  assert.equal(getContentStatusBadge("pending_approval").tone, "pending");
  assert.equal(getContentStatusBadge("ready").tone, "pending");
  assert.equal(getContentStatusBadge("rejected").tone, "rejected");
});

test("CA-03: updateMerchantContentApproval verifies merchant ownership before update", async () => {
  const merchantA = "11111111-1111-1111-1111-111111111111";
  const merchantB = "22222222-2222-2222-2222-222222222222";
  const campaignOfA = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
  const contentOfA = "33333333-3333-4333-8333-333333333333";

  // Mock Supabase client
  const mockClient = {
    from: (table: string) => {
      if (table === "contents") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: contentOfA, campaign_id: campaignOfA },
                error: null,
              }),
            }),
          }),
          update: (payload: any) => ({
            eq: () => ({
              select: () => ({
                single: async () => ({
                  data: { id: contentOfA, campaign_id: campaignOfA, ...payload },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "campaigns") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: campaignOfA, merchant_id: merchantA, title: "Chiến dịch A" },
                error: null,
              }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  };

  // Trường hợp 1: Merchant B cố tình duyệt nội dung của Merchant A -> BỊ TỪ CHỐI (FORBIDDEN)
  const unauthorizedResult = await updateMerchantContentApproval(
    mockClient as any,
    merchantB,
    { content_id: contentOfA, status: "approved" }
  );
  assert.equal(unauthorizedResult.success, false);
  assert.equal(unauthorizedResult.code, "FORBIDDEN");

  // Trường hợp 2: Đúng Merchant A duyệt nội dung -> THÀNH CÔNG
  const authorizedResult = await updateMerchantContentApproval(
    mockClient as any,
    merchantA,
    { content_id: contentOfA, status: "approved" }
  );
  assert.equal(authorizedResult.success, true);
  assert.equal(authorizedResult.data.status, "approved");
});

test("CA-04: Reseller Content Kit publication policy respects approved status", () => {
  const campaignId = "44444444-4444-4444-4444-111111111111";
  const resellerId = "22222222-2222-2222-2222-111111111111";
  const context: ContentContext = { campaignId, resellerId };

  // Dữ liệu nội dung mô phỏng
  const mockRows = [
    {
      id: "11111111-1111-4111-8111-111111111111",
      campaign_id: campaignId,
      reseller_id: null,
      persona: "family",
      status: "pending_approval", // CHƯA DUYỆT
      hook: "Bà Nà Hills cho cả gia đình",
      script: "Kịch bản gia đình",
      caption: "Bài viết gia đình",
      cta: "Nhấp link",
      video_url: null,
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      campaign_id: campaignId,
      reseller_id: null,
      persona: "local_guide",
      status: "approved", // ĐÃ DUYỆT BỞI MERCHANT
      hook: "Bí kíp check-in Cầu Vàng",
      script: "Kịch bản local guide",
      caption: "Bài viết local guide",
      cta: "Nhấp link",
      video_url: null,
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      campaign_id: campaignId,
      reseller_id: null,
      persona: "foodie",
      status: "rejected", // BỊ TỪ CHỐI
      hook: "Ăn gì ở Đà Nẵng",
      script: "Kịch bản foodie",
      caption: "Bài viết foodie",
      cta: "Nhấp link",
      video_url: null,
    },
  ];

  const excludedCodes: string[] = [];
  const variants = parseContentVariants(
    mockRows,
    context,
    confirmedContentPolicy,
    (code) => excludedCodes.push(code)
  );

  // Chỉ có đúng 1 bài có status 'approved' được chuyển thành ContentVariant cho Reseller
  assert.equal(variants.length, 1);
  assert.equal(variants[0].id, "22222222-2222-4222-8222-222222222222");
  assert.equal(variants[0].persona, "local-guide");

  // Bài pending_approval và rejected bị loại trừ đúng chuẩn STATUS_EXCLUDED
  assert.ok(excludedCodes.includes("STATUS_EXCLUDED"));
  assert.equal(excludedCodes.filter((c) => c === "STATUS_EXCLUDED").length, 2);
});

test("CA-05: Route files and UI components exist and are integrated", () => {
  const pagePath = resolve("app/merchant/contents/page.tsx");
  const previewPath = resolve("app/preview/merchant/contents/page.tsx");
  const apiPath = resolve("app/api/merchant/contents/route.ts");
  const componentPath = resolve("src/components/merchant/content-approval-list.tsx");
  const dashboardPath = resolve("src/components/merchant/dashboard.tsx");
  const campaignListPath = resolve("src/components/merchant/campaign-list.tsx");

  assert.ok(existsSync(pagePath), "app/merchant/contents/page.tsx must exist");
  assert.ok(existsSync(previewPath), "app/preview/merchant/contents/page.tsx must exist");
  assert.ok(existsSync(apiPath), "app/api/merchant/contents/route.ts must exist");
  assert.ok(existsSync(componentPath), "content-approval-list.tsx must exist");

  // Check API route
  const apiContent = readFileSync(apiPath, "utf-8");
  assert.match(apiContent, /export async function GET/, "route.ts must implement GET method");
  assert.match(apiContent, /export async function PATCH/, "route.ts must implement PATCH method");

  // Check Navigation integration
  const dashContent = readFileSync(dashboardPath, "utf-8");
  assert.match(
    dashContent,
    /\/merchant\/contents/,
    "dashboard.tsx must link to /merchant/contents"
  );

  const cmpListContent = readFileSync(campaignListPath, "utf-8");
  assert.match(
    cmpListContent,
    /\/contents/,
    "campaign-list.tsx must link to /contents"
  );
});

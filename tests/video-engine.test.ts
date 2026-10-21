import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  BANNED_AI_CLICHES,
  generateVideoDirectorScript,
  synthesizeVideoDraft,
  validatePreFlightGate,
} from "../src/lib/video-engine/generator.ts";
import {
  blockedMissingInputSchema,
  calculateMinRequiredAssets,
  readyForRenderSchema,
  videoEngineInputSchema,
  videoEngineOutputSchema,
  type VideoEngineInput,
} from "../src/lib/video-engine/types.ts";

// Đọc fixtures mẫu chuẩn
const inputFixturePath = resolve(
  process.cwd(),
  "tests/fixtures/mock-video-engine-input.json"
);
const outputFixturePath = resolve(
  process.cwd(),
  "tests/fixtures/mock-video-director-output.json"
);

const rawInputFixture = JSON.parse(readFileSync(inputFixturePath, "utf8"));
const rawOutputFixture = JSON.parse(readFileSync(outputFixturePath, "utf8"));

// ============================================================================
// TEST SUITE 1: DATA CONTRACT & FIXTURES VALIDATION
// ============================================================================

test("Suite 1: Công thức tính toán tài nguyên tối thiểu (calculateMinRequiredAssets)", () => {
  assert.equal(calculateMinRequiredAssets(15), 7); // ceil(15 / 2.2) = 7
  assert.equal(calculateMinRequiredAssets(22), 10); // ceil(22 / 2.2) = 10
  assert.equal(calculateMinRequiredAssets(28), 13); // ceil(28 / 2.2) = 13
  assert.equal(calculateMinRequiredAssets(30), 14); // ceil(30 / 2.2) = 14
  assert.equal(calculateMinRequiredAssets(60), 28); // ceil(60 / 2.2) = 28
});

test("Suite 1: Xác thực dữ liệu mock fixtures với Zod Schemas", () => {
  const parsedInput = videoEngineInputSchema.safeParse(rawInputFixture);
  assert.equal(
    parsedInput.success,
    true,
    "Fixture mock-video-engine-input.json phải hợp lệ với videoEngineInputSchema"
  );

  const parsedOutput = readyForRenderSchema.safeParse(rawOutputFixture);
  assert.equal(
    parsedOutput.success,
    true,
    "Fixture mock-video-director-output.json phải hợp lệ với readyForRenderSchema"
  );

  const unifiedOutput = videoEngineOutputSchema.safeParse(rawOutputFixture);
  assert.equal(
    unifiedOutput.success,
    true,
    "Fixture output phải hợp lệ với discriminated union videoEngineOutputSchema"
  );
});

// ============================================================================
// TEST SUITE 2: PRE-FLIGHT GATE & FAIL-FAST MECHANISMS (BLOCKED_MISSING_INPUT)
// ============================================================================

test("Suite 2: Chặn dữ liệu sai schema cơ bản (Invalid Schema Input)", () => {
  const invalidRawInput = {
    merchant_name: "ABC",
    // Thiếu product_name, sale_price, media_assets...
  };

  const result = generateVideoDirectorScript(invalidRawInput);
  assert.equal(result.status, "BLOCKED_MISSING_INPUT");
  assert.equal(result.can_proceed, false);

  const parsedBlocked = blockedMissingInputSchema.safeParse(result);
  assert.equal(parsedBlocked.success, true);
  assert.ok(result.missing_or_invalid_inputs.length > 0);
});

test("Suite 2: Fail-Fast khi thiếu ảnh/clip thật theo công thức ceil(duration / 2.2)", () => {
  // Video 28s cần tối thiểu 13 assets, ta chỉ cung cấp 4 assets
  const insufficientAssetsInput: VideoEngineInput = {
    ...rawInputFixture,
    target_duration_sec: 28.0,
    media_assets: rawInputFixture.media_assets.slice(0, 4),
  };

  const result = generateVideoDirectorScript(insufficientAssetsInput);
  assert.equal(result.status, "BLOCKED_MISSING_INPUT");
  assert.equal(result.can_proceed, false);

  const assetViolation = result.missing_or_invalid_inputs.find(
    (item) => item.field === "media_assets"
  );
  assert.ok(assetViolation, "Phải ghi nhận vi phạm thiếu media_assets");
  assert.match(assetViolation.reason, /cần tối thiểu 13 ảnh\/clip thật/);
  assert.match(assetViolation.required_action, /thêm ít nhất 9 ảnh/);
});

test("Suite 2: Fail-Fast khi yêu cầu hiệu ứng Drone nhưng thiếu ảnh AERIAL_WIDE/SCENIC_MEDIUM", () => {
  // Thay thế tất cả assets bằng CLOSEUP_FOOD
  const noAerialAssetsInput: VideoEngineInput = {
    ...rawInputFixture,
    allow_3d_spatial_effects: true,
    media_assets: rawInputFixture.media_assets.map(
      (a: { asset_id: string; url: string }) => ({
        ...a,
        shot_type: "CLOSEUP_FOOD" as const,
      })
    ),
  };

  const gateResult = validatePreFlightGate(noAerialAssetsInput);
  assert.equal(gateResult.isValid, false);

  const droneViolation = gateResult.errors.find(
    (item) =>
      item.field === "media_assets.shot_type (AERIAL_WIDE / SCENIC_MEDIUM)"
  );
  assert.ok(droneViolation, "Phải báo lỗi thiếu ảnh toàn cảnh cho hiệu ứng Drone");
});

test("Suite 2: Fail-Fast khi thiếu mẹo du lịch thực tế (authentic_tips rỗng)", () => {
  const noTipsInput: VideoEngineInput = {
    ...rawInputFixture,
    authentic_tips: [],
  };

  const gateResult = validatePreFlightGate(noTipsInput);
  assert.equal(gateResult.isValid, false);

  const tipsViolation = gateResult.errors.find(
    (item) => item.field === "authentic_tips"
  );
  assert.ok(tipsViolation, "Phải bắt lỗi authentic_tips rỗng");
});

test("Suite 2: Fail-Fast khi giá bán sản phẩm không hợp lệ (sale_price <= 0)", () => {
  const invalidPriceInput: VideoEngineInput = {
    ...rawInputFixture,
    sale_price: 0,
  };

  const gateResult = validatePreFlightGate(invalidPriceInput);
  assert.equal(gateResult.isValid, false);

  const priceViolation = gateResult.errors.find(
    (item) => item.field === "sale_price"
  );
  assert.ok(priceViolation, "Phải bắt lỗi sale_price <= 0");
});

// ============================================================================
// TEST SUITE 3: SUCCESSFUL VIDEO DIRECTOR SCRIPT GENERATION (READY_FOR_RENDER)
// ============================================================================

test("Suite 3: Sinh kịch bản thành công trạng thái READY_FOR_RENDER với đầy đủ thông số CapCut UGC", () => {
  const result = generateVideoDirectorScript(rawInputFixture);

  assert.equal(result.status, "READY_FOR_RENDER");
  assert.equal(result.can_proceed, true);

  if (result.status !== "READY_FOR_RENDER") {
    assert.fail("Kết quả phải là READY_FOR_RENDER");
    return;
  }

  // 1. Kiểm tra Metadata
  assert.equal(result.campaign_metadata.merchant_name, "ABC Theme Park Da Nang");
  assert.equal(result.campaign_metadata.aspect_ratio, "9:16");
  assert.equal(result.campaign_metadata.safe_zone_enforced, true);
  assert.equal(result.campaign_metadata.total_duration_sec, 28.0);

  // 2. Kiểm tra Anti-AI Compliance Check
  assert.equal(result.anti_ai_compliance_check.real_footage_100_percent, true);
  assert.equal(result.anti_ai_compliance_check.generative_pixel_ai_used, false);
  assert.equal(result.anti_ai_compliance_check.no_ai_cliche_words, true);
  assert.equal(
    result.anti_ai_compliance_check.verified_merchant_price_and_cta,
    true
  );

  // Đảm bảo không chứa từ ngữ AI sáo rỗng trong kịch bản thu âm
  const fullVoiceover =
    result.audio_config.full_voiceover_script_with_pauses.toLowerCase();
  for (const cliche of BANNED_AI_CLICHES) {
    assert.equal(
      fullVoiceover.includes(cliche),
      false,
      `Kịch bản không được chứa từ ngữ AI sáo rỗng: ${cliche}`
    );
  }

  // 3. Kiểm tra nhịp cắt cảnh nhanh (Cut Pacing)
  assert.ok(
    result.timeline_scenes.length >= 13,
    "Số lượng phân cảnh phải đạt tối thiểu ceil(28 / 2.2) = 13 cảnh"
  );
  assert.ok(
    result.anti_ai_compliance_check.average_scene_duration_sec >= 1.0 &&
      result.anti_ai_compliance_check.average_scene_duration_sec <= 3.0,
    "Thời lượng cảnh trung bình phải nằm trong ngưỡng 1.0s - 3.0s"
  );

  for (const scene of result.timeline_scenes) {
    assert.ok(
      scene.duration_sec >= 1.2 && scene.duration_sec <= 3.0,
      `Cảnh ${scene.scene_index} có thời lượng ${scene.duration_sec}s nằm ngoài chuẩn 1.2s - 3.0s`
    );
    assert.ok(
      scene.ambient_sfx.volume_percent >= 20 &&
        scene.ambient_sfx.volume_percent <= 35,
      "Âm lượng Ambient SFX phải kiểm soát ở mức 20% - 35%"
    );
  }

  // 4. Kiểm tra Phân cảnh mở đầu Hook (Cảnh 1)
  const hookScene = result.timeline_scenes[0];
  assert.equal(hookScene.scene_index, 1);
  assert.ok(
    hookScene.duration_sec <= 3.0,
    "Hook scene phải hoàn tất trong 3 giây đầu"
  );
  assert.equal(hookScene.on_screen_text.type, "HOOK_HEADLINE");
  assert.equal(hookScene.on_screen_text.position, "CENTER_SAFE_ZONE");
  assert.equal(hookScene.on_screen_text.color, "#FFD700"); // Chữ vàng
  assert.equal(hookScene.on_screen_text.stroke, "#000000"); // Viền đen

  // 5. Kiểm tra Phân cảnh Ưu đãi & Kêu gọi hành động (CTA)
  const offerScene = result.timeline_scenes[result.timeline_scenes.length - 2];
  assert.equal(offerScene.on_screen_text.type, "OFFER_CALLOUT");
  assert.match(
    offerScene.on_screen_text.text,
    /299\.000đ/,
    "Thẻ ưu đãi phải thể hiện đúng giá bán định dạng VND"
  );

  const lastScene = result.timeline_scenes[result.timeline_scenes.length - 1];
  assert.equal(lastScene.on_screen_text.type, "OFFICIAL_CTA");
  assert.equal(lastScene.on_screen_text.position, "LOWER_MIDDLE_SAFE_ZONE");

  // 6. Kiểm tra Social Publishing Package
  assert.ok(result.social_publishing_package.caption.length >= 10);
  assert.equal(
    result.social_publishing_package.official_cta_text,
    rawInputFixture.official_cta
  );
});

// ============================================================================
// TEST SUITE 4: RENDERER PIPELINE ADAPTER (synthesizeVideoDraft)
// ============================================================================

test("Suite 4: Renderer Pipeline Adapter (synthesizeVideoDraft) xuất video chuẩn 9:16", async () => {
  const result = generateVideoDirectorScript(rawInputFixture);
  assert.equal(result.status, "READY_FOR_RENDER");

  if (result.status === "READY_FOR_RENDER") {
    const renderDraft = await synthesizeVideoDraft(result);

    assert.equal(renderDraft.success, true);
    assert.equal(renderDraft.aspect_ratio, "9:16");
    assert.equal(renderDraft.resolution, "1080x1920");
    assert.equal(renderDraft.duration_sec, 28.0);
    assert.equal(renderDraft.storage_bucket, "campaign-videos");
    assert.match(
      renderDraft.video_url,
      /^https:\/\/storage\.travellink\.vn\/campaign-videos\/.+\.mp4$/
    );
    assert.ok(new Date(renderDraft.rendered_at).getTime() > 0);
  }
});

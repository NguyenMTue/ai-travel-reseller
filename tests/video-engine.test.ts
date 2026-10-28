import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  BANNED_AI_CLICHES,
  generateVideoDirectorScript,
  synthesizeVideoDraft,
  validatePreFlightGate,
  type VideoRendererAdapter,
  type VideoRenderResult,
  MockVideoRendererAdapter,
} from "../src/lib/video-engine/generator.ts";
import {
  blockedMissingInputSchema,
  calculateMinRequiredAssets,
  readyForRenderSchema,
  videoEngineInputSchema,
  videoEngineOutputSchema,
  type VideoEngineInput,
  type ReadyForRenderResult,
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

test("Suite 4: Renderer Pipeline Adapter (synthesizeVideoDraft) xuất mock video metadata chuẩn 9:16", async () => {
  const result = generateVideoDirectorScript(rawInputFixture);
  assert.equal(result.status, "READY_FOR_RENDER");

  if (result.status === "READY_FOR_RENDER") {
    const renderDraft = await synthesizeVideoDraft(result, new MockVideoRendererAdapter());

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

// ============================================================================
// TEST SUITE 5: DIRECT SCENE-LEVEL INGESTION (BE2 14 Approved Scenes Consumption)
// ============================================================================

const mock14Assets = Array.from({ length: 14 }, (_, i) => ({
  asset_id: `asset_${(i + 1).toString().padStart(4, "0")}`,
  url: `https://storage.travellink.vn/assets/media_${i + 1}.jpg`,
  type: "IMAGE" as const,
  shot_type: i === 0 ? ("AERIAL_WIDE" as const) : ("SCENIC_MEDIUM" as const),
  resolution: "1080x1920",
  description: `Tài nguyên hình ảnh phong cảnh xác thực số ${i + 1}`,
}));

const mock14VerifiedFacts = [
  { id: "fact_01", text: "Vé vào cổng khu du lịch và cáp treo khứ hồi" },
  { id: "fact_02", text: "Buffet trưa hơn 100 món tại nhà hàng chỉ định" },
];

const mock14ApprovedScenes = Array.from({ length: 14 }, (_, i) => ({
  index: i + 1,
  start_seconds: Number((i * 2.0).toFixed(1)),
  end_seconds: Number(((i + 1) * 2.0).toFixed(1)),
  visual_prompt: `Góc quay phân cảnh thứ ${i + 1} của kịch bản du lịch đỉnh núi.`,
  shot_instruction:
    i === 0 ? "Flycam góc rộng AERIAL_WIDE" : "Cận cảnh SCENIC_MEDIUM",
  narration: `Lời thoại phân cảnh ${i + 1} được duyệt bởi BE2.`,
  on_screen_text:
    i === 13 ? "Đặt vé ngay tại [LINK_MUA_VE]" : `Tiêu đề cảnh ${i + 1}`,
  verified_fact_refs: ["fact_01"],
  suggested_asset_id: `asset_${(i + 1).toString().padStart(4, "0")}`,
}));

test("Suite 5: BE1 Direct Scene-level Ingestion: tiêu thụ trực tiếp 14 approved scenes và bảo toàn 100% 7 trường dữ liệu BE2", () => {
  const inputWith14Scenes: VideoEngineInput = {
    ...rawInputFixture,
    target_duration_sec: 28.0,
    official_cta: "Đặt vé ngay tại [LINK_MUA_VE]",
    media_assets: mock14Assets,
    verified_facts: mock14VerifiedFacts,
    scenes: mock14ApprovedScenes,
  };

  const result = generateVideoDirectorScript(inputWith14Scenes);
  assert.equal(result.status, "READY_FOR_RENDER");
  if (result.status === "READY_FOR_RENDER") {
    // 1. Phải có đúng 14 timeline scenes
    assert.equal(result.timeline_scenes.length, 14);

    // 2. Phải có đúng 14 source_asset_id duy nhất
    const uniqueSourceAssets = new Set(
      result.timeline_scenes.map((s) => s.source_asset_id),
    );
    assert.equal(
      uniqueSourceAssets.size,
      14,
      "Mỗi phân cảnh phải ánh xạ tới đúng một asset_id duy nhất",
    );

    // 3. Mọi fact ref phải tồn tại trong verified_facts
    const knownFacts = new Set(mock14VerifiedFacts.map((f) => f.id));
    for (const sc of result.timeline_scenes) {
      assert.ok(
        (sc.verified_fact_refs || []).every((r) => knownFacts.has(r)),
        "Mọi fact ref phải tồn tại trong verified_facts",
      );
    }

    // 4. Nội dung từng scene phải khớp đúng 100% và bảo toàn đầy đủ 7 trường dữ liệu từ BE2
    for (const [i, currentScene] of result.timeline_scenes.entries()) {
      const approved = mock14ApprovedScenes[i];
      assert.equal(currentScene.scene_index, approved.index, "scene_index phải được bảo toàn");
      assert.equal(
        currentScene.time_range_sec,
        `${approved.start_seconds.toFixed(1)} - ${approved.end_seconds.toFixed(1)}`,
        "time_range_sec phải khớp thời lượng",
      );
      assert.equal(currentScene.visual_prompt, approved.visual_prompt, "visual_prompt phải được bảo toàn");
      assert.equal(currentScene.shot_instruction, approved.shot_instruction, "shot_instruction phải được bảo toàn");
      assert.equal(currentScene.voiceover_segment, approved.narration, "voiceover_segment phải được bảo toàn");
      assert.equal(currentScene.on_screen_text.text, approved.on_screen_text, "on_screen_text phải được bảo toàn");
      assert.deepEqual(currentScene.verified_fact_refs, approved.verified_fact_refs, "verified_fact_refs phải được bảo toàn");
      assert.equal(currentScene.source_asset_id, approved.suggested_asset_id, "source_asset_id phải ánh xạ chuẩn 1-1");
    }

    // 3. CTA scene phải giữ nguyên placeholder [LINK_MUA_VE]
    const ctaScene = result.timeline_scenes[13];
    assert.equal(ctaScene.on_screen_text.type, "OFFICIAL_CTA");
    assert.ok(ctaScene.on_screen_text.text.includes("[LINK_MUA_VE]"));
  }
});

test("Suite 5: Fail-closed khi kịch bản không đúng 14 phân cảnh (thiếu/thừa scene)", () => {
  const invalid13Scenes = mock14ApprovedScenes.slice(0, 13);
  const inputWith13Scenes = {
    ...rawInputFixture,
    media_assets: mock14Assets,
    scenes: invalid13Scenes,
  };

  const result = generateVideoDirectorScript(inputWith13Scenes);
  assert.equal(result.status, "BLOCKED_MISSING_INPUT");
  assert.equal(result.can_proceed, false);
});

test("Suite 5: Fail-closed khi index bị trùng lặp (Duplicate index)", () => {
  const duplicateIndexScenes = mock14ApprovedScenes.map((s, i) =>
    i === 1 ? { ...s, index: 1 } : s,
  );
  const input = {
    ...rawInputFixture,
    target_duration_sec: 28.0,
    media_assets: mock14Assets,
    scenes: duplicateIndexScenes,
  };

  const result = generateVideoDirectorScript(input);
  assert.equal(result.status, "BLOCKED_MISSING_INPUT");
  assert.equal(result.can_proceed, false);
  const indexErr = result.missing_or_invalid_inputs.find((e) =>
    e.field.includes("index"),
  );
  assert.ok(indexErr, "Phải báo lỗi index khi bị trùng lặp");
});

test("Suite 5: Fail-closed khi index đảo thứ tự (Out-of-order index)", () => {
  const outOfOrderScenes = [...mock14ApprovedScenes];
  outOfOrderScenes[1] = { ...mock14ApprovedScenes[1], index: 3 };
  outOfOrderScenes[2] = { ...mock14ApprovedScenes[2], index: 2 };

  const input = {
    ...rawInputFixture,
    target_duration_sec: 28.0,
    media_assets: mock14Assets,
    scenes: outOfOrderScenes,
  };

  const result = generateVideoDirectorScript(input);
  assert.equal(result.status, "BLOCKED_MISSING_INPUT");
  assert.equal(result.can_proceed, false);
});

test("Suite 5: Fail-closed khi index không bắt đầu từ 1", () => {
  const notStartingAtOne = mock14ApprovedScenes.map((s) => ({
    ...s,
    index: s.index + 1,
  }));
  const input = {
    ...rawInputFixture,
    target_duration_sec: 28.0,
    media_assets: mock14Assets,
    scenes: notStartingAtOne,
  };

  const result = generateVideoDirectorScript(input);
  assert.equal(result.status, "BLOCKED_MISSING_INPUT");
  assert.equal(result.can_proceed, false);
});

test("Suite 5: Fail-closed khi end_seconds <= start_seconds", () => {
  const invalidDurationScenes = mock14ApprovedScenes.map((s, i) =>
    i === 2 ? { ...s, start_seconds: 6.0, end_seconds: 5.5 } : s,
  );
  const input = {
    ...rawInputFixture,
    target_duration_sec: 28.0,
    media_assets: mock14Assets,
    scenes: invalidDurationScenes,
  };

  const result = generateVideoDirectorScript(input);
  assert.equal(result.status, "BLOCKED_MISSING_INPUT");
  assert.equal(result.can_proceed, false);
  const durErr = result.missing_or_invalid_inputs.find((e) =>
    e.field.includes("duration"),
  );
  assert.ok(durErr, "Phải báo lỗi duration khi end_seconds <= start_seconds");
});

test("Suite 5: Fail-closed khi timeline các phân cảnh bị đứt đoạn", () => {
  const brokenTimelineScenes = mock14ApprovedScenes.map((s, i) =>
    i === 3 ? { ...s, start_seconds: 7.0 } : s, // Hở 1.0 giây so với cảnh 3 kết thúc ở 6.0s
  );

  const inputWithBrokenTimeline = {
    ...rawInputFixture,
    target_duration_sec: 28.0,
    media_assets: mock14Assets,
    scenes: brokenTimelineScenes,
  };

  const result = generateVideoDirectorScript(inputWithBrokenTimeline);
  assert.equal(result.status, "BLOCKED_MISSING_INPUT");
  assert.equal(result.can_proceed, false);
  const timelineErr = result.missing_or_invalid_inputs.find(
    (e) => e.field === "scenes.timeline",
  );
  assert.ok(timelineErr, "Phải báo lỗi scenes.timeline khi timeline đứt đoạn");
});

test("Suite 5: Fail-closed khi fact ref không tồn tại trong verified_facts", () => {
  const unknownFactRefScenes = mock14ApprovedScenes.map((s, i) =>
    i === 4 ? { ...s, verified_fact_refs: ["fact_phantom_unverified"] } : s,
  );
  const input = {
    ...rawInputFixture,
    target_duration_sec: 28.0,
    media_assets: mock14Assets,
    verified_facts: mock14VerifiedFacts,
    scenes: unknownFactRefScenes,
  };

  const result = generateVideoDirectorScript(input);
  assert.equal(result.status, "BLOCKED_MISSING_INPUT");
  assert.equal(result.can_proceed, false);
  const factErr = result.missing_or_invalid_inputs.find((e) =>
    e.field.includes("verified_fact_refs"),
  );
  assert.ok(factErr, "Phải báo lỗi khi fact ref không tồn tại trong verified_facts");
});

test("Suite 5: Fail-closed khi fact ref rỗng", () => {
  const emptyFactRefScenes = mock14ApprovedScenes.map((s, i) =>
    i === 1 ? { ...s, verified_fact_refs: [""] } : s,
  );
  const input = {
    ...rawInputFixture,
    target_duration_sec: 28.0,
    media_assets: mock14Assets,
    scenes: emptyFactRefScenes,
  };

  const result = generateVideoDirectorScript(input);
  assert.equal(result.status, "BLOCKED_MISSING_INPUT");
  assert.equal(result.can_proceed, false);
});

test("Suite 5: Fail-closed khi CTA cảnh 14 thiếu [LINK_MUA_VE] (Không tự chèn placeholder)", () => {
  const missingCtaScenes = mock14ApprovedScenes.map((s, i) =>
    i === 13 ? { ...s, on_screen_text: "Đặt vé ngay hôm nay để nhận ưu đãi!" } : s,
  );
  const input = {
    ...rawInputFixture,
    target_duration_sec: 28.0,
    media_assets: mock14Assets,
    scenes: missingCtaScenes,
  };

  const result = generateVideoDirectorScript(input);
  assert.equal(result.status, "BLOCKED_MISSING_INPUT");
  assert.equal(result.can_proceed, false);
  const ctaErr = result.missing_or_invalid_inputs.find((e) =>
    e.field.includes("on_screen_text"),
  );
  assert.ok(ctaErr, "Phải báo lỗi khi CTA thiếu [LINK_MUA_VE]");
});

test("Suite 5: Fail-closed khi cảnh chứa URL ngoại lai lạ", () => {
  const foreignUrlScenes = mock14ApprovedScenes.map((s, i) =>
    i === 5 ? { ...s, narration: "Xem thêm tại https://external-evil.com nhé." } : s,
  );
  const input = {
    ...rawInputFixture,
    target_duration_sec: 28.0,
    media_assets: mock14Assets,
    scenes: foreignUrlScenes,
  };

  const result = generateVideoDirectorScript(input);
  assert.equal(result.status, "BLOCKED_MISSING_INPUT");
  assert.equal(result.can_proceed, false);
  const urlErr = result.missing_or_invalid_inputs.find((e) =>
    e.field.includes("foreign_url"),
  );
  assert.ok(urlErr, "Phải báo lỗi khi phát hiện URL ngoại lai trong cảnh");
});

test("Suite 5: Fail-closed khi suggested_asset_id không tồn tại trong media_assets", () => {
  const invalidAssetScenes = mock14ApprovedScenes.map((s, i) =>
    i === 2 ? { ...s, suggested_asset_id: "asset_9999_non_existent" } : s,
  );
  const input = {
    ...rawInputFixture,
    target_duration_sec: 28.0,
    media_assets: mock14Assets,
    scenes: invalidAssetScenes,
  };

  const result = generateVideoDirectorScript(input);
  assert.equal(result.status, "BLOCKED_MISSING_INPUT");
  assert.equal(result.can_proceed, false);
  const assetErr = result.missing_or_invalid_inputs.find((e) =>
    e.field.includes("suggested_asset_id"),
  );
  assert.ok(assetErr, "Phải báo lỗi khi suggested_asset_id không tìm thấy");
});

test("Suite 5: Fail-closed khi không đủ 14 media assets cho 14 approved scenes", () => {
  const inputWithFewAssets = {
    ...rawInputFixture,
    target_duration_sec: 28.0,
    media_assets: mock14Assets.slice(0, 10), // chỉ có 10 assets
    scenes: mock14ApprovedScenes,
  };

  const result = generateVideoDirectorScript(inputWithFewAssets);
  assert.equal(result.status, "BLOCKED_MISSING_INPUT");
  assert.equal(result.can_proceed, false);
  const assetErr = result.missing_or_invalid_inputs.find(
    (e) => e.field === "media_assets",
  );
  assert.ok(assetErr, "Phải báo lỗi media_assets khi thiếu assets cho 14 scenes");
});

test("Suite 5: Fail-closed khi có scenes nhưng thiếu verified_facts (undefined)", () => {
  const inputWithoutFacts = {
    ...rawInputFixture,
    target_duration_sec: 28.0,
    media_assets: mock14Assets,
    verified_facts: undefined,
    scenes: mock14ApprovedScenes,
  };

  const result = generateVideoDirectorScript(inputWithoutFacts);
  assert.equal(result.status, "BLOCKED_MISSING_INPUT");
  assert.equal(result.can_proceed, false);
  const factErr = result.missing_or_invalid_inputs.find(
    (e) => e.field === "verified_facts",
  );
  assert.ok(factErr, "Phải báo lỗi thiếu verified_facts khi có scenes");
});

test("Suite 5: Fail-closed khi verified_facts là mảng rỗng", () => {
  const inputWithEmptyFacts = {
    ...rawInputFixture,
    target_duration_sec: 28.0,
    media_assets: mock14Assets,
    verified_facts: [],
    scenes: mock14ApprovedScenes,
  };

  const result = generateVideoDirectorScript(inputWithEmptyFacts);
  assert.equal(result.status, "BLOCKED_MISSING_INPUT");
  assert.equal(result.can_proceed, false);
  const factErr = result.missing_or_invalid_inputs.find(
    (e) => e.field === "verified_facts",
  );
  assert.ok(factErr, "Phải báo lỗi khi verified_facts là mảng rỗng");
});

test("Suite 5: Fail-closed khi Fact ID trong verified_facts bị trùng lặp", () => {
  const duplicateFacts = [
    { id: "fact_01", text: "Vé vào cổng khu du lịch và cáp treo khứ hồi" },
    { id: "fact_01", text: "Buffet trưa hơn 100 món tại nhà hàng chỉ định" },
  ];
  const inputWithDuplicateFacts = {
    ...rawInputFixture,
    target_duration_sec: 28.0,
    media_assets: mock14Assets,
    verified_facts: duplicateFacts,
    scenes: mock14ApprovedScenes,
  };

  const result = generateVideoDirectorScript(inputWithDuplicateFacts);
  assert.equal(result.status, "BLOCKED_MISSING_INPUT");
  assert.equal(result.can_proceed, false);
  const idErr = result.missing_or_invalid_inputs.find(
    (e) => e.field.includes("verified_facts") && e.field.includes("id"),
  );
  assert.ok(idErr, "Phải báo lỗi trùng lặp Fact ID trong verified_facts");
});

test("Suite 5: Fail-closed khi 14 media item nhưng tất cả trùng cùng một asset_id", () => {
  const duplicatedAsset = {
    ...mock14Assets[0],
    asset_id: "asset_0001",
  };
  const inputWithDuplicateAssets = {
    ...rawInputFixture,
    target_duration_sec: 28.0,
    media_assets: Array.from({ length: 14 }, () => ({ ...duplicatedAsset })),
    verified_facts: mock14VerifiedFacts,
    scenes: mock14ApprovedScenes,
  };

  const result = generateVideoDirectorScript(inputWithDuplicateAssets);
  assert.equal(result.status, "BLOCKED_MISSING_INPUT");
  assert.equal(result.can_proceed, false);
  const assetDupErr = result.missing_or_invalid_inputs.find((e) =>
    e.field.includes("media_assets"),
  );
  assert.ok(assetDupErr, "Phải báo lỗi media_assets khi trùng lặp asset_id");
});

test("Suite 5: Fail-closed khi hai scene dùng cùng một suggested_asset_id", () => {
  const duplicateSuggestedScenes = mock14ApprovedScenes.map((s, i) =>
    i === 1 ? { ...s, suggested_asset_id: "asset_0001" } : s,
  );
  const input = {
    ...rawInputFixture,
    target_duration_sec: 28.0,
    media_assets: mock14Assets,
    verified_facts: mock14VerifiedFacts,
    scenes: duplicateSuggestedScenes,
  };

  const result = generateVideoDirectorScript(input);
  assert.equal(result.status, "BLOCKED_MISSING_INPUT");
  assert.equal(result.can_proceed, false);
  const suggestedErr = result.missing_or_invalid_inputs.find((e) =>
    e.field.includes("suggested_asset_id"),
  );
  assert.ok(suggestedErr, "Phải báo lỗi khi 2 scene cùng dùng một suggested_asset_id");
});

test("Suite 5: Proof Regression: Fail-closed toàn diện khi input kết hợp thiếu facts, trùng asset và sai refs", () => {
  const duplicatedAsset = {
    ...mock14Assets[0],
    asset_id: "asset_0001",
  };

  const malformedInput = {
    ...rawInputFixture,
    target_duration_sec: 28.0,
    verified_facts: undefined,
    media_assets: Array.from(
      { length: 14 },
      () => ({ ...duplicatedAsset }),
    ),
    scenes: mock14ApprovedScenes.map((scene) => ({
      ...scene,
      verified_fact_refs: ["fact_khong_ton_tai"],
      suggested_asset_id: "asset_0001",
    })),
  };

  const result = generateVideoDirectorScript(malformedInput);
  assert.equal(result.status, "BLOCKED_MISSING_INPUT");
  assert.equal(result.can_proceed, false);
  assert.ok(result.missing_or_invalid_inputs.length >= 3);
});

test("Suite 5: Renderer adapter injectable (synthesizeVideoDraft) tiếp nhận đầy đủ thông số draft từ 14 scenes", async () => {
  const inputWith14Scenes: VideoEngineInput = {
    ...rawInputFixture,
    target_duration_sec: 28.0,
    official_cta: "Đặt vé ngay tại [LINK_MUA_VE]",
    media_assets: mock14Assets,
    verified_facts: mock14VerifiedFacts,
    scenes: mock14ApprovedScenes,
  };

  const result = generateVideoDirectorScript(inputWith14Scenes);
  assert.equal(result.status, "READY_FOR_RENDER");
  if (result.status === "READY_FOR_RENDER") {
    // Inject in-memory capturing adapter để thẩm định payload truyền tới renderer
    let capturedSpec: ReadyForRenderResult | null = null;
    const capturingAdapter: VideoRendererAdapter = {
      async render(spec: ReadyForRenderResult): Promise<VideoRenderResult> {
        capturedSpec = spec;
        return {
          success: true,
          video_url: "https://storage.travellink.vn/campaign-videos/test-mock-draft.mp4",
          duration_sec: spec.campaign_metadata.total_duration_sec,
          aspect_ratio: "9:16",
          resolution: "1080x1920",
          storage_bucket: "campaign-videos",
          rendered_at: new Date().toISOString(),
        };
      },
    };

    const draft = await synthesizeVideoDraft(result, capturingAdapter);
    assert.equal(draft.success, true);
    assert.equal(draft.aspect_ratio, "9:16");
    assert.equal(draft.resolution, "1080x1920");
    assert.equal(draft.duration_sec, 28.0);
    assert.ok(draft.video_url.startsWith("https://storage.travellink.vn/"));

    // Kiểm chứng capturing adapter nhận trọn vẹn 14 scenes
    const finalCaptured = capturedSpec as ReadyForRenderResult | null;
    assert.ok(finalCaptured !== null, "Capturing adapter phải nhận được renderSpec");
    assert.equal(finalCaptured.timeline_scenes.length, 14, "Renderer phải nhận đủ 14 timeline scenes");
    const uniqueAssets = new Set(finalCaptured.timeline_scenes.map((s) => s.source_asset_id));
    assert.equal(uniqueAssets.size, 14, "Mỗi scene phải có source_asset_id riêng biệt");
  }
});

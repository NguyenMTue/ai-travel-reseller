import { test } from "node:test";
import assert from "node:assert/strict";
import { generateVideoDirectorScript } from "../src/lib/video-engine/generator.ts";
import type { VideoEngineInput } from "../src/lib/video-engine/types.ts";

test("Kiểm tra bóc tách Prompt và kịch bản không bị lặp lại câu văn", () => {
  const dummyAssets = Array.from({ length: 14 }).map((_, i) => ({
    asset_id: `asset-${i}`,
    url: `https://images.unsplash.com/photo-${i}`,
    type: "IMAGE" as const,
    shot_type: i < 3 ? ("AERIAL_WIDE" as const) : ("SCENIC_MEDIUM" as const),
    resolution: "1080x1920",
    description: `Khung cảnh ${i} Bà Nà Hills tuyệt đẹp`,
  }));

  const input: VideoEngineInput = {
    merchant_name: "Sun World Bà Nà",
    product_name: "Vé Cáp Treo Bà Nà Hills",
    location: "Đà Nẵng",
    sale_price: 950000,
    original_price: 1050000,
    official_cta: "Bình luận nhận ưu đãi",
    booking_url: "https://travellink.vn/book/bana",
    target_platforms: ["TIKTOK", "INSTAGRAM_REELS"],
    content_type: "CONVERSION",
    persona: "Local Guide",
    target_duration_sec: 28,
    media_assets: dummyAssets,
    allow_3d_spatial_effects: true,
    authentic_tips: ["Đi chuyến cáp sớm nhất trước 8h30 để săn mây"],
    audio_config: {
      voice_persona_id: "vn_danang_youth_female_energetic",
      ambient_sound_tags: ["tiếng gió", "tiếng chim"],
    },
  };

  const scriptResult = generateVideoDirectorScript(input);
  assert.equal(scriptResult.status, "READY_FOR_RENDER");

  if (scriptResult.status === "READY_FOR_RENDER") {
    // 1. Kiểm tra không lặp lại câu văn "cảnh đẹp mãn nhãn và dịch vụ cực kỳ chu đáo."
    const fullScript = scriptResult.audio_config.full_voiceover_script_with_pauses;
    const occurrences = (fullScript.match(/cảnh đẹp mãn nhãn/g) || []).length;
    assert.equal(occurrences, 0, "Không được chứa câu văn lặp lại 'cảnh đẹp mãn nhãn'");

    // 2. Kiểm tra tính đa dạng của các phân cảnh trải nghiệm
    const sceneVoiceovers = scriptResult.timeline_scenes.map((s) => s.voiceover_segment);
    const uniqueSegments = new Set(sceneVoiceovers);
    assert.ok(uniqueSegments.size >= 5, "Các phân cảnh phải có nội dung thuyết minh phong phú đa dạng");

    // 3. Kiểm tra camera_motion là object hợp lệ và không bị biến thành [object object]
    const scene1 = scriptResult.timeline_scenes[0];
    assert.ok(typeof scene1.camera_motion === "object");
    assert.ok(scene1.camera_motion.effect);

    let cameraMotionStr = "";
    if (typeof scene1.camera_motion === "object" && scene1.camera_motion.effect) {
      cameraMotionStr = String(scene1.camera_motion.effect).toLowerCase().replace(/_/g, " ");
    }
    assert.ok(!cameraMotionStr.includes("object"), "Camera motion không được chứa '[object object]'");
    assert.ok(cameraMotionStr.length > 0);
  }
});

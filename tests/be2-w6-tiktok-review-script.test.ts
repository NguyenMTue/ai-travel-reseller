import test from "node:test";
import assert from "node:assert/strict";

import {
  tiktokReviewScriptSchema,
  generateDeterministicTikTokScript,
  type TikTokReviewScript,
} from "../src/lib/video-engine/tiktok-review-script.ts";
import {
  matchScenesToBrollAssets,
  calculateAssetMatchScore,
  type MediaAsset,
} from "../src/lib/video-engine/semantic-tag-matcher.ts";

test("BE2-W6-01: TikTok review script schema validates 4-scene 40-50s structure", () => {
  const validScript: TikTokReviewScript = {
    title: "Review Sun World Bà Nà Hills - Cáp treo & Cầu Vàng",
    totalDuration: 45.0,
    scenes: [
      {
        sceneNumber: 1,
        role: "hook",
        duration: 6.0,
        voiceover: "Bạn đã từng ngắm mây trôi dưới chân mình tại Cầu Vàng chưa?",
        visualTag: "golden_bridge_aerial",
      },
      {
        sceneNumber: 2,
        role: "experience",
        duration: 19.0,
        voiceover: "Cáp treo đưa bạn lên đỉnh Bà Nà, dạo bước qua làng Pháp cổ kính và hòa mình vào lễ hội rực rỡ.",
        visualTag: "cable_car_french_village",
      },
      {
        sceneNumber: 3,
        role: "pricing",
        duration: 12.0,
        voiceover: "Vé trọn gói hiện có giá ưu đãi chỉ 950.000 VNĐ, tiết kiệm hơn so với giá niêm yết 1.250.000 VNĐ.",
        visualTag: "ticket_pricing_info",
      },
      {
        sceneNumber: 4,
        role: "cta",
        duration: 8.0,
        voiceover: "Nhấn ngay vào liên kết góc màn hình để đặt vé chính hãng và nhận mã ưu đãi sớm nhất!",
        visualTag: "cta_booking_action",
      },
    ],
  };

  const parsed = tiktokReviewScriptSchema.safeParse(validScript);
  assert.equal(parsed.success, true);
});

test("BE2-W6-01: Rejects scripts with wrong duration, wrong scene count, or wrong roles order", () => {
  // Reject < 40s
  const tooShort = {
    title: "Review ngắn",
    totalDuration: 25.0,
    scenes: [
      { sceneNumber: 1, role: "hook", duration: 5.0, voiceover: "Hook", visualTag: "tag1" },
      { sceneNumber: 2, role: "experience", duration: 10.0, voiceover: "Exp", visualTag: "tag2" },
      { sceneNumber: 3, role: "pricing", duration: 5.0, voiceover: "Price", visualTag: "tag3" },
      { sceneNumber: 4, role: "cta", duration: 5.0, voiceover: "CTA", visualTag: "tag4" },
    ],
  };
  assert.equal(tiktokReviewScriptSchema.safeParse(tooShort).success, false);

  // Reject wrong roles order
  const wrongOrder = {
    title: "Review sai thứ tự",
    totalDuration: 45.0,
    scenes: [
      { sceneNumber: 1, role: "pricing", duration: 12.0, voiceover: "Giá trước", visualTag: "tag1" },
      { sceneNumber: 2, role: "hook", duration: 6.0, voiceover: "Hook sau", visualTag: "tag2" },
      { sceneNumber: 3, role: "experience", duration: 19.0, voiceover: "Exp", visualTag: "tag3" },
      { sceneNumber: 4, role: "cta", duration: 8.0, voiceover: "CTA", visualTag: "tag4" },
    ],
  };
  assert.equal(tiktokReviewScriptSchema.safeParse(wrongOrder).success, false);
});

test("BE2-W6-01: Deterministic generator produces valid TikTok review script", () => {
  const tour = {
    name: "Vé Cáp Treo Sun World Ba Na Hills",
    location: "Đà Nẵng",
    sale_price: 950_000,
    original_price: 1_250_000,
  };

  const script = generateDeterministicTikTokScript(tour);
  const parsed = tiktokReviewScriptSchema.safeParse(script);
  assert.equal(parsed.success, true);
  assert.equal(script.scenes.length, 4);
  assert.equal(script.scenes[0].role, "hook");
  assert.equal(script.scenes[1].role, "experience");
  assert.equal(script.scenes[2].role, "pricing");
  assert.equal(script.scenes[3].role, "cta");
  assert.ok(script.totalDuration >= 40.0 && script.totalDuration <= 50.0);
});

test("BE2-W6-03: Semantic Tag Matcher prioritizes videos and scores tags accurately", () => {
  const scenes = [
    {
      sceneNumber: 1,
      role: "hook" as const,
      duration: 6.0,
      visualTag: "golden_bridge",
      voiceover: "Cầu Vàng Bà Nà tuyệt đẹp",
    },
    {
      sceneNumber: 2,
      role: "experience" as const,
      duration: 19.0,
      visualTag: "cable_car",
      voiceover: "Cáp treo vượt mây",
    },
  ];

  const library: MediaAsset[] = [
    {
      id: "video-golden-bridge",
      name: "Flycam Cầu Vàng",
      type: "video",
      tags: ["golden_bridge", "drone", "aerial"],
      url: "https://cdn.example.com/broll/bridge.mp4",
    },
    {
      id: "image-golden-bridge",
      name: "Ảnh chụp Cầu Vàng",
      type: "image",
      tags: ["golden_bridge"],
      url: "https://cdn.example.com/broll/bridge.jpg",
    },
    {
      id: "video-cable-car",
      name: "Cáp treo lên đỉnh núi",
      type: "video",
      tags: ["cable_car", "activity"],
      url: "https://cdn.example.com/broll/cable.mp4",
    },
  ];

  // Video version of golden bridge should score higher than image version due to MP4 bonus
  const videoScore = calculateAssetMatchScore(scenes[0], library[0]);
  const imageScore = calculateAssetMatchScore(scenes[0], library[1]);
  assert.ok(videoScore > imageScore, "Video must score higher than static image for TikTok");

  const matched = matchScenesToBrollAssets(scenes, library);
  assert.equal(matched.length, 2);
  assert.equal(matched[0].matchedAsset?.id, "video-golden-bridge");
  assert.equal(matched[1].matchedAsset?.id, "video-cable-car");
});


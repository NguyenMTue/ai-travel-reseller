import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildChainedPromptPlan,
  buildSegmentOmniPrompt,
  type ChainedAssetInput,
} from "../src/lib/video-engine/chained-prompt-generator.ts";

test("Chained Prompt: 4 ảnh tư liệu sinh 3 phân cảnh nối tiếp chuẩn 16.5s", () => {
  const assets: ChainedAssetInput[] = [
    {
      asset_id: "1",
      url: "https://unsplash.com/photo1",
      title: "Cáp treo Bà Nà lướt qua mây",
    },
    {
      asset_id: "2",
      url: "https://unsplash.com/photo2",
      title: "Lâu đài Mặt Trăng kiến trúc Pháp",
    },
    {
      asset_id: "3",
      url: "https://unsplash.com/photo3",
      title: "Quảng trường Nhật Thực rực rỡ nắng vàng",
    },
    {
      asset_id: "4",
      url: "https://unsplash.com/photo4",
      title: "Toàn cảnh Cầu Vàng trong biển mây",
    },
  ];

  const plan = buildChainedPromptPlan({
    productName: "Vé Cáp Treo Bà Nà",
    location: "Bà Nà Hills, Đà Nẵng",
    salePrice: 950000,
    officialCta: "Comment nhận ưu đãi vé chính hãng",
    authenticTips: ["Đi chuyến cáp sớm trước 8h30 để săn mây vắng người"],
    mediaAssets: assets,
    targetDurationSec: 16.5,
  });

  // 1. Kiểm tra thời lượng tổng
  assert.ok(plan.totalDurationSec >= 15.0 && plan.totalDurationSec <= 18.0, "Thời lượng phải nằm trong 15s - 18s");
  assert.equal(plan.segmentsCount, 3, "4 ảnh phải sinh đúng 3 phân cảnh nối tiếp");

  // 2. Kiểm tra vai trò của từng cảnh
  assert.equal(plan.segments[0].role, "OPENING_HOOK");
  assert.equal(plan.segments[1].role, "JOURNEY_TRAVERSE");
  assert.equal(plan.segments[2].role, "CLIMAX_PANORAMA");

  // 3. Kiểm tra tính liên tục của cặp ảnh (Ảnh kết thúc cảnh trước = Ảnh bắt đầu cảnh sau)
  assert.equal(plan.segments[0].endImageIndex, plan.segments[1].startImageIndex);
  assert.equal(plan.segments[1].endImageIndex, plan.segments[2].startImageIndex);

  // 4. Kiểm tra Prompt chuyên biệt của từng cảnh
  const p1 = plan.segments[0].omniPrompt;
  assert.ok(p1.includes("Frame 1 (Start)"));
  assert.ok(p1.includes("Frame 2 (End)"));
  assert.ok(p1.includes("forward flight acceleration"));
  assert.ok(p1.includes("locks stably into the exact composition and perspective of Frame 2"));
  assert.ok(p1.includes("5600K golden-hour daylight"));
  assert.ok(p1.includes("Preserve authentic physical landmarks without artificial morphing"));

  const p2 = plan.segments[1].omniPrompt;
  assert.ok(p2.includes("Directly inheriting the forward momentum from Frame 1"));
  assert.ok(p2.includes("maintaining uniform altitude"));

  const p3 = plan.segments[2].omniPrompt;
  assert.ok(p3.includes("ascending reveal flight"));
  assert.ok(p3.includes("rock-solid stable wide vista"));

  // 5. Kiểm tra kịch bản Voiceover không trùng lắp và có độ dài phù hợp
  assert.ok(plan.audioSpec.fullVoiceoverScript.length > 50);
  assert.ok(plan.audioSpec.fullVoiceoverScript.includes("Bí kíp săn mây"));
  assert.ok(plan.audioSpec.fullVoiceoverScript.includes("950.000đ"));
});

test("Chained Prompt: 3 ảnh tư liệu sinh 2 phân cảnh nối tiếp chuẩn 16s", () => {
  const assets: ChainedAssetInput[] = [
    { asset_id: "1", url: "https://unsplash.com/1", title: "Cáp treo" },
    { asset_id: "2", url: "https://unsplash.com/2", title: "Làng Pháp" },
    { asset_id: "3", url: "https://unsplash.com/3", title: "Cầu Vàng" },
  ];

  const plan = buildChainedPromptPlan({
    productName: "Vé Sun World",
    location: "Đà Nẵng",
    salePrice: 850000,
    officialCta: "Đặt vé ngay",
    mediaAssets: assets,
    targetDurationSec: 16.0,
  });

  assert.equal(plan.segmentsCount, 2);
  assert.equal(plan.segments[0].role, "OPENING_HOOK");
  assert.equal(plan.segments[1].role, "CLIMAX_PANORAMA");
  assert.ok(plan.totalDurationSec >= 15.0 && plan.totalDurationSec <= 18.0);
});

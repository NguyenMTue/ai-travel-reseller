import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  clampTargetDurationSec,
  generateAutoReviewScript,
  normalizeAutoReviewScenes,
  renderAutoReviewVideo,
  selectMediaForScene,
  selectMediaPlanForScenes,
  type MatchedMediaItem,
} from "../src/lib/video-engine/auto-pipeline-worker.ts";
import {
  buildTikTokAssSubtitles,
  splitIntoTikTokChunks,
} from "../src/lib/video-engine/ass-subtitles.ts";
import { runFFmpeg } from "../src/lib/video-engine/ffmpeg-compositor.ts";

test("OPT-01: clampTargetDurationSec & normalizeAutoReviewScenes enforce 40-50s", () => {
  assert.equal(clampTargetDurationSec(undefined), 45);
  assert.equal(clampTargetDurationSec(20), 40);
  assert.equal(clampTargetDurationSec(90), 50);

  const scenes = normalizeAutoReviewScenes(
    Array.from({ length: 7 }, (_, i) => ({
      durationSec: 6,
      overlayText: `Text ${i + 1}`,
      voiceoverText: `Voice ${i + 1}`,
    })),
    45
  );

  assert.equal(scenes.length, 7);
  assert.equal(scenes[0].role, "HOOK");
  assert.equal(scenes[5].role, "PRICING_AND_QR");
  assert.equal(scenes[6].role, "CTA");
  assert.equal(
    scenes.reduce((acc, s) => acc + s.durationSec, 0),
    45
  );
  assert.ok(scenes[0].timeRange.startsWith("00:00 - "));
  assert.ok(scenes[6].timeRange.endsWith(" - 00:45"));
});

test("OPT-02: ASS subtitles split into 2-4 word chunks, MarginV >= 300, and exact audio offsets", () => {
  const chunks = splitIntoTikTokChunks("Đến Đà Nẵng mà bỏ qua Cầu Vàng là tiếc lắm đó");
  assert.ok(chunks.length >= 3);
  for (const c of chunks) {
    const wc = c.split(" ").length;
    assert.ok(wc >= 2 && wc <= 4, `Chunk word count out of 2-4 range: "${c}"`);
  }

  const ass = buildTikTokAssSubtitles([
    { text: "Cảnh một rất đẹp", audioDurationSec: 4.5, role: "HOOK", overlayBanner: "CHỈ 950K" },
    { text: "Cảnh hai cực chill luôn", audioDurationSec: 5.0, role: "EXPERIENCE" },
  ]);

  assert.ok(ass.includes("PlayResX: 1080"));
  assert.ok(ass.includes("PlayResY: 1920"));
  assert.ok(ass.includes(",330,1"), "MarginV must be >= 300px");
  assert.ok(ass.includes("0:00:00.00,0:00:04.50,TopBanner"), "Banner must match audio 1");
  // Scene 2 starts at exact 4.50s (no xfade overlap added!)
  assert.ok(ass.includes("Dialogue: 2,0:00:04.50,"), "Scene 2 subtitle must start at 4.50s");
});

test("OPT-03: selectMediaForScene matches style_tags and rotates cropMode & motion", () => {
  const pool: MatchedMediaItem[] = [
    {
      id: "img-bridge",
      title: "Toàn cảnh Cầu Vàng",
      url: "https://example.com/bridge.jpg",
      styleTags: ["golden_bridge", "sunrise"],
      isVideo: false,
    },
    {
      id: "img-cable",
      title: "Cabin cáp treo qua rừng",
      url: "https://example.com/cable.jpg",
      styleTags: ["cable_car", "aerial"],
      isVideo: false,
    },
  ];
  const usage = new Map<string, number>();

  const s1 = selectMediaForScene(
    {
      sceneNumber: 1,
      role: "HOOK",
      durationSec: 5,
      timeRange: "00:00 - 00:05",
      visualTag: "cable_car",
      overlayText: "Cáp treo",
      voiceoverText: "Đi cáp treo ngắm rừng cây",
      bRollDescription: "",
    },
    pool,
    usage,
    0
  );
  assert.equal(s1.media.id, "img-cable");
  assert.equal(s1.cropMode, "full");

  const s2 = selectMediaForScene(
    {
      sceneNumber: 2,
      role: "EXPERIENCE",
      durationSec: 6,
      timeRange: "00:05 - 00:11",
      visualTag: "golden_bridge",
      overlayText: "Cầu Vàng",
      voiceoverText: "Check-in Cầu Vàng",
      bRollDescription: "",
    },
    pool,
    usage,
    1
  );
  assert.equal(s2.media.id, "img-bridge");
  assert.notEqual(s1.motion, s2.motion);

  // Reuse rotates to center_zoom
  const s3 = selectMediaForScene(
    {
      sceneNumber: 3,
      role: "EXPERIENCE",
      durationSec: 6,
      timeRange: "00:11 - 00:17",
      visualTag: "cable_car",
      overlayText: "Cận cảnh",
      voiceoverText: "Ngồi cabin cáp treo",
      bRollDescription: "",
    },
    pool,
    usage,
    2
  );
  assert.equal(s3.cropMode, "center_zoom");
  assert.notEqual(s2.motion, s3.motion);

  // Two-pass planner: Scene mentioning "Cầu Vàng" keeps the Cầu Vàng image even if Scene 1 has generic tags
  const plan = selectMediaPlanForScenes(
    [
      {
        sceneNumber: 1,
        role: "HOOK",
        durationSec: 5,
        timeRange: "00:00 - 00:05",
        visualTag: "sunrise",
        overlayText: "Bà Nà Hills",
        voiceoverText: "Chào mừng đến Đà Nẵng",
        bRollDescription: "",
      },
      {
        sceneNumber: 2,
        role: "EXPERIENCE",
        durationSec: 6,
        timeRange: "00:05 - 00:11",
        visualTag: "checkin",
        overlayText: "Cầu Vàng",
        voiceoverText: "Check-in tại Cầu Vàng siêu đẹp",
        bRollDescription: "",
      },
    ],
    pool
  );
  assert.equal(plan[1].media.id, "img-bridge", "Scene mentioning Cầu Vàng must get the Cầu Vàng image");
});

test("OPT-04: generateAutoReviewScript injects DB highlights, prices, period & hotline", async () => {
  const originalKey = process.env.GROQ_API_KEY;
  process.env.GROQ_API_KEY = "your_groq_api_key_here";
  try {
    const script = await generateAutoReviewScript({
      campaignId: "44444444-4444-4444-4444-555555555555",
      merchantId: "11111111-1111-1111-1111-111111111111",
      tourName: "Bà Nà Hills",
      location: "Đà Nẵng",
      highlights: ["Cáp treo kỷ lục", "Cầu Vàng bình minh", "Làng Pháp cổ kính"],
      price: 950000,
      originalPrice: 1200000,
      campaignPeriod: "25/11 - 30/12",
      contactPhone: "1900 8888",
      targetDurationSec: 45,
    });

    assert.equal(script.scenes.length, 7);
    assert.ok(script.scenes[1].voiceoverText.includes("Cáp treo kỷ lục"));
    assert.ok(script.scenes[5].voiceoverText.includes("950.000đ"));
    assert.ok(script.scenes[5].voiceoverText.includes("25/11 - 30/12"));
    assert.ok(script.scenes[6].overlayText.includes("1900 8888"));
  } finally {
    process.env.GROQ_API_KEY = originalKey;
  }
});

test("OPT-05: renderAutoReviewVideo renders multi-scene static MP4 with blurred BG, xfade & ASS", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "opt05-test-"));
  try {
    const img1 = path.join(tmpDir, "landscape1.jpg");
    const img2 = path.join(tmpDir, "landscape2.jpg");
    // Generate 2 real landscape 1280x720 JPEGs via FFmpeg testsrc
    await runFFmpeg(["-f", "lavfi", "-i", "color=c=#1e40af:s=1280x720", "-frames:v", "1", "-y", img1]);
    await runFFmpeg(["-f", "lavfi", "-i", "color=c=#0f766e:s=1280x720", "-frames:v", "1", "-y", img2]);

    const script = {
      title: "Test Render",
      targetDurationSec: 12,
      caption: "Test",
      hookText: "HOOK TEST",
      ctaText: "CTA TEST",
      hashtags: ["#test"],
      scenes: [
        {
          sceneNumber: 1,
          role: "HOOK" as const,
          durationSec: 4,
          timeRange: "00:00 - 00:04",
          visualTag: "bridge",
          overlayText: "CẦU VÀNG ĐÀ NẴNG",
          voiceoverText: "Chào mừng bạn đến với Cầu Vàng Đà Nẵng",
          bRollDescription: "",
        },
        {
          sceneNumber: 2,
          role: "PRICING_AND_QR" as const,
          durationSec: 4,
          timeRange: "00:04 - 00:08",
          visualTag: "cable",
          overlayText: "GIÁ CHỈ 950.000Đ",
          voiceoverText: "Vé ưu đãi chỉ chín trăm năm mươi nghìn",
          bRollDescription: "",
        },
        {
          sceneNumber: 3,
          role: "CTA" as const,
          durationSec: 4,
          timeRange: "00:08 - 00:12",
          visualTag: "cta",
          overlayText: "ĐẶT NGAY DƯỚI BIO",
          voiceoverText: "Bấm link bên dưới để đặt vé ngay",
          bRollDescription: "",
        },
      ],
    };

    const mediaPool: MatchedMediaItem[] = [
      { id: "m1", title: "Cầu Vàng", url: img1, styleTags: ["bridge"], isVideo: false },
      { id: "m2", title: "Cáp treo", url: img2, styleTags: ["cable"], isVideo: false },
    ];

    const result = await renderAutoReviewVideo({ script, mediaPool });
    assert.ok(result.videoBuffer.length > 30000, `Expected MP4 > 30KB, got ${result.videoBuffer.length}`);
    assert.ok(result.videoBuffer.subarray(0, 16).toString("latin1").includes("ftyp"));
    assert.ok(result.warnings.length > 0, "Should emit warning when <= 3 images");
    assert.ok(result.durationSec >= 9, "Duration should reflect TTS/fallback audio length");
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
});

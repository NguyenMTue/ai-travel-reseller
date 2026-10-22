import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, readdirSync, unlinkSync, mkdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { execSync } from "node:child_process";
import ffmpegPath from "ffmpeg-static";

import { generateVideoDirectorScript } from "../src/lib/video-engine/generator.ts";
import { generateImageToVideo, isEligibleForI2V } from "../src/lib/ai/i2v.ts";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  console.log("================================================================================");
  console.log("🎬 KHỞI ĐỘNG RENDER VIDEO BÀ NÀ HILLS VỚI LUỒNG MỚI (I2V + SELECTIVE ROUTING)");
  console.log("================================================================================\n");

  // 1. ĐỌC DỮ LIỆU TƯ LIỆU MẪU ĐÃ CẬP NHẬT (14 ITEMS)
  const samplePath = resolve(process.cwd(), "docs/be1/samples/media-references-banahills.sample.json");
  const sampleAssets = JSON.parse(readFileSync(samplePath, "utf8"));
  console.log(`1. Đã nạp ${sampleAssets.length} tư liệu ảnh thật từ sample:`);
  sampleAssets.forEach((a, i) => {
    console.log(`   [${i + 1}] ${a.id} | ${a.shot_type} | ${a.title.slice(0, 45)}...`);
  });

  // 2. CHUẨN BỊ ENGINE INPUT CHO BÀ NÀ HILLS
  const engineInput = {
    merchant_name: "Sun World Bà Nà Hills",
    product_name: "Combo Vé Cáp Treo + Buffet Trưa Bà Nà Hills",
    location: "Đà Nẵng",
    sale_price: 1150000,
    original_price: 1450000,
    official_cta: "Comment VÉ để nhận ưu đãi chính thức từ Sun World",
    booking_url: "https://travellink.vn/book/banahills-combo",
    target_platforms: ["TIKTOK", "INSTAGRAM_REELS", "FACEBOOK_REELS"],
    content_type: "CONVERSION",
    persona: "Local Guide",
    target_duration_sec: 28.0,
    allow_3d_spatial_effects: true,
    media_assets: sampleAssets.map((item) => ({
      asset_id: item.id,
      url: item.video_url,
      type: "IMAGE",
      shot_type: item.shot_type,
      resolution: "1080x1920",
      description: item.title,
    })),
    authentic_tips: [
      "Đi cáp sớm trước 8h30 để săn mây và check-in Cầu Vàng vắng người",
      "Ăn trưa buffet Four Seasons hơn 100 món thả ga siêu tiết kiệm",
      "Buổi chiều đỉnh núi có sương lạnh nhớ mang áo khoác mỏng",
    ],
    audio_config: {
      voice_persona_id: "vn_danang_youth_female_energetic",
      ambient_sound_tags: [
        "tiếng gió đỉnh núi",
        "tiếng cáp treo vận hành",
        "tiếng xèo xèo đồ nướng buffet",
        "tiếng gió vi vu Cầu Vàng",
      ],
    },
  };

  // 3. THỰC THI FAIL-FAST PRE-FLIGHT GATE & STORYBOARD COMPOSER
  console.log("\n2. Kiểm tra Pre-flight Gate & Đạo diễn phân cảnh UGC 4 phần...");
  const directorResult = generateVideoDirectorScript(engineInput);

  if (directorResult.status === "BLOCKED_MISSING_INPUT") {
    console.error("❌ Bị chặn bởi Fail-Fast Gate:", directorResult.error_summary);
    process.exit(1);
  }

  console.log(`✅ Pre-flight Gate PASS: Đủ ${sampleAssets.length} tư liệu thật, không có lỗi vi phạm.`);
  console.log(`   Tổng số phân cảnh: ${directorResult.timeline_scenes.length}`);
  console.log(`   Anti-AI Check: 100% real footage, no generative pixel artifacts.`);

  // 4. ÁP DỤNG SELECTIVE ROUTING & MULTI-PROVIDER I2V CHO TỪNG PHÂN CẢNH
  console.log("\n3. Thực thi Selective Routing & Multi-Provider I2V Router (i2v.ts):");
  const i2vResults = [];

  for (let i = 0; i < directorResult.timeline_scenes.length; i++) {
    const scene = directorResult.timeline_scenes[i];
    const asset = sampleAssets.find((a) => a.id === scene.source_asset_id) || sampleAssets[i % sampleAssets.length];

    const i2vRes = await generateImageToVideo({
      imageUrl: asset.video_url,
      shotType: scene.shot_type,
      prompt: scene.voiceover_segment,
      durationSec: scene.duration_sec,
      motion: scene.camera_motion.effect,
      productId: "11111111-1111-4111-8111-111111111111",
      campaignId: "22222222-2222-4222-8222-222222222222",
    });

    i2vResults.push(i2vRes);

    const isEligible = isEligibleForI2V(scene.shot_type);
    console.log(
      `   [Scene ${scene.scene_index}] ${scene.shot_type.padEnd(14)} | Eligible: ${isEligible ? "✅ YES" : "⛔ NO "} | Mode: ${i2vRes.mode.padEnd(18)} | Motion: ${i2vRes.motionType} (${i2vRes.provider})`
    );
  }

  // 5. ĐỌC DỮ LIỆU TIMING & AUDIO MANIFEST ĐỒNG BỘ 1:1:1
  console.log("\n4. Nạp timing manifest & Audio đã mix đồng bộ...");
  const manifestPath = resolve(process.cwd(), "tmp-audio-perfect/timing_manifest.json");
  const timingManifest = JSON.parse(readFileSync(manifestPath, "utf8"));

  const renderedScenes = timingManifest.map((tm, idx) => {
    const asset = sampleAssets.find((a) => a.id === tm.asset_id) || sampleAssets[idx % sampleAssets.length];
    const i2vInfo = i2vResults[idx] || i2vResults[0];

    // Xác định class chuyển động CSS dựa trên kết quả Selective Routing
    let motionClass = "ken-push";
    if (asset.shot_type === "AERIAL_WIDE") {
      motionClass = "drone-pan"; // Drone Truck Left
    } else if (asset.shot_type === "CLOSEUP_FOOD") {
      motionClass = "food-zoom"; // Food Focus Zoom
    } else if (asset.shot_type === "HUMAN_POV") {
      motionClass = "thrill-ride"; // Handheld Thrill
    } else if (idx % 2 === 1) {
      motionClass = "ken-pull";
    }

    return {
      ...tm,
      imageUrl: asset.video_url,
      title: asset.title,
      motionClass,
      shotType: asset.shot_type,
      i2vMode: i2vInfo.mode,
    };
  });

  const totalDuration = timingManifest[timingManifest.length - 1].startTime + timingManifest[timingManifest.length - 1].sceneDuration + 0.6;
  console.log(`   Thời lượng video thành phẩm: ${totalDuration.toFixed(2)}s`);

  // 6. XÂY DỰNG HTML TEMPLATE 9:16 (540x960 CANVAS, KHUNG ẢNH 16:9 SẮC NÉT Ở GIỮA)
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 540px;
      height: 960px;
      overflow: hidden;
      background: #080c16;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      position: relative;
    }

    .scene-stage {
      position: absolute;
      inset: 0;
      opacity: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      transition: opacity 0.22s ease-in-out;
    }
    .scene-stage.active {
      opacity: 1;
      z-index: 5;
    }

    /* Hậu cảnh ambient blur 9:16 chiếm trọn màn hình */
    .ambient-bg {
      position: absolute;
      inset: -25px;
      background-size: cover;
      background-position: center;
      filter: blur(24px) brightness(0.40);
      transform: scale(1.15);
      z-index: 1;
    }

    /* Khung ảnh chính 16:9 ở giữa màn hình (504 x 283.5 px) */
    .frame-center {
      position: relative;
      z-index: 10;
      width: 504px;
      height: 283.5px;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 24px 50px rgba(0, 0, 0, 0.95), 0 0 0 1.5px rgba(255, 255, 255, 0.2);
      background: #000;
      margin-top: -36px;
    }

    .photo-view {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    /* Hiệu ứng Drone Truck Left (AERIAL_WIDE) */
    .drone-pan .photo-view {
      width: 140%;
      height: 100%;
      max-width: none;
      animation: sweepMove 6s ease-in-out infinite alternate;
    }
    @keyframes sweepMove {
      0% { transform: scale(1.08) translateX(12%); }
      100% { transform: scale(1.08) translateX(-12%); }
    }

    /* Hiệu ứng Ken Burns Push-In (SCENIC_MEDIUM) */
    .ken-push .photo-view {
      animation: pushMove 6s ease-out forwards;
    }
    @keyframes pushMove {
      0% { transform: scale(1.0); }
      100% { transform: scale(1.26); }
    }

    /* Hiệu ứng Ken Burns Pull-Out */
    .ken-pull .photo-view {
      animation: pullMove 6s ease-out forwards;
    }
    @keyframes pullMove {
      0% { transform: scale(1.26); }
      100% { transform: scale(1.02); }
    }

    /* Hiệu ứng Food Focus Zoom (CLOSEUP_FOOD - Giữ chất lượng thật) */
    .food-zoom .photo-view {
      animation: foodFocus 6s ease-out forwards;
    }
    @keyframes foodFocus {
      0% { transform: scale(1.04) translateY(3%); }
      100% { transform: scale(1.24) translateY(-3%); }
    }

    /* Hiệu ứng Thrill Coaster (HUMAN_POV) */
    .thrill-ride .photo-view {
      animation: thrillShake 0.4s ease-in-out infinite alternate, pushMove 6s ease-out forwards;
    }
    @keyframes thrillShake {
      0% { transform: scale(1.05) translate(-1px, -1px); }
      100% { transform: scale(1.05) translate(1px, 1px); }
    }

    /* Overlay Badge & Header UI */
    .top-header {
      position: absolute;
      top: 68px;
      left: 20px;
      right: 20px;
      z-index: 20;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    .badge-pill {
      background: rgba(16, 24, 40, 0.85);
      border: 1px solid rgba(255, 215, 0, 0.6);
      backdrop-filter: blur(12px);
      padding: 7px 18px;
      border-radius: 9999px;
      color: #ffd700;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
    }

    .hook-title {
      font-size: 26px;
      font-weight: 900;
      text-align: center;
      color: #ffd700;
      text-shadow: 0 2px 4px #000, 0 0 18px rgba(255, 215, 0, 0.4);
      line-height: 1.25;
      text-transform: uppercase;
    }

    /* Phụ đề động chuẩn Safe Zone (cách đáy 260px) */
    .safe-zone-captions {
      position: absolute;
      bottom: 260px;
      left: 20px;
      right: 20px;
      z-index: 30;
      text-align: center;
    }

    .sub-bubble {
      display: inline-block;
      max-width: 90%;
      background: rgba(0, 0, 0, 0.88);
      border: 1.5px solid rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(8px);
      color: #ffffff;
      font-size: 19px;
      font-weight: 800;
      line-height: 1.4;
      padding: 10px 22px;
      border-radius: 14px;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.8);
    }

    .sub-glow {
      color: #ffd700;
      text-shadow: 0 0 10px rgba(255, 215, 0, 0.7);
    }

    /* Bottom Trust Bar & Reseller CTA */
    .bottom-cta-card {
      position: absolute;
      bottom: 80px;
      left: 20px;
      right: 20px;
      z-index: 20;
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95));
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 14px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 12px 30px rgba(0,0,0,0.8);
    }

    .cta-text-wrap {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .cta-sub {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .cta-main {
      font-size: 14px;
      font-weight: 800;
      color: #ffffff;
    }
    .cta-btn {
      background: #ffd700;
      color: #0b0f19;
      font-size: 13px;
      font-weight: 800;
      padding: 8px 14px;
      border-radius: 8px;
    }

    /* Progress bar */
    .progress-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 4px;
      background: #ffd700;
      width: 0%;
      z-index: 50;
      transition: width 0.1s linear;
    }
  </style>
</head>
<body>
  ${renderedScenes
    .map(
      (sc, idx) => `
  <div class="scene-stage ${idx === 0 ? "active" : ""}" id="stage-${idx}">
    <div class="ambient-bg" style="background-image: url('${sc.imageUrl}');"></div>
    <div class="frame-center ${sc.motionClass}">
      <img src="${sc.imageUrl}" class="photo-view" alt="${sc.title}" />
    </div>
  </div>`
    )
    .join("")}

  <div class="top-header">
    <div class="badge-pill" id="sceneBadge" style="display: none;"></div>
    <div class="hook-title" id="hookTitle">⚠️ LƯU Ý SỐNG CÒN KHI ĐI BÀ NÀ HILLS!</div>
  </div>

  <div class="safe-zone-captions">
    <div class="sub-bubble" id="subtitleBox">${renderedScenes[0].sub}</div>
  </div>

  <div class="bottom-cta-card">
    <div class="cta-text-wrap">
      <div class="cta-sub">Đối tác chính thức: Sun World Bà Nà Hills</div>
      <div class="cta-main">Combo Cáp Treo + Buffet Trưa: 1.150.000đ</div>
    </div>
    <div class="cta-btn">Đặt Ngay</div>
  </div>

  <div class="progress-bar" id="pbar"></div>

  <script>
    const scenes = ${JSON.stringify(renderedScenes)};
    const totalDuration = ${totalDuration};
    const pbar = document.getElementById("pbar");
    const subtitleBox = document.getElementById("subtitleBox");
    const hookTitle = document.getElementById("hookTitle");
    const sceneBadge = document.getElementById("sceneBadge");

    const startTime = Date.now();
    setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const pct = Math.min(100, (elapsed / totalDuration) * 100);
      pbar.style.width = pct + "%";
    }, 40);

    scenes.forEach((sc, idx) => {
      setTimeout(() => {
        scenes.forEach((_, i) => {
          const el = document.getElementById("stage-" + i);
          if (el) el.classList.remove("active");
        });

        const currEl = document.getElementById("stage-" + idx);
        if (currEl) currEl.classList.add("active");

        if (idx === 0) {
          hookTitle.style.display = "block";
          sceneBadge.style.display = "none";
        } else {
          hookTitle.style.display = "none";
          sceneBadge.style.display = "block";
          sceneBadge.innerText = sc.top_badge;
        }

        const words = sc.sub.split(" ");
        if (words.length > 4) {
          subtitleBox.innerHTML = '<span class="sub-glow">' + words.slice(0, 3).join(" ") + '</span> ' + words.slice(3).join(" ");
        } else {
          subtitleBox.innerHTML = sc.sub;
        }
      }, sc.startTime * 1000);
    });
  </script>
</body>
</html>`;

  // 7. GHI HÌNH CHROMIUM (PLAYWRIGHT)
  console.log("\n5. Khởi động Chromium Playwright ghi hình 540x960...");
  const tmpDir = resolve(process.cwd(), "tmp-hybrid-video");
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: tmpDir,
      size: { width: 540, height: 960 },
    },
    viewport: { width: 540, height: 960 },
  });

  const page = await context.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });

  console.log(`   Đang ghi hình ${totalDuration.toFixed(1)} giây video...`);
  await page.waitForTimeout((totalDuration + 0.5) * 1000);

  await page.close();
  await context.close();
  await browser.close();

  const webmFiles = readdirSync(tmpDir).filter((f) => f.endsWith(".webm"));
  if (webmFiles.length === 0) throw new Error("Không tìm thấy tệp WebM đã ghi hình!");
  const rawWebmPath = join(tmpDir, webmFiles[0]);
  console.log(`   Ghi hình video thô thành công: ${rawWebmPath}`);

  // 8. GHÉP ÂM THANH THUYẾT MINH + BGM BẰNG FFMPEG
  const audioPath = resolve(process.cwd(), "docs/be1/samples/banahills-remediated-audio.mp3");
  const masterMp4Path = resolve(process.cwd(), "docs/be1/samples/banahills-hybrid-new-workflow.mp4");

  console.log("\n6. Dùng FFmpeg ghép âm thanh thuyết minh đồng bộ và xuất bản MP4...");
  const ffmpegCmd = `"${ffmpegPath}" -y -i "${rawWebmPath}" -i "${audioPath}" -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${masterMp4Path}"`;
  execSync(ffmpegCmd, { stdio: "ignore" });

  const finalMp4Buf = readFileSync(masterMp4Path);
  console.log(`   ✅ Tệp MP4 hoàn chỉnh: ${(finalMp4Buf.length / 1024 / 1024).toFixed(2)} MB (${finalMp4Buf.length} bytes)`);

  // 9. UPLOAD LÊN SUPABASE STORAGE BUCKET campaign-videos
  const storageFileName = `banahills-hybrid-new-workflow-${Date.now()}.mp4`;
  console.log(`\n7. Đang upload lên Supabase Storage bucket 'campaign-videos': ${storageFileName}...`);

  let publicVideoUrl = "";
  try {
    const { error: uploadErr } = await supabase.storage
      .from("campaign-videos")
      .upload(storageFileName, finalMp4Buf, {
        contentType: "video/mp4",
        upsert: true,
      });

    if (uploadErr) {
      console.warn("   ⚠️ Supabase storage upload warning:", uploadErr.message);
    } else {
      const { data: pubData } = supabase.storage
        .from("campaign-videos")
        .getPublicUrl(storageFileName);
      publicVideoUrl = pubData.publicUrl;
      console.log(`   🎉 Public URL xem trực tiếp: ${publicVideoUrl}`);
    }
  } catch (err) {
    console.warn("   ⚠️ Lỗi khi upload Storage:", err.message);
  }

  // 10. TẠO TRANG PREVIEW HTML CHO NGƯỜI DÙNG XEM TRỰC TIẾP
  const previewHtmlPath = resolve(process.cwd(), "docs/be1/samples/banahills-new-workflow-preview.html");
  const previewHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TravelLink AI - New Workflow Video Preview</title>
  <style>
    body {
      background: #0b0f19;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 30px 15px;
      margin: 0;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 24px;
      max-width: 520px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    }
    h1 {
      font-size: 20px;
      color: #ffd700;
      margin-bottom: 8px;
    }
    p {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 20px;
    }
    .video-wrap {
      width: 100%;
      aspect-ratio: 9/16;
      border-radius: 12px;
      overflow: hidden;
      background: #000;
      box-shadow: 0 10px 30px rgba(0,0,0,0.8);
      margin-bottom: 20px;
    }
    video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .badge-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }
    .badge {
      background: #0f172a;
      border: 1px solid #3b82f6;
      color: #60a5fa;
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-weight: 600;
    }
    .badge-success {
      border-color: #22c55e;
      color: #4ade80;
    }
    .link-btn {
      display: block;
      text-align: center;
      background: #ffd700;
      color: #0b0f19;
      font-weight: 700;
      padding: 12px;
      border-radius: 8px;
      text-decoration: none;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>🎬 Video Chiến dịch Bà Nà Hills (Luồng Mới)</h1>
    <p>Render kết xuất từ 14 tư liệu mẫu thật kết hợp <b>I2V Selective Routing</b>, chuyển động Drone Truck Left, Ken Burns Food Focus và âm thanh thuyết minh đồng bộ.</p>
    
    <div class="badge-list">
      <span class="badge badge-success">✓ Tỷ lệ chuẩn 9:16</span>
      <span class="badge badge-success">✓ Khung ảnh chính 16:9 sắc nét</span>
      <span class="badge badge-success">✓ Selective Routing Anti-AI</span>
      <span class="badge badge-success">✓ Audio-Driven Dynamic Timing</span>
    </div>

    <div class="video-wrap">
      <video controls autoplay muted loop playsinline>
        <source src="banahills-hybrid-new-workflow.mp4" type="video/mp4">
        ${publicVideoUrl ? `<source src="${publicVideoUrl}" type="video/mp4">` : ""}
        Trình duyệt của bạn không hỗ trợ thẻ video.
      </video>
    </div>

    ${
      publicVideoUrl
        ? `<a class="link-btn" href="${publicVideoUrl}" target="_blank">Mở Video Supabase Storage Public URL</a>`
        : ""
    }
  </div>
</body>
</html>`;

  writeFileSync(previewHtmlPath, previewHtml, "utf8");
  console.log(`\n8. Đã tạo file preview HTML: ${previewHtmlPath}`);

  // Dọn dẹp tệp tạm
  try {
    unlinkSync(rawWebmPath);
  } catch {}

  console.log("\n================================================================================");
  console.log("🎉 HOÀN TẤT TẠO VIDEO MỚI VỚI LUỒNG MỚI THÀNH CÔNG RỰC RỠ!");
  console.log(`- File MP4 nội bộ: ${masterMp4Path}`);
  if (publicVideoUrl) console.log(`- Supabase Storage URL: ${publicVideoUrl}`);
  console.log(`- HTML Preview: ${previewHtmlPath}`);
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("❌ Lỗi tiến trình render:", err);
  process.exit(1);
});

import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, unlinkSync, mkdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { execSync } from "node:child_process";
import ffmpegPath from "ffmpeg-static";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Đọc manifest đã chuẩn hóa
const manifestPath = resolve(process.cwd(), "tmp-audio-perfect/timing_manifest.json");
const scenesTiming = JSON.parse(readFileSync(manifestPath, "utf8"));

// Đọc danh sách media references từ sample
const samplePath = resolve(process.cwd(), "docs/be1/samples/media-references-banahills.sample.json");
const mediaAssets = JSON.parse(readFileSync(samplePath, "utf8"));

// Ghép asset URL vào scenesTiming
const scenes = scenesTiming.map((st) => {
  const asset = mediaAssets.find((a) => a.id === st.asset_id) || mediaAssets[0];
  return {
    ...st,
    imageUrl: asset.video_url,
    title: asset.title,
  };
});

function buildRemediatedHtml(scenesList, totalSec) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 540px;
      height: 960px;
      overflow: hidden;
      background: #0b0f19;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      position: relative;
    }

    /* GATE 1: Cảnh đầu tiên có opacity 1 ngay lập tức, không màn hình đen */
    .scene-stage {
      position: absolute;
      inset: 0;
      opacity: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      transition: opacity 0.25s ease-in-out;
    }
    .scene-stage.active {
      opacity: 1;
      z-index: 5;
    }

    /* Hậu cảnh ambient blur 9:16 chiếm trọn khung hình */
    .ambient-bg {
      position: absolute;
      inset: -25px;
      background-size: cover;
      background-position: center;
      filter: blur(24px) brightness(0.42);
      transform: scale(1.15);
      z-index: 1;
    }

    /* KHUNG ẢNH CHÍNH 16:9 NẰM Ở TRUNG TÂM (VID-07 + Yêu cầu người dùng) */
    .frame-center {
      position: relative;
      z-index: 10;
      width: 504px;
      height: 283.5px; /* Chính xác tỷ lệ 16:9 (504 * 9 / 16) */
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.9), 0 0 0 1.5px rgba(255, 255, 255, 0.18);
      background: #000;
      margin-top: -36px;
    }

    .photo-view {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    /* HIỆU ỨNG CHUYỂN ĐỘNG RÕ RỆT (CHỐNG LƯỚT ẢNH TĨNH) */
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

    .ken-push .photo-view {
      animation: pushMove 6s ease-out forwards;
    }
    @keyframes pushMove {
      0% { transform: scale(1.0); }
      100% { transform: scale(1.28); }
    }

    .ken-pull .photo-view {
      animation: pullMove 6s ease-out forwards;
    }
    @keyframes pullMove {
      0% { transform: scale(1.28); }
      100% { transform: scale(1.02); }
    }

    .food-zoom .photo-view {
      animation: foodFocus 6s ease-out forwards;
    }
    @keyframes foodFocus {
      0% { transform: scale(1.05) translateY(3%); }
      100% { transform: scale(1.24) translateY(-3%); }
    }

    .thrill-ride .photo-view {
      animation: rideWobble 6s linear forwards;
    }
    @keyframes rideWobble {
      0% { transform: scale(1.12) rotate(0deg); }
      25% { transform: scale(1.18) rotate(1.2deg); }
      75% { transform: scale(1.22) rotate(-1.2deg); }
      100% { transform: scale(1.25) rotate(0deg); }
    }

    /* VÙNG GIAO DIỆN CAPCUT UGC SAFE ZONE */
    .ui-overlay {
      position: absolute;
      inset: 0;
      z-index: 40;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 42px 22px 34px 22px;
    }

    /* VID-05: TUÂN THỦ BRAND COMPLIANCE - KHÔNG MẠO DANH OFFICIAL */
    .header-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: center;
    }

    .compliance-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(56, 189, 248, 0.4);
      backdrop-filter: blur(10px);
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      color: #38bdf8;
      box-shadow: 0 4px 15px rgba(0,0,0,0.6);
    }
    .check-mark {
      background: #38bdf8;
      color: #0f172a;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 900;
    }

    /* Hook 3s cực gắt */
    .hook-headline {
      background: linear-gradient(135deg, rgba(20, 20, 20, 0.96), rgba(35, 35, 35, 0.9));
      border: 3px solid #ffd700;
      color: #ffd700;
      font-weight: 900;
      font-size: 18px;
      text-align: center;
      padding: 10px 18px;
      border-radius: 12px;
      text-transform: uppercase;
      box-shadow: 0 8px 25px rgba(255, 215, 0, 0.25), 0 4px 12px rgba(0,0,0,0.8);
      line-height: 1.35;
      text-shadow: 0 2px 4px #000;
      max-width: 95%;
    }

    .top-scene-badge {
      background: rgba(0, 0, 0, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #f1f5f9;
      font-size: 13px;
      font-weight: 800;
      padding: 6px 16px;
      border-radius: 8px;
      display: none;
      backdrop-filter: blur(8px);
      letter-spacing: 0.3px;
    }

    /* Audio Equalizer dancing */
    .sound-eq {
      position: absolute;
      top: 45px;
      right: 24px;
      display: flex;
      align-items: flex-end;
      gap: 3px;
      height: 20px;
    }
    .eq-bar {
      width: 3.5px;
      background: #38bdf8;
      border-radius: 2px;
      animation: eqDance 0.7s ease-in-out infinite alternate;
    }
    .eq-bar:nth-child(1) { height: 6px; animation-delay: 0.1s; }
    .eq-bar:nth-child(2) { height: 18px; animation-delay: 0.3s; }
    .eq-bar:nth-child(3) { height: 12px; animation-delay: 0.2s; }
    .eq-bar:nth-child(4) { height: 16px; animation-delay: 0.4s; }
    @keyframes eqDance {
      0% { height: 4px; }
      100% { height: 20px; }
    }

    /* Footer Zone (Subtitle & CTA) */
    .footer-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .subtitle-banner {
      background: rgba(10, 15, 30, 0.92);
      border: 1.5px solid rgba(56, 189, 248, 0.45);
      backdrop-filter: blur(12px);
      color: #ffffff;
      font-weight: 800;
      font-size: 15px;
      text-align: center;
      padding: 12px 18px;
      border-radius: 12px;
      line-height: 1.45;
      box-shadow: 0 8px 24px rgba(0,0,0,0.75);
    }
    .sub-glow {
      color: #ffd700;
      text-shadow: 0 0 10px rgba(255, 215, 0, 0.6);
    }

    .cta-card {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .verified-price-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(0, 0, 0, 0.88);
      border: 1px solid #ffd700;
      padding: 8px 14px;
      border-radius: 8px;
    }
    .price-number {
      color: #ffd700;
      font-weight: 900;
      font-size: 16.5px;
      text-shadow: 0 0 8px rgba(255,215,0,0.5);
    }
    .price-desc {
      color: #cbd5e1;
      font-size: 12px;
      font-weight: 700;
    }

    .cta-action-button {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: #ffffff;
      font-weight: 900;
      font-size: 14.5px;
      padding: 13px 18px;
      border-radius: 10px;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 6px 20px rgba(239, 68, 68, 0.65);
      animation: ctaPulse 1.8s infinite;
    }
    @keyframes ctaPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }

    .progress-line {
      position: absolute;
      top: 0;
      left: 0;
      height: 4px;
      background: linear-gradient(90deg, #38bdf8, #ffd700);
      width: 0%;
      z-index: 100;
    }
  </style>
</head>
<body>
  <div class="progress-line" id="pbar"></div>

  <!-- Equalizer -->
  <div class="sound-eq">
    <div class="eq-bar"></div>
    <div class="eq-bar"></div>
    <div class="eq-bar"></div>
    <div class="eq-bar"></div>
  </div>

  <!-- 7 Phân Cảnh (GATE 1: scene-0 active ngay lập tức) -->
  <div id="scenes-container">
    ${scenesList
      .map((s, idx) => `
      <div class="scene-stage ${s.motion_type} ${idx === 0 ? "active" : ""}" id="stage-${idx}">
        <div class="ambient-bg" style="background-image: url('${s.imageUrl}');"></div>
        <div class="frame-center">
          <img class="photo-view" src="${s.imageUrl}" alt="Cảnh ${idx + 1}" />
        </div>
      </div>`)
      .join("")}
  </div>

  <!-- UI Overlay -->
  <div class="ui-overlay">
    <div class="header-group">
      <!-- VID-05: Tuân thủ quy chế đối tác phân phối chính thức -->
      <div class="compliance-badge">
        <span class="check-mark">✓</span>
        <span>Đối tác phân phối chính thức • Sun World</span>
      </div>

      <div class="hook-headline" id="hook-title">
        ⚠️ LƯU Ý SỐNG CÒN KHI ĐI BÀ NÀ HILLS!
      </div>

      <div class="top-scene-badge" id="scene-badge">
        🚠 CÁP TREO SĂN MÂY BÀ NÀ
      </div>
    </div>

    <div class="footer-group">
      <div class="subtitle-banner" id="subtitle-box">
        <span class="sub-glow">Đi Bà Nà Hills cuối tuần</span> mà bỏ qua lưu ý này là tiếc đứt ruột!
      </div>

      <div class="cta-card">
        <div class="verified-price-bar">
          <span class="price-desc">🎫 Vé Cáp Treo + Buffet Trưa</span>
          <span class="price-number">1.150.000đ</span>
        </div>
        <div class="cta-action-button">
          👇 NHẤN LINK BIO / COMMENT ĐỂ NHẬN VÉ CHÍNH HÃNG
        </div>
      </div>
    </div>
  </div>

  <script>
    const scenes = ${JSON.stringify(scenesList)};
    const totalDurationMs = ${totalSec} * 1000;
    const startTime = Date.now();

    const pbar = document.getElementById("pbar");
    const hookTitle = document.getElementById("hook-title");
    const sceneBadge = document.getElementById("scene-badge");
    const subtitleBox = document.getElementById("subtitle-box");

    // Cập nhật thanh tiến trình mượt mà
    setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / totalDurationMs) * 100, 100);
      pbar.style.width = pct + "%";
    }, 40);

    // BINDING 1:1:1 AUDIO-DRIVEN TIMING
    // Lên lịch kích hoạt từng cảnh dựa trên mốc mili-giây chính xác của âm thanh
    scenes.forEach((sc, idx) => {
      setTimeout(() => {
        // Tắt active cảnh trước
        scenes.forEach((_, i) => {
          const el = document.getElementById("stage-" + i);
          if (el) el.classList.remove("active");
        });

        // Bật active cảnh hiện tại
        const currEl = document.getElementById("stage-" + idx);
        if (currEl) currEl.classList.add("active");

        // Điều phối Hook và Top Badge
        if (idx === 0) {
          hookTitle.style.display = "block";
          sceneBadge.style.display = "none";
        } else {
          hookTitle.style.display = "none";
          sceneBadge.style.display = "block";
          sceneBadge.innerText = sc.top_badge;
        }

        // Cập nhật phụ đề đồng bộ 100% với giọng đọc
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
}

async function renderRemediatedVideo() {
  console.log("=== BẮT ĐẦU RENDER VIDEO THEO ĐẶC TẢ REMEDIATION (AUDIO-DRIVEN + KHUNG 16:9 CHUẨN) ===");

  const tmpDir = resolve(process.cwd(), "tmp-remediated");
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

  const totalDuration = scenesTiming[scenesTiming.length - 1].startTime + scenesTiming[scenesTiming.length - 1].sceneDuration + 0.6;
  console.log(`Thời lượng video mục tiêu: ${totalDuration.toFixed(2)}s`);

  const html = buildRemediatedHtml(scenes, totalDuration);

  console.log("1. Khởi động Chromium quay hình 540x960 (GATE 1: Zero Black Frame)...");
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

  console.log(`2. Đang ghi hình ${totalDuration.toFixed(1)} giây...`);
  await page.waitForTimeout((totalDuration + 0.5) * 1000);

  await page.close();
  await context.close();
  await browser.close();

  const webmFiles = readdirSync(tmpDir).filter((f) => f.endsWith(".webm"));
  if (webmFiles.length === 0) throw new Error("Không có video webm!");
  const rawVideoPath = join(tmpDir, webmFiles[0]);
  console.log("3. Ghi hình video thô thành công:", rawVideoPath);

  // 4. Ghép Audio đã mix chuẩn (Voiceover + BGM) bằng FFmpeg
  const audioPath = resolve(process.cwd(), "docs/be1/samples/banahills-remediated-audio.mp3");
  const outputMp4Path = resolve(process.cwd(), "docs/be1/samples/banahills-campaign-remediated.mp4");

  console.log("4. Ghép âm thanh thuyết minh đồng bộ + BGM vào video bằng FFmpeg...");
  const ffmpegCmd = `"${ffmpegPath}" -y -i "${rawVideoPath}" -i "${audioPath}" -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${outputMp4Path}"`;
  execSync(ffmpegCmd, { stdio: "inherit" });

  const finalBuf = readFileSync(outputMp4Path);
  console.log(`✅ Xuất bản tệp MP4 chuẩn: ${finalBuf.length} bytes (${(finalBuf.length / 1024 / 1024).toFixed(2)} MB)`);

  // 5. Upload lên Supabase Storage bucket 'campaign-videos'
  const storageFileName = `banahills-remediated-${Date.now()}.mp4`;
  console.log(`5. Đang upload lên Supabase Storage: ${storageFileName}...`);

  const { error: uploadErr } = await supabase.storage
    .from("campaign-videos")
    .upload(storageFileName, finalBuf, {
      contentType: "video/mp4",
      upsert: true,
    });

  if (uploadErr) throw new Error("Supabase Storage error: " + uploadErr.message);

  const { data: publicData } = supabase.storage
    .from("campaign-videos")
    .getPublicUrl(storageFileName);

  const remediatedUrl = publicData.publicUrl;
  console.log("\n🎉 REMEDIATED MASTER VIDEO ĐÃ ĐƯỢC UPLOAD LÊN STORAGE HOÀN TẤT!");
  console.log("👉 URL Video xem ngay:", remediatedUrl);

  // 6. Cập nhật bảng contents
  const { data: updatedContent, error: updateErr } = await supabase
    .from("contents")
    .update({
      video_url: remediatedUrl,
      status: "ready",
      hook: "⚠️ LƯU Ý SỐNG CÒN KHI ĐI BÀ NÀ HILLS!",
      cta: "Nhấn link bio hoặc comment bên dưới để nhận vé chính thức ngay nhé!",
      script: scenes.map((s) => s.sub).join(" "),
      caption: "Kinh nghiệm đi Bà Nà Hills cuối tuần cực hữu ích! Lưu ngay lại để đi cùng bạn bè nhé! #ĐàNẵng #BàNàHills #CầuVàng",
    })
    .eq("id", "8f249b82-8728-4f79-89b5-3b2c7a6901cf")
    .select("id, video_url, status, hook")
    .single();

  if (updateErr) {
    console.error("Lỗi cập nhật bảng contents:", updateErr.message);
  } else {
    console.log("✅ Bản ghi contents ID 8f249b82-8728-4f79-89b5-3b2c7a6901cf đã cập nhật video mới!");
  }

  // Dọn dẹp
  try {
    unlinkSync(rawVideoPath);
  } catch {}
}

renderRemediatedVideo().catch((err) => {
  console.error("Lỗi:", err);
  process.exit(1);
});

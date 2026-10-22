import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
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

async function downloadFile(url, destPath) {
  if (existsSync(destPath)) return destPath;
  console.log(`   Downloading: ${url.slice(0, 70)}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(destPath, buf);
  return destPath;
}

function formatAssTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds - Math.floor(seconds)) * 100);
  const pad = (n, width = 2) => String(n).padStart(width, "0");
  return `${h}:${pad(m)}:${pad(s)}.${pad(cs)}`;
}

async function main() {
  console.log("================================================================================");
  console.log("🎬 KHỞI ĐỘNG RENDER HYBRID VIDEO ENGINE: THỰC SỰ SỬ DỤNG I2V VIDEO TỪ REFERENCE");
  console.log("================================================================================\n");

  const tmpDir = resolve("tmp-hybrid-master");
  const imgDir = resolve(tmpDir, "images");
  const scenesDir = resolve(tmpDir, "scenes");
  if (!existsSync(imgDir)) mkdirSync(imgDir, { recursive: true });
  if (!existsSync(scenesDir)) mkdirSync(scenesDir, { recursive: true });

  // 1. TỆP REFERENCE VIDEO THẬT TỪ THƯ MỤC docs/be1/samples/reference
  const refVideoPath = resolve("docs/be1/samples/reference/tmpjlq6nmak (1).mp4");
  if (!existsSync(refVideoPath)) {
    throw new Error(`Không tìm thấy file video tham khảo tại ${refVideoPath}`);
  }
  console.log(`1. Xác nhận tệp I2V Video Clip tham khảo thật: ${refVideoPath}`);

  // 2. DANH SÁCH 7 PHÂN CẢNH CHUẨN AUDIO-DRIVEN (TỔNG 34.89s)
  const SCENES = [
    {
      index: 0,
      startTime: 0.00,
      duration: 3.49,
      type: "I2V_VIDEO",
      shot_type: "AERIAL_WIDE",
      badge: "⚠️ LƯU Ý SỐNG CÒN KHI ĐI BÀ NÀ HILLS!",
      sub: "Lưu ý sống còn khi đi Bà Nà Hills cuối tuần!",
      sourcePath: refVideoPath,
    },
    {
      index: 1,
      startTime: 3.49,
      duration: 5.94,
      type: "I2V_VIDEO",
      shot_type: "AERIAL_WIDE",
      badge: "🚠 CÁP TREO SĂN MÂY BÀ NÀ",
      sub: "Đi cáp sớm trước 8h30 để săn mây và check-in Cầu Vàng vắng người.",
      sourcePath: refVideoPath,
      loopSpeed: 0.60, // Slow cinematic flycam
    },
    {
      index: 2,
      startTime: 9.43,
      duration: 4.83,
      type: "PHOTO_KEN_BURNS",
      shot_type: "SCENIC_MEDIUM",
      badge: "🏰 LÂU ĐÀI ĐÁ & LÀNG PHÁP",
      sub: "Check-in Lâu Đài Đá và Làng Pháp cổ kính đẹp như trời Âu.",
      url: "https://img.cnt.traveloka.com/tvlk/xpe-asset/GZtqLuOqb-33qvDmG1FcMeN1eFEH7PVvlsdFr2AUBT39jzSxIGG5kZNhhHY-p7nw/2001357730516/Sunworld-Banahills-and-Golden-Bridge-Day-Tour-from-Danang-e239f82f-a17f-4310-862c-d7742be67ab5.png",
      motion: "push_in",
    },
    {
      index: 3,
      startTime: 14.26,
      duration: 5.34,
      type: "PHOTO_KEN_BURNS",
      shot_type: "CLOSEUP_FOOD", // SELECTIVE ROUTING: Món ăn chống AI méo mó
      badge: "🍽️ BUFFET FOUR SEASONS 100 MÓN",
      sub: "Ăn trưa buffet Four Seasons hơn 100 món thả ga, siêu tiết kiệm!",
      url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1280&h=720&q=80",
      motion: "food_zoom",
    },
    {
      index: 4,
      startTime: 19.60,
      duration: 4.38,
      type: "PHOTO_KEN_BURNS",
      shot_type: "HUMAN_POV", // SELECTIVE ROUTING: Góc nhìn trải nghiệm
      badge: "🎢 MÁNG TRƯỢT TỐC ĐỘ HIỆP SĨ",
      sub: "Thử thách máng trượt tốc độ ngắm cảnh sườn núi cực đã.",
      url: "https://img.cnt.traveloka.com/tvlk/xpe-asset/dsIfD0QxFcgaDmB6sQchobk5CmBu9PzsWhwFXGFxJ179jzSxIGG5kZNhhHY-p7nw/xxt/experience/image/travelmart-danang-banahills-8-jpg-1080x720-FIT-6a64f03843740352d4da2f5433049818.jpeg",
      motion: "thrill_shake",
    },
    {
      index: 5,
      startTime: 23.98,
      duration: 5.72,
      type: "PHOTO_KEN_BURNS",
      shot_type: "SCENIC_MEDIUM",
      badge: "🎫 COMBO CÁP TREO + BUFFET TRƯA",
      sub: "Combo cáp treo kèm buffet trưa chính hãng chỉ 1.150.000đ.",
      url: "https://img.cnt.traveloka.com/tvlk/xpe-asset/GZtqLuOqb-33qvDmG1FcMeN1eFEH7PVvlsdFr2AUBT39jzSxIGG5kZNhhHY-p7nw/2001357730516/Sunworld-Banahills-and-Golden-Bridge-Day-Tour-from-Danang-0f27dd8a-6f15-4405-b4b8-fe9fd4851808.png",
      motion: "pull_out",
    },
    {
      index: 6,
      startTime: 29.70,
      duration: 5.19, // Đảm bảo khớp tổng 34.89s
      type: "PHOTO_KEN_BURNS",
      shot_type: "SCENIC_MEDIUM",
      badge: "📍 ĐIỂM ĐẾN: BÀ NÀ HILLS",
      sub: "Nhấn link bio hoặc comment bên dưới để nhận vé ngay nhé!",
      url: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=1280&h=720&q=80",
      motion: "push_in",
    },
  ];

  // 3. RENDER TỪNG CẢNH VỚI KHUNG DỌC 9:16 (1080x1920) VÀ KHUNG 16:9 SẮC NÉT Ở TRUNG TÂM
  console.log("\n2. Tiến hành render từng phân cảnh độc lập bằng FFmpeg...");
  const renderedScenePaths = [];

  for (const sc of SCENES) {
    const sceneOut = resolve(scenesDir, `scene_${sc.index}.mp4`);
    console.log(`   [Cảnh ${sc.index + 1}/7] ${sc.shot_type} (${sc.type}) | Thời lượng: ${sc.duration}s`);

    if (sc.type === "I2V_VIDEO") {
      // SỬ DỤNG TRỰC TIẾP CLIP VIDEO I2V TẠO TỪ ẢNH THẬT
      const filter =
        `[0:v]split=2[bg][fg];` +
        `[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=25:2,eq=brightness=-0.15[bgblur];` +
        `[fg]scale=1008:567:force_original_aspect_ratio=increase,crop=1008:567[fgscaled];` +
        `[bgblur][fgscaled]overlay=(W-w)/2:(H-h)/2-80[outv]`;

      const loopOpt = sc.index === 1 ? `-stream_loop -1` : ``;
      const cmd = `"${ffmpegPath}" -y ${loopOpt} -i "${sc.sourcePath}" -filter_complex "${filter}" -map "[outv]" -c:v libx264 -pix_fmt yuv420p -r 25 -t ${sc.duration} "${sceneOut}"`;
      execSync(cmd, { stdio: "ignore" });
    } else {
      // ẢNH THẬT ĐƯỢC XỬ LÝ THEO SELECTIVE ROUTING (KEN BURNS CHUYÊN BIỆT)
      const localImg = resolve(imgDir, `photo_${sc.index}.jpg`);
      await downloadFile(sc.url, localImg);

      const frames = Math.round(sc.duration * 25);
      let zoomExpr = `min(zoom+0.0012,1.20)`;
      let xExpr = `iw/2-(iw/zoom/2)`;
      let yExpr = `ih/2-(ih/zoom/2)`;

      if (sc.motion === "pull_out") {
        zoomExpr = `max(1.22-0.0012*on,1.02)`;
      } else if (sc.motion === "food_zoom") {
        zoomExpr = `min(zoom+0.0010,1.18)`;
      } else if (sc.motion === "thrill_shake") {
        zoomExpr = `min(zoom+0.0014,1.24)`;
        xExpr = `iw/2-(iw/zoom/2) + sin(on/2)*3`;
      }

      const filter =
        `[0:v]split=2[bg][fg];` +
        `[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=25:2,eq=brightness=-0.15[bgblur];` +
        `[fg]zoompan=z='${zoomExpr}':d=${frames}:x='${xExpr}':y='${yExpr}':s=1008x567:fps=25[fgscaled];` +
        `[bgblur][fgscaled]overlay=(W-w)/2:(H-h)/2-80[outv]`;

      const cmd = `"${ffmpegPath}" -y -loop 1 -i "${localImg}" -filter_complex "${filter}" -map "[outv]" -c:v libx264 -pix_fmt yuv420p -r 25 -t ${sc.duration} "${sceneOut}"`;
      execSync(cmd, { stdio: "ignore" });
    }

    renderedScenePaths.push(sceneOut);
  }

  // 4. GHÉP TẤT CẢ PHÂN CẢNH THÀNH MỘT VIDEO DÀI HOÀN CHỈNH
  console.log("\n3. Ghép nối 7 phân cảnh...");
  const concatTxt = resolve(tmpDir, "concat.txt");
  const txtContent = renderedScenePaths
    .map((p) => `file '${p.replace(/\\/g, "/")}'`)
    .join("\n");
  writeFileSync(concatTxt, txtContent, "utf8");

  const mergedVideo = resolve(tmpDir, "scenes_merged.mp4");
  execSync(
    `"${ffmpegPath}" -y -f concat -safe 0 -i "${concatTxt}" -c copy "${mergedVideo}"`,
    { stdio: "ignore" }
  );
  console.log("   ✅ Đã ghép xong video thô 1080x1920.");

  // 5. TẠO TỆP PHỤ ĐỀ ASS CHUẨN SAFE ZONE & TYPOGRAPHY CAPCUT
  console.log("\n4. Tạo tệp phụ đề và Overlay ASS...");
  const assPath = resolve(tmpDir, "overlays.ass");

  let assEvents = "";
  for (const sc of SCENES) {
    const startStr = formatAssTime(sc.startTime);
    const endStr = formatAssTime(sc.startTime + sc.duration);

    // Top Badge
    assEvents += `Dialogue: 0,${startStr},${endStr},TopBadge,,0,0,0,,{\\b1}${sc.badge}{\\b0}\n`;

    // Dynamic Subtitle với Safe Zone 280px cách đáy
    const words = sc.sub.split(" ");
    let highlighted = sc.sub;
    if (words.length > 4) {
      highlighted = `{\\c&H00D7FF&}${words.slice(0, 3).join(" ")} {\\c&HFFFFFF&}${words.slice(3).join(" ")}`;
    }
    assEvents += `Dialogue: 0,${startStr},${endStr},Subtitle,,0,0,0,,${highlighted}\n`;
  }

  // Thêm Bottom Card cố định cho toàn video
  assEvents += `Dialogue: 0,0:00:00.00,0:00:34.89,BottomCard,,0,0,0,,{\\b1}SUN WORLD BÀ NÀ HILLS{\\b0}   |   Combo Vé Cáp Treo + Buffet: 1.150.000đ   |   ĐẶT VÉ NGAY\n`;

  const assContent = `[Script Info]
Title: TravelLink AI Video Overlays
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: TopBadge,Arial,34,&H0000D7FF,&H000000FF,&H00000000,&HB0101828,-1,0,0,0,100,100,1,0,1,3,4,8,40,40,95,1
Style: Subtitle,Arial,46,&H00FFFFFF,&H000000FF,&H00000000,&HE0000000,-1,0,0,0,100,100,1,0,1,4,4,2,40,40,280,1
Style: BottomCard,Arial,28,&H00E2E8F0,&H000000FF,&H00000000,&HE00F172A,-1,0,0,0,100,100,0,0,1,2,3,2,40,40,75,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${assEvents}`;

  writeFileSync(assPath, assContent, "utf8");

  // 6. NUNG PHỤ ĐỀ ASS + GHÉP AUDIO THUYẾT MINH & BGM BẰNG FFMPEG
  console.log("\n5. Nung phụ đề Safe Zone và trộn âm thanh Hoài My TTS + BGM...");
  const audioPath = resolve("docs/be1/samples/banahills-remediated-audio.mp3");
  const finalMasterPath = resolve("docs/be1/samples/banahills-hybrid-new-workflow.mp4");

  const escapedAss = assPath.replace(/\\/g, "/").replace(/:/g, "\\:");
  const finalCmd = `"${ffmpegPath}" -y -i "${mergedVideo}" -i "${audioPath}" -vf "ass='${escapedAss}'" -c:v libx264 -pix_fmt yuv420p -b:v 4500k -c:a aac -b:a 192k -shortest "${finalMasterPath}"`;

  execSync(finalCmd, { stdio: "ignore" });

  const finalBuf = readFileSync(finalMasterPath);
  console.log(`   ✅ Tệp MP4 hoàn chỉnh: ${(finalBuf.length / 1024 / 1024).toFixed(2)} MB (${finalBuf.length} bytes)`);

  // 7. UPLOAD LÊN SUPABASE STORAGE
  const storageName = `banahills-hybrid-new-workflow-${Date.now()}.mp4`;
  console.log(`\n6. Upload lên Supabase Storage: ${storageName}...`);
  let publicUrl = "";

  try {
    const { error: upErr } = await supabase.storage
      .from("campaign-videos")
      .upload(storageName, finalBuf, {
        contentType: "video/mp4",
        upsert: true,
      });

    if (upErr) {
      console.warn("   ⚠️ Supabase storage upload warning:", upErr.message);
    } else {
      const { data: pubData } = supabase.storage
        .from("campaign-videos")
        .getPublicUrl(storageName);
      publicUrl = pubData.publicUrl;
      console.log(`   🎉 Public Storage URL: ${publicUrl}`);
    }
  } catch (err) {
    console.warn("   ⚠️ Lỗi upload:", err.message);
  }

  // 8. TẠO HTML PREVIEW PLAYER CHO NGƯỜI DÙNG
  const previewPath = resolve("docs/be1/samples/banahills-new-workflow-preview.html");
  const previewHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TravelLink AI - True Hybrid Video Preview (I2V + Ken Burns)</title>
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
    <h1>🎬 True Hybrid Video: I2V Reference Motion + Ken Burns Food Safeguard</h1>
    <p>Cảnh 1 & Cảnh 2 sử dụng <b>clip video chuyển động AI thực tế (từ reference)</b>; Cảnh 4 món ăn áp dụng <b>Ken Burns Food Focus Zoom</b> trên ảnh thật 100%.</p>
    
    <div class="badge-list">
      <span class="badge badge-success">✓ Cảnh 1-2: Real I2V Video Clip</span>
      <span class="badge badge-success">✓ Cảnh 4: Real Food Image Zoom</span>
      <span class="badge badge-success">✓ Tỷ lệ chuẩn dọc 9:16</span>
      <span class="badge badge-success">✓ Phụ đề Safe Zone 280px</span>
      <span class="badge badge-success">✓ Hoài My TTS + BGM Ducking</span>
    </div>

    <div class="video-wrap">
      <video controls autoplay muted loop playsinline>
        <source src="banahills-hybrid-new-workflow.mp4" type="video/mp4">
        ${publicUrl ? `<source src="${publicUrl}" type="video/mp4">` : ""}
        Trình duyệt của bạn không hỗ trợ thẻ video.
      </video>
    </div>

    ${
      publicUrl
        ? `<a class="link-btn" href="${publicUrl}" target="_blank">Mở Video Supabase Storage Public URL</a>`
        : ""
    }
  </div>
</body>
</html>`;

  writeFileSync(previewPath, previewHtml, "utf8");
  console.log(`\n7. Đã cập nhật file preview HTML: ${previewPath}`);

  console.log("\n================================================================================");
  console.log("🎉 HOÀN TẤT RENDER VIDEO THỰC THỤ VỚI CLIP I2V REFERENCE THÀNH CÔNG!");
  console.log(`- File MP4 nội bộ: ${finalMasterPath}`);
  if (publicUrl) console.log(`- Supabase Storage URL: ${publicUrl}`);
  console.log(`- HTML Preview: ${previewPath}`);
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("❌ Lỗi render:", err);
  process.exit(1);
});

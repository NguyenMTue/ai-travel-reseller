import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
// @ts-ignore - node-edge-tts does not have type declaration
import { EdgeTTS } from "node-edge-tts";

export interface TextOverlayConfig {
  hookText?: string;
  priceBadgeText?: string;
  ctaText?: string;
  tipText?: string;
  destinationText?: string;
}

export interface ComposeHybridVideoInput {
  heroVideoBuffer: Buffer;
  bodyImageBuffers: Buffer[];
  voiceoverScript: string;
  textOverlay: TextOverlayConfig;
  targetDurationSec?: number;
}

/**
 * Xác định chính xác đường dẫn binary ffmpeg.exe
 * Khắc phục triệt để lỗi Next.js Webpack/Turbopack biến __dirname thành \ROOT\node_modules\...
 */
export function getResolvedFFmpegPath(): string {
  if (process.env.FFMPEG_PATH && existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }

  const localBinary = path.join(
    process.cwd(),
    "node_modules",
    "ffmpeg-static",
    process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"
  );
  if (existsSync(localBinary)) {
    return localBinary;
  }

  if (
    ffmpegPath &&
    typeof ffmpegPath === "string" &&
    !ffmpegPath.includes("ROOT") &&
    existsSync(ffmpegPath)
  ) {
    return ffmpegPath;
  }

  return "ffmpeg";
}

/**
 * Hàm gọi FFmpeg CLI dưới dạng Promise an toàn
 */
export function runFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const executable = getResolvedFFmpegPath();

    const proc = spawn(executable, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg thất bại (code ${code}): ${stderr.slice(-500)}`));
      }
    });

    proc.on("error", (err) => {
      reject(err);
    });
  });
}

/**
 * Tạo clip chuyển cảnh Hero mượt mà trực tiếp từ 2 ảnh thật (Interpolation + Ken Burns + Xfade)
 * Không bao giờ sử dụng video mock có sẵn, đảm bảo 100% hình ảnh là của Merchant đã chọn.
 */
export async function createTwoImageHeroClip(
  startImageBuffer: Buffer,
  endImageBuffer: Buffer,
  durationSec = 6
): Promise<Buffer> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "hero-interp-"));
  try {
    const startPath = path.join(tempDir, "start.jpg");
    const endPath = path.join(tempDir, "end.jpg");
    await fs.writeFile(startPath, startImageBuffer);
    await fs.writeFile(endPath, endImageBuffer);

    const half = (durationSec + 1) / 2; // Ví dụ 6s: half = 3.5s
    const fps = 30;
    const framesPerClip = Math.round(half * fps);
    const xfadeOffset = Math.max(0.5, half - 1.0); // 2.5s bắt đầu hòa trộn 1s

    const clip1 = path.join(tempDir, "clip1.mp4");
    const clip2 = path.join(tempDir, "clip2.mp4");
    const heroOut = path.join(tempDir, "hero_out.mp4");

    // Clip 1: Butter-smooth zoom in (pre-scaled to 2160x3840 4K to eliminate micro-jitter)
    await runFFmpeg([
      "-loop", "1", "-i", startPath,
      "-vf", `scale=2160:3840:force_original_aspect_ratio=increase,crop=2160:3840,zoompan=z='min(zoom+0.0012,1.25)':d=${framesPerClip}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=2160x3840:fps=${fps},scale=1080:1920:flags=bicubic`,
      "-t", String(half),
      "-pix_fmt", "yuv420p",
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-y", clip1,
    ]);

    // Clip 2: Butter-smooth zoom out with gentle easing (no frame 0 jumping)
    await runFFmpeg([
      "-loop", "1", "-i", endPath,
      "-vf", `scale=2160:3840:force_original_aspect_ratio=increase,crop=2160:3840,zoompan=z='if(lte(zoom,1.0),1.25,max(1.25-0.0012*on,1.0))':d=${framesPerClip}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=2160x3840:fps=${fps},scale=1080:1920:flags=bicubic`,
      "-t", String(half),
      "-pix_fmt", "yuv420p",
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-y", clip2,
    ]);

    // Cross-fade xfade
    await runFFmpeg([
      "-i", clip1,
      "-i", clip2,
      "-filter_complex", `xfade=transition=fade:duration=1.0:offset=${xfadeOffset}`,
      "-pix_fmt", "yuv420p",
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-y", heroOut,
    ]);

    return await fs.readFile(heroOut);
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {}
  }
}

/**
 * 1. Sinh file âm thanh thuyết minh tiếng Việt hoàn toàn miễn phí bằng Edge-TTS
 */
export async function generateVoiceoverAudio(
  text: string,
  outputPath: string,
  voice = "vi-VN-HoaiMyNeural"
): Promise<void> {
  const cleanText = text
    .replace(/\[pause\s*[\d\.]+s?\]/gi, " ... ")
    .replace(/[\[\]]/g, "")
    .trim();

  const tts = new EdgeTTS({
    voice,
    lang: "vi-VN",
    outputFormat: "audio-24khz-48kbitrate-mono-mp3",
  });

  await tts.ttsPromise(cleanText, outputPath);
}

/**
 * 2. Tạo đoạn clip Ken Burns (Zoom in / Zoom out / Pan) từ một ảnh tĩnh
 * Áp dụng pre-scale 1080x1920 và 30fps để triệt tiêu hoàn toàn hiện tượng rung lắc
 */
async function createKenBurnsClip(
  imagePath: string,
  outputPath: string,
  durationSec = 3.0,
  motionType: "ZOOM_IN" | "ZOOM_OUT" | "PAN_LEFT" | "PAN_RIGHT" = "ZOOM_IN"
): Promise<void> {
  const fps = 30;
  const totalFrames = Math.round(durationSec * fps);

  let vfFilter = "";
  switch (motionType) {
    case "ZOOM_OUT":
      vfFilter = `scale=2160:3840:force_original_aspect_ratio=increase,crop=2160:3840,zoompan=z='if(lte(zoom,1.0),1.25,max(1.25-0.0012*on,1.0))':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=2160x3840:fps=${fps},scale=1080:1920:flags=bicubic`;
      break;
    case "PAN_LEFT":
      vfFilter = `scale=2484:3840:force_original_aspect_ratio=increase,crop=2484:3840,zoompan=z=1.0:d=${totalFrames}:x='(1-on/${totalFrames})*(iw-2160)':y='ih/2-1920':s=2160x3840:fps=${fps},scale=1080:1920:flags=bicubic`;
      break;
    case "PAN_RIGHT":
      vfFilter = `scale=2484:3840:force_original_aspect_ratio=increase,crop=2484:3840,zoompan=z=1.0:d=${totalFrames}:x='(on/${totalFrames})*(iw-2160)':y='ih/2-1920':s=2160x3840:fps=${fps},scale=1080:1920:flags=bicubic`;
      break;
    case "ZOOM_IN":
    default:
      vfFilter = `scale=2160:3840:force_original_aspect_ratio=increase,crop=2160:3840,zoompan=z='min(zoom+0.0012,1.25)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=2160x3840:fps=${fps},scale=1080:1920:flags=bicubic`;
      break;
  }

  const args = [
    "-loop", "1",
    "-i", imagePath,
    "-vf", vfFilter,
    "-t", String(durationSec),
    "-pix_fmt", "yuv420p",
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-y", outputPath,
  ];

  await runFFmpeg(args);
}

/**
 * 3. Hợp nhất Video Hero + Chuỗi ảnh Ken Burns + Voiceover + Text Overlays
 */
export async function composeHybridVideo(
  input: ComposeHybridVideoInput
): Promise<Buffer> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "travel-video-"));

  try {
    // 3.1. Ghi file Hero video từ Gemini Omni Flash / Interpolation
    const heroVideoPath = path.join(tempDir, "hero.mp4");
    await fs.writeFile(heroVideoPath, input.heroVideoBuffer);

    // 3.2. Sinh Voiceover audio bằng Edge-TTS
    const voiceoverPath = path.join(tempDir, "voiceover.mp3");
    await generateVoiceoverAudio(input.voiceoverScript, voiceoverPath);

    // 3.3. Xử lý các ảnh Body còn lại thành các clip Ken Burns mượt mà
    // Tính toán thời lượng từng ảnh Body dựa trên targetDurationSec để không bị lặp hình
    const heroDuration = 6.0;
    const targetDuration = input.targetDurationSec || 20;
    const remainingDuration = Math.max(4.0, targetDuration - heroDuration);
    const numBody = Math.max(1, input.bodyImageBuffers.length);
    const eachBodyDuration = Number((remainingDuration / numBody).toFixed(2));

    const clipPaths: string[] = [heroVideoPath];
    const motionCycles: Array<"ZOOM_IN" | "ZOOM_OUT" | "PAN_LEFT" | "PAN_RIGHT"> = [
      "ZOOM_IN",
      "PAN_LEFT",
      "ZOOM_OUT",
      "PAN_RIGHT",
    ];

    for (let i = 0; i < input.bodyImageBuffers.length; i++) {
      const imgPath = path.join(tempDir, `body_${i}.jpg`);
      await fs.writeFile(imgPath, input.bodyImageBuffers[i]);

      const clipPath = path.join(tempDir, `clip_${i}.mp4`);
      const motion = motionCycles[i % motionCycles.length];
      await createKenBurnsClip(imgPath, clipPath, eachBodyDuration, motion);
      clipPaths.push(clipPath);
    }

    // 3.4. Chuẩn bị file danh sách ghép nối (concat list)
    // Chuẩn hóa tất cả các clip về cùng kích thước 1080x1920 và fps 30
    const normalizedClipPaths: string[] = [];
    for (let i = 0; i < clipPaths.length; i++) {
      const normPath = path.join(tempDir, `norm_${i}.mp4`);
      await runFFmpeg([
        "-i",
        clipPaths[i],
        "-vf",
        "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,fps=30",
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-an",
        "-y",
        normPath,
      ]);
      normalizedClipPaths.push(normPath);
    }

    const concatListPath = path.join(tempDir, "concat_list.txt");
    const concatContent = normalizedClipPaths
      .map((p) => `file '${p.replace(/\\/g, "/")}'`)
      .join("\n");
    await fs.writeFile(concatListPath, concatContent);

    const mergedVisualPath = path.join(tempDir, "merged_visual.mp4");
    await runFFmpeg([
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      concatListPath,
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-pix_fmt",
      "yuv420p",
      "-y",
      mergedVisualPath,
    ]);

    // 3.5. Áp dụng Text Overlay và chuẩn hóa thời lượng tuyệt đối
    const finalOutputPath = path.join(tempDir, "final_composition.mp4");
    const fontPath = "C\\:/Windows/Fonts/arial.ttf"; // Font Arial Windows hỗ trợ Unicode tiếng Việt hoàn hảo
    const is10s = targetDuration <= 12;

    const drawtextFilters: string[] = [];

    // Hook: 0-2s (10s) hoặc 0-3s (18s+)
    if (input.textOverlay.hookText) {
      const escapedHook = input.textOverlay.hookText
        .replace(/'/g, "")
        .replace(/:/g, "\\:");
      const hookEnd = is10s ? 2 : 3;
      drawtextFilters.push(
        `drawtext=fontfile='${fontPath}':text='${escapedHook}':fontcolor=0xFFD700:fontsize=36:borderw=3:bordercolor=black:x=(w-text_w)/2:y=(h-text_h)/2-100:enable='between(t,0,${hookEnd})'`
      );
    }

    // Mẹo du lịch / Trải nghiệm thực tế
    if (input.textOverlay.tipText) {
      const escapedTip = input.textOverlay.tipText
        .replace(/'/g, "")
        .replace(/:/g, "\\:");
      const tipStart = is10s ? 2 : 3;
      const tipEnd = is10s ? 5 : 7;
      drawtextFilters.push(
        `drawtext=fontfile='${fontPath}':text='${escapedTip}':fontcolor=0x34C759:fontsize=26:borderw=2:bordercolor=black:x=(w-text_w)/2:y=h-240:enable='between(t,${tipStart},${tipEnd})'`
      );
    }

    // Badge giá vé: 5-8s (10s) hoặc 11-15s (18s+)
    if (input.textOverlay.priceBadgeText) {
      const escapedPrice = input.textOverlay.priceBadgeText
        .replace(/'/g, "")
        .replace(/:/g, "\\:");
      const priceStart = is10s ? 5 : 11;
      const priceEnd = is10s ? 8 : 15;
      drawtextFilters.push(
        `drawtext=fontfile='${fontPath}':text='${escapedPrice}':fontcolor=white:fontsize=28:box=1:boxcolor=black@0.6:boxborderw=10:x=(w-text_w)/2:y=120:enable='between(t,${priceStart},${priceEnd})'`
      );
    }

    // CTA & Link đặt vé: 8-10s (10s) hoặc 15-18s (18s+)
    if (input.textOverlay.ctaText) {
      const escapedCta = input.textOverlay.ctaText
        .replace(/'/g, "")
        .replace(/:/g, "\\:");
      const ctaStart = is10s ? 8 : 15;
      drawtextFilters.push(
        `drawtext=fontfile='${fontPath}':text='${escapedCta}':fontcolor=0x00FFCC:fontsize=26:borderw=2:bordercolor=black:x=(w-text_w)/2:y=h-180:enable='gte(t,${ctaStart})'`
      );
    }

    const vfFilters = [
      "tpad=stop_mode=clone:stop_duration=3",
      ...(drawtextFilters.length > 0 ? drawtextFilters : []),
    ].join(",");

    // Ghép visual + voiceover audio chuẩn xác (cắt đúng targetDuration tuyệt đối)
    await runFFmpeg([
      "-i",
      mergedVisualPath,
      "-i",
      voiceoverPath,
      "-filter_complex",
      `[0:v]${vfFilters}[vout];[1:a]apad=whole_dur=${targetDuration}[aout]`,
      "-map",
      "[vout]",
      "-map",
      "[aout]",
      "-t",
      `${targetDuration}`,
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      "-y",
      finalOutputPath,
    ]);

    const finalBuffer = await fs.readFile(finalOutputPath);
    return finalBuffer;
  } finally {
    // Dọn dẹp thư mục tạm
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Bỏ qua lỗi dọn dẹp
    }
  }
}

export interface TourEndCardConfig {
  productName: string;
  location?: string;
  salePrice: number;
  originalPrice?: number | null;
  highlights?: string[];
  ctaText?: string;
  hotline?: string;
  merchantName?: string;
  authenticTips?: string[];
}

export function getSystemFontPath(): string {
  if (process.platform === "win32") {
    return "C\\:/Windows/Fonts/arial.ttf";
  }
  return "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
}

/**
 * Kiểm tra xem một file media có chứa audio stream hay không
 */
export function hasAudioStream(filePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const executable = getResolvedFFmpegPath();
    const proc = spawn(executable, ["-i", filePath, "-vn", "-c:a", "copy", "-f", "null", "-"], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    proc.on("close", (code) => {
      resolve(code === 0);
    });
    proc.on("error", () => {
      resolve(false);
    });
  });
}

/**
 * Loại bỏ ký tự emoji và ký hiệu đặc biệt gây lỗi font (▯ / tofu glyph) trong FFmpeg drawtext
 */
function sanitizeForDrawtext(text?: string): string {
  if (!text) return "";
  return text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F100}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2300}-\u{23FF}\u{2B50}\u{20E3}\u{FE0F}\u{FE0E}]/gu, "")
    .replace(/[⚠️📍✨👉🎟️⚡👨‍👩‍👧‍👦💸🔥📸]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tự động ngắt dòng thông minh cho tiêu đề End-Card để tránh tràn mép khung hình
 */
function wrapText(text: string, maxCharsPerLine = 24): string {
  if (!text || text.length <= maxCharsPerLine) return text;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + " " + word).length <= maxCharsPerLine) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length >= 2) break;
    }
  }
  if (currentLine && lines.length < 2) {
    lines.push(currentLine);
  }
  return lines.join("\n");
}

/**
 * Tạo clip hiển thị thông tin Tour ở cuối video:
 * - Lấy một hình ảnh (thường là ảnh đại diện hoặc cảnh cuối của tour)
 * - Phủ lớp mờ điện ảnh (Frosted Bokeh Blur qua boxblur)
 * - Đặt khối card bán trong suốt (frosted glass) với viền cyan/gold sang trọng
 * - Thể hiện đầy đủ và nổi bật: Tên tour, Địa điểm, Giá trọn gói, Ưu đãi, Điểm nổi bật, Hotline và CTA
 * - Đồng bộ âm thanh voiceover CTA để khách hàng dễ dàng tiếp cận và ra quyết định
 */
export async function createBlurredTourInfoClip(params: {
  imageBuffer: Buffer;
  durationSec: number;
  info: TourEndCardConfig;
  voiceoverText?: string;
}): Promise<Buffer> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "tour-endcard-"));

  try {
    const imgPath = path.join(tempDir, "card_bg.jpg");
    await fs.writeFile(imgPath, params.imageBuffer);

    // Tính toán tỷ lệ giảm giá nếu có
    const discount =
      params.info.originalPrice && params.info.originalPrice > params.info.salePrice
        ? Math.round(
            ((params.info.originalPrice - params.info.salePrice) / params.info.originalPrice) * 100
          )
        : 0;

    const rawHighlights =
      params.info.highlights && params.info.highlights.length > 0
        ? params.info.highlights.slice(0, 3)
        : params.info.authenticTips && params.info.authenticTips.length > 0
        ? params.info.authenticTips.slice(0, 3)
        : [
            "Vé tham quan & dịch vụ trọn gói chính hãng",
            "Trải nghiệm điểm check-in biểu tượng đẹp nhất",
            "Hỗ trợ vào cổng ưu tiên, không chờ đợi",
          ];

    const highlights = rawHighlights.map(
      (h) => `• ${h.replace(/^[•\-\*\s]+/, "").trim()}`
    );

    const contactLines = [
      `• Đơn vị tổ chức: ${params.info.merchantName || "Đối tác du lịch uy tín"}`,
      `• Hotline hỗ trợ: ${params.info.hotline || "1900 8888 (Tư vấn 24/7)"}`,
      "• Cam kết vé điện tử chính hãng 100%",
    ];

    // Ghi các file văn bản UTF-8 độc lập cho từng khối giao diện, tránh lỗi cú pháp FFmpeg
    const headerPath = path.join(tempDir, "header.txt");
    await fs.writeFile(headerPath, "THÔNG TIN TOUR DU LỊCH CHÍNH HÃNG", "utf8");

    const titlePath = path.join(tempDir, "title.txt");
    const rawTitle = sanitizeForDrawtext(params.info.productName || "TOUR DU LỊCH").toUpperCase();
    const wrappedTitle = wrapText(rawTitle, 26);
    const isMultiLineTitle = wrappedTitle.includes("\n");
    await fs.writeFile(titlePath, wrappedTitle, "utf8");

    const locationPath = path.join(tempDir, "location.txt");
    const cleanLocation = sanitizeForDrawtext(params.info.location || "Việt Nam");
    await fs.writeFile(locationPath, `Điểm đến: ${cleanLocation}`, "utf8");

    const pricePath = path.join(tempDir, "price.txt");
    await fs.writeFile(
      pricePath,
      `GIÁ TRỌN GÓI: ${Number(params.info.salePrice || 0).toLocaleString("vi-VN")} VNĐ`,
      "utf8"
    );

    const discountPath = path.join(tempDir, "discount.txt");
    await fs.writeFile(
      discountPath,
      discount > 0
        ? `Ưu đãi độc quyền: Giảm ${discount}% khi đặt sớm`
        : "Ưu đãi độc quyền cho khách hàng đặt sớm",
      "utf8"
    );

    const hlTitlePath = path.join(tempDir, "hl_title.txt");
    await fs.writeFile(hlTitlePath, "TRẢI NGHIỆM NỔI BẬT", "utf8");

    const hlContentPath = path.join(tempDir, "highlights.txt");
    await fs.writeFile(hlContentPath, highlights.map((h) => sanitizeForDrawtext(h)).join("\n"), "utf8");

    const contactTitlePath = path.join(tempDir, "contact_title.txt");
    await fs.writeFile(contactTitlePath, "THÔNG TIN ĐƠN VỊ & HỖ TRỢ", "utf8");

    const contactContentPath = path.join(tempDir, "contact.txt");
    await fs.writeFile(contactContentPath, contactLines.map((c) => sanitizeForDrawtext(c)).join("\n"), "utf8");

    const cta1Path = path.join(tempDir, "cta1.txt");
    await fs.writeFile(cta1Path, "ĐẶT VÉ CHÍNH HÃNG - QUÉT MÃ VÀO CỔNG", "utf8");

    const cta2Path = path.join(tempDir, "cta2.txt");
    const rawCta2 = params.info.ctaText && !params.info.ctaText.includes("giỏ hàng")
      ? sanitizeForDrawtext(params.info.ctaText)
      : "ĐIỀU HƯỚNG OFFICIAL CHECKOUT - GIỮ CHỖ NGAY";
    await fs.writeFile(
      cta2Path,
      rawCta2,
      "utf8"
    );

    // Sinh voiceover audio cho End-Card (hoặc fallback silence nếu lỗi)
    const cardAudioPath = path.join(tempDir, "card_audio.mp3");
    let hasVoice = false;
    try {
      const voiceText =
        sanitizeForDrawtext(params.voiceoverText || params.info.ctaText) ||
        `Vé chính hãng chỉ ${Number(params.info.salePrice).toLocaleString("vi-VN")} đồng. Quét mã vào cổng ngay hôm nay!`;
      await generateVoiceoverAudio(voiceText, cardAudioPath);
      hasVoice = true;
    } catch (e: any) {
      console.warn(
        "[FFmpeg Compositor] Không thể tạo TTS cho End-Card, dùng silent audio:",
        e?.message
      );
    }

    const fontPath = getSystemFontPath();
    // Giới hạn thời lượng End-Card chuẩn 2.0s để tối ưu tỷ lệ xem hết video (completion rate)
    const duration = Math.min(2.5, Math.max(2.0, Number((params.durationSec || 2.0).toFixed(1))));
    const totalFrames = Math.round(duration * 30);
    const outPath = path.join(tempDir, "endcard.mp4");

    const titleFontSize = isMultiLineTitle ? 28 : (rawTitle.length > 25 ? 32 : 36);
    const titleY = isMultiLineTitle ? 350 : 370;
    const locationY = isMultiLineTitle ? 435 : 430;

    const cta2Length = rawCta2.length;
    const cta2FontSize = cta2Length > 35 ? 20 : 24;

    const vf = [
      "scale=1280:2276:force_original_aspect_ratio=increase",
      "crop=1280:2276",
      `zoompan=z='min(zoom+0.0012,1.06)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30`,
      "boxblur=18:5",
      // 1. Khung card trung tâm với độ mờ sang trọng
      "drawbox=x=70:y=200:w=940:h=1520:color=0x0B132B@0.92:t=fill",
      "drawbox=x=70:y=200:w=940:h=1520:color=0x38BDF8@0.85:t=4",
      // 2. Banner tiêu đề màu xanh lam
      "drawbox=x=70:y=200:w=940:h=120:color=0x0284C7@0.95:t=fill",
      `drawtext=fontfile='${fontPath}':textfile=header.txt:fontcolor=white:fontsize=34:x=(w-text_w)/2:y=242:expansion=none`,
      // 3. Tên tour và địa điểm (chống tràn chữ)
      `drawtext=fontfile='${fontPath}':textfile=title.txt:fontcolor=0x38BDF8:fontsize=${titleFontSize}:line_spacing=10:x=(w-text_w)/2:y=${titleY}:expansion=none`,
      `drawtext=fontfile='${fontPath}':textfile=location.txt:fontcolor=0x94A3B8:fontsize=28:x=(w-text_w)/2:y=${locationY}:expansion=none`,
      // 4. Khung giá vàng nổi bật
      "drawbox=x=120:y=500:w=840:h=170:color=0x1E293B@0.95:t=fill",
      "drawbox=x=120:y=500:w=840:h=170:color=0xF59E0B@0.85:t=3",
      `drawtext=fontfile='${fontPath}':textfile=price.txt:fontcolor=0xFFD700:fontsize=44:x=(w-text_w)/2:y=535:expansion=none`,
      `drawtext=fontfile='${fontPath}':textfile=discount.txt:fontcolor=0x34C759:fontsize=26:x=(w-text_w)/2:y=605:expansion=none`,
      // 5. Trải nghiệm nổi bật
      `drawtext=fontfile='${fontPath}':textfile=hl_title.txt:fontcolor=0xF8FAFC:fontsize=30:x=130:y=720:expansion=none`,
      `drawtext=fontfile='${fontPath}':textfile=highlights.txt:fontcolor=0xE2E8F0:fontsize=28:line_spacing=22:x=130:y=780:expansion=none`,
      // 6. Đường phân cách và thông tin đơn vị
      "drawbox=x=120:y=1000:w=840:h=2:color=0x334155:t=fill",
      `drawtext=fontfile='${fontPath}':textfile=contact_title.txt:fontcolor=0xF8FAFC:fontsize=30:x=130:y=1040:expansion=none`,
      `drawtext=fontfile='${fontPath}':textfile=contact.txt:fontcolor=0xCBD5E1:fontsize=28:line_spacing=22:x=130:y=1100:expansion=none`,
      // 7. Banner nút kêu gọi hành động (CTA Official Checkout)
      "drawbox=x=120:y=1320:w=840:h=160:color=0x059669@0.95:t=fill",
      "drawbox=x=120:y=1320:w=840:h=160:color=0x34D399:t=2",
      `drawtext=fontfile='${fontPath}':textfile=cta1.txt:fontcolor=white:fontsize=30:x=(w-text_w)/2:y=1355:expansion=none`,
      `drawtext=fontfile='${fontPath}':textfile=cta2.txt:fontcolor=0xDCFCE7:fontsize=${cta2FontSize}:x=(w-text_w)/2:y=1410:expansion=none`,
    ].join(",");

    const ffmpegArgs = ["-loop", "1", "-i", "card_bg.jpg"];

    if (hasVoice) {
      ffmpegArgs.push("-i", "card_audio.mp3");
    } else {
      ffmpegArgs.push("-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo");
    }

    ffmpegArgs.push(
      "-vf",
      vf,
      "-t",
      `${duration}`,
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-ar",
      "44100",
      "-ac",
      "2",
      "-b:a",
      "128k",
      "-shortest",
      "-y",
      "endcard.mp4"
    );

    await new Promise<void>((resolve, reject) => {
      const exec = getResolvedFFmpegPath();
      const proc = spawn(exec, ffmpegArgs, {
        cwd: tempDir,
        stdio: ["ignore", "pipe", "pipe"],
      });
      let errStr = "";
      proc.stderr.on("data", (d) => {
        errStr += d.toString();
      });
      proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Tạo End-Card thất bại (${code}): ${errStr.slice(-400)}`));
      });
      proc.on("error", reject);
    });

    return await fs.readFile(outPath);
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {}
  }
}

export interface ComposeChainedVideoInput {
  segmentVideoBuffers: Buffer[];
  voiceoverScript: string;
  textOverlay: TextOverlayConfig;
  targetDurationSec?: number;
  closingImageBuffer?: Buffer;
  tourEndCardInfo?: TourEndCardConfig;
  useMuseAudio?: boolean;
}

/**
 * 4. Hợp nhất chuỗi phân cảnh AI Muse AI + Voiceover + Hình ảnh mờ hiển thị Tour Info ở cuối
 * Nối liền mạch N phân cảnh AI với độ phân giải đồng nhất 1080x1920 30fps.
 */
export async function composeChainedOmniVideo(
  input: ComposeChainedVideoInput
): Promise<Buffer> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "chained-composition-"));

  try {
    // 4.1. Sinh Voiceover audio bằng Edge-TTS làm dự phòng
    const voiceoverPath = path.join(tempDir, "voiceover.mp3");
    let hasEdgeTts = false;
    try {
      await generateVoiceoverAudio(input.voiceoverScript, voiceoverPath);
      hasEdgeTts = true;
    } catch (ttsErr: any) {
      console.warn("[FFmpeg Compositor] Notice: Edge-TTS generation:", ttsErr?.message);
    }

    const targetDuration = Number((input.targetDurationSec || 10).toFixed(1));
    const is10s = targetDuration <= 12;

    // Chuẩn bị danh sách buffer video các phân cảnh
    const clipBuffers = [...input.segmentVideoBuffers];

    // 4.2. Nếu có ảnh kết và thông tin tour -> Sinh clip End-Card phủ mờ (2.0s)
    let hasEndCard = false;
    let endCardDur = 0;
    if (input.closingImageBuffer && input.tourEndCardInfo) {
      try {
        endCardDur = 2.0; // Chuẩn 2.0s tối ưu tỷ lệ xem hết video (completion rate)
        console.log(
          `[FFmpeg Compositor] Tạo phân cảnh kết thúc (End-Card) phủ mờ hiển thị thông tin tour (${endCardDur}s)...`
        );
        const cardBuffer = await createBlurredTourInfoClip({
          imageBuffer: input.closingImageBuffer,
          durationSec: endCardDur,
          info: input.tourEndCardInfo,
          voiceoverText: input.tourEndCardInfo.ctaText,
        });
        if (cardBuffer && cardBuffer.length > 1000) {
          clipBuffers.push(cardBuffer);
          hasEndCard = true;
        }
      } catch (cardErr: any) {
        console.warn("[FFmpeg Compositor] End-Card creation notice:", cardErr?.message);
      }
    }

    // Thời lượng tổng video thành phẩm: Thời lượng clip AI + thời lượng End-Card (nếu có)
    const finalTotalDuration = Number((targetDuration + (hasEndCard ? endCardDur : 0)).toFixed(1));

    // 4.3. Chuẩn hóa tất cả các phân cảnh video về cùng 1080x1920 30fps và chuẩn âm thanh AAC
    const normalizedClipPaths: string[] = [];
    let hasAnyNativeAudio = false;

    for (let i = 0; i < clipBuffers.length; i++) {
      const rawPath = path.join(tempDir, `raw_seg_${i}.mp4`);
      await fs.writeFile(rawPath, clipBuffers[i]);

      const normPath = path.join(tempDir, `norm_seg_${i}.mp4`);
      const hasAudio = await hasAudioStream(rawPath);
      if (hasAudio) {
        hasAnyNativeAudio = true;
        await runFFmpeg([
          "-i",
          rawPath,
          "-vf",
          "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,fps=30",
          "-c:v",
          "libx264",
          "-preset",
          "ultrafast",
          "-c:a",
          "aac",
          "-ar",
          "44100",
          "-ac",
          "2",
          "-b:a",
          "128k",
          "-y",
          normPath,
        ]);
      } else {
        await runFFmpeg([
          "-i",
          rawPath,
          "-f",
          "lavfi",
          "-i",
          "anullsrc=r=44100:cl=stereo",
          "-vf",
          "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,fps=30",
          "-c:v",
          "libx264",
          "-preset",
          "ultrafast",
          "-c:a",
          "aac",
          "-ar",
          "44100",
          "-ac",
          "2",
          "-b:a",
          "128k",
          "-shortest",
          "-y",
          normPath,
        ]);
      }
      normalizedClipPaths.push(normPath);
    }

    // 4.4. Nối các phân cảnh
    const concatListPath = path.join(tempDir, "concat_list.txt");
    const concatContent = normalizedClipPaths
      .map((p) => `file '${p.replace(/\\/g, "/")}'`)
      .join("\n");
    await fs.writeFile(concatListPath, concatContent);

    const mergedVisualPath = path.join(tempDir, "merged_visual.mp4");
    await runFFmpeg([
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      concatListPath,
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-ar",
      "44100",
      "-ac",
      "2",
      "-b:a",
      "128k",
      "-y",
      mergedVisualPath,
    ]);

    // 4.5. Áp dụng Text Overlay (nếu có End-Card, bỏ qua overlay CTA/badge đè lên card)
    const finalOutputPath = path.join(tempDir, "final_composition.mp4");
    const fontPath = getSystemFontPath();

    const drawtextFilters: string[] = [];

    // Hook: 0-2s (10s) hoặc 0-3s (18s+) - cỡ chữ 44px rõ ràng, tương phản cao, loại bỏ emoji tránh lỗi font
    if (input.textOverlay.hookText) {
      const cleanHook = sanitizeForDrawtext(input.textOverlay.hookText);
      const escapedHook = cleanHook
        .replace(/'/g, "")
        .replace(/:/g, "\\:");
      const hookEnd = is10s ? 2 : 3;
      drawtextFilters.push(
        `drawtext=fontfile='${fontPath}':text='${escapedHook}':fontcolor=0xFFD700:fontsize=44:box=1:boxcolor=black@0.65:boxborderw=10:x=(w-text_w)/2:y=(h-text_h)/2-100:enable='between(t,0,${hookEnd})':expansion=none`
      );
    }

    // Mẹo du lịch / Trải nghiệm thực tế - cỡ chữ 36px (nâng từ 26px) giúp dễ đọc trên điện thoại
    if (input.textOverlay.tipText) {
      const cleanTip = sanitizeForDrawtext(input.textOverlay.tipText);
      const escapedTip = cleanTip
        .replace(/'/g, "")
        .replace(/:/g, "\\:");
      const tipStart = is10s ? 2 : 3;
      const tipEnd = is10s ? 5 : 7;
      drawtextFilters.push(
        `drawtext=fontfile='${fontPath}':text='${escapedTip}':fontcolor=0x34D399:fontsize=36:box=1:boxcolor=black@0.65:boxborderw=10:x=(w-text_w)/2:y=h-280:enable='between(t,${tipStart},${tipEnd})':expansion=none`
      );
    }

    // Nếu KHÔNG có End-Card -> Áp dụng Badge giá vé & CTA như trước
    if (!hasEndCard) {
      if (input.textOverlay.priceBadgeText) {
        const cleanPrice = sanitizeForDrawtext(input.textOverlay.priceBadgeText);
        const escapedPrice = cleanPrice
          .replace(/'/g, "")
          .replace(/:/g, "\\:");
        const priceStart = is10s ? 5 : 11;
        const priceEnd = is10s ? 8 : 15;
        drawtextFilters.push(
          `drawtext=fontfile='${fontPath}':text='${escapedPrice}':fontcolor=white:fontsize=32:box=1:boxcolor=black@0.65:boxborderw=12:x=(w-text_w)/2:y=120:enable='between(t,${priceStart},${priceEnd})':expansion=none`
        );
      }

      if (input.textOverlay.ctaText) {
        const cleanCta = sanitizeForDrawtext(input.textOverlay.ctaText || "ĐẶT VÉ CHÍNH HÃNG - QUÉT MÃ VÀO CỔNG");
        const escapedCta = cleanCta
          .replace(/'/g, "")
          .replace(/:/g, "\\:");
        const ctaStart = is10s ? 8 : 15;
        drawtextFilters.push(
          `drawtext=fontfile='${fontPath}':text='${escapedCta}':fontcolor=0x00FFCC:fontsize=32:box=1:boxcolor=black@0.65:boxborderw=10:x=(w-text_w)/2:y=h-180:enable='gte(t,${ctaStart})':expansion=none`
        );
      }
    }

    const vfFilters = drawtextFilters.length > 0
      ? drawtextFilters.join(",")
      : "null";

    // 4.6. Ghép visual + audio: Mặc định ưu tiên 100% âm thanh thuyết minh tiếng Việt chuẩn từ Edge-TTS
    // Chỉ dùng âm thanh gốc của Muse AI khi được chỉ định tường minh (useMuseAudio === true)
    // để tránh hiện tượng Muse AI tự chèn giọng đọc tiếng Anh ngẫu nhiên vào giữa video
    const useNativeAudio = hasAnyNativeAudio && input.useMuseAudio === true;

    if (useNativeAudio) {
      console.log("[FFmpeg Compositor] Giữ nguyên âm thanh giọng đọc & hiệu ứng từ Muse AI...");
      await runFFmpeg([
        "-i",
        mergedVisualPath,
        "-filter_complex",
        `[0:v]${vfFilters}[vout]`,
        "-map",
        "[vout]",
        "-map",
        "0:a",
        "-t",
        `${finalTotalDuration}`,
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        "-y",
        finalOutputPath,
      ]);
    } else if (hasEdgeTts) {
      console.log("[FFmpeg Compositor] Ghép âm thanh thuyết minh từ Edge-TTS...");
      await runFFmpeg([
        "-i",
        mergedVisualPath,
        "-i",
        voiceoverPath,
        "-filter_complex",
        `[0:v]${vfFilters}[vout];[1:a]apad=whole_dur=${finalTotalDuration}[aout]`,
        "-map",
        "[vout]",
        "-map",
        "[aout]",
        "-t",
        `${finalTotalDuration}`,
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        "-y",
        finalOutputPath,
      ]);
    } else {
      await runFFmpeg([
        "-i",
        mergedVisualPath,
        "-filter_complex",
        `[0:v]${vfFilters}[vout]`,
        "-map",
        "[vout]",
        "-t",
        `${finalTotalDuration}`,
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-an",
        "-movflags",
        "+faststart",
        "-y",
        finalOutputPath,
      ]);
    }

    return await fs.readFile(finalOutputPath);
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {}
  }
}

export const composeChainedMuseVideo = composeChainedOmniVideo;

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

    // Clip 1: Butter-smooth zoom in (pre-scaled to 1080x1920 to eliminate shaking)
    await runFFmpeg([
      "-loop", "1", "-i", startPath,
      "-vf", `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0012,1.2)':d=${framesPerClip}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${fps}`,
      "-t", String(half),
      "-pix_fmt", "yuv420p",
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-y", clip1,
    ]);

    // Clip 2: Butter-smooth zoom out with gentle easing (no frame 0 jumping)
    await runFFmpeg([
      "-loop", "1", "-i", endPath,
      "-vf", `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='if(lte(zoom,1.0),1.2,max(1.2-0.0012*on,1.0))':d=${framesPerClip}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${fps}`,
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
      vfFilter = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='if(lte(zoom,1.0),1.2,max(1.2-0.0012*on,1.0))':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${fps}`;
      break;
    case "PAN_LEFT":
      vfFilter = `scale=1242:1920:force_original_aspect_ratio=increase,crop=1242:1920,zoompan=z=1.0:d=${totalFrames}:x='(1-on/${totalFrames})*(iw-1080)':y='ih/2-960':s=1080x1920:fps=${fps}`;
      break;
    case "PAN_RIGHT":
      vfFilter = `scale=1242:1920:force_original_aspect_ratio=increase,crop=1242:1920,zoompan=z=1.0:d=${totalFrames}:x='(on/${totalFrames})*(iw-1080)':y='ih/2-960':s=1080x1920:fps=${fps}`;
      break;
    case "ZOOM_IN":
    default:
      vfFilter = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0012,1.2)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${fps}`;
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

    // 3.5. Áp dụng Text Overlay (Hook 3s đầu, Badge giá vé, Link mua vé)
    // và lồng ghép âm thanh Voiceover
    const finalOutputPath = path.join(tempDir, "final_composition.mp4");
    const fontPath = "C\\:/Windows/Fonts/arial.ttf"; // Font Arial Windows hỗ trợ Unicode tiếng Việt hoàn hảo

    const drawtextFilters: string[] = [];

    // Hook 3s đầu: chữ vàng viền đen ở trung tâm
    if (input.textOverlay.hookText) {
      const escapedHook = input.textOverlay.hookText
        .replace(/'/g, "")
        .replace(/:/g, "\\:");
      drawtextFilters.push(
        `drawtext=fontfile='${fontPath}':text='${escapedHook}':fontcolor=0xFFD700:fontsize=36:borderw=3:bordercolor=black:x=(w-text_w)/2:y=(h-text_h)/2-100:enable='between(t,0,3)'`
      );
    }

    // Badge giá vé: xuất hiện từ giây thứ 3 ở góc trên
    if (input.textOverlay.priceBadgeText) {
      const escapedPrice = input.textOverlay.priceBadgeText
        .replace(/'/g, "")
        .replace(/:/g, "\\:");
      drawtextFilters.push(
        `drawtext=fontfile='${fontPath}':text='${escapedPrice}':fontcolor=white:fontsize=28:box=1:boxcolor=black@0.6:boxborderw=10:x=(w-text_w)/2:y=120:enable='gte(t,3)'`
      );
    }

    // CTA & Link đặt vé: xuất hiện ở cuối video
    if (input.textOverlay.ctaText) {
      const escapedCta = input.textOverlay.ctaText
        .replace(/'/g, "")
        .replace(/:/g, "\\:");
      drawtextFilters.push(
        `drawtext=fontfile='${fontPath}':text='${escapedCta}':fontcolor=0x00FFCC:fontsize=26:borderw=2:bordercolor=black:x=(w-text_w)/2:y=h-180:enable='gte(t,4)'`
      );
    }

    const vfString =
      drawtextFilters.length > 0 ? drawtextFilters.join(",") : "null";

    // Ghép visual + voiceover audio chuẩn xác (không lặp lại video visual)
    await runFFmpeg([
      "-i",
      mergedVisualPath,
      "-i",
      voiceoverPath,
      "-vf",
      vfString,
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-shortest",
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

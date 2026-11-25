import crypto from "node:crypto";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { generateVoiceoverAudio, getResolvedFFmpegPath, runFFmpeg } from "./ffmpeg-compositor.ts";

const TTS_CACHE_DIR = path.join(os.tmpdir(), "travellink-tts-cache");
const RETRY_DELAYS_MS = [2000, 5000, 10000];

export interface TtsSynthesisResult {
  audioPath: string;
  durationSec: number;
  cached: boolean;
  provider: "edge_tts" | "edge_tts_cached" | "google_tts" | "silent_fallback";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function estimateSpeechDurationSec(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  // Vietnamese natural TTS pacing ~2.9 words/sec, bounded [3.2, 12]s per scene
  return Math.min(12, Math.max(3.2, Number((words / 2.85 + 0.45).toFixed(2))));
}

/**
 * Đo thời lượng file âm thanh thực tế (giây) bằng FFmpeg stderr
 */
export async function probeAudioDurationSec(filePath: string): Promise<number | null> {
  try {
    const execPath = getResolvedFFmpegPath();
    return await new Promise((resolve) => {
      const proc = spawn(/*turbopackIgnore: true*/ execPath, ["-i", filePath], {
        stdio: ["ignore", "ignore", "pipe"],
      });
      let stderr = "";
      proc.stderr.on("data", (d) => {
        stderr += d.toString();
      });
      proc.on("close", () => {
        const m = stderr.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/);
        if (!m) return resolve(null);
        const secs = Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
        resolve(Number.isFinite(secs) && secs > 0 ? secs : null);
      });
      proc.on("error", () => resolve(null));
    });
  } catch {
    return null;
  }
}

async function tryGoogleCloudTtsFallback(
  text: string,
  outputPath: string
): Promise<boolean> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY?.trim();
  if (!apiKey) return false;

  try {
    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: "vi-VN", name: "vi-VN-Wavenet-A" },
          audioConfig: { audioEncoding: "MP3" },
        }),
      }
    );
    if (!res.ok) return false;
    const json = await res.json();
    if (!json.audioContent) return false;
    await fs.writeFile(outputPath, Buffer.from(json.audioContent, "base64"));
    return existsSync(outputPath);
  } catch {
    return false;
  }
}

/**
 * Sinh giọng đọc tuần tự với:
 * 1. Cache theo SHA-256 hash của text + voice
 * 2. Retry backoff (2s, 5s, 10s) chống 429
 * 3. Fallback Google Cloud TTS (nếu cấu hình) hoặc silent MP3 đúng thời lượng ước lượng
 */
export async function synthesizeSceneSpeech(params: {
  text: string;
  outputPath: string;
  voice?: string;
}): Promise<TtsSynthesisResult> {
  const cleanText = params.text.trim();
  const voice = params.voice || "vi-VN-HoaiMyNeural";
  await fs.mkdir(TTS_CACHE_DIR, { recursive: true });

  const hash = crypto
    .createHash("sha256")
    .update(`${voice}|${cleanText}`)
    .digest("hex")
    .slice(0, 24);
  const cachePath = path.join(TTS_CACHE_DIR, `${hash}.mp3`);

  // 1. Check cache hit
  if (existsSync(cachePath)) {
    const stat = await fs.stat(cachePath).catch(() => null);
    if (stat && stat.size > 512) {
      await fs.copyFile(cachePath, params.outputPath);
      const dur = (await probeAudioDurationSec(params.outputPath)) ?? estimateSpeechDurationSec(cleanText);
      return {
        audioPath: params.outputPath,
        durationSec: dur,
        cached: true,
        provider: "edge_tts_cached",
      };
    }
  }

  // 2. Edge TTS with retry backoff (2s, 5s, 10s)
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      await generateVoiceoverAudio(cleanText, params.outputPath, voice);
      if (existsSync(params.outputPath)) {
        const stat = await fs.stat(params.outputPath).catch(() => null);
        if (stat && stat.size > 512) {
          await fs.copyFile(params.outputPath, cachePath).catch(() => {});
          const dur = (await probeAudioDurationSec(params.outputPath)) ?? estimateSpeechDurationSec(cleanText);
          return {
            audioPath: params.outputPath,
            durationSec: dur,
            cached: false,
            provider: "edge_tts",
          };
        }
      }
    } catch (err) {
      if (attempt < RETRY_DELAYS_MS.length) {
        const delayMs = RETRY_DELAYS_MS[attempt];
        console.warn(`[TTS] Attempt ${attempt + 1} failed, retrying in ${delayMs}ms...`, (err as Error)?.message || err);
        await sleep(delayMs);
      }
    }
  }

  // 3. Fallback Google Cloud TTS (if configured)
  const googleOk = await tryGoogleCloudTtsFallback(cleanText, params.outputPath);
  if (googleOk) {
    await fs.copyFile(params.outputPath, cachePath).catch(() => {});
    const dur = (await probeAudioDurationSec(params.outputPath)) ?? estimateSpeechDurationSec(cleanText);
    return {
      audioPath: params.outputPath,
      durationSec: dur,
      cached: false,
      provider: "google_tts",
    };
  }

  // 4. Silent audio fallback matching estimated speech duration
  const estDuration = estimateSpeechDurationSec(cleanText);
  await runFFmpeg([
    "-f", "lavfi",
    "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
    "-t", String(estDuration),
    "-c:a", "libmp3lame",
    "-b:a", "128k",
    "-y", params.outputPath,
  ]);

  return {
    audioPath: params.outputPath,
    durationSec: estDuration,
    cached: false,
    provider: "silent_fallback",
  };
}

/**
 * Thêm khoảng nghỉ tự nhiên (apad) vào cuối file MP3 của 1 phân cảnh
 * hoặc chỉnh tốc độ nhẹ (atempo) để tổng thời lượng luôn nằm trong 40-50s.
 */
export async function padAudioFileToDuration(
  audioPath: string,
  targetSec: number
): Promise<number> {
  const currentDur = (await probeAudioDurationSec(audioPath)) ?? 0;
  if (targetSec <= currentDur + 0.05) return currentDur;

  const paddedPath = `${audioPath}.pad.mp3`;
  await runFFmpeg([
    "-i", audioPath,
    "-af", `apad,atrim=0:${targetSec.toFixed(3)}`,
    "-c:a", "libmp3lame",
    "-b:a", "128k",
    "-y", paddedPath,
  ]);
  await fs.rename(paddedPath, audioPath);
  return targetSec;
}

export async function speedUpAudioFile(
  audioPath: string,
  tempo: number
): Promise<number> {
  const safeTempo = Math.min(1.25, Math.max(1.01, tempo));
  const fastPath = `${audioPath}.fast.mp3`;
  await runFFmpeg([
    "-i", audioPath,
    "-af", `atempo=${safeTempo.toFixed(3)}`,
    "-c:a", "libmp3lame",
    "-b:a", "128k",
    "-y", fastPath,
  ]);
  await fs.rename(fastPath, audioPath);
  return (await probeAudioDurationSec(audioPath)) ?? 4.0;
}

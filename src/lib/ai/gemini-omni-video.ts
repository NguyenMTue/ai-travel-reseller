import { createTwoImageHeroClip } from "../video-engine/ffmpeg-compositor.ts";
import {
  isMuse2ApiConfigured,
  generateMuseVideoClip,
  getMuse2ApiConfig,
  type MuseVideoCostBreakdown,
  type OmniVideoCostBreakdown,
  type MuseVideoGenerationInput,
  type MuseVideoGenerationResult,
} from "./muse-video.ts";

export {
  isMuse2ApiConfigured,
  generateMuseVideoClip,
  getMuse2ApiConfig,
  type MuseVideoCostBreakdown,
  type OmniVideoCostBreakdown,
};

export interface OmniVideoGenerationInput {
  prompt: string;
  startImageBuffer: Buffer;
  endImageBuffer: Buffer;
  durationSeconds?: number;
  aspectRatio?: "9:16" | "16:9";
  voiceoverScript?: string;
  ambientSounds?: string[];
}

export interface OmniVideoGenerationResult {
  videoBuffer: Buffer;
  durationSeconds: number;
  cost: OmniVideoCostBreakdown;
  videoUrl?: string;
}

/**
 * Tính toán chi phí cho Muse AI Video:
 * Muse AI hoạt động qua tài khoản Muse2API Gateway (Miễn phí 0đ, không tốn credit Google Gemini Omni).
 */
export function calculateGeminiOmniCost(
  durationSeconds: number,
  _inputTokens = 1500,
  isLiveCall = true
): OmniVideoCostBreakdown {
  const outputTokens = Math.round(durationSeconds * 5792);

  if (!isLiveCall) {
    return {
      model_name: "muse-video (Nội suy ảnh thật FFmpeg Ken Burns)",
      duration_seconds: durationSeconds,
      input_tokens: 0,
      output_tokens: 0,
      cost_usd: 0,
      cost_vnd: 0,
      free_tier_components: {
        ffmpeg_compositor_cost: 0,
        edge_tts_cost: 0,
        total_free_savings_usd: 3.5,
      },
      is_live_call: false,
      status_note: "Nội suy chuyển cảnh động mượt mà từ ảnh thật (0đ).",
    };
  }

  return {
    model_name: "muse-video (Muse AI Gateway)",
    duration_seconds: durationSeconds,
    input_tokens: 1500,
    output_tokens: outputTokens,
    cost_usd: 0,
    cost_vnd: 0,
    free_tier_components: {
      ffmpeg_compositor_cost: 0,
      edge_tts_cost: 0,
      total_free_savings_usd: 3.5,
    },
    is_live_call: true,
    status_note: "Tạo thành công bằng mô hình muse-video trực tiếp qua Muse AI.",
  };
}

/**
 * Sinh video phân cảnh hoàn toàn bằng Muse AI:
 * 1. Gọi trực tiếp MUSE2API Gateway (Image-to-Video với prompt và reference image).
 * 2. Fallback an toàn: Nội suy chuyển cảnh Ken Burns 4K bằng FFmpeg từ ảnh thật của Merchant (0đ, không dùng Gemini Omni).
 */
export async function generateGeminiOmniHeroVideo(
  input: OmniVideoGenerationInput
): Promise<OmniVideoGenerationResult> {
  const duration = input.durationSeconds || 6;

  // 1. Tạo video bằng Muse AI qua MUSE2API Gateway
  if (isMuse2ApiConfigured()) {
    try {
      console.log(`[Video Engine] Tạo phân cảnh bằng Muse AI (${duration}s)...`);
      const museResult = await generateMuseVideoClip({
        prompt: input.prompt,
        startImageBuffer: input.startImageBuffer,
        endImageBuffer: input.endImageBuffer,
        durationSeconds: duration,
        aspectRatio: input.aspectRatio || "9:16",
        voiceoverScript: input.voiceoverScript,
        ambientSounds: input.ambientSounds,
      });

      if (museResult?.videoBuffer && museResult.videoBuffer.length > 1000) {
        return {
          videoBuffer: museResult.videoBuffer,
          durationSeconds: museResult.durationSeconds,
          cost: museResult.cost,
          videoUrl: museResult.videoUrl,
        };
      }
    } catch (museErr: any) {
      console.warn("[Video Engine] Muse AI Gateway notice:", museErr?.message || museErr);
    }
  }

  // 2. Fallback trực tiếp bằng Ken Burns nội suy từ ảnh thật của Merchant (không phụ thuộc Gemini Omni)
  try {
    console.log("[Video Engine] Kích hoạt Ken Burns nội suy từ ảnh thật của Merchant...");
    const heroInterpolatedBuffer = await createTwoImageHeroClip(
      input.startImageBuffer,
      input.endImageBuffer,
      duration
    );

    return {
      videoBuffer: heroInterpolatedBuffer,
      durationSeconds: duration,
      cost: calculateGeminiOmniCost(duration, 0, false),
    };
  } catch (renderErr: any) {
    console.error("Lỗi khi tổng hợp video từ ảnh thật:", renderErr?.message);
    throw new Error(
      "Không thể tạo video từ ảnh đã chọn: " + (renderErr?.message || "Lỗi xử lý hình ảnh")
    );
  }
}

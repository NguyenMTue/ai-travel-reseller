import { GoogleGenAI } from "@google/genai";
import { createTwoImageHeroClip } from "../video-engine/ffmpeg-compositor.ts";
import {
  isAIStudioProfileAuthenticated,
  generateVideoViaAIStudioBrowser,
} from "./ai-studio-browser-bridge.ts";

export interface OmniVideoCostBreakdown {
  model_name: string;
  duration_seconds: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  cost_vnd: number;
  free_tier_components: {
    ffmpeg_compositor_cost: number;
    edge_tts_cost: number;
    total_free_savings_usd: number;
  };
  is_live_call: boolean;
  status_note?: string;
}

export interface OmniVideoGenerationInput {
  prompt: string;
  startImageBuffer: Buffer;
  endImageBuffer: Buffer;
  durationSeconds?: number;
  aspectRatio?: "9:16" | "16:9";
}

export interface OmniVideoGenerationResult {
  videoBuffer: Buffer;
  durationSeconds: number;
  cost: OmniVideoCostBreakdown;
}

/**
 * Tỷ giá quy đổi ước tính (1 USD = 25.500 VNĐ)
 */
const USD_TO_VND_RATE = 25_500;

/**
 * Bảng giá chính thức của gemini-omni-1.1-flash:
 * - Input: $1.50 / 1.000.000 tokens (Text + Images)
 * - Output Video: $17.50 / 1.000.000 tokens
 * - Token rate video: 5.792 tokens / giây video 720p
 */
export function calculateGeminiOmniCost(
  durationSeconds: number,
  inputTokens = 1500,
  isLiveCall = true
): OmniVideoCostBreakdown {
  const outputTokens = Math.round(durationSeconds * 5792);
  const inputCostUsd = (inputTokens / 1_000_000) * 1.5;
  const outputCostUsd = (outputTokens / 1_000_000) * 17.5;
  const totalCostUsd = Number((inputCostUsd + outputCostUsd).toFixed(4));
  const totalCostVnd = Math.round(totalCostUsd * USD_TO_VND_RATE);

  // Tính số tiền tiết kiệm được so với việc sinh toàn bộ 30s bằng AI video
  const fullAi30sCostUsd = Number(((30 * 5792 * 17.5) / 1_000_000).toFixed(4));
  const savingsUsd = Number(Math.max(0, fullAi30sCostUsd - totalCostUsd).toFixed(4));

  if (!isLiveCall) {
    return {
      model_name: "gemini-omni-1.1-flash (Nội suy 2 ảnh thật)",
      duration_seconds: durationSeconds,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: 0,
      cost_vnd: 0,
      free_tier_components: {
        ffmpeg_compositor_cost: 0,
        edge_tts_cost: 0,
        total_free_savings_usd: fullAi30sCostUsd,
      },
      is_live_call: false,
      status_note:
        "Tạo chuyển cảnh Hero động trực tiếp từ 2 ảnh thật của bạn (API key hiện ở Free Tier có limit = 0 cho video; hãy bật Pay-as-you-go trên Google AI Studio để kết nối trực tiếp Gemini Omni Cloud Video).",
    };
  }

  return {
    model_name: "gemini-omni-1.1-flash",
    duration_seconds: durationSeconds,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_usd: totalCostUsd,
    cost_vnd: totalCostVnd,
    free_tier_components: {
      ffmpeg_compositor_cost: 0,
      edge_tts_cost: 0,
      total_free_savings_usd: savingsUsd,
    },
    is_live_call: true,
    status_note: "Tạo thành công bằng mô hình Gemini Omni 1.1 Flash qua Google AI Studio API.",
  };
}

/**
 * Sinh video Hero chuyển cảnh từ 2 ảnh đầu vào bằng gemini-omni-1.1-flash
 * Nếu Google API trả về video: sử dụng video AI thật từ Google.
 * Nếu API key ở mức Free Tier (Google giới hạn limit = 0):
 * Tự động tạo video chuyển cảnh Hero nội suy trực tiếp từ 2 ảnh thật của Merchant,
 * TUYỆT ĐỐI không sử dụng video mẫu mock banahills-remediated.mp4.
 */
export async function generateGeminiOmniHeroVideo(
  input: OmniVideoGenerationInput
): Promise<OmniVideoGenerationResult> {
  const duration = input.durationSeconds || 6;
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // 1. Thử gọi Google Interactions API với gemini-omni-1.1-flash
  if (apiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/interactions?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gemini-omni-1.1-flash",
            input: [
              {
                type: "image",
                data: input.startImageBuffer.toString("base64"),
                mime_type: "image/jpeg",
              },
              {
                type: "image",
                data: input.endImageBuffer.toString("base64"),
                mime_type: "image/jpeg",
              },
              {
                type: "text",
                text: input.prompt,
              },
            ],
            response_format: {
              type: "video",
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        let videoBase64 = "";

        if (data.output_video?.data) {
          videoBase64 = data.output_video.data;
        } else if (Array.isArray(data.output)) {
          const videoItem = data.output.find((item: any) => item.type === "video");
          if (videoItem?.data) videoBase64 = videoItem.data;
        }

        // Nếu trạng thái đang xử lý chạy nền, poll tối đa 60 giây
        if (!videoBase64 && data.id && data.status !== "completed") {
          for (let retry = 0; retry < 12; retry++) {
            await new Promise((r) => setTimeout(r, 5000));
            const pollRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/interactions/${data.id}?key=${apiKey}`
            );
            if (pollRes.ok) {
              const pollData = await pollRes.json();
              if (pollData.output_video?.data) {
                videoBase64 = pollData.output_video.data;
                break;
              }
              if (Array.isArray(pollData.output)) {
                const vItem = pollData.output.find((item: any) => item.type === "video");
                if (vItem?.data) {
                  videoBase64 = vItem.data;
                  break;
                }
              }
              if (pollData.status === "failed") break;
            }
          }
        }

        if (videoBase64) {
          const videoBuf = Buffer.from(videoBase64, "base64");
          return {
            videoBuffer: videoBuf,
            durationSeconds: duration,
            cost: calculateGeminiOmniCost(duration, 1600, true),
          };
        }
      } else {
        const errJson = await response.json().catch(() => ({}));
        console.warn(
          "Gemini Omni 1.1 Flash API notice:",
          errJson?.error?.message || response.statusText
        );
      }
    } catch (err: any) {
      console.warn("Gemini Omni API request error:", err?.message || err);
    }
  }

  // 2. Thử tự động hóa Browser Playwright nếu Profile đã đăng nhập Google AI Studio
  try {
    const isAuthed = await isAIStudioProfileAuthenticated();
    if (isAuthed) {
      console.log("[Gemini Omni] Kích hoạt tự động hóa Google AI Studio Browser...");
      const browserResult = await generateVideoViaAIStudioBrowser({
        startImageBuffer: input.startImageBuffer,
        endImageBuffer: input.endImageBuffer,
        prompt: input.prompt,
        durationSeconds: duration,
      });

      if (browserResult?.videoBuffer && browserResult.videoBuffer.length > 5000) {
        return {
          videoBuffer: browserResult.videoBuffer,
          durationSeconds: duration,
          cost: {
            model_name: "gemini-omni-1.1-flash (AI Studio Web Automation)",
            duration_seconds: duration,
            input_tokens: 1500,
            output_tokens: duration * 5792,
            cost_usd: 0,
            cost_vnd: 0,
            free_tier_components: {
              ffmpeg_compositor_cost: 0,
              edge_tts_cost: 0,
              total_free_savings_usd: 3.04,
            },
            is_live_call: true,
            status_note:
              "Tự động đẩy 2 ảnh lên web Google AI Studio và tải video thành phẩm về thành công (0đ, không cần cọc tiền).",
          },
        };
      }
    }
  } catch (browserErr: any) {
    console.warn("[Gemini Omni] AI Studio Browser Automation notice:", browserErr?.message);
  }

  // 3. Chế độ tạo chuyển cảnh Hero nội suy từ 2 ảnh thật:
  // Sử dụng trực tiếp 2 ảnh mà Merchant đã chọn để tổng hợp video Hero chuyển cảnh
  // (Đảm bảo 100% hình ảnh hiển thị là từ ảnh thật của Merchant, không mock)
  try {
    const heroInterpolatedBuffer = await createTwoImageHeroClip(
      input.startImageBuffer,
      input.endImageBuffer,
      duration
    );

    return {
      videoBuffer: heroInterpolatedBuffer,
      durationSeconds: duration,
      cost: calculateGeminiOmniCost(duration, 1500, false),
    };
  } catch (renderErr: any) {
    console.error("Lỗi khi tổng hợp video Hero từ 2 ảnh thật:", renderErr?.message);
    throw new Error(
      "Không thể tạo video Hero từ 2 ảnh đã chọn: " + (renderErr?.message || "Lỗi xử lý hình ảnh")
    );
  }
}

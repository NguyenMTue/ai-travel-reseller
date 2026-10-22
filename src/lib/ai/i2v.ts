/**
 * Image-to-Video (I2V) Service & Multi-Provider Router
 * Project: TravelLink AI - AI Content Factory / Video Generation Pipeline
 *
 * Configurable Architecture:
 * 1. n8n Webhook (Highest priority if configured via N8N_I2V_WEBHOOK_URL)
 * 2. Replicate SVD (Stable Video Diffusion if REPLICATE_API_TOKEN is present)
 * 3. fal.ai (Fast SVD / Kling if FAL_KEY or FAL_API_KEY is present)
 *
 * Safe Fallback Guarantee:
 * - If no provider is configured, or if any network/API error occurs (timeout, rate-limit, 5xx),
 *   the system automatically falls back to:
 *   a) Pre-rendered clips (video mẫu đã tạo sẵn), or
 *   b) Ken Burns effect (2.5D Pan/Zoom via FFmpeg/Canvas)
 * - The pipeline NEVER throws or breaks; rendering always continues smoothly.
 *
 * Selective Routing:
 * - AERIAL_WIDE & SCENIC_MEDIUM: Eligible for I2V / Drone spatial motion.
 * - CLOSEUP_FOOD & HUMAN_POV: Excluded from generative pixel AI (per RuleAIAgentsGenVideo)
 *   to prevent facial distortion and unnatural food textures.
 */

export type I2VProviderType = "n8n" | "replicate" | "fal" | "auto" | "fallback";

export type I2VMotionMode = "GENERATIVE_VIDEO" | "PRE_RENDERED_CLIP" | "KEN_BURNS";

export interface I2VConfig {
  provider?: I2VProviderType;
  n8nWebhookUrl?: string;
  replicateApiToken?: string;
  replicateModel?: string;
  falKey?: string;
  falModel?: string;
  timeoutMs?: number;
  preRenderedClips?: Record<string, string>;
  fetchFn?: typeof fetch;
}

export interface I2VRequest {
  imageUrl: string;
  shotType?: string;
  prompt?: string;
  durationSec?: number;
  motion?: "DRONE_TRUCK_LEFT" | "DRONE_TRUCK_RIGHT" | "KEN_BURNS_PUSH_IN" | string;
  productId?: string;
  campaignId?: string;
}

export interface I2VResult {
  success: boolean;
  mode: I2VMotionMode;
  provider:
    | "n8n"
    | "replicate"
    | "fal"
    | "pre_rendered_fallback"
    | "ken_burns_fallback"
    | "selective_routing";
  videoUrl?: string;
  motionType: string;
  fallbackReason?: string;
  latencyMs: number;
}

export const DEFAULT_PRE_RENDERED_CLIPS: Record<string, string> = {
  AERIAL_WIDE:
    "http://127.0.0.1:54321/storage/v1/object/public/campaign-videos/banahills-i2v-drone-reference.mp4",
  SCENIC_MEDIUM:
    "http://127.0.0.1:54321/storage/v1/object/public/campaign-videos/banahills-i2v-drone-reference.mp4",
  DEFAULT:
    "http://127.0.0.1:54321/storage/v1/object/public/campaign-videos/banahills-i2v-drone-reference.mp4",
};

/**
 * Đọc cấu hình I2V từ biến môi trường
 */
export function getI2VConfig(overrides?: Partial<I2VConfig>): I2VConfig {
  const env = typeof process !== "undefined" ? process.env : {};

  return {
    provider: (overrides?.provider ||
      env.I2V_PROVIDER ||
      "auto") as I2VProviderType,
    n8nWebhookUrl:
      overrides?.n8nWebhookUrl ||
      env.N8N_I2V_WEBHOOK_URL ||
      env.N8N_WEBHOOK_I2V_URL ||
      "",
    replicateApiToken:
      overrides?.replicateApiToken || env.REPLICATE_API_TOKEN || "",
    replicateModel:
      overrides?.replicateModel ||
      env.REPLICATE_SVD_MODEL ||
      "stability-ai/stable-video-diffusion:3f0457140d6ab67cd0050f045ca6137f402218a397c28543dce268e803495b2d",
    falKey:
      overrides?.falKey || env.FAL_KEY || env.FAL_API_KEY || "",
    falModel:
      overrides?.falModel ||
      env.FAL_I2V_MODEL ||
      "fal-ai/fast-svd/lcm",
    timeoutMs: overrides?.timeoutMs || 25_000,
    preRenderedClips:
      overrides?.preRenderedClips !== undefined
        ? overrides.preRenderedClips
        : {
            ...DEFAULT_PRE_RENDERED_CLIPS,
            ...(env.I2V_PRE_RENDERED_FALLBACK_URL
              ? { DEFAULT: env.I2V_PRE_RENDERED_FALLBACK_URL }
              : {}),
          },
    fetchFn: overrides?.fetchFn || globalThis.fetch,
  };
}

/**
 * Selective Routing:
 * Chỉ ảnh toàn cảnh / góc rộng (AERIAL_WIDE, SCENIC_MEDIUM) mới được nạp vào
 * pipeline sinh chuyển động camera I2V / Drone Truck Left.
 * Ảnh món ăn (CLOSEUP_FOOD) hoặc du khách (HUMAN_POV) TUYỆT ĐỐI không nạp vào
 * để tránh biến dạng AI (RuleAIAgentsGenVideo).
 */
export function isEligibleForI2V(shotType?: string): boolean {
  if (!shotType) return false;
  const normalized = shotType.toUpperCase().trim();
  return normalized === "AERIAL_WIDE" || normalized === "SCENIC_MEDIUM";
}

/**
 * Xác định nhà cung cấp khả dụng dựa trên thứ tự ưu tiên
 */
export function resolveActiveProvider(
  config: I2VConfig
): "n8n" | "replicate" | "fal" | "fallback" {
  if (config.provider && config.provider !== "auto") {
    if (config.provider === "n8n" && config.n8nWebhookUrl) return "n8n";
    if (config.provider === "replicate" && config.replicateApiToken) return "replicate";
    if (config.provider === "fal" && config.falKey) return "fal";
    return "fallback";
  }

  // Thứ tự ưu tiên mặc định:
  // 1. Webhook n8n (ưu tiên hàng đầu nếu có cấu hình)
  if (config.n8nWebhookUrl) {
    return "n8n";
  }
  // 2. Replicate SVD
  if (config.replicateApiToken) {
    return "replicate";
  }
  // 3. fal.ai
  if (config.falKey) {
    return "fal";
  }

  // Fallback an toàn nếu không có API key nào
  return "fallback";
}

/**
 * Gọi webhook n8n Image-to-Video
 */
async function callN8nI2V(
  request: I2VRequest,
  config: I2VConfig
): Promise<string> {
  const fetcher = config.fetchFn || globalThis.fetch;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const res = await fetcher(config.n8nWebhookUrl!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: request.imageUrl,
        shot_type: request.shotType,
        prompt: request.prompt || "cinematic drone shot smooth camera motion",
        duration_sec: request.durationSec || 3.0,
        motion: request.motion || "DRONE_TRUCK_LEFT",
        product_id: request.productId,
        campaign_id: request.campaignId,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`n8n webhook returned status ${res.status}`);
    }

    const data = await res.json();
    const videoUrl =
      data?.videoUrl ||
      data?.video_url ||
      data?.output_url ||
      data?.url ||
      data?.data?.video_url;

    if (!videoUrl || typeof videoUrl !== "string") {
      throw new Error("n8n response missing video URL field");
    }

    return videoUrl;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Gọi Replicate SVD (Stable Video Diffusion) API
 */
async function callReplicateSVD(
  request: I2VRequest,
  config: I2VConfig
): Promise<string> {
  const fetcher = config.fetchFn || globalThis.fetch;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const res = await fetcher("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.replicateApiToken}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({
        version: config.replicateModel!.split(":")[1] || config.replicateModel,
        input: {
          input_image: request.imageUrl,
          video_length: "14_frames_with_svd",
          sizing_strategy: "maintain_aspect_ratio",
          motion_bucket_id: 127,
          cond_aug: 0.02,
          decoding_t: 7,
          fps: 24,
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Replicate API returned status ${res.status}`);
    }

    const data = await res.json();
    // Khi dùng Prefer: wait, output có thể là string URL hoặc array [string]
    let videoUrl = "";
    if (typeof data.output === "string") {
      videoUrl = data.output;
    } else if (Array.isArray(data.output) && data.output.length > 0) {
      videoUrl = data.output[0];
    } else if (data.status === "failed") {
      throw new Error(`Replicate prediction failed: ${data.error || "Unknown"}`);
    } else if (data.urls?.get) {
      // Đang xử lý async nếu backend không wait
      videoUrl = data.urls.get;
    }

    if (!videoUrl) {
      throw new Error("Replicate response did not contain a valid video output URL");
    }

    return videoUrl;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Gọi fal.ai Image-to-Video API
 */
async function callFalI2V(
  request: I2VRequest,
  config: I2VConfig
): Promise<string> {
  const fetcher = config.fetchFn || globalThis.fetch;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const endpoint = `https://fal.run/${config.falModel || "fal-ai/fast-svd/lcm"}`;
    const res = await fetcher(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Key ${config.falKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: request.imageUrl,
        motion_bucket_id: 127,
        fps: 24,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`fal.ai API returned status ${res.status}`);
    }

    const data = await res.json();
    const videoUrl =
      data?.video?.url ||
      data?.video_url ||
      data?.output?.video_url ||
      data?.url;

    if (!videoUrl || typeof videoUrl !== "string") {
      throw new Error("fal.ai response did not contain a valid video output URL");
    }

    return videoUrl;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Tạo Fallback kết quả an toàn (Pre-rendered Clip hoặc Ken Burns)
 */
function createSafeFallbackResult(
  request: I2VRequest,
  config: I2VConfig,
  startTime: number,
  reason: string
): I2VResult {
  const clips = config.preRenderedClips || DEFAULT_PRE_RENDERED_CLIPS;
  const shotKey = (request.shotType || "").toUpperCase();
  const preRenderedUrl = clips[shotKey] || clips.DEFAULT;

  if (preRenderedUrl) {
    return {
      success: true,
      mode: "PRE_RENDERED_CLIP",
      provider: "pre_rendered_fallback",
      videoUrl: preRenderedUrl,
      motionType: request.motion || "DRONE_TRUCK_LEFT",
      fallbackReason: reason,
      latencyMs: Date.now() - startTime,
    };
  }

  // Fallback về hiệu ứng Ken Burns cũ
  return {
    success: true,
    mode: "KEN_BURNS",
    provider: "ken_burns_fallback",
    motionType: "KEN_BURNS_PUSH_IN",
    fallbackReason: `${reason} -> Fallback sang Ken Burns Motion (FFmpeg/Canvas)`,
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Core Function: Sinh video từ hình ảnh (Image-to-Video)
 * - Tự động định tuyến (Selective Routing)
 * - Tự động chọn Provider (n8n > Replicate > fal.ai)
 * - Tự động Fallback an toàn (Pre-rendered clip / Ken Burns) khi có lỗi hoặc thiếu key
 */
export async function generateImageToVideo(
  request: I2VRequest,
  overrides?: Partial<I2VConfig>
): Promise<I2VResult> {
  const startTime = Date.now();
  const config = getI2VConfig(overrides);

  // 1. Kiểm tra Selective Routing:
  // Nếu ảnh là món ăn hoặc góc người review (CLOSEUP_FOOD, HUMAN_POV),
  // không nạp vào I2V để bảo toàn chất lượng ảnh thật theo RuleAIAgentsGenVideo.
  if (!isEligibleForI2V(request.shotType)) {
    const isFood = request.shotType?.toUpperCase() === "CLOSEUP_FOOD";
    return {
      success: true,
      mode: "KEN_BURNS",
      provider: "selective_routing",
      motionType: isFood ? "FOOD_FOCUS_ZOOM" : "HANDHELD_POV_KEN_BURNS",
      fallbackReason: `Tài nguyên ${request.shotType || "NON_LANDSCAPE"} được giữ nguyên chất lượng thật qua hiệu ứng Ken Burns để chống biến dạng AI.`,
      latencyMs: Date.now() - startTime,
    };
  }

  // 2. Xác định Active Provider
  const activeProvider = resolveActiveProvider(config);

  if (activeProvider === "fallback") {
    return createSafeFallbackResult(
      request,
      config,
      startTime,
      "Không có API token (n8n/Replicate/fal.ai) được cấu hình"
    );
  }

  // 3. Thực thi Provider theo thứ tự ưu tiên kèm cơ chế Fallback
  try {
    let videoUrl = "";

    if (activeProvider === "n8n") {
      videoUrl = await callN8nI2V(request, config);
    } else if (activeProvider === "replicate") {
      videoUrl = await callReplicateSVD(request, config);
    } else if (activeProvider === "fal") {
      videoUrl = await callFalI2V(request, config);
    }

    return {
      success: true,
      mode: "GENERATIVE_VIDEO",
      provider: activeProvider,
      videoUrl,
      motionType: request.motion || "DRONE_TRUCK_LEFT",
      latencyMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    // Bắt toàn bộ lỗi (Timeout, 401, 429, 500...) và kích hoạt Fallback an toàn
    return createSafeFallbackResult(
      request,
      config,
      startTime,
      `Lỗi khi gọi provider ${activeProvider}: ${errorMessage}`
    );
  }
}

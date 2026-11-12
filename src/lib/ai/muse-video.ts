export interface MuseVideoCostBreakdown {
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

// Giữ lại type alias OmniVideoCostBreakdown để tương thích ngược các file gọi cũ
export type OmniVideoCostBreakdown = MuseVideoCostBreakdown;

export interface Muse2ApiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

export interface MuseVideoGenerationInput {
  prompt: string;
  startImageBuffer?: Buffer;
  endImageBuffer?: Buffer;
  durationSeconds?: number;
  aspectRatio?: "9:16" | "16:9";
  voiceoverScript?: string;
  ambientSounds?: string[];
  signal?: AbortSignal;
}

export interface MuseVideoGenerationResult {
  videoBuffer: Buffer;
  durationSeconds: number;
  cost: MuseVideoCostBreakdown;
  taskId?: string;
  videoUrl?: string;
}

/**
 * Lấy cấu hình MUSE2API từ biến môi trường
 */
export function getMuse2ApiConfig(): Muse2ApiConfig | null {
  const apiKey = (process.env.MUSE2API_KEY || "").trim();
  if (!apiKey) return null;

  const rawBaseUrl = (
    process.env.MUSE2API_BASE_URL ||
    process.env.MUSE2API_URL ||
    "http://localhost:18610"
  ).trim();

  // Chuẩn hóa loại bỏ dấu / ở cuối URL
  const baseUrl = rawBaseUrl.replace(/\/+$/, "");
  const model = (process.env.MUSE2API_MODEL || "muse-video").trim();
  const timeoutMs = Number(process.env.MUSE2API_TIMEOUT_MS) || 180_000;

  return { apiKey, baseUrl, model, timeoutMs };
}

/**
 * Kiểm tra xem MUSE2API_KEY đã được thiết lập hay chưa
 */
export function isMuse2ApiConfigured(): boolean {
  return Boolean(process.env.MUSE2API_KEY && process.env.MUSE2API_KEY.trim().length > 0);
}

/**
 * Nhận diện MIME type của ảnh từ Header Bytes
 */
function detectImageMime(buffer: Buffer): string {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }
  return "image/jpeg";
}

/**
 * Kiểm tra tính khả dụng của MUSE2API Gateway
 */
export async function checkMuse2ApiHealth(config?: Muse2ApiConfig): Promise<{
  ok: boolean;
  models?: string[];
  message?: string;
}> {
  const cfg = config || getMuse2ApiConfig();
  if (!cfg) {
    return { ok: false, message: "MUSE2API_KEY chưa được cấu hình trong môi trường." };
  }

  try {
    const res = await fetch(`${cfg.baseUrl}/v1/models`, {
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) {
      return { ok: false, message: `MUSE2API trả về mã lỗi HTTP ${res.status}` };
    }

    const data = await res.json();
    const modelIds = Array.isArray(data?.data)
      ? data.data.map((m: any) => String(m.id))
      : [];

    return { ok: true, models: modelIds, message: "MUSE2API sẵn sàng." };
  } catch (err: any) {
    return { ok: false, message: err?.message || "Không thể kết nối tới MUSE2API Gateway." };
  }
}

/**
 * Gọi MUSE2API Gateway để sinh video AI chất lượng cao từ Prompt và ảnh tham chiếu (Image-to-Video)
 */
export async function generateMuseVideoClip(
  input: MuseVideoGenerationInput
): Promise<MuseVideoGenerationResult> {
  const config = getMuse2ApiConfig();
  if (!config) {
    throw new Error(
      "[MUSE2API] Không tìm thấy biến môi trường MUSE2API_KEY. Vui lòng cấu hình trong file .env."
    );
  }

  const requestedDuration = input.durationSeconds || 6;
  // Muse API hỗ trợ các mốc thời lượng 5s, 6s, 8s, 10s
  const duration = Math.min(10, Math.max(5, Math.round(requestedDuration)));
  const aspectRatio = input.aspectRatio || "9:16";

  let imagePayload: string | undefined = undefined;
  if (input.startImageBuffer && input.startImageBuffer.length > 0) {
    const mime = detectImageMime(input.startImageBuffer);
    imagePayload = `data:${mime};base64,${input.startImageBuffer.toString("base64")}`;
  }

  let fullPrompt = input.prompt;
  if (input.voiceoverScript && input.voiceoverScript.trim()) {
    const cleanVoice = input.voiceoverScript
      .replace(/\[pause\s*[\d\.]+s?\]/gi, " ")
      .replace(/\[.*?\]/g, " ")
      .trim();
    if (cleanVoice) {
      fullPrompt += ` Audio & Voiceover Narration: Professional, warm, engaging Vietnamese travel host says: "${cleanVoice}".`;
      if (input.ambientSounds && input.ambientSounds.length > 0) {
        fullPrompt += ` Synchronized ambient soundscape: ${input.ambientSounds.join(", ")}.`;
      }
    }
  }

  console.log(
    `[MUSE2API] Gửi yêu cầu sinh video (${duration}s, ${aspectRatio}, model: ${config.model}) tới ${config.baseUrl}/v1/videos...`
  );

  const requestBody: Record<string, unknown> = {
    prompt: fullPrompt,
    model: config.model,
    duration,
    aspect_ratio: aspectRatio,
  };

  if (imagePayload) {
    requestBody.image = imagePayload;
    requestBody.reference_image = imagePayload;
  }

  // 1. Tạo tác vụ sinh video (Asynchronous Task)
  const createRes = await fetch(`${config.baseUrl}/v1/videos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(requestBody),
    signal: input.signal,
  });

  if (!createRes.ok) {
    const errorBody = await createRes.text().catch(() => "");
    throw new Error(
      `[MUSE2API] Yêu cầu tạo video thất bại [HTTP ${createRes.status}]: ${errorBody || createRes.statusText}`
    );
  }

  const taskData = await createRes.json();
  const taskId = taskData?.id || taskData?.task_id;

  if (!taskId) {
    throw new Error(
      `[MUSE2API] Phản hồi không chứa taskId hợp lệ: ${JSON.stringify(taskData)}`
    );
  }

  console.log(`[MUSE2API] Tác vụ đã được tiếp nhận: ${taskId}. Đang thăm dò tiến trình...`);

  // 2. Thăm dò (Polling) kết quả hoàn tất tác vụ
  const startTime = Date.now();
  const pollIntervalMs = 2500;
  let finalVideoUrl = "";

  while (Date.now() - startTime < config.timeoutMs) {
    if (input.signal?.aborted) {
      throw new Error("[MUSE2API] Tác vụ tạo video đã bị huỷ bởi người dùng (Aborted).");
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

    let pollRes: Response;
    try {
      pollRes = await fetch(`${config.baseUrl}/v1/videos/${taskId}`, {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
        signal: input.signal,
      });
    } catch (pollErr: any) {
      console.warn(`[MUSE2API] Lỗi kết nối khi thăm dò ${taskId}: ${pollErr?.message}. Thử lại...`);
      continue;
    }

    if (!pollRes.ok) {
      console.warn(`[MUSE2API] Thăm dò ${taskId} trả về HTTP ${pollRes.status}. Thử lại...`);
      continue;
    }

    const pollData = await pollRes.json();
    const status = String(pollData?.status || "").toLowerCase();
    const progress = pollData?.progress ?? 0;

    console.log(
      `[MUSE2API] Tác vụ ${taskId} - Trạng thái: ${status} (${progress}%) - Đã qua: ${Math.round((Date.now() - startTime) / 1000)}s`
    );

    if (status === "completed" || status === "succeeded" || status === "success" || status === "done") {
      finalVideoUrl =
        pollData.url ||
        pollData.video?.url ||
        pollData.result?.url ||
        "";
      break;
    }

    if (status === "failed" || status === "error") {
      const errDetail = pollData.error || "Không rõ nguyên nhân";
      throw new Error(`[MUSE2API] Tác vụ sinh video ${taskId} thất bại: ${errDetail}`);
    }
  }

  if (!finalVideoUrl) {
    throw new Error(
      `[MUSE2API] Quá thời gian chờ (${Math.round(config.timeoutMs / 1000)}s) cho tác vụ ${taskId}.`
    );
  }

  // 3. Chuẩn hóa URL video (nếu đường dẫn tương đối -> ghép với baseUrl)
  const resolvedDownloadUrl = finalVideoUrl.startsWith("http")
    ? finalVideoUrl
    : `${config.baseUrl}${finalVideoUrl.startsWith("/") ? "" : "/"}${finalVideoUrl}`;

  console.log(`[MUSE2API] Tải video thành phẩm từ: ${resolvedDownloadUrl}`);

  const downloadRes = await fetch(resolvedDownloadUrl, {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
    signal: input.signal,
  });

  if (!downloadRes.ok) {
    throw new Error(
      `[MUSE2API] Không thể tải video thành phẩm từ ${resolvedDownloadUrl} [HTTP ${downloadRes.status}]`
    );
  }

  const arrayBuf = await downloadRes.arrayBuffer();
  const videoBuffer = Buffer.from(arrayBuf);

  if (videoBuffer.length < 1000) {
    throw new Error(
      `[MUSE2API] Kích thước file video nhận về không hợp lệ (${videoBuffer.length} bytes).`
    );
  }

  console.log(
    `[MUSE2API] Tải video thành công (${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB, ${duration}s).`
  );

  return {
    videoBuffer,
    durationSeconds: duration,
    taskId,
    videoUrl: resolvedDownloadUrl,
    cost: {
      model_name: `muse-video (MUSE2API Gateway: ${config.model})`,
      duration_seconds: duration,
      input_tokens: 1500,
      output_tokens: duration * 5792,
      cost_usd: 0,
      cost_vnd: 0,
      free_tier_components: {
        ffmpeg_compositor_cost: 0,
        edge_tts_cost: 0,
        total_free_savings_usd: 3.5,
      },
      is_live_call: true,
      status_note: `Tạo video AI trực tiếp qua MUSE2API Gateway (Tài khoản Muse AI, mã tác vụ: ${taskId}).`,
    },
  };
}

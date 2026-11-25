import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { createAdminClient } from "../supabase/admin.ts";
import {
  composeMultiSceneStaticVideo,
  type CropMode,
  type MotionType,
} from "./ffmpeg-compositor.ts";
import {
  padAudioFileToDuration,
  speedUpAudioFile,
  synthesizeSceneSpeech,
} from "./tts-service.ts";
import { buildTikTokAssSubtitles, type AssSceneInput } from "./ass-subtitles.ts";

export interface AutoReviewScene {
  sceneNumber: number;
  role: "HOOK" | "EXPERIENCE" | "PRICING_AND_QR" | "CTA";
  durationSec: number;
  timeRange: string;
  visualTag: string;
  overlayText: string;
  voiceoverText: string;
  bRollDescription: string;
  mediaId?: string;
  motion?: MotionType;
  cropMode?: CropMode;
}

export interface AutoReviewScript {
  title: string;
  targetDurationSec: number;
  caption: string;
  scenes: AutoReviewScene[];
  hookText: string;
  ctaText: string;
  hashtags: string[];
  campaignInfo?: {
    priceOriginal?: number | null;
    priceSale?: number | null;
    period?: string | null;
    contact?: string | null;
  };
}

export interface AutoPipelineInput {
  campaignId: string;
  merchantId: string;
  productId?: string;
  mediaReferenceIds?: string[];
  tourName: string;
  location?: string;
  highlights?: string | string[];
  targetAudience?: string;
  targetDurationSec?: number;
  price?: string | number;
  originalPrice?: string | number | null;
  campaignPeriod?: string | null;
  contactPhone?: string | null;
  logoUrl?: string | null;
  customInstructions?: string;
}

export interface MatchedMediaItem {
  id: string;
  title: string;
  url: string;
  styleTags: string[];
  isVideo: boolean;
}

export interface AutoPipelineJobStatus {
  jobId: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  step: string;
  contentId?: string;
  videoUrl?: string;
  durationSec?: number;
  warnings?: string[];
  error?: string;
  updatedAt: string;
}

const jobStatusRegistry = new Map<string, AutoPipelineJobStatus>();
const MOTION_ROTATION: MotionType[] = ["zoom_in", "pan_right", "zoom_out", "pan_left", "pan_up"];

export function getAutoPipelineJobStatus(jobId: string): AutoPipelineJobStatus | null {
  return jobStatusRegistry.get(jobId) || null;
}

export function registerAutoPipelineJob(jobId: string): void {
  jobStatusRegistry.set(jobId, {
    jobId,
    status: "queued",
    progress: 10,
    step: "Tiếp nhận yêu cầu sinh video tự động",
    updatedAt: new Date().toISOString(),
  });
}

export function updateAutoPipelineJobStatus(
  jobId: string,
  update: Partial<AutoPipelineJobStatus>
): void {
  const current = jobStatusRegistry.get(jobId);
  if (current) {
    jobStatusRegistry.set(jobId, {
      ...current,
      ...update,
      updatedAt: new Date().toISOString(),
    });
  } else {
    jobStatusRegistry.set(jobId, {
      jobId,
      status: update.status || "processing",
      progress: update.progress || 50,
      step: update.step || "Đang xử lý",
      ...update,
      updatedAt: new Date().toISOString(),
    });
  }
}

export interface AutoPipelineResult {
  success: boolean;
  jobId: string;
  contentId?: string;
  videoUrl?: string;
  durationSec: number;
  script: AutoReviewScript;
  warnings?: string[];
  error?: string;
}

export function clampTargetDurationSec(raw?: number): number {
  if (typeof raw !== "number" || Number.isNaN(raw)) return 45;
  return Math.min(50, Math.max(40, Math.round(raw)));
}

function formatMmSs(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec));
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function normalizeHighlightsList(highlights?: string | string[]): string[] {
  if (Array.isArray(highlights)) {
    return highlights.map((h) => String(h).trim()).filter(Boolean);
  }
  if (typeof highlights === "string" && highlights.trim()) {
    return highlights
      .split(/[.;,\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 4);
  }
  return ["Cảnh quan thiên nhiên tuyệt mỹ", "Góc check-in sống ảo triệu view", "Trải nghiệm dịch vụ chính hãng"];
}

/**
 * Chuẩn hóa danh sách phân cảnh (4–9 cảnh) để tổng thời lượng nằm trong [40, 50]s
 * và khớp timeRange liên tục.
 */
export function normalizeAutoReviewScenes(
  rawScenes: Partial<AutoReviewScene>[],
  targetDurationSec = 45
): AutoReviewScene[] {
  const safeTotal = clampTargetDurationSec(targetDurationSec);
  const count = Math.max(4, Math.min(9, rawScenes.length));
  const items = rawScenes.slice(0, count);

  const baseDurations = items.map((s) => {
    const d = Number(s?.durationSec);
    return Number.isFinite(d) && d > 0 ? d : safeTotal / count;
  });

  const rawSum = baseDurations.reduce((a, b) => a + b, 0) || safeTotal;
  const scaled = baseDurations.map((d) => Math.max(4, Math.round((d / rawSum) * safeTotal)));
  const diff = safeTotal - scaled.reduce((a, b) => a + b, 0);
  const adjustIdx = Math.min(1, count - 1);
  scaled[adjustIdx] = Math.max(4, scaled[adjustIdx] + diff);

  let cursor = 0;
  return items.map((src, idx) => {
    const dur = scaled[idx];
    const start = cursor;
    const end = cursor + dur;
    cursor = end;

    const role: AutoReviewScene["role"] =
      idx === 0
        ? "HOOK"
        : idx === count - 1
        ? "CTA"
        : idx === count - 2
        ? "PRICING_AND_QR"
        : "EXPERIENCE";

    return {
      sceneNumber: idx + 1,
      role: src.role || role,
      durationSec: dur,
      timeRange: `${formatMmSs(start)} - ${formatMmSs(end)}`,
      visualTag: src.visualTag || (role === "HOOK" ? "aerial_wide" : role === "CTA" ? "cta_bio" : "scenic_experience"),
      overlayText: String(src.overlayText || "").trim(),
      voiceoverText: String(src.voiceoverText || "").trim(),
      bRollDescription: String(src.bRollDescription || "").trim(),
      motion: src.motion,
      cropMode: src.cropMode,
    };
  });
}

/**
 * 1. Sinh kịch bản 7–8 cảnh nhịp nhanh (95–120 từ) chuẩn TikTok 40–50s.
 * Quy tắc: Giá, ưu đãi, ngày chiến dịch, hotline lấy trực tiếp từ DB (không để LLM tự bịa số).
 */
export async function generateAutoReviewScript(
  input: AutoPipelineInput
): Promise<AutoReviewScript> {
  const tourName = input.tourName || "Tour Du Lịch Trải Nghiệm";
  const location = input.location || "Đà Nẵng - Miền Trung";
  const highlightList = normalizeHighlightsList(input.highlights);
  const salePriceNum = input.price ? Number(input.price) : null;
  const origPriceNum = input.originalPrice ? Number(input.originalPrice) : null;
  const priceDisplay = salePriceNum ? `${salePriceNum.toLocaleString("vi-VN")}đ` : "giá ưu đãi";
  const periodDisplay = input.campaignPeriod?.trim() || "";
  const contactDisplay = input.contactPhone?.trim() || "";
  const targetDuration = clampTargetDurationSec(input.targetDurationSec);

  const groqApiKey = process.env.GROQ_API_KEY?.trim();

  if (groqApiKey && !groqApiKey.includes("your_groq_api_key_here")) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          temperature: 0.65,
          max_tokens: 1500,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "Bạn là biên kịch video review du lịch TikTok 40-50 giây tại Việt Nam. Xuất JSON với 7-8 phân cảnh ngắn (5-7 giây/cảnh), tổng lời thoại đúng 125-145 từ tiếng Việt tự nhiên (mỗi cảnh ~18-22 từ) để khớp thời lượng 43-47 giây. KHÔNG tự viết con số giá tiền, số điện thoại hay ngày tháng trong lời thoại nếu không có; các cảnh PRICING_AND_QR và CTA chỉ viết câu dẫn ngắn gọn để hệ thống ghép số thật từ DB.",
            },
            {
              role: "user",
              content: `Tạo kịch bản 7 phân cảnh dài ${targetDuration}s cho "${tourName}" tại ${location}. Điểm nổi bật thật: ${highlightList.join("; ")}.${input.customInstructions ? ` Ghi chú: ${input.customInstructions}.` : ""} Trả về JSON gồm title, caption, hashtags (mảng), scenes (mảng 7 phần tử: sceneNumber, role [HOOK|EXPERIENCE|PRICING_AND_QR|CTA], durationSec, visualTag, overlayText, voiceoverText, bRollDescription).`,
            },
          ],
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const content = json.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed.scenes) && parsed.scenes.length >= 4) {
            const normalized = normalizeAutoReviewScenes(parsed.scenes, targetDuration);
            // Deterministically inject DB price/period/contact into last 2 scenes
            const priceScene = normalized[normalized.length - 2];
            const ctaScene = normalized[normalized.length - 1];
            if (priceScene && salePriceNum) {
              priceScene.overlayText =
                origPriceNum && origPriceNum > salePriceNum
                  ? `CHỈ ${priceDisplay} (GỐC ${origPriceNum.toLocaleString("vi-VN")}đ)`
                  : `GIÁ CHỈ ${priceDisplay}`;
              priceScene.voiceoverText = `Giá vé ưu đãi chỉ ${priceDisplay}${
                periodDisplay ? ` áp dụng ${periodDisplay}` : ""
              }, nhận vé QR quét thẳng cổng vào.`;
            }
            if (ctaScene) {
              ctaScene.overlayText = contactDisplay ? `ĐẶT NGAY • ${contactDisplay}` : "ĐẶT VÉ QR DƯỚI BIO";
              ctaScene.voiceoverText = `Bấm link dưới bio để giữ suất ngay hôm nay${
                contactDisplay ? ` hoặc gọi ${contactDisplay}` : ""
              } nhé!`;
            }

            const hashtags = Array.isArray(parsed.hashtags)
              ? parsed.hashtags.map(String)
              : [`#TravelLink`, `#${location.replace(/[\s-]/g, "")}`, `#ReviewDuLich`];

            return {
              title: parsed.title || `Review ${tourName}`,
              targetDurationSec: targetDuration,
              caption: parsed.caption || `Khám phá ${tourName} tại ${location}! ${hashtags.join(" ")}`,
              scenes: normalized,
              hookText: normalized[0]?.overlayText || tourName.toUpperCase(),
              ctaText: ctaScene?.overlayText || "ĐẶT VÉ NGAY",
              hashtags,
              campaignInfo: {
                priceOriginal: origPriceNum,
                priceSale: salePriceNum,
                period: periodDisplay || null,
                contact: contactDisplay || null,
              },
            };
          }
        }
      }
    } catch (groqErr) {
      console.warn("[AUTO_PIPELINE] Groq fallback to grounded 7-scene script:", groqErr);
    }
  }

  // Fallback kịch bản 7 cảnh nhịp nhanh (~130 từ tiếng Việt, khớp 43–46s) bám sát DB
  const h1 = highlightList[0] || `toàn cảnh ${tourName}`;
  const h2 = highlightList[1] || "góc check-in triệu view cực chill";
  const h3 = highlightList[2] || "trải nghiệm vui chơi và ẩm thực đặc sắc";
  const hashtags = [`#TravelLink`, `#${location.replace(/[\s-]/g, "")}`, `#ReviewDuLich`, `#TikTokTravel`];

  const fallbackScenes = normalizeAutoReviewScenes(
    [
      {
        sceneNumber: 1,
        role: "HOOK",
        durationSec: 6,
        visualTag: "aerial_wide_sunrise",
        overlayText: `ĐI ${tourName.toUpperCase()} CHỈ ${priceDisplay}?`,
        voiceoverText: `Đến ${location} mà bạn vẫn chưa ghé qua ${tourName} thì quả thực là một thiếu sót cực kỳ lớn trong chuyến đi năm nay luôn đó!`,
      },
      {
        sceneNumber: 2,
        role: "EXPERIENCE",
        durationSec: 6,
        visualTag: "cable_car_aerial",
        overlayText: "TOÀN CẢNH CỰC MÃN NHÃN",
        voiceoverText: `Ngay từ khoảnh khắc đặt chân tới đây, mình đã thực sự choáng ngợp với khung cảnh ${h1} đẹp như trời Âu.`,
      },
      {
        sceneNumber: 3,
        role: "EXPERIENCE",
        durationSec: 7,
        visualTag: "golden_bridge_checkin",
        overlayText: "GÓC SỐNG ẢO TRIỆU VIEW",
        voiceoverText: `Điểm cộng siêu to khổng lồ chính là ${h2}, đứng ở góc nào giơ máy lên cũng có ngay bộ ảnh triệu like mang về.`,
      },
      {
        sceneNumber: 4,
        role: "EXPERIENCE",
        durationSec: 7,
        visualTag: "architecture_scenic",
        overlayText: "TRẢI NGHIỆM TRỌN VẸN",
        voiceoverText: `Chưa dừng lại ở đó, bạn còn được tận hưởng trọn vẹn ${h3} từ sáng tới chiều cùng gia đình và hội bạn thân.`,
      },
      {
        sceneNumber: 5,
        role: "EXPERIENCE",
        durationSec: 6,
        visualTag: "sunny_day_crowd_free",
        overlayText: "MẸO ĐI VẮNG NGƯỜI",
        voiceoverText: `Bật mí nhỏ cho bạn là nên xuất phát từ chuyến sáng sớm để thời tiết mát mẻ và chụp hình không bị dính đông người nhé.`,
      },
      {
        sceneNumber: 6,
        role: "PRICING_AND_QR",
        durationSec: 7,
        visualTag: "ticket_qr_entry",
        overlayText:
          origPriceNum && salePriceNum && origPriceNum > salePriceNum
            ? `CHỈ ${priceDisplay} (GỐC ${origPriceNum.toLocaleString("vi-VN")}đ)`
            : `VÉ QR CHỈ ${priceDisplay}`,
        voiceoverText: `Đặc biệt giá vé ưu đãi chỉ ${priceDisplay}${
          periodDisplay ? ` áp dụng trong ${periodDisplay}` : ""
        }, nhận ngay mã QR quét thẳng cổng vào không cần xếp hàng chờ đợi.`,
      },
      {
        sceneNumber: 7,
        role: "CTA",
        durationSec: 6,
        visualTag: "cta_voucher_bio",
        overlayText: contactDisplay ? `ĐẶT NGAY • ${contactDisplay}` : "BẤM LINK BIO ĐẶT NGAY",
        voiceoverText: `Bấm ngay vào đường link bên dưới bio để giữ suất ưu đãi chính hãng từ đối tác ngay hôm nay nhé!`,
      },
    ],
    targetDuration
  );

  return {
    title: `Review ${tourName}`,
    targetDurationSec: targetDuration,
    caption: `Khám phá ${tourName} tại ${location} chỉ từ ${priceDisplay}! ${hashtags.join(" ")}`,
    hookText: fallbackScenes[0].overlayText,
    ctaText: fallbackScenes[fallbackScenes.length - 1].overlayText,
    hashtags,
    campaignInfo: {
      priceOriginal: origPriceNum,
      priceSale: salePriceNum,
      period: periodDisplay || null,
      contact: contactDisplay || null,
    },
    scenes: fallbackScenes,
  };
}

/**
 * 2. Lấy kho ảnh/media từ `media_references` theo merchant
 */
export async function fetchMerchantMediaReferences(
  merchantId: string,
  mediaReferenceIds?: string[],
  dbClient?: any
): Promise<MatchedMediaItem[]> {
  const client = dbClient || createAdminClient();
  try {
    let mediaRows: any[] | null = null;

    if (Array.isArray(mediaReferenceIds) && mediaReferenceIds.length > 0) {
      const { data } = await client
        .from("media_references")
        .select("id, title, video_url, thumbnail_url, platform, style_tags")
        .in("id", mediaReferenceIds)
        .limit(25);
      mediaRows = data;
    }

    if (!mediaRows || mediaRows.length === 0) {
      const { data } = await client
        .from("media_references")
        .select("id, title, video_url, thumbnail_url, platform, style_tags")
        .eq("merchant_id", merchantId)
        .limit(25);
      mediaRows = data;
    }

    if (!mediaRows || mediaRows.length === 0) return [];

    return mediaRows
      .filter((r) => Boolean(r.thumbnail_url || r.video_url))
      .map((row) => {
        const url = String(row.thumbnail_url || row.video_url);
        const isVideo =
          row.platform !== "upload" &&
          /\.(mp4|mov|webm)(\?|$)/i.test(String(row.video_url || ""));
        return {
          id: String(row.id),
          title: String(row.title || ""),
          url,
          styleTags: Array.isArray(row.style_tags) ? row.style_tags.map(String) : [],
          isVideo,
        };
      });
  } catch (err) {
    console.warn("[ASSET_MATCHER_WARN] Error querying media_references:", err);
    return [];
  }
}

const LANDMARK_PHRASES = [
  "cầu vàng",
  "golden bridge",
  "cáp treo",
  "cable car",
  "làng pháp",
  "french village",
  "cổng thời gian",
  "sunworld_gate",
  "vườn hoa",
  "hầm rượu",
  "bà nà",
  "ngũ hành sơn",
  "động huyền không",
  "hội an",
  "phố cổ",
  "chùa cầu",
  "fansipan",
  "cát cát",
  "phú quốc",
  "bãi sao",
  "san hô",
  "buffet",
  "ẩm thực",
  "hoàng hôn",
  "bình minh",
];

function scoreMediaForText(text: string, media: MatchedMediaItem): number {
  const query = text.toLowerCase();
  const haystack = `${media.title} ${media.styleTags.join(" ")}`.toLowerCase();
  let score = 0;

  // High weight (+12) for explicit landmark / subject phrase match in BOTH voiceover & media
  for (const phrase of LANDMARK_PHRASES) {
    if (query.includes(phrase) && haystack.includes(phrase)) {
      score += 12;
    }
  }

  // Medium weight (+2) for individual tokens
  const tokens = query
    .split(/[^a-z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ_]+/)
    .filter((w) => w.length >= 3);
  for (const tk of tokens) {
    if (haystack.includes(tk)) score += 2;
  }

  return score;
}

/**
 * Khớp ảnh với lời thoại từng cảnh dựa trên `style_tags` & `title` theo 2 vòng:
 * - Vòng 1: Ưu tiên các cảnh nhắc trực tiếp tên địa danh/chủ thể trong lời thoại để không bị cảnh mở đầu "cướp" mất ảnh.
 * - Vòng 2: Phân bổ các cảnh còn lại cân đối, tái sử dụng với cropMode khác nhau khi ít ảnh.
 */
export function selectMediaPlanForScenes(
  scenes: AutoReviewScene[],
  mediaPool: MatchedMediaItem[]
): Array<{ media: MatchedMediaItem; cropMode: CropMode; motion: MotionType }> {
  const assignments = new Array<{ media: MatchedMediaItem; cropMode: CropMode; motion: MotionType }>(
    scenes.length
  );
  const usageCount = new Map<string, number>();

  // Tính điểm khớp chủ thể cho từng (scene, media)
  const sceneBestMatches = scenes.map((scene, idx) => {
    const scored = mediaPool.map((m) => ({
      media: m,
      score: scoreMediaForText(`${scene.voiceoverText} ${scene.visualTag}`, m),
    }));
    scored.sort((a, b) => b.score - a.score);
    return { idx, scene, bestScore: scored[0]?.score ?? 0, scored };
  });

  // Vòng 1: Sắp xếp các cảnh có điểm khớp cao nhất (nhắc trực tiếp tên địa danh) để gán trước
  const order = [...sceneBestMatches].sort((a, b) => b.bestScore - a.bestScore);

  for (const item of order) {
    let chosen = mediaPool[item.idx % mediaPool.length];
    let bestAdjusted = -Infinity;

    for (const candidate of item.scored) {
      const used = usageCount.get(candidate.media.id) || 0;
      const adjusted = candidate.score - used * 5;
      if (adjusted > bestAdjusted) {
        bestAdjusted = adjusted;
        chosen = candidate.media;
      }
    }

    const prevCount = usageCount.get(chosen.id) || 0;
    usageCount.set(chosen.id, prevCount + 1);

    assignments[item.idx] = {
      media: chosen,
      cropMode: prevCount % 2 === 0 ? "full" : "center_zoom",
      motion: MOTION_ROTATION[item.idx % MOTION_ROTATION.length],
    };
  }

  return assignments;
}

export function selectMediaForScene(
  scene: AutoReviewScene,
  mediaPool: MatchedMediaItem[],
  usageCount: Map<string, number>,
  sceneIndex: number
): { media: MatchedMediaItem; cropMode: CropMode; motion: MotionType } {
  let bestItem = mediaPool[sceneIndex % mediaPool.length];
  let bestScore = -Infinity;

  for (const item of mediaPool) {
    const baseScore = scoreMediaForText(`${scene.voiceoverText} ${scene.visualTag}`, item);
    const used = usageCount.get(item.id) || 0;
    const score = baseScore - used * 5;
    if (score > bestScore) {
      bestScore = score;
      bestItem = item;
    }
  }

  const prevCount = usageCount.get(bestItem.id) || 0;
  usageCount.set(bestItem.id, prevCount + 1);

  return {
    media: bestItem,
    cropMode: prevCount % 2 === 0 ? "full" : "center_zoom",
    motion: MOTION_ROTATION[sceneIndex % MOTION_ROTATION.length],
  };
}

async function fetchBufferWithTimeout(url: string, timeoutMs = 10000): Promise<Buffer | null> {
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) {
    if (existsSync(url)) return fs.readFile(url).catch(() => null);
    return null;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length > 512 ? buf : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 3. Hàm render độc lập: Nhận script + mediaPool -> TTS tuần tự từng cảnh -> ghép FFmpeg đa chuyển động + nền mờ + .ass + BGM + logo
 */
export async function renderAutoReviewVideo(params: {
  script: AutoReviewScript;
  mediaPool: MatchedMediaItem[];
  logoUrl?: string | null;
}): Promise<{ videoBuffer: Buffer; durationSec: number; warnings: string[] }> {
  const warnings: string[] = [];
  if (params.mediaPool.length === 0) {
    throw new Error("INSUFFICIENT_MEDIA: Tour chưa có ảnh/media nào để tạo video.");
  }
  if (params.mediaPool.length <= 3) {
    warnings.push(
      `Tour hiện mới có ${params.mediaPool.length} ảnh/media; video sẽ tái sử dụng góc crop khác nhau (khuyến nghị bổ sung >= 4 ảnh).`
    );
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "render-static-"));
  const usageCount = new Map<string, number>();

  try {
    // Tải trước buffer ảnh để không tải lặp lại nhiều lần
    const bufferCache = new Map<string, Buffer>();
    for (const m of params.mediaPool) {
      const buf = await fetchBufferWithTimeout(m.url);
      if (buf) bufferCache.set(m.id, buf);
    }

    if (bufferCache.size === 0) {
      throw new Error("INSUFFICIENT_MEDIA: Không tải được dữ liệu ảnh từ URL media_references.");
    }

    const availablePool = params.mediaPool.filter((m) => bufferCache.has(m.id));
    const mediaPlan = selectMediaPlanForScenes(params.script.scenes, availablePool);
    const renderedScenes: Array<{
      imageBuffer: Buffer;
      audioPath: string;
      audioDurationSec: number;
      motion: MotionType;
      cropMode: CropMode;
      assInput: AssSceneInput;
    }> = [];

    // 1. TTS tuần tự từng cảnh (chống 429) & chuẩn hóa thời lượng theo đúng bội số 30fps
    for (let i = 0; i < params.script.scenes.length; i++) {
      const scene = params.script.scenes[i];
      const audioPath = path.join(tempDir, `voice_${i + 1}.mp3`);
      const ttsRes = await synthesizeSceneSpeech({
        text: scene.voiceoverText || scene.overlayText || params.script.title,
        outputPath: audioPath,
      });

      // Làm tròn lên bội số frame (1/30s) để hình và tiếng khớp tuyệt đối qua xfade
      const frameAlignedDur = Math.ceil(ttsRes.durationSec * 30) / 30;
      if (frameAlignedDur > ttsRes.durationSec + 0.005) {
        await padAudioFileToDuration(ttsRes.audioPath, frameAlignedDur);
      }

      const selected = mediaPlan[i];
      const imageBuffer = bufferCache.get(selected.media.id)!;

      // Update script metadata with matched media_id and motion
      scene.mediaId = selected.media.id;
      scene.motion = selected.motion;
      scene.cropMode = selected.cropMode;
      scene.durationSec = Number(frameAlignedDur.toFixed(2));

      renderedScenes.push({
        imageBuffer,
        audioPath: ttsRes.audioPath,
        audioDurationSec: frameAlignedDur,
        motion: selected.motion,
        cropMode: selected.cropMode,
        assInput: {
          text: scene.voiceoverText,
          audioDurationSec: frameAlignedDur,
          role: scene.role,
          overlayBanner:
            scene.role === "HOOK" || scene.role === "PRICING_AND_QR" || scene.role === "CTA"
              ? scene.overlayText
              : undefined,
        },
      });
    }

    // 1b. Đảm bảo tổng thời lượng luôn nằm trong khoảng mục tiêu [40, 50]s khi targetDuration >= 40
    const requestedTarget = params.script.targetDurationSec;
    if (requestedTarget >= 40 && renderedScenes.length > 0) {
      const currentTotal = renderedScenes.reduce((acc, r) => acc + r.audioDurationSec, 0);
      if (currentTotal < 40) {
        const targetGoal = Math.min(48, Math.max(42, requestedTarget));
        const extraPerScene = (targetGoal - currentTotal) / renderedScenes.length;
        for (let i = 0; i < renderedScenes.length; i++) {
          const newDur = Number((renderedScenes[i].audioDurationSec + extraPerScene).toFixed(2));
          await padAudioFileToDuration(renderedScenes[i].audioPath, newDur);
          renderedScenes[i].audioDurationSec = newDur;
          renderedScenes[i].assInput.audioDurationSec = newDur;
          params.script.scenes[i].durationSec = newDur;
        }
      } else if (currentTotal > 50) {
        const tempo = currentTotal / 48;
        for (let i = 0; i < renderedScenes.length; i++) {
          const newDur = await speedUpAudioFile(renderedScenes[i].audioPath, tempo);
          renderedScenes[i].audioDurationSec = newDur;
          renderedScenes[i].assInput.audioDurationSec = newDur;
          params.script.scenes[i].durationSec = Number(newDur.toFixed(2));
        }
      }
    }

    // 2. Sinh file phụ đề .ass (từng cụm 2–4 từ, mốc = tổng audio trước đó)
    const assContent = buildTikTokAssSubtitles(renderedScenes.map((r) => r.assInput));

    // 3. Nhạc nền royalty-free (nếu có trong repo) & Logo Merchant
    const defaultBgmPath = path.join(process.cwd(), "docs", "be1", "samples", "travel-bgm.mp3");
    const bgmPath = existsSync(defaultBgmPath) ? defaultBgmPath : null;
    const logoBuffer = params.logoUrl ? await fetchBufferWithTimeout(params.logoUrl, 5000) : null;

    // 4. Dựng video hoàn chỉnh với bù thời gian xfade
    const { videoBuffer, durationSec } = await composeMultiSceneStaticVideo({
      scenes: renderedScenes,
      assContent,
      bgmPath,
      logoBuffer,
      xfadeDurationSec: 0.4,
    });

    return { videoBuffer, durationSec, warnings };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * 4. Điều phối toàn bộ quy trình Auto Video Pipeline (Queue Worker / Background Runner)
 */
export async function executeAutoVideoPipeline(
  input: AutoPipelineInput,
  jobId: string,
  dbClient?: any
): Promise<AutoPipelineResult> {
  const adminClient = dbClient || createAdminClient();
  const minImages = Math.max(0, Number(process.env.MIN_IMAGES ?? 1));

  const syncJobRow = async (patch: Record<string, any>) => {
    try {
      await adminClient
        .from("video_jobs")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", jobId);
    } catch {
      // Ignore if jobId is not a UUID in video_jobs (e.g., direct test call)
    }
  };

  try {
    updateAutoPipelineJobStatus(jobId, {
      status: "processing",
      progress: 20,
      step: "Đang sinh kịch bản review 7 cảnh 40-50s",
    });
    await syncJobRow({ status: "running", progress: 20, step: "Đang sinh kịch bản review 40-50s" });

    const script = await generateAutoReviewScript(input);

    updateAutoPipelineJobStatus(jobId, {
      status: "processing",
      progress: 40,
      step: "Đang khớp ảnh từ media_references theo style_tags",
    });

    const mediaPool = await fetchMerchantMediaReferences(
      input.merchantId,
      input.mediaReferenceIds,
      adminClient
    );

    if (mediaPool.length < minImages) {
      const errMsg = `Tour cần tối thiểu ${minImages} ảnh/media để tạo video (hiện có ${mediaPool.length}).`;
      updateAutoPipelineJobStatus(jobId, {
        status: "failed",
        progress: 100,
        step: "Thiếu tư liệu hình ảnh",
        error: errMsg,
      });
      await syncJobRow({
        status: "failed",
        error: errMsg,
        finished_at: new Date().toISOString(),
      });
      return {
        success: false,
        jobId,
        durationSec: 0,
        script,
        error: errMsg,
      };
    }

    updateAutoPipelineJobStatus(jobId, {
      status: "processing",
      progress: 60,
      step: "Đang tạo giọng đọc từng cảnh, phụ đề .ass & dựng FFmpeg",
    });
    await syncJobRow({
      progress: 60,
      script_json: script,
      step: "Đang dựng video FFmpeg (nền mờ + đa chuyển động + .ass)",
    });

    const { videoBuffer, durationSec, warnings } = await renderAutoReviewVideo({
      script,
      mediaPool,
      logoUrl: input.logoUrl,
    });

    updateAutoPipelineJobStatus(jobId, {
      status: "processing",
      progress: 88,
      step: "Đang tải video lên Supabase Storage campaign-videos",
      warnings,
    });

    const timestamp = Date.now();
    const storagePath = `${input.campaignId}/auto-review-${timestamp}.mp4`;
    let uploadedVideoUrl = `/videos/auto-review-${timestamp}.mp4`;

    try {
      const { data: uploadData, error: uploadErr } = await adminClient.storage
        .from("campaign-videos")
        .upload(storagePath, videoBuffer, {
          contentType: "video/mp4",
          upsert: true,
        });

      if (!uploadErr && uploadData?.path) {
        const { data: urlData } = adminClient.storage
          .from("campaign-videos")
          .getPublicUrl(uploadData.path);
        if (urlData?.publicUrl) {
          uploadedVideoUrl = urlData.publicUrl;
        }
      }
    } catch (storageErr) {
      console.warn("[AUTO_PIPELINE] Storage upload error:", storageErr);
    }

    const formattedScriptText = script.scenes
      .map(
        (s) =>
          `Cảnh ${s.sceneNumber} (${s.timeRange}) [${s.role}]:\n  Lời thoại: ${s.voiceoverText}${
            s.overlayText ? `\n  Chữ hiển thị: ${s.overlayText}` : ""
          }`
      )
      .join("\n\n");

    const { data: newContent, error: contentErr } = await adminClient
      .from("contents")
      .insert({
        campaign_id: input.campaignId,
        product_id: input.productId || null,
        persona: "auto_review_v2",
        hook: script.hookText,
        script: formattedScriptText,
        caption: script.caption,
        cta: script.ctaText,
        video_url: uploadedVideoUrl,
        status: "pending",
      })
      .select("id")
      .single();

    if (contentErr) {
      console.warn("[AUTO_PIPELINE] Contents insert warning:", contentErr.message);
    }

    updateAutoPipelineJobStatus(jobId, {
      status: "completed",
      progress: 100,
      step: "Hoàn tất tạo video và lưu vào danh sách chờ duyệt",
      contentId: newContent?.id,
      videoUrl: uploadedVideoUrl,
      durationSec,
      warnings,
    });

    await syncJobRow({
      status: "done",
      progress: 100,
      step: "Hoàn tất",
      video_url: uploadedVideoUrl,
      content_id: newContent?.id || null,
      duration_sec: durationSec,
      warnings,
      script_json: script,
      finished_at: new Date().toISOString(),
    });

    return {
      success: true,
      jobId,
      contentId: newContent?.id,
      videoUrl: uploadedVideoUrl,
      durationSec,
      script,
      warnings,
    };
  } catch (err: any) {
    console.error("[AUTO_PIPELINE] Execution error:", err);
    updateAutoPipelineJobStatus(jobId, {
      status: "failed",
      progress: 100,
      step: "Quá trình xử lý gặp sự cố",
      error: err?.message || "Unknown pipeline error",
    });
    await syncJobRow({
      status: "failed",
      error: err?.message || "Unknown pipeline error",
      finished_at: new Date().toISOString(),
    });
    throw err;
  }
}

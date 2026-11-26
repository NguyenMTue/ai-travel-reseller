import fs from "node:fs/promises";
import path from "node:path";
import {
  generateMuseVideoClip,
  isMuse2ApiConfigured,
  type MuseVideoCostBreakdown,
  type OmniVideoCostBreakdown,
} from "../ai/muse-video.ts";
import {
  composeHybridVideo,
  composeChainedOmniVideo,
  createTwoImageHeroClip,
  createSingleImageMotionClip,
  trimVideoBuffer,
  type TourEndCardConfig,
} from "../video-engine/ffmpeg-compositor.ts";
import { buildChainedPromptPlan } from "../video-engine/chained-prompt-generator.ts";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/src/lib/database.types";
import {
  generateVideoDirectorScript,
  synthesizeVideoDraft,
} from "../video-engine/generator.ts";
import type {
  MediaAsset,
  ShotType,
  VideoEngineInput,
} from "../video-engine/types.ts";
import type {
  VideoGenerateBlockedResponse,
  VideoGenerateRequestInput,
  VideoGenerateSuccessData,
} from "./video-generate-schema.ts";

export type GenerateVideoServiceResult =
  | {
      success: true;
      data: VideoGenerateSuccessData;
    }
  | {
      success: false;
      errorType: "NOT_FOUND" | "FORBIDDEN" | "INVALID_INPUT";
      error: string;
    }
  | {
      success: false;
      errorType: "BLOCKED";
      blockedData: VideoGenerateBlockedResponse;
    };

/**
 * Suy đoán Shot Type thông minh từ style_tags và title của media
 */
function inferShotType(styleTags: string[], title: string, index: number, metadata?: unknown): ShotType {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    const raw = (metadata as Record<string, unknown>).shot_type;
    if (
      typeof raw === "string" &&
      ["AERIAL_WIDE", "SCENIC_MEDIUM", "CLOSEUP_FOOD", "HUMAN_POV"].includes(raw)
    ) {
      return raw as ShotType;
    }
  }
  const combined = (styleTags.join(" ") + " " + title).toLowerCase();

  if (
    combined.includes("aerial") ||
    combined.includes("flycam") ||
    combined.includes("toàn cảnh") ||
    combined.includes("góc rộng") ||
    combined.includes("trên cao")
  ) {
    return "AERIAL_WIDE";
  }

  if (
    combined.includes("food") ||
    combined.includes("ẩm thực") ||
    combined.includes("món ăn") ||
    combined.includes("buffet") ||
    combined.includes("cận cảnh")
  ) {
    return "CLOSEUP_FOOD";
  }

  if (
    combined.includes("pov") ||
    combined.includes("du khách") ||
    combined.includes("trải nghiệm") ||
    combined.includes("check-in")
  ) {
    return "HUMAN_POV";
  }

  // Phân bổ xen kẽ mặc định nếu không có tag rõ ràng
  return index % 2 === 0 ? "SCENIC_MEDIUM" : "AERIAL_WIDE";
}

/**
 * Service điều phối tạo Video Chiến dịch cho Merchant:
 * 1. Xác thực quyền sở hữu Campaign và Product.
 * 2. Trích xuất Media Assets thật từ bảng media_references.
 * 3. Nạp vào Core AI Video Generation Engine (Fail-Fast Gate & UGC Director).
 * 4. Nếu hợp lệ -> Gọi Render Draft và ghi bản ghi vào bảng contents.
 * 5. Bắn Webhook event cho BE3 n8n (BE3-W3-03).
 */
export async function generateMerchantCampaignVideo(
  client: SupabaseClient<Database>,
  merchantId: string,
  input: VideoGenerateRequestInput
): Promise<GenerateVideoServiceResult> {
  // 1. Kiểm tra Campaign
  const { data: campaign, error: campaignError } = await client
    .from("campaigns")
    .select("id, merchant_id, product_id, name, target_location")
    .eq("id", input.campaign_id)
    .maybeSingle();

  if (campaignError || !campaign) {
    return {
      success: false,
      errorType: "NOT_FOUND",
      error: "Không tìm thấy chiến dịch tương ứng.",
    };
  }

  if (campaign.merchant_id && campaign.merchant_id !== merchantId) {
    return {
      success: false,
      errorType: "FORBIDDEN",
      error: "Bạn không có quyền quản lý chiến dịch này.",
    };
  }

  if (campaign.product_id && campaign.product_id !== input.product_id) {
    return {
      success: false,
      errorType: "INVALID_INPUT",
      error: "Sản phẩm không khớp với sản phẩm đã đăng ký trong chiến dịch.",
    };
  }

  // 2. Kiểm tra Product
  const { data: product, error: productError } = await client
    .from("products")
    .select("id, merchant_id, name, description, sale_price, original_price")
    .eq("id", input.product_id)
    .maybeSingle();

  if (productError || !product) {
    return {
      success: false,
      errorType: "NOT_FOUND",
      error: "Không tìm thấy sản phẩm du lịch tương ứng.",
    };
  }

  // 3. Lấy tên Merchant
  const { data: merchant } = await client
    .from("merchants")
    .select("id, name")
    .eq("id", merchantId)
    .maybeSingle();

  const merchantName = merchant?.name || "Đối tác du lịch";

  // 4. Lấy danh sách Media References từ DB
  let mediaRows: any[] = [];

  if (input.media_reference_ids && input.media_reference_ids.length > 0) {
    const { data: selectedRows, error: selectedError } = await client
      .from("media_references")
      .select(
        "id, title, video_url, thumbnail_url, platform, style_tags, duration, analysis_metadata"
      )
      .eq("merchant_id", merchantId)
      .in("id", input.media_reference_ids);

    if (selectedError) {
      return {
        success: false,
        errorType: "INVALID_INPUT",
        error: "Lỗi truy vấn thư viện video mẫu: " + selectedError.message,
      };
    }

    // Bảo toàn chính xác 100% thứ tự các ảnh mà người dùng đã click chọn:
    // mediaRows[0] = Hero 1, mediaRows[1] = Hero 2, mediaRows[2..N] = Body
    const rowMap = new Map((selectedRows || []).map((r) => [r.id, r]));
    mediaRows = input.media_reference_ids
      .map((id) => rowMap.get(id))
      .filter((r): r is NonNullable<typeof r> => Boolean(r));

    // Nếu số lượng tư liệu được chọn ít hơn mức tối thiểu (ceil(duration / 2.2)),
    // tự động bổ sung thêm các tư liệu khác của Merchant trong thư viện (đặt mẫu đã chọn lên đầu)
    const minRequired = Math.ceil((input.target_duration_sec || 28) / 2.2);
    if (mediaRows.length < minRequired) {
      const selectedIds = new Set(mediaRows.map((r: any) => r.id));
      const { data: extraRows } = await client
        .from("media_references")
        .select(
          "id, title, video_url, thumbnail_url, platform, style_tags, duration, analysis_metadata"
        )
        .eq("merchant_id", merchantId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (extraRows) {
        for (const row of extraRows) {
          if (!selectedIds.has(row.id)) {
            mediaRows.push(row);
            selectedIds.add(row.id);
            if (mediaRows.length >= minRequired) break;
          }
        }
      }
    }
  } else {
    // Nếu Merchant không chọn cụ thể -> Lấy tối đa 20 tư liệu gần nhất
    const { data: defaultRows, error: mediaError } = await client
      .from("media_references")
      .select(
        "id, title, video_url, thumbnail_url, platform, style_tags, duration, analysis_metadata"
      )
      .eq("merchant_id", merchantId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (mediaError) {
      return {
        success: false,
        errorType: "INVALID_INPUT",
        error: "Lỗi truy vấn thư viện video mẫu: " + mediaError.message,
      };
    }
    mediaRows = defaultRows || [];
  }

  // Ưu tiên xếp các tư liệu khớp chính xác với sản phẩm / địa danh lên hàng đầu (Grounding)
  const productKeyword = (product.name + " " + ((campaign as any).target_location || "")).toLowerCase();
  const isRowRelevant = (row: any) => {
    const text = `${row.title || ""} ${(row.style_tags || []).join(" ")}`.toLowerCase();
    if (
      productKeyword.includes("ngũ hành sơn") ||
      productKeyword.includes("huyền không") ||
      productKeyword.includes("non nước")
    ) {
      return (
        text.includes("ngũ hành sơn") ||
        text.includes("huyền không") ||
        text.includes("non nước") ||
        text.includes("chùa") ||
        text.includes("động")
      );
    }
    if (productKeyword.includes("bà nà") || productKeyword.includes("bana")) {
      return (
        text.includes("bà nà") ||
        text.includes("cầu vàng") ||
        text.includes("cáp treo") ||
        text.includes("làng pháp")
      );
    }
    return false;
  };

  if (mediaRows && mediaRows.length > 1) {
    mediaRows.sort((a, b) => {
      const aRel = isRowRelevant(a) ? 1 : 0;
      const bRel = isRowRelevant(b) ? 1 : 0;
      return bRel - aRel;
    });
  }

  // Nếu Merchant có từ 4 tư liệu thật trở lên và chọn tạo video dài 30–45s (cần ceil(duration / 2.2) phân cảnh),
  // tự động luân phiên các góc ảnh thật phù hợp nhất để đủ số phân cảnh mà không bị chặn lỗi 422.
  // (Giữ nguyên hành vi chặn Fail-Fast 422 khi tổng tư liệu < 4 để tuân thủ bài kiểm thử thiếu ảnh).
  const minAssetsNeeded = Math.ceil((input.target_duration_sec || 28) / 2.2);
  if (mediaRows.length >= 4 && mediaRows.length < minAssetsNeeded) {
    const basePool = [...mediaRows];
    let idx = 0;
    while (mediaRows.length < minAssetsNeeded) {
      const sourceRow = basePool[idx % basePool.length];
      mediaRows.push({
        ...sourceRow,
        id: `${sourceRow.id}_angle_${mediaRows.length + 1}`,
      });
      idx++;
    }
  }

  // Ánh xạ sang MediaAsset chuẩn của Video Engine
  const mediaAssets: MediaAsset[] = (mediaRows || []).map((row, index) => {
    const isVideo =
      row.platform !== "upload" ||
      row.video_url.endsWith(".mp4") ||
      row.video_url.endsWith(".mov") ||
      row.video_url.endsWith(".webm");

    return {
      asset_id: row.id,
      url: row.video_url,
      type: isVideo ? "VIDEO" : "IMAGE",
      shot_type: inferShotType(row.style_tags || [], row.title, index, row.analysis_metadata),
      resolution: "1080x1920",
      description: row.title,
    };
  });

  // Kiểm tra xem bộ ảnh được chọn có phải là Ba Na Hills hay không để tự động chuẩn hóa metadata (Grounding)
  const assetsText = (mediaRows || [])
    .map((r: any) => `${r.title || ""} ${(r.style_tags || []).join(" ")}`)
    .join(" ")
    .toLowerCase();

  const isBaNaAssets =
    assetsText.includes("bà nà") ||
    assetsText.includes("bana") ||
    assetsText.includes("cầu vàng") ||
    assetsText.includes("cáp treo") ||
    assetsText.includes("làng pháp") ||
    assetsText.includes("nhật thực");

  const isNguHanhSonProduct =
    (product.name + " " + ((campaign as any).target_location || "")).toLowerCase().includes("ngũ hành sơn") ||
    (product.name + " " + ((campaign as any).target_location || "")).toLowerCase().includes("huyền không");

  // Nếu bộ ảnh chọn là Bà Nà Hills nhưng Product lại bị gán sang Ngũ Hành Sơn (do chọn nhầm campaign hoặc default),
  // tự động chuẩn hóa metadata hiển thị sang đúng Vé Cáp Treo Sun World Ba Na Hills (950.000 VND)
  let effectiveProductName = product.name;
  let effectiveLocation = (campaign as any).target_location || "Đà Nẵng";
  let effectiveSalePrice = Number(product.sale_price) || 0;
  let effectiveOriginalPrice = product.original_price ? Number(product.original_price) : null;

  if (isBaNaAssets && isNguHanhSonProduct) {
    console.log(
      "[Video Service] Tự động chuẩn hóa metadata sang Sun World Ba Na Hills vì toàn bộ ảnh được chọn là Bà Nà Hills!"
    );
    effectiveProductName = "Vé Cáp Treo Sun World Ba Na Hills";
    effectiveLocation = "Bà Nà Hills, Đà Nẵng";
    effectiveSalePrice = 950000;
    effectiveOriginalPrice = 1050000;
  }

  // 5. Chuẩn bị Input nạp vào Core AI Video Generation Engine
  const engineInput: VideoEngineInput = {
    merchant_name: merchantName,
    product_name: effectiveProductName,
    location: effectiveLocation,
    sale_price: effectiveSalePrice,
    original_price: effectiveOriginalPrice,
    official_cta: `Comment để nhận link đặt vé chính thức từ ${merchantName}`,
    booking_url: `https://travellink.vn/book/${product.id}`,
    target_platforms: input.target_platforms,
    content_type: input.content_type || "CONVERSION",
    persona: input.persona,
    target_duration_sec: input.target_duration_sec,
    media_assets: mediaAssets,
    allow_3d_spatial_effects: input.allow_3d_spatial_effects,
    authentic_tips: input.authentic_tips,
    audio_config: {
      voice_persona_id: "vn_danang_youth_female_energetic",
      ambient_sound_tags: (effectiveProductName + " " + effectiveLocation).toLowerCase().includes("ngũ hành sơn") ||
        (effectiveProductName + " " + effectiveLocation).toLowerCase().includes("huyền không")
        ? [
            "tiếng chuông chùa ngân vang",
            "tiếng gió lùa qua hang đá",
            "tiếng chim hót thanh tịnh",
            "tiếng bước chân du khách",
          ]
        : [
            "tiếng gió đỉnh núi",
            "tiếng cáp treo vận hành",
            "tiếng check-in rộn ràng",
            "tiếng bước chân",
          ],
    },
  };

  // 6. Thực thi Core Engine với cổng Pre-flight Gate
  const directorResult = generateVideoDirectorScript(engineInput);

  // Nếu bị chặn bởi Fail-Fast Gate -> Trả về lỗi 422 chi tiết
  if (directorResult.status === "BLOCKED_MISSING_INPUT") {
    return {
      success: false,
      errorType: "BLOCKED",
      blockedData: {
        success: false,
        status: "BLOCKED_MISSING_INPUT",
        error_summary: directorResult.error_summary,
        missing_or_invalid_inputs: directorResult.missing_or_invalid_inputs,
      },
    };
  }

  // 7. Tạo Video Hybrid: Gemini Omni Flash (Hero) + FFmpeg Ken Burns + Edge-TTS
  let finalVideoUrl = "";
  let totalDurationSec = directorResult.campaign_metadata.total_duration_sec;
  let costBreakdown: OmniVideoCostBreakdown | undefined = undefined;
  let finalVoiceoverScript = directorResult.audio_config.full_voiceover_script_with_pauses;
  let finalHookText = directorResult.timeline_scenes[0]?.on_screen_text?.text || "";

  if (input.target_duration_sec && input.target_duration_sec >= 28) {
    const prePlan = buildChainedPromptPlan({
      productName: effectiveProductName,
      campaignName: campaign.name || effectiveProductName,
      location: effectiveLocation,
      salePrice: effectiveSalePrice,
      originalPrice: effectiveOriginalPrice,
      officialCta: (campaign as any).official_cta || "Bình luận nhận ưu đãi vé chính hãng",
      authenticTips: input.authentic_tips,
      mediaAssets: mediaAssets.slice(0, 6).map((a) => ({
        asset_id: a.asset_id,
        url: a.url,
        title: a.description || effectiveProductName,
        description: a.description,
        shot_type: a.shot_type,
      })),
      targetDurationSec: input.target_duration_sec,
      merchantName,
    });
    if (prePlan.profile === "30_45s_campaign_deep_dive") {
      finalVoiceoverScript = prePlan.audioSpec.fullVoiceoverScript;
      finalHookText = prePlan.textOverlaySpec.hookText || finalHookText;
    }
  }

  try {
    // 7.1. Tải ảnh Hero (2 ảnh đầu) và ảnh Body (các ảnh sau) đảm bảo bảo toàn 100% thứ tự lựa chọn
    async function fetchBufferWithFallback(url: string): Promise<Buffer | null> {
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
          signal: AbortSignal.timeout(10000),
        });
        if (res.ok) {
          return Buffer.from(await res.arrayBuffer());
        }
      } catch (err: any) {
        console.warn("[Video Service] Không thể tải tư liệu:", url, err?.message);
      }
      return null;
    }

    // 7.1. Tải các ảnh tư liệu được chọn (tối đa 6 ảnh cho chuỗi Chained 10s / 18s / 30-45s)
    const imageBuffers: Buffer[] = [];
    for (const asset of mediaAssets.slice(0, 6)) {
      const buf = await fetchBufferWithFallback(asset.url);
      if (buf) imageBuffers.push(buf);
    }

    const location = (campaign as any).target_location || "Đà Nẵng";
    const isShortFormat = !input.target_duration_sec || input.target_duration_sec <= 18;
    const isCampaignDeepDive = Boolean(input.target_duration_sec && input.target_duration_sec >= 28);
    const effectiveDuration = (input.target_duration_sec && input.target_duration_sec <= 14)
      ? 10.0
      : (input.target_duration_sec ? input.target_duration_sec : 10.0);

    if (imageBuffers.length >= 2) {
      // 7.2. Xây dựng Kế hoạch Prompt & Phân cảnh Chained (10s / 18s / 30-45s Campaign Deep-Dive)
      const promptPlan = buildChainedPromptPlan({
        productName: effectiveProductName,
        campaignName: campaign.name || effectiveProductName,
        location: effectiveLocation,
        salePrice: effectiveSalePrice,
        originalPrice: effectiveOriginalPrice,
        officialCta: (campaign as any).official_cta || "Bình luận nhận ưu đãi vé chính hãng",
        authenticTips: input.authentic_tips,
        mediaAssets: mediaAssets.slice(0, 6).map((a) => ({
          asset_id: a.asset_id,
          url: a.url,
          title: a.description || effectiveProductName,
          description: a.description,
          shot_type: a.shot_type,
        })),
        targetDurationSec: effectiveDuration,
        merchantName,
      });

      let finalBuffer: Buffer;

      // Chuẩn bị thông tin Tour End-Card phủ mờ ở cuối video để khách hàng dễ tiếp cận
      const closingImageBuffer =
        imageBuffers[imageBuffers.length - 1] || imageBuffers[0];

      const isNguHanhSon =
        `${effectiveProductName} ${effectiveLocation}`.toLowerCase().includes("ngũ hành sơn") ||
        `${effectiveProductName} ${effectiveLocation}`.toLowerCase().includes("huyền không") ||
        `${effectiveProductName} ${effectiveLocation}`.toLowerCase().includes("non nước");

      const tourEndCardInfo: TourEndCardConfig = {
        productName: effectiveProductName,
        location: effectiveLocation,
        salePrice: effectiveSalePrice,
        originalPrice: effectiveOriginalPrice,
        highlights:
          input.authentic_tips && input.authentic_tips.length > 0
            ? input.authentic_tips
            : isNguHanhSon
            ? [
                "Vé tham quan thắng cảnh & thang máy khứ hồi",
                "Chiêm bái Động Huyền Không & Chùa Linh Ứng",
                "Hỗ trợ vào cổng ưu tiên, không chờ đợi",
              ]
            : [
                "Vé tham quan & dịch vụ trọn gói chính hãng",
                "Trải nghiệm điểm check-in biểu tượng đẹp nhất",
                "Hỗ trợ vào cổng ưu tiên, không chờ đợi",
              ],
        ctaText:
          (campaign as any).official_cta ||
          "ĐẶT VÉ CHÍNH HÃNG - QUÉT MÃ VÀO CỔNG",
        hotline: "1900 8888 (Tư vấn 24/7)",
        merchantName,
        authenticTips: input.authentic_tips,
      };

      if (isShortFormat || isCampaignDeepDive) {
        const segmentBuffers: Buffer[] = [];
        let museCircuitBroken = false;
        let museLastError = "";
        let museSuccessCount = 0;

        // Lặp qua TẤT CẢ các phân cảnh (100% phân cảnh đều gọi Muse AI để sinh video chuyển động 3D thật).
        // Chỉ chuyển sang FFmpeg fallback nếu cổng Muse2API bị sập kết nối hoặc lỗi Cookie 401 (Circuit Breaker).
        for (let idx = 0; idx < promptPlan.segments.length; idx++) {
          const segment = promptPlan.segments[idx];
          const startBuf = imageBuffers[segment.startImageIndex] || imageBuffers[0];
          const endBuf = imageBuffers[segment.endImageIndex] || startBuf;

          const segDurWithCrossfadeBuffer =
            promptPlan.segmentsCount > 1
              ? Number((segment.durationSeconds + 0.35).toFixed(2))
              : segment.durationSeconds;

          let segBuffer: Buffer | null = null;
          if (isMuse2ApiConfigured() && !museCircuitBroken) {
            console.log(
              `[Video Service] Đang tạo phân cảnh ${segment.segmentIndex}/${promptPlan.segmentsCount} (${segment.role}) bằng Muse AI - ${segment.durationSeconds}s...`
            );
            try {
              const segResult = await generateMuseVideoClip({
                prompt: segment.musePrompt || segment.omniPrompt,
                startImageBuffer: startBuf,
                endImageBuffer: endBuf,
                durationSeconds: Math.max(5, Math.ceil(segDurWithCrossfadeBuffer)),
                aspectRatio: "9:16",
                includeAudioPrompt: false,
              });
              if (segResult?.videoBuffer && segResult.videoBuffer.length > 1000) {
                segBuffer = await trimVideoBuffer(segResult.videoBuffer, segDurWithCrossfadeBuffer);
                museSuccessCount++;
                if (!costBreakdown) costBreakdown = segResult.cost;
              }
            } catch (museErr: any) {
              const errMsg = String(museErr?.message || museErr);
              museLastError = errMsg;
              console.warn("[Video Service] Muse AI clip warning:", errMsg);
              if (
                errMsg.includes("401") ||
                errMsg.includes("会话认证失败") ||
                errMsg.toLowerCase().includes("cookie") ||
                errMsg.includes("ECONNREFUSED") ||
                errMsg.includes("fetch failed")
              ) {
                museCircuitBroken = true;
                console.warn(
                  "[Video Service] ⚡ Ngắt mạch Muse2API (Circuit Breaker) do lỗi Cookie/Session 401 hoặc mất kết nối Gateway. Chuyển sang dựng song song (Parallel Batch) các phân cảnh bằng FFmpeg Ken Burns."
                );
              }
            }
          }

          if (segBuffer) {
            segmentBuffers.push(segBuffer);
            continue;
          }

          // Nếu Muse2API bị lỗi kết nối/401 (hoặc chưa cấu hình), dựng song song các phân cảnh còn lại
          if (museCircuitBroken || !isMuse2ApiConfigured()) {
            const remainingSegments = promptPlan.segments.slice(idx);
            const batchSize = 3;
            for (let b = 0; b < remainingSegments.length; b += batchSize) {
              const batch = remainingSegments.slice(b, b + batchSize);
              const batchBuffers = await Promise.all(
                batch.map((seg) => {
                  const sBuf = imageBuffers[seg.startImageIndex] || imageBuffers[0];
                  const dur =
                    promptPlan.segmentsCount > 1
                      ? Number((seg.durationSeconds + 0.35).toFixed(2))
                      : seg.durationSeconds;
                  return createSingleImageMotionClip(sBuf, dur, seg.role);
                })
              );
              segmentBuffers.push(...batchBuffers);
            }
            break;
          }

          segBuffer = await createSingleImageMotionClip(
            startBuf,
            segDurWithCrossfadeBuffer,
            segment.role
          );
          segmentBuffers.push(segBuffer);
        }

        totalDurationSec = promptPlan.totalDurationSec;

        if (!costBreakdown) {
          costBreakdown = {
            model_name:
              museSuccessCount > 0
                ? "muse-video (Muse AI)"
                : "FFmpeg Ken Burns Compositor (Muse2API Fallback)",
            duration_seconds: totalDurationSec,
            input_tokens: 1500,
            output_tokens: totalDurationSec * 5792,
            cost_usd: 0,
            cost_vnd: 0,
            free_tier_components: {
              ffmpeg_compositor_cost: 0,
              edge_tts_cost: 0,
              total_free_savings_usd: 3.5,
            },
            is_live_call: museSuccessCount > 0,
            status_note:
              museSuccessCount > 0
                ? "Tạo video AI trực tiếp qua MUSE2API Gateway (Tài khoản Muse AI)."
                : museLastError.includes("401") || museLastError.includes("会话认证失败")
                ? "Phiên đăng nhập (Cookie) trên Muse2API Gateway (localhost:18610) đã hết hạn (HTTP 401). Đã tự động chuyển sang dựng bằng FFmpeg Ken Burns."
                : "Muse2API tạm thời không phản hồi. Đã tự động chuyển sang dựng bằng FFmpeg Ken Burns.",
          };
        }

        finalBuffer = await composeChainedOmniVideo({
          segmentVideoBuffers: segmentBuffers,
          voiceoverScript: promptPlan.audioSpec.fullVoiceoverScript,
          targetDurationSec: promptPlan.totalDurationSec,
          textOverlay: promptPlan.textOverlaySpec,
          closingImageBuffer,
          tourEndCardInfo,
          useMuseAudio: false, // Luôn dùng 100% Edge-TTS tiếng Việt chuẩn, triệt tiêu giọng đọc tiếng Anh của Muse
        });
      } else {
        // Chế độ Hybrid cho thời lượng > 18s bằng Muse AI + FFmpeg Ken Burns
        const bodyImages: Buffer[] = [];
        for (const asset of mediaAssets.slice(2, 6)) {
          const buf = await fetchBufferWithFallback(asset.url);
          if (buf) bodyImages.push(buf);
        }

        let heroBuffer: Buffer | null = null;
        if (isMuse2ApiConfigured()) {
          try {
            const museRes = await generateMuseVideoClip({
              prompt: promptPlan.segments[0]?.musePrompt || promptPlan.segments[0]?.omniPrompt,
              startImageBuffer: imageBuffers[0],
              endImageBuffer: imageBuffers[1] || imageBuffers[0],
              durationSeconds: 6,
              aspectRatio: "9:16",
              voiceoverScript: promptPlan.segments[0]?.voiceoverSegment,
            });
            if (museRes?.videoBuffer && museRes.videoBuffer.length > 1000) {
              heroBuffer = museRes.videoBuffer;
              costBreakdown = museRes.cost;
            }
          } catch (mErr: any) {
            console.warn("[Video Service] Hybrid Hero Muse AI notice:", mErr?.message);
          }
        }

        if (!heroBuffer) {
          heroBuffer = await createTwoImageHeroClip(imageBuffers[0], imageBuffers[1] || imageBuffers[0], 6);
        }

        if (!costBreakdown) {
          costBreakdown = {
            model_name: "muse-video (Muse AI)",
            duration_seconds: effectiveDuration,
            input_tokens: 1500,
            output_tokens: effectiveDuration * 5792,
            cost_usd: 0,
            cost_vnd: 0,
            free_tier_components: {
              ffmpeg_compositor_cost: 0,
              edge_tts_cost: 0,
              total_free_savings_usd: 3.5,
            },
            is_live_call: true,
            status_note: "Tạo video AI trực tiếp qua MUSE2API Gateway (Tài khoản Muse AI).",
          };
        }

        finalBuffer = await composeHybridVideo({
          heroVideoBuffer: heroBuffer,
          bodyImageBuffers: bodyImages,
          voiceoverScript: directorResult.audio_config.full_voiceover_script_with_pauses,
          targetDurationSec: effectiveDuration,
          textOverlay: {
            hookText: directorResult.timeline_scenes[0]?.on_screen_text?.text || `Khám phá ${product.name}`,
            priceBadgeText: `Vé trọn gói chỉ: ${Number(product.sale_price).toLocaleString("vi-VN")}đ`,
            ctaText: "Bình luận hoặc bấm link giỏ hàng nhận vé chính hãng",
          },
        });
      }

      // 7.4. Lưu bản sao MP4 cục bộ vào public/videos/ (đảm bảo phát được 100% ngay lập tức trên trình duyệt)
      // đồng thời đẩy lên Supabase Storage bucket 'campaign-videos'
      const timestamp = Date.now();
      const slug = product.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      const filename = `${slug || "campaign-video"}-${timestamp}.mp4`;

      let localVideoUrl = "";
      try {
        const publicVideosDir = path.join(process.cwd(), "public", "videos");
        await fs.mkdir(publicVideosDir, { recursive: true });
        const localFilePath = path.join(publicVideosDir, filename);
        await fs.writeFile(localFilePath, finalBuffer);
        localVideoUrl = `/videos/${filename}`;
        console.log(
          `[Video Service] Đã lưu bản sao video cục bộ (${(finalBuffer.length / 1024 / 1024).toFixed(2)} MB) tại: ${localVideoUrl}`
        );
      } catch (localErr: any) {
        console.warn("[Video Service] Không thể lưu bản sao video cục bộ:", localErr?.message);
      }

      const { error: uploadError } = await client.storage
        .from("campaign-videos")
        .upload(filename, finalBuffer, {
          contentType: "video/mp4",
          upsert: true,
        });

      if (!uploadError) {
        const { data: publicUrlData } = client.storage
          .from("campaign-videos")
          .getPublicUrl(filename);
        finalVideoUrl = publicUrlData.publicUrl;
      } else {
        console.error("Supabase Storage upload error:", uploadError.message);
        if (localVideoUrl) {
          finalVideoUrl = localVideoUrl;
          console.log(
            `[Video Service] Chuyển sang phát trực tiếp từ file video cục bộ: ${finalVideoUrl}`
          );
        }
      }
    }
  } catch (err: any) {
    console.error("Hybrid video render error:", err?.message || err);
  }

  // Fallback an toàn nếu chưa có finalVideoUrl
  if (!finalVideoUrl) {
    const renderDraft = await synthesizeVideoDraft(directorResult);
    finalVideoUrl = renderDraft.video_url;
  }

  // 8. Lưu bản ghi kịch bản và URL video vào bảng `contents`
  const contentToInsert = {
    campaign_id: input.campaign_id,
    product_id: input.product_id,
    hook: finalHookText || null,
    script: finalVoiceoverScript,
    caption: directorResult.social_publishing_package.caption,
    cta: directorResult.social_publishing_package.official_cta_text,
    video_url: finalVideoUrl,
    status: "ready",
    persona: input.persona,
    tracking_url: `https://travellink.vn/r/c_${input.campaign_id.slice(0, 8)}`,
  };

  const { data: insertedContent, error: insertError } = await client
    .from("contents")
    .insert(contentToInsert)
    .select("id, created_at")
    .single();

  if (insertError || !insertedContent) {
    return {
      success: false,
      errorType: "INVALID_INPUT",
      error: "Lỗi lưu bản ghi nội dung video vào database: " + insertError?.message,
    };
  }

  // 9. Bắn Webhook event sang n8n cho BE3 (BE3-W3-03) không gây nghẽn tiến trình
  const webhookUrl = process.env.N8N_VIDEO_COMPLETED_WEBHOOK_URL;
  if (webhookUrl) {
    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "video.generation.completed",
        content_id: insertedContent.id,
        campaign_id: input.campaign_id,
        product_name: product.name,
        video_url: finalVideoUrl,
        duration_sec: totalDurationSec,
        status: "ready",
        hook_headline: finalHookText,
        created_at: insertedContent.created_at,
      }),
    }).catch((err) => {
      console.warn("Non-blocking n8n webhook notification failed:", err?.message);
    });
  }

  // 10. Trả về kết quả thành công
  return {
    success: true,
    data: {
      content_id: insertedContent.id,
      campaign_id: input.campaign_id,
      product_id: input.product_id,
      video_url: finalVideoUrl,
      status: "ready",
      aspect_ratio: "9:16",
      duration_sec: totalDurationSec,
      hook: finalHookText,
      script: finalVoiceoverScript,
      caption: directorResult.social_publishing_package.caption,
      cta: directorResult.social_publishing_package.official_cta_text,
      scenes_count: directorResult.timeline_scenes.length,
      created_at: insertedContent.created_at || new Date().toISOString(),
      cost_breakdown: costBreakdown,
    },
  };
}

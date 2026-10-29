import { generateGeminiOmniHeroVideo, type OmniVideoCostBreakdown } from "../ai/gemini-omni-video.ts";
import { composeHybridVideo, composeChainedOmniVideo } from "../video-engine/ffmpeg-compositor.ts";
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

  // 5. Chuẩn bị Input nạp vào Core AI Video Generation Engine
  const engineInput: VideoEngineInput = {
    merchant_name: merchantName,
    product_name: product.name,
    location: (campaign as any).target_location || "Đà Nẵng",
    sale_price: Number(product.sale_price) || 0,
    original_price: product.original_price
      ? Number(product.original_price)
      : null,
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
      ambient_sound_tags: [
        "tiếng gió đỉnh núi",
        "tiếng cáp treo vận hành",
        "tiếng xèo xèo buffet",
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

    // 7.1. Tải các ảnh tư liệu được chọn (tối đa 4 ảnh cho chuỗi Chained 15s - 18s)
    const imageBuffers: Buffer[] = [];
    for (const asset of mediaAssets.slice(0, 4)) {
      const buf = await fetchBufferWithFallback(asset.url);
      if (buf) imageBuffers.push(buf);
    }

    const location = (campaign as any).target_location || "Đà Nẵng";
    const isShortFormat = !input.target_duration_sec || input.target_duration_sec <= 18;
    const effectiveDuration = isShortFormat
      ? (input.target_duration_sec || 16.5)
      : input.target_duration_sec;

    if (imageBuffers.length >= 2) {
      // 7.2. Xây dựng Kế hoạch Prompt & Phân cảnh Chained chuẩn 15s - 18s
      // Theo đúng chuẩn docs/be2/system_prompt_travel_video_director_agent.md:
      // Vector Momentum Matching + Terminal Stabilization + Unified Atmospheric Anchor
      const promptPlan = buildChainedPromptPlan({
        productName: product.name,
        location,
        salePrice: Number(product.sale_price) || 0,
        officialCta: (campaign as any).official_cta || "Bình luận nhận ưu đãi vé chính hãng",
        authenticTips: input.authentic_tips,
        mediaAssets: mediaAssets.slice(0, 4).map((a) => ({
          asset_id: a.asset_id,
          url: a.url,
          title: a.description || product.name,
          description: a.description,
          shot_type: a.shot_type,
        })),
        targetDurationSec: effectiveDuration,
      });

      let finalBuffer: Buffer;

      if (isShortFormat) {
        // Sinh chuỗi phân cảnh Chained Omni liền mạch (15s - 18s)
        const segmentBuffers: Buffer[] = [];
        for (const segment of promptPlan.segments) {
          const startBuf = imageBuffers[segment.startImageIndex] || imageBuffers[0];
          const endBuf = imageBuffers[segment.endImageIndex] || imageBuffers[1] || startBuf;

          console.log(`[Video Service] Đang tạo phân cảnh ${segment.segmentIndex}/${promptPlan.segmentsCount} (${segment.role}) - ${segment.durationSeconds}s...`);

          const segResult = await generateGeminiOmniHeroVideo({
            prompt: segment.omniPrompt,
            startImageBuffer: startBuf,
            endImageBuffer: endBuf,
            durationSeconds: segment.durationSeconds,
            aspectRatio: "9:16",
          });

          segmentBuffers.push(segResult.videoBuffer);
          if (!costBreakdown) costBreakdown = segResult.cost;
        }

        totalDurationSec = promptPlan.totalDurationSec;

        finalBuffer = await composeChainedOmniVideo({
          segmentVideoBuffers: segmentBuffers,
          voiceoverScript: promptPlan.audioSpec.fullVoiceoverScript,
          targetDurationSec: promptPlan.totalDurationSec,
          textOverlay: promptPlan.textOverlaySpec,
        });
      } else {
        // Chế độ Hybrid dài cho thời lượng > 18s
        const bodyImages: Buffer[] = [];
        for (const asset of mediaAssets.slice(2, 6)) {
          const buf = await fetchBufferWithFallback(asset.url);
          if (buf) bodyImages.push(buf);
        }

        const omniResult = await generateGeminiOmniHeroVideo({
          prompt: promptPlan.segments[0]?.omniPrompt,
          startImageBuffer: imageBuffers[0],
          endImageBuffer: imageBuffers[1] || imageBuffers[0],
          durationSeconds: 6,
          aspectRatio: "9:16",
        });

        costBreakdown = omniResult.cost;

        finalBuffer = await composeHybridVideo({
          heroVideoBuffer: omniResult.videoBuffer,
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

      // 7.4. Đẩy video thành phẩm lên Supabase Storage bucket 'campaign-videos'
      const timestamp = Date.now();
      const slug = product.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
      const filename = `${slug}-${timestamp}.mp4`;

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
    hook: directorResult.timeline_scenes[0]?.on_screen_text?.text || null,
    script: directorResult.audio_config.full_voiceover_script_with_pauses,
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
        hook_headline: directorResult.timeline_scenes[0]?.on_screen_text?.text,
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
      hook: directorResult.timeline_scenes[0]?.on_screen_text?.text || "",
      script: directorResult.audio_config.full_voiceover_script_with_pauses,
      caption: directorResult.social_publishing_package.caption,
      cta: directorResult.social_publishing_package.official_cta_text,
      scenes_count: directorResult.timeline_scenes.length,
      created_at: insertedContent.created_at || new Date().toISOString(),
      cost_breakdown: costBreakdown,
    },
  };
}

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
  let mediaQuery = client
    .from("media_references")
    .select(
      "id, title, video_url, thumbnail_url, platform, style_tags, duration, analysis_metadata"
    )
    .eq("merchant_id", merchantId);

  if (input.media_reference_ids && input.media_reference_ids.length > 0) {
    mediaQuery = mediaQuery.in("id", input.media_reference_ids);
  } else {
    // Nếu Merchant không chọn cụ thể -> Lấy tối đa 20 tư liệu gần nhất
    mediaQuery = mediaQuery.order("created_at", { ascending: false }).limit(20);
  }

  const { data: mediaRows, error: mediaError } = await mediaQuery;

  if (mediaError) {
    return {
      success: false,
      errorType: "INVALID_INPUT",
      error: "Lỗi truy vấn thư viện video mẫu: " + mediaError.message,
    };
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
    content_type: input.content_type,
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

  // 7. Tạo Video Draft chuẩn tỷ lệ 9:16 và định danh Supabase Storage
  const renderDraft = await synthesizeVideoDraft(directorResult);

  // 8. Lưu bản ghi kịch bản và URL video vào bảng `contents`
  const contentToInsert = {
    campaign_id: input.campaign_id,
    product_id: input.product_id,
    hook: directorResult.timeline_scenes[0]?.on_screen_text?.text || null,
    script: directorResult.audio_config.full_voiceover_script_with_pauses,
    caption: directorResult.social_publishing_package.caption,
    cta: directorResult.social_publishing_package.official_cta_text,
    video_url: renderDraft.video_url,
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
        video_url: renderDraft.video_url,
        duration_sec: renderDraft.duration_sec,
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
      video_url: renderDraft.video_url,
      status: "ready",
      aspect_ratio: "9:16",
      duration_sec: renderDraft.duration_sec,
      hook: directorResult.timeline_scenes[0]?.on_screen_text?.text || "",
      script: directorResult.audio_config.full_voiceover_script_with_pauses,
      caption: directorResult.social_publishing_package.caption,
      cta: directorResult.social_publishing_package.official_cta_text,
      scenes_count: directorResult.timeline_scenes.length,
      created_at: insertedContent.created_at || new Date().toISOString(),
    },
  };
}

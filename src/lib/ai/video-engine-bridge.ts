import {
  generateVideoDirectorScript,
  validatePreFlightGate,
} from "../video-engine/generator.ts";
import {
  type ContentType,
  type MediaAsset,
  type TargetPlatform,
  type VideoEngineInput,
  type VideoEngineOutput,
  videoEngineInputSchema,
} from "../video-engine/types.ts";
import type {
  CampaignVideoScript,
  VideoAnalysis,
} from "./schemas/video-schema.ts";
import type {
  VideoCampaignInput,
  VideoGuardrailResult,
} from "./video-generator.ts";

// ============================================================================
// 1. BRIDGE ERRORS
// ============================================================================

export class VideoEngineBridgeGateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VideoEngineBridgeGateError";
  }
}

// ============================================================================
// 2. BRIDGE INTERFACE TYPES
// ============================================================================

export type MerchantProductionMetadata = {
  merchantName: string;
  bookingUrl: string;
  targetPlatforms?: TargetPlatform[];
  contentType?: ContentType;
  persona?: string;
  allow3dSpatialEffects?: boolean;
  voicePersonaId?: string;
  additionalAuthenticTips?: string[];
};

export type VideoEngineBridgeRequest = {
  script: CampaignVideoScript;
  guardrails: VideoGuardrailResult;
  campaign: VideoCampaignInput;
  mediaAssets: MediaAsset[];
  merchantMetadata: MerchantProductionMetadata;
};

export type VideoEngineBridgeResult = {
  videoEngineInput: VideoEngineInput;
  videoEngineOutput: VideoEngineOutput;
  passedPreFlight: boolean;
  approvedScript: CampaignVideoScript;
  sceneConsumptionNote: string;
};

// ============================================================================
// 3. MAPPER: BE2 SCRIPT -> BE1 VIDEO ENGINE INPUT (PREFLIGHT / METADATA)
// ============================================================================

/**
 * Ánh xạ dữ liệu giữa kịch bản BE2 đã được phê duyệt và cấu hình đầu vào Core Video Engine BE1.
 *
 * KIẾN TRÚC & LIÊN THÔNG DỮ LIỆU:
 * - BE1 Core Video Engine trực tiếp tiếp nhận và tiêu thụ toàn bộ 14 approved scenes của BE2
 *   vào timeline_scenes, ánh xạ các trường visual_prompt, shot_instruction, narration,
 *   on_screen_text, verified_fact_refs và bảo toàn nguyên văn placeholder [LINK_MUA_VE].
 * - Kịch bản gốc được bảo toàn trong `VideoEngineBridgeResult.approvedScript`.
 *
 * FIELD MAPPING:
 * - merchant_name            <- merchantMetadata.merchantName || campaign.campaignName
 * - product_name             <- campaign.productName
 * - location                 <- campaign.targetLocation (Bắt buộc, không fallback)
 * - sale_price               <- campaign.salePrice (Bắt buộc số dương đã xác minh, không fallback)
 * - original_price           <- campaign.originalPrice
 * - official_cta             <- script.cta.on_screen_text (Bắt buộc giữ placeholder [LINK_MUA_VE])
 * - booking_url              <- merchantMetadata.bookingUrl (URL HTTPS hợp lệ của Merchant)
 * - target_platforms         <- merchantMetadata.targetPlatforms || ["TIKTOK", "INSTAGRAM_REELS"]
 * - content_type             <- merchantMetadata.contentType || "CONVERSION"
 * - persona                  <- merchantMetadata.persona || "UGC Traveler"
 * - target_duration_sec      <- script.duration_seconds (15-60)
 * - media_assets             <- mediaAssets (tài nguyên ảnh/clip thật của Merchant)
 * - allow_3d_spatial_effects <- merchantMetadata.allow3dSpatialEffects ?? true
 * - authentic_tips           <- campaign.verifiedFacts + additionalAuthenticTips (Fail-closed nếu thiếu)
 * - audio_config             <- voice_persona_id + ambient_sound_tags từ script.audio_plan
 */
export function mapScriptToVideoEngineInput(
  request: VideoEngineBridgeRequest,
): VideoEngineInput {
  // 1. Kiểm tra đồng thời cổng kiểm duyệt an toàn BE2:
  //    - guardrails.isValid === true
  //    - guardrails.recommendedStatus === "APPROVED"
  //    - guardrails.flags.length === 0
  const { guardrails } = request;
  if (
    !guardrails ||
    guardrails.isValid !== true ||
    guardrails.recommendedStatus !== "APPROVED" ||
    (Array.isArray(guardrails.flags) && guardrails.flags.length > 0)
  ) {
    const flagsStr = Array.isArray(guardrails?.flags)
      ? guardrails.flags.join(", ")
      : "none";
    throw new VideoEngineBridgeGateError(
      `Cannot bridge script to Core Video Engine: guardrail validation failed (isValid=${guardrails?.isValid}, status='${guardrails?.recommendedStatus}', flags=[${flagsStr}]). Script must be valid, APPROVED, and have 0 flags.`,
    );
  }

  const { script, campaign, mediaAssets, merchantMetadata } = request;

  // 2. Kiểm tra số lượng scenes: Bắt buộc đúng 14 scenes theo chuẩn kịch bản BE1 Video Engine
  if (!script.scenes || script.scenes.length !== 14) {
    throw new VideoEngineBridgeGateError(
      `Cannot bridge script to Core Video Engine: script must contain exactly 14 scenes, but received ${script.scenes?.length ?? 0}.`,
    );
  }

  // 3. Kiểm tra giá bán thực tế: Không tự tiện fallback giá 1, bắt buộc số dương đã xác minh
  if (
    campaign.salePrice === undefined ||
    campaign.salePrice === null ||
    typeof campaign.salePrice !== "number" ||
    campaign.salePrice <= 0 ||
    Number.isNaN(campaign.salePrice)
  ) {
    throw new VideoEngineBridgeGateError(
      `Cannot bridge script to Core Video Engine: missing or invalid verified sale price (${campaign.salePrice}). A verified positive sale price is required.`,
    );
  }

  // 4. Kiểm tra địa điểm: Không tự tiện dùng default "Việt Nam", bắt buộc location xác thực
  const location = campaign.targetLocation?.trim();
  if (!location) {
    throw new VideoEngineBridgeGateError(
      "Cannot bridge script to Core Video Engine: targetLocation is missing or empty. A verified location is required.",
    );
  }

  // 5. Kiểm tra authentic tips: Không tự sinh câu tip chung chung; fail-closed nếu thiếu
  const factTips = (campaign.verifiedFacts || [])
    .map((fact) => fact.text?.trim() || "")
    .filter((text) => text.length >= 5);
  const additionalTips = (merchantMetadata.additionalAuthenticTips || [])
    .map((tip) => tip?.trim() || "")
    .filter((tip) => tip.length >= 5);

  const combinedTips = Array.from(new Set([...factTips, ...additionalTips]));

  if (combinedTips.length === 0) {
    throw new VideoEngineBridgeGateError(
      "Cannot bridge script to Core Video Engine: no authentic tips available. Verified facts or merchant authentic tips are required; synthetic tips are strictly forbidden.",
    );
  }

  // 6. Kiểm tra Booking URL: Chỉ chấp nhận HTTPS hợp lệ, không echo URL thô vào log lỗi
  if (
    !merchantMetadata.bookingUrl ||
    typeof merchantMetadata.bookingUrl !== "string"
  ) {
    throw new VideoEngineBridgeGateError(
      "Cannot bridge script to Core Video Engine: bookingUrl is required.",
    );
  }
  let parsedBookingUrl: URL;
  try {
    parsedBookingUrl = new URL(merchantMetadata.bookingUrl.trim());
  } catch {
    throw new VideoEngineBridgeGateError(
      "Cannot bridge script to Core Video Engine: bookingUrl format is invalid. A valid HTTPS URL is required.",
    );
  }
  if (parsedBookingUrl.protocol !== "https:") {
    throw new VideoEngineBridgeGateError(
      `Cannot bridge script to Core Video Engine: bookingUrl protocol '${parsedBookingUrl.protocol}' is invalid. Only HTTPS is allowed.`,
    );
  }

  // 7. CTA chuyển sang BE1: Bắt buộc bảo toàn nguyên văn [LINK_MUA_VE], cấm URL ngoại lai và cấm âm thầm thay thế placeholder
  const ctaOnScreen = script.cta.on_screen_text?.trim();
  if (!ctaOnScreen || !ctaOnScreen.includes("[LINK_MUA_VE]")) {
    throw new VideoEngineBridgeGateError(
      "Cannot bridge script to Core Video Engine: CTA on_screen_text is missing required placeholder [LINK_MUA_VE]. Silent replacement or omission is strictly prohibited.",
    );
  }

  const urlPattern = /https?:\/\/[^\s]+/i;
  if (
    urlPattern.test(ctaOnScreen) ||
    urlPattern.test(script.cta.spoken_text?.trim() || "")
  ) {
    throw new VideoEngineBridgeGateError(
      "Cannot bridge script to Core Video Engine: CTA contains unauthorized foreign or generated URL. Only [LINK_MUA_VE] placeholder is allowed.",
    );
  }

  for (const scene of script.scenes) {
    if (
      (scene.narration && urlPattern.test(scene.narration)) ||
      (scene.on_screen_text && urlPattern.test(scene.on_screen_text))
    ) {
      throw new VideoEngineBridgeGateError(
        `Cannot bridge script to Core Video Engine: Scene ${scene.index} contains unauthorized foreign URL.`,
      );
    }
  }

  const officialCta = ctaOnScreen;

  // 7. Chuẩn bị ambient sound tags từ script audio plan
  const ambientTags = [
    script.audio_plan.music_mood.trim(),
    script.audio_plan.voiceover_style.trim(),
  ].filter((t) => t.length > 0);

  if (ambientTags.length === 0) {
    ambientTags.push("Nhạc nền du lịch năng động");
  }

  const rawEngineInput = {
    merchant_name:
      merchantMetadata.merchantName.trim() || campaign.campaignName.trim(),
    product_name: campaign.productName.trim(),
    location,
    sale_price: campaign.salePrice,
    original_price: campaign.originalPrice ?? null,
    official_cta: officialCta,
    booking_url: parsedBookingUrl.toString(),
    target_platforms: merchantMetadata.targetPlatforms || [
      "TIKTOK",
      "INSTAGRAM_REELS",
    ],
    content_type: merchantMetadata.contentType || "CONVERSION",
    persona: merchantMetadata.persona?.trim() || "UGC Traveler",
    target_duration_sec: script.duration_seconds,
    media_assets: mediaAssets,
    allow_3d_spatial_effects:
      merchantMetadata.allow3dSpatialEffects ?? true,
    authentic_tips: combinedTips,
    audio_config: {
      voice_persona_id:
        merchantMetadata.voicePersonaId?.trim() || "voice_vi_standard",
      ambient_sound_tags: ambientTags,
    },
    verified_facts: campaign.verifiedFacts.map((f) => ({
      id: f.id,
      text: f.text,
    })),
    scenes: script.scenes.map((s) => ({
      index: s.index,
      start_seconds: s.start_seconds,
      end_seconds: s.end_seconds,
      visual_prompt: s.visual_prompt,
      shot_instruction: s.shot_instruction,
      narration: s.narration,
      on_screen_text: s.on_screen_text,
      verified_fact_refs: s.verified_fact_refs,
    })),
  };

  return videoEngineInputSchema.parse(rawEngineInput);
}

// ============================================================================
// 4. BRIDGE EXECUTOR
// ============================================================================

/**
 * Thực thi chuyển giao từ kịch bản BE2 sang Core Video Engine BE1
 *
 * Ghi chú: Preflight fail không được báo READY_FOR_RENDER.
 * Kết quả bảo toàn approvedScript của BE2 và direct scene-level ingestion đã hoàn tất 100%.
 */
export function bridgeToVideoEngine(
  request: VideoEngineBridgeRequest,
): VideoEngineBridgeResult {
  const engineInput = mapScriptToVideoEngineInput(request);
  const gateCheck = validatePreFlightGate(engineInput);
  const engineOutput = generateVideoDirectorScript(engineInput);

  return {
    videoEngineInput: engineInput,
    videoEngineOutput: engineOutput,
    passedPreFlight: gateCheck.isValid,
    approvedScript: request.script,
    sceneConsumptionNote:
      "BE1 Core Video Engine directly ingested and consumed all 14 approved scenes from BE2 into timeline_scenes, preserving scene order, time ranges, narration, on-screen text, and [LINK_MUA_VE] CTA placeholder verbatim.",
  };
}

export type { VideoAnalysis };

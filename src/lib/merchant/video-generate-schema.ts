import { z } from "zod";

import {
  CONTENT_TYPES,
  TARGET_PLATFORMS,
  type ContentType,
  type TargetPlatform,
} from "../video-engine/types.ts";

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ============================================================================
// 1. REQUEST SCHEMA: TIẾP NHẬN YÊU CẦU TẠO VIDEO (POST /api/merchant/video/generate)
// ============================================================================

/**
 * Helper tiền xử lý hỗ trợ linh hoạt cả snake_case (từ API/JSON)
 * và camelCase (từ JavaScript/React Form)
 */
function normalizeRequestPayload(data: unknown): unknown {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  const record = data as Record<string, unknown>;
  return {
    campaign_id: record.campaign_id ?? record.campaignId,
    product_id: record.product_id ?? record.productId,
    target_platforms: record.target_platforms ?? record.targetPlatforms,
    persona: record.persona,
    content_type: record.content_type ?? record.contentType,
    target_duration_sec:
      record.target_duration_sec ?? record.targetDurationSec,
    media_reference_ids:
      record.media_reference_ids ?? record.mediaReferenceIds,
    authentic_tips: record.authentic_tips ?? record.authenticTips,
    allow_3d_spatial_effects:
      record.allow_3d_spatial_effects ?? record.allow3dSpatialEffects,
  };
}

export const videoGenerateRequestSchema = z.preprocess(
  normalizeRequestPayload,
  z
    .object({
      campaign_id: z
        .string()
        .trim()
        .min(1, "campaign_id không được để trống")
        .regex(UUID_PATTERN, "campaign_id không đúng định dạng UUID"),

      product_id: z
        .string()
        .trim()
        .min(1, "product_id không được để trống")
        .regex(UUID_PATTERN, "product_id không đúng định dạng UUID"),

      target_platforms: z
        .array(z.enum(TARGET_PLATFORMS))
        .min(1, "Bắt buộc chọn ít nhất 1 nền tảng phân phối (TIKTOK, REELS,...)")
        .default(["TIKTOK", "INSTAGRAM_REELS"]),

      persona: z
        .string()
        .trim()
        .min(1, "Persona không được để trống")
        .max(100, "Persona tối đa 100 ký tự")
        .default("Local Guide"),

      content_type: z.enum(CONTENT_TYPES).default("CONVERSION"),

      target_duration_sec: z
        .number()
        .min(15, "Thời lượng video tối thiểu là 15 giây")
        .max(60, "Thời lượng video tối đa là 60 giây")
        .default(28),

      media_reference_ids: z
        .array(
          z.string().regex(UUID_PATTERN, "ID video mẫu phải là định dạng UUID")
        )
        .default([]),

      authentic_tips: z
        .array(
          z
            .string()
            .trim()
            .min(5, "Mỗi mẹo du lịch thực tế phải có ít nhất 5 ký tự")
            .max(300, "Mỗi mẹo du lịch tối đa 300 ký tự")
        )
        .default([]),

      allow_3d_spatial_effects: z.boolean().default(true),
    })
    .strict()
);

export type VideoGenerateRequestInput = z.infer<
  typeof videoGenerateRequestSchema
>;

// ============================================================================
// 2. RESPONSE SCHEMAS: PHẢN HỒI THÀNH CÔNG (201) & BỊ CHẶN FAIL-FAST (422)
// ============================================================================

export const videoGenerateSuccessDataSchema = z
  .object({
    content_id: z.string().regex(UUID_PATTERN),
    campaign_id: z.string().regex(UUID_PATTERN),
    product_id: z.string().regex(UUID_PATTERN),
    video_url: z.string().url(),
    status: z.literal("ready"),
    aspect_ratio: z.literal("9:16"),
    duration_sec: z.number().positive(),
    hook: z.string(),
    script: z.string(),
    caption: z.string(),
    cta: z.string(),
    scenes_count: z.number().int().positive(),
    created_at: z.string(),
    cost_breakdown: z.object({
      model_name: z.string(),
      duration_seconds: z.number(),
      input_tokens: z.number(),
      output_tokens: z.number(),
      cost_usd: z.number(),
      cost_vnd: z.number(),
      free_tier_components: z.object({
        ffmpeg_compositor_cost: z.number(),
        edge_tts_cost: z.number(),
        total_free_savings_usd: z.number(),
      }),
      is_live_call: z.boolean(),
      status_note: z.string().optional(),
    }).optional(),
  })
  .strict();

export const videoGenerateSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string(),
    data: videoGenerateSuccessDataSchema,
  })
  .strict();

export const videoGenerateBlockedResponseSchema = z
  .object({
    success: z.literal(false),
    status: z.literal("BLOCKED_MISSING_INPUT"),
    error_summary: z.string(),
    missing_or_invalid_inputs: z.array(
      z.object({
        field: z.string(),
        reason: z.string(),
        required_action: z.string(),
      })
    ),
  })
  .strict();

export type VideoGenerateSuccessData = z.infer<
  typeof videoGenerateSuccessDataSchema
>;
export type VideoGenerateSuccessResponse = z.infer<
  typeof videoGenerateSuccessResponseSchema
>;
export type VideoGenerateBlockedResponse = z.infer<
  typeof videoGenerateBlockedResponseSchema
>;

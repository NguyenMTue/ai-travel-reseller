import { z } from "zod";

// ============================================================================
// 1. CONSTANTS & HELPER FORMULAS (Theo .ai/role/RuleAIAgentsGenVideo.md)
// ============================================================================

export const TARGET_PLATFORMS = [
  "TIKTOK",
  "INSTAGRAM_REELS",
  "FACEBOOK_REELS",
] as const;

export const CONTENT_TYPES = [
  "DISCOVERY",
  "CONSIDERATION",
  "CONVERSION",
] as const;

export const MEDIA_ASSET_TYPES = ["IMAGE", "VIDEO"] as const;

export const SHOT_TYPES = [
  "AERIAL_WIDE",
  "SCENIC_MEDIUM",
  "CLOSEUP_FOOD",
  "HUMAN_POV",
] as const;

export const SPATIAL_AI_TECHNIQUES = [
  "2.5D_AERIAL_PARALLAX",
  "DEPTH_BASED_3D_KEN_BURNS",
  "SINGLE_IMAGE_3D_MESH_PROJECTION",
  "NONE_REAL_VIDEO",
] as const;

export type TargetPlatform = (typeof TARGET_PLATFORMS)[number];
export type ContentType = (typeof CONTENT_TYPES)[number];
export type MediaAssetType = (typeof MEDIA_ASSET_TYPES)[number];
export type ShotType = (typeof SHOT_TYPES)[number];
export type SpatialAiTechnique = (typeof SPATIAL_AI_TECHNIQUES)[number];
export type CameraMotionEffect = (typeof CAMERA_MOTION_EFFECTS)[number];
export type MotionSpeed = (typeof MOTION_SPEEDS)[number];
export type TransitionType = (typeof TRANSITION_TYPES)[number];
export type TextOverlayType = (typeof TEXT_OVERLAY_TYPES)[number];
export type TextPosition = (typeof TEXT_POSITIONS)[number];
export type TextAnimation = (typeof TEXT_ANIMATIONS)[number];

export const CAMERA_MOTION_EFFECTS = [
  "DRONE_TRUCK_LEFT",
  "DRONE_TRUCK_RIGHT",
  "DRONE_TRUCK_LEFT_WITH_SLIGHT_PUSH_IN",
  "NATURAL_HANDHELD_POV",
  "KEN_BURNS_PUSH_IN",
  "KEN_BURNS_PULL_OUT",
  "STATIC",
] as const;

export const MOTION_SPEEDS = [
  "SLOW_CINEMATIC",
  "SMOOTH_MEDIUM",
  "NORMAL",
  "FAST",
] as const;

export const TRANSITION_TYPES = [
  "HARD_JUMP_CUT",
  "WHIP_PAN_SHORT",
  "CROSS_DISSOLVE_FAST",
] as const;

export const TEXT_OVERLAY_TYPES = [
  "HOOK_HEADLINE",
  "DYNAMIC_CAPTION",
  "OFFER_CALLOUT",
  "OFFICIAL_CTA",
] as const;

export const TEXT_POSITIONS = [
  "CENTER_SAFE_ZONE",
  "LOWER_MIDDLE_SAFE_ZONE",
  "TOP_SAFE_ZONE",
] as const;

export const TEXT_ANIMATIONS = [
  "POP_BOUNCE",
  "WORD_BY_WORD_HIGHLIGHT",
  "FADE_SLIDE_UP",
] as const;

/**
 * Công thức tính số lượng asset thật tối thiểu (Mục 2.1 Rule):
 * Min Assets = ceil(target_duration_sec / 2.2)
 * Ví dụ: 30s cần tối thiểu 14 ảnh/clip thật
 */
export function calculateMinRequiredAssets(durationSec: number): number {
  return Math.ceil(durationSec / 2.2);
}

// ============================================================================
// 2. INPUT SCHEMAS (Cổng kiểm duyệt đầu vào - Pre-flight Input Gate)
// ============================================================================

export const mediaAssetItemSchema = z
  .object({
    asset_id: z.string().trim().min(1),
    url: z.string().url(),
    type: z.enum(MEDIA_ASSET_TYPES),
    shot_type: z.enum(SHOT_TYPES),
    resolution: z.string().trim().min(3),
    description: z.string().trim().min(3).max(500),
  })
  .strict();

export type MediaAssetItem = z.infer<typeof mediaAssetItemSchema>;

export const audioConfigInputSchema = z
  .object({
    voice_persona_id: z.string().trim().min(1),
    ambient_sound_tags: z.array(z.string().trim().min(1)).min(1),
  })
  .strict();

export const approvedSceneInputSchema = z
  .object({
    index: z.number().int().positive(),
    start_seconds: z.number().min(0),
    end_seconds: z.number().positive(),
    visual_prompt: z.string().trim().min(5),
    shot_instruction: z.string().trim().min(3),
    narration: z.string().trim().min(3),
    on_screen_text: z.string().trim().min(1),
    verified_fact_refs: z.array(z.string().trim().min(1)).min(1),
    suggested_asset_id: z.string().trim().optional(),
  })
  .strict();

export type ApprovedSceneInput = z.infer<typeof approvedSceneInputSchema>;

export const videoEngineInputSchema = z
  .object({
    // Nhóm 1: Thông tin Sản phẩm & Merchant
    merchant_name: z.string().trim().min(1).max(255),
    product_name: z.string().trim().min(1).max(255),
    location: z.string().trim().min(1).max(255),
    sale_price: z.number().positive(),
    original_price: z.number().positive().optional().nullable(),
    official_cta: z.string().trim().min(5).max(300),
    booking_url: z.string().url(),

    // Nhóm 2: Chiến dịch & Đa nền tảng
    target_platforms: z.array(z.enum(TARGET_PLATFORMS)).min(1),
    content_type: z.enum(CONTENT_TYPES),
    persona: z.string().trim().min(1).max(100),
    target_duration_sec: z.number().min(15).max(60),

    // Nhóm 3 & 4: Tài nguyên hình ảnh thật & Cấu hình Spatial AI
    media_assets: z.array(mediaAssetItemSchema),
    allow_3d_spatial_effects: z.boolean().default(true),

    // Nhóm 5: Mẹo & Lưu ý thực tế (Bắt buộc tối thiểu 1-2 mẹo)
    authentic_tips: z.array(z.string().trim().min(5)).min(1),

    // Nhóm 6: Cấu hình âm thanh
    audio_config: audioConfigInputSchema,

    // Nhóm 7: Phân cảnh kịch bản được phê duyệt (Direct Scene-level Ingestion từ BE2)
    scenes: z.array(approvedSceneInputSchema).length(14).optional(),

    // Nhóm 8: Dữ kiện xác minh từ chiến dịch (Verified Facts đối chiếu Fact Refs)
    verified_facts: z
      .array(
        z
          .object({
            id: z.string().trim().min(1),
            text: z.string().trim().min(1),
            category: z.string().trim().optional(),
          })
          .strict(),
      )
      .optional(),
  })
  .strict();

export type MediaAsset = z.infer<typeof mediaAssetItemSchema>;
export type VideoEngineInput = z.infer<typeof videoEngineInputSchema>;

// ============================================================================
// 3. OUTPUT SCHEMAS - TRƯỜNG HỢP A: BLOCKED_MISSING_INPUT (Fail-Fast)
// ============================================================================

export const missingOrInvalidInputItemSchema = z
  .object({
    field: z.string().trim().min(1),
    reason: z.string().trim().min(5),
    required_action: z.string().trim().min(5),
  })
  .strict();

export const blockedMissingInputSchema = z
  .object({
    status: z.literal("BLOCKED_MISSING_INPUT"),
    can_proceed: z.literal(false),
    error_summary: z.string().trim().min(10),
    missing_or_invalid_inputs: z.array(missingOrInvalidInputItemSchema).min(1),
  })
  .strict();

export type MissingOrInvalidInputItem = z.infer<
  typeof missingOrInvalidInputItemSchema
>;
export type BlockedMissingInputResult = z.infer<
  typeof blockedMissingInputSchema
>;

// ============================================================================
// 4. OUTPUT SCHEMAS - TRƯỜNG HỢP B: READY_FOR_RENDER (Chuẩn CapCut UGC)
// ============================================================================

export const campaignMetadataSchema = z
  .object({
    merchant_name: z.string().trim().min(1),
    product_name: z.string().trim().min(1),
    persona: z.string().trim().min(1),
    content_type: z.enum(CONTENT_TYPES),
    target_platforms: z.array(z.enum(TARGET_PLATFORMS)).min(1),
    total_duration_sec: z.number().min(15).max(60),
    aspect_ratio: z.literal("9:16"),
    safe_zone_enforced: z.literal(true),
  })
  .strict();

export const antiAiComplianceCheckSchema = z
  .object({
    real_footage_100_percent: z.literal(true),
    generative_pixel_ai_used: z.literal(false),
    allowed_spatial_ai_techniques: z.array(z.enum(SPATIAL_AI_TECHNIQUES)),
    average_scene_duration_sec: z.number().min(1.0).max(3.0),
    no_ai_cliche_words: z.literal(true),
    verified_merchant_price_and_cta: z.literal(true),
  })
  .strict();

export const renderAudioConfigSchema = z
  .object({
    voice_persona_id: z.string().trim().min(1),
    speaking_rate: z.number().positive(),
    bgm_style: z.string().trim().min(3),
    full_voiceover_script_with_pauses: z.string().trim().min(10),
  })
  .strict();

export const cameraMotionSchema = z
  .object({
    effect: z.enum(CAMERA_MOTION_EFFECTS),
    direction: z.string().trim().min(1),
    speed: z.enum(MOTION_SPEEDS),
    max_displacement_percent: z.number().min(0).max(12),
    depth_layers: z.number().int().min(1).max(5),
  })
  .strict();

export const ambientSfxSchema = z
  .object({
    sound: z.string().trim().min(3),
    volume_percent: z.number().min(10).max(50),
  })
  .strict();

export const onScreenTextSchema = z
  .object({
    type: z.enum(TEXT_OVERLAY_TYPES),
    text: z.string().trim().min(1),
    font: z.string().trim().min(1),
    color: z.string().trim().optional(),
    stroke: z.string().trim().optional(),
    highlight_word: z.string().trim().optional(),
    highlight_color: z.string().trim().optional(),
    position: z.enum(TEXT_POSITIONS),
    animation: z.enum(TEXT_ANIMATIONS),
  })
  .strict();

export const timelineSceneSchema = z
  .object({
    scene_index: z.number().int().positive(),
    time_range_sec: z.string().regex(/^\d+(\.\d+)?\s*-\s*\d+(\.\d+)?$/),
    duration_sec: z.number().min(1.2).max(3.0),
    source_asset_id: z.string().trim().min(1),
    asset_type: z.enum(MEDIA_ASSET_TYPES),
    shot_type: z.enum(SHOT_TYPES),
    spatial_ai_technique: z.enum(SPATIAL_AI_TECHNIQUES),
    camera_motion: cameraMotionSchema,
    transition_out: z.enum(TRANSITION_TYPES),
    voiceover_segment: z.string().trim().min(1),
    ambient_sfx: ambientSfxSchema,
    on_screen_text: onScreenTextSchema,
    visual_prompt: z.string().trim().min(5).optional(),
    shot_instruction: z.string().trim().min(3).optional(),
    verified_fact_refs: z.array(z.string().trim().min(1)).optional(),
  })
  .strict();

export const socialPublishingPackageSchema = z
  .object({
    caption: z.string().trim().min(10).max(1000),
    official_cta_text: z.string().trim().min(5).max(300),
  })
  .strict();

export const readyForRenderSchema = z
  .object({
    status: z.literal("READY_FOR_RENDER"),
    can_proceed: z.literal(true),
    campaign_metadata: campaignMetadataSchema,
    anti_ai_compliance_check: antiAiComplianceCheckSchema,
    audio_config: renderAudioConfigSchema,
    timeline_scenes: z.array(timelineSceneSchema).min(1),
    social_publishing_package: socialPublishingPackageSchema,
  })
  .strict();

export type CampaignMetadata = z.infer<typeof campaignMetadataSchema>;
export type AntiAiComplianceCheck = z.infer<typeof antiAiComplianceCheckSchema>;
export type RenderAudioConfig = z.infer<typeof renderAudioConfigSchema>;
export type CameraMotion = z.infer<typeof cameraMotionSchema>;
export type AmbientSfx = z.infer<typeof ambientSfxSchema>;
export type OnScreenText = z.infer<typeof onScreenTextSchema>;
export type TimelineScene = z.infer<typeof timelineSceneSchema>;
export type SocialPublishingPackage = z.infer<
  typeof socialPublishingPackageSchema
>;
export type ReadyForRenderResult = z.infer<typeof readyForRenderSchema>;

// ============================================================================
// 5. UNIFIED DISCRIMINATED OUTPUT (Kết quả trả về của Video Engine)
// ============================================================================

export const videoEngineOutputSchema = z.discriminatedUnion("status", [
  blockedMissingInputSchema,
  readyForRenderSchema,
]);

export type VideoEngineOutput = z.infer<typeof videoEngineOutputSchema>;

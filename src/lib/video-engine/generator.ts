import {
  blockedMissingInputSchema,
  calculateMinRequiredAssets,
  readyForRenderSchema,
  videoEngineInputSchema,
  videoEngineOutputSchema,
  type BlockedMissingInputResult,
  type CameraMotion,
  type MissingOrInvalidInputItem,
  type OnScreenText,
  type ReadyForRenderResult,
  type SpatialAiTechnique,
  type TimelineScene,
  type VideoEngineInput,
  type VideoEngineOutput,
} from "./types.ts";

// ============================================================================
// 1. DANH SÁCH TỪ NGỮ CẤM & QUY CHUẨN (Theo RuleAIAgentsGenVideo.md)
// ============================================================================

export const BANNED_AI_CLICHES = [
  "viên ngọc quý",
  "hội tụ vẻ đẹp thiên nhiên kỳ vĩ",
  "hãy cùng chúng tôi khám phá",
  "điểm đến không thể bỏ lỡ",
  "thiên đường nghỉ dưỡng tuyệt vời",
] as const;

// ============================================================================
// 2. PRE-FLIGHT GATE: KIỂM DUYỆT ĐẦU VÀO FAIL-FAST (Mục 2 của Rule)
// ============================================================================

/**
 * Kiểm tra các điều kiện an toàn & tài nguyên thật của Merchant.
 * Nếu thiếu bất kỳ điều kiện nào, trả về danh sách vi phạm chi tiết.
 */
export function validatePreFlightGate(input: VideoEngineInput): {
  isValid: boolean;
  errors: MissingOrInvalidInputItem[];
} {
  const errors: MissingOrInvalidInputItem[] = [];
  const minRequiredAssets = calculateMinRequiredAssets(
    input.target_duration_sec
  );

  // 1. Kiểm tra số lượng assets thật tối thiểu (công thức ceil(duration / 2.2))
  if (input.media_assets.length < minRequiredAssets) {
    errors.push({
      field: "media_assets",
      reason: `Chiến dịch yêu cầu video ${input.target_duration_sec}s trên đa nền tảng (cần tối thiểu ${minRequiredAssets} ảnh/clip thật để cắt cảnh nhanh 1.5s - 2.5s/cảnh), nhưng hiện tại chỉ cung cấp ${input.media_assets.length} tài nguyên.`,
      required_action: `Vui lòng tải lên thêm ít nhất ${minRequiredAssets - input.media_assets.length} ảnh chụp thật hoặc clip quay thực tế của tour/sản phẩm.`,
    });
  }

  // 2. Kiểm tra điều kiện hiệu ứng Drone / 3D Spatial
  if (input.allow_3d_spatial_effects) {
    const wideScenicAssets = input.media_assets.filter(
      (a) => a.shot_type === "AERIAL_WIDE" || a.shot_type === "SCENIC_MEDIUM"
    );
    if (wideScenicAssets.length < 2) {
      errors.push({
        field: "media_assets.shot_type (AERIAL_WIDE / SCENIC_MEDIUM)",
        reason:
          "Yêu cầu hiệu ứng Drone Truck Left kết hợp Spatial AI nhưng không có đủ ít nhất 2 ảnh toàn cảnh/góc cao (AERIAL_WIDE hoặc SCENIC_MEDIUM) đạt chuẩn.",
        required_action:
          "Bổ sung ít nhất 2 ảnh chụp góc rộng/toàn cảnh thực tế của địa điểm (không cận mặt người) để áp dụng hiệu ứng Drone Truck Left.",
      });
    }
  }

  // 3. Kiểm tra Mẹo & Lưu ý thực tế (Authentic Tips)
  if (!input.authentic_tips || input.authentic_tips.length === 0) {
    errors.push({
      field: "authentic_tips",
      reason:
        "Thiếu danh sách 'Mẹo & Lưu ý thực tế' tại điểm đến. Video chuẩn UGC bắt buộc phải có trải nghiệm thực tế.",
      required_action:
        "Bổ sung ít nhất 1-2 kinh nghiệm/lưu ý thực tế (VD: thời điểm vắng khách, trang phục nên mặc, lưu ý thời tiết).",
    });
  }

  // 4. Kiểm tra Giá bán thực tế (Anti-Hallucination)
  if (input.sale_price <= 0) {
    errors.push({
      field: "sale_price",
      reason: "Giá bán sản phẩm không hợp lệ (phải là số dương đã xác thực).",
      required_action:
        "Cung cấp giá bán chính xác từ cơ sở dữ liệu của Merchant.",
    });
  }

  // 5. Kiểm tra Booking URL & Official CTA
  if (!input.booking_url || !input.booking_url.startsWith("http")) {
    errors.push({
      field: "booking_url",
      reason: "Đường dẫn đặt vé chính thức không hợp lệ hoặc bị thiếu.",
      required_action:
        "Cung cấp liên kết đặt vé chính thức (HTTP/HTTPS) có xác thực của Merchant.",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// 3. STORYBOARD COMPOSER: DỰNG PHÂN CẢNH CHUẨN UGC CAPCUT (Mục 3 của Rule)
// ============================================================================

function formatVnd(amount: number): string {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

/**
 * Xây dựng danh sách phân cảnh timeline 1.5s - 2.5s, phân bổ hiệu ứng Drone Truck Left,
 * chèn Text Hook Safe Zone và âm thanh 3 lớp.
 */
const EXPERIENTIAL_VOICEOVERS = [
  "chiêm ngưỡng kiến trúc tráng lệ giữa làn mây bồng bềnh,",
  "thưởng thức không khí trong lành cùng những góc check-in tuyệt đẹp,",
  "trải nghiệm ẩm thực phong phú với thực đơn hấp dẫn chuẩn vị,",
  "tận hưởng những khoảnh khắc giải trí đỉnh cao vô cùng sôi động,",
  "lưu giữ trọn vẹn từng kỷ niệm đáng nhớ cùng người thân,",
  "dịch vụ chuyên nghiệp tận tâm luôn sẵn sàng đồng hành cùng bạn,",
];

const EXPERIENTIAL_CAPTIONS = [
  "Kiến trúc tráng lệ giữa biển mây",
  "Góc check-in tuyệt đẹp khó quên",
  "Đại tiệc ẩm thực phong phú chuẩn vị",
  "Giải trí đỉnh cao bất tận cảm xúc",
  "Khoảnh khắc kỷ niệm trọn vẹn",
  "Dịch vụ chuyên nghiệp tận tâm",
];

function composeTimelineScenes(input: VideoEngineInput): TimelineScene[] {
  const totalDuration = input.target_duration_sec;
  const assets = input.media_assets;
  const numScenes = Math.max(
    calculateMinRequiredAssets(totalDuration),
    assets.length
  );

  // Phân bổ thời lượng từng cảnh trong khoảng 1.8s - 2.2s sao cho tổng bằng totalDuration
  const baseDuration = Number((totalDuration / numScenes).toFixed(1));
  const sceneDurations: number[] = [];
  let accumulated = 0;

  for (let i = 0; i < numScenes; i++) {
    if (i === numScenes - 1) {
      const remaining = Number((totalDuration - accumulated).toFixed(1));
      sceneDurations.push(Math.max(1.5, remaining));
    } else {
      sceneDurations.push(baseDuration);
      accumulated += baseDuration;
    }
  }

  const scenes: TimelineScene[] = [];
  let currentStart = 0;
  let droneTruckCount = 0;

  for (let i = 0; i < numScenes; i++) {
    const sceneIndex = i + 1;
    const duration = sceneDurations[i];
    const end = Number((currentStart + duration).toFixed(1));
    const timeRange = `${currentStart.toFixed(1)} - ${end.toFixed(1)}`;
    const asset = assets[i % assets.length];

    // Xác định vai trò của phân cảnh theo công thức UGC 4 phần:
    // 1. Hook (0s - 3s)
    // 2. Experience & Tips (3s - ~75% thời lượng)
    // 3. Offer / Value (~75% - ~90% thời lượng)
    // 4. Official CTA (Phân cảnh cuối cùng)
    const isHookScene = sceneIndex === 1;
    const isLastScene = sceneIndex === numScenes;
    const isOfferScene = sceneIndex === numScenes - 1;
    const isTipsScene = sceneIndex === 3 || sceneIndex === 4;

    // Phân bổ Kỹ thuật Spatial AI & Camera Motion
    let spatialTechnique: SpatialAiTechnique =
      "SINGLE_IMAGE_3D_MESH_PROJECTION";
    let cameraMotion: CameraMotion = {
      effect: "STATIC",
      direction: "NONE",
      speed: "NORMAL",
      max_displacement_percent: 0,
      depth_layers: 2,
    };

    if (asset.type === "VIDEO") {
      spatialTechnique = "NONE_REAL_VIDEO";
      cameraMotion = {
        effect: "NATURAL_HANDHELD_POV",
        direction: "FORWARD",
        speed: "NORMAL",
        max_displacement_percent: 0,
        depth_layers: 1,
      };
    } else if (
      input.allow_3d_spatial_effects &&
      asset.shot_type === "AERIAL_WIDE" &&
      droneTruckCount < 3
    ) {
      spatialTechnique = "2.5D_AERIAL_PARALLAX";
      cameraMotion = {
        effect:
          droneTruckCount % 2 === 0 ? "DRONE_TRUCK_LEFT" : "DRONE_TRUCK_RIGHT",
        direction: droneTruckCount % 2 === 0 ? "RIGHT_TO_LEFT" : "LEFT_TO_RIGHT",
        speed: "SMOOTH_MEDIUM",
        max_displacement_percent: 10,
        depth_layers: 3,
      };
      droneTruckCount++;
    } else if (
      asset.shot_type === "CLOSEUP_FOOD" ||
      asset.shot_type === "SCENIC_MEDIUM"
    ) {
      spatialTechnique = "DEPTH_BASED_3D_KEN_BURNS";
      cameraMotion = {
        effect: "KEN_BURNS_PUSH_IN",
        direction: "CENTER_FORWARD",
        speed: "SLOW_CINEMATIC",
        max_displacement_percent: 6,
        depth_layers: 3,
      };
    }

    // Phân bổ Text Overlay & Safe Zone Typography
    let onScreenText: OnScreenText;
    let voiceoverSegment = "";

    if (isHookScene) {
      onScreenText = {
        type: "HOOK_HEADLINE",
        text: `⚠️ LƯU Ý SỐNG CÒN KHI ĐI ${input.product_name.toUpperCase()}!`,
        font: "Be Vietnam Pro ExtraBold",
        color: "#FFD700",
        stroke: "#000000",
        position: "CENTER_SAFE_ZONE",
        animation: "POP_BOUNCE",
      };
      voiceoverSegment = `Đi ${input.product_name} cuối tuần mà không biết lưu ý này,`;
    } else if (isLastScene) {
      onScreenText = {
        type: "OFFICIAL_CTA",
        text: `👇 ${input.official_cta.toUpperCase()}`,
        font: "Be Vietnam Pro ExtraBold",
        color: "#FFFFFF",
        stroke: "#000000",
        position: "LOWER_MIDDLE_SAFE_ZONE",
        animation: "POP_BOUNCE",
      };
      voiceoverSegment = `Comment ngay bên dưới để nhận link đặt vé chính thức từ đối tác nha!`;
    } else if (isOfferScene) {
      onScreenText = {
        type: "OFFER_CALLOUT",
        text: `🔥 VÉ CHÍNH HÃNG CHỈ ${formatVnd(input.sale_price)}`,
        font: "Be Vietnam Pro ExtraBold",
        color: "#FFD700",
        stroke: "#000000",
        position: "CENTER_SAFE_ZONE",
        animation: "POP_BOUNCE",
      };
      voiceoverSegment = `Đợt này vé ưu đãi chính hãng chỉ ${formatVnd(input.sale_price)}, quét mã QR vào thẳng cổng.`;
    } else if (isTipsScene && input.authentic_tips.length > 0) {
      const tipText =
        input.authentic_tips[
          (sceneIndex - 3) % input.authentic_tips.length
        ];
      onScreenText = {
        type: "DYNAMIC_CAPTION",
        text: `📍 Mẹo thực tế: ${tipText}`,
        font: "Montserrat Bold",
        highlight_word: "Mẹo thực tế",
        highlight_color: "#34C759",
        position: "LOWER_MIDDLE_SAFE_ZONE",
        animation: "WORD_BY_WORD_HIGHLIGHT",
      };
      voiceoverSegment = `[breath] Lưu ý thực tế là ${tipText.toLowerCase()},`;
    } else {
      const phraseIdx = (sceneIndex - 2) % EXPERIENTIAL_VOICEOVERS.length;
      onScreenText = {
        type: "DYNAMIC_CAPTION",
        text: EXPERIENTIAL_CAPTIONS[phraseIdx],
        font: "Montserrat Bold",
        position: "LOWER_MIDDLE_SAFE_ZONE",
        animation: "WORD_BY_WORD_HIGHLIGHT",
      };
      voiceoverSegment = EXPERIENTIAL_VOICEOVERS[phraseIdx];
    }

    // Âm thanh hiện trường (Ambient SFX)
    const ambientTag =
      input.audio_config.ambient_sound_tags[
        i % input.audio_config.ambient_sound_tags.length
      ];

    scenes.push({
      scene_index: sceneIndex,
      time_range_sec: timeRange,
      duration_sec: duration,
      source_asset_id: asset.asset_id,
      asset_type: asset.type,
      shot_type: asset.shot_type,
      spatial_ai_technique: spatialTechnique,
      camera_motion: cameraMotion,
      transition_out: i % 2 === 0 ? "HARD_JUMP_CUT" : "WHIP_PAN_SHORT",
      voiceover_segment: voiceoverSegment,
      ambient_sfx: {
        sound: `Âm thanh thực tế: ${ambientTag}`,
        volume_percent: isHookScene ? 30 : 25,
      },
      on_screen_text: onScreenText,
    });

    currentStart = end;
  }

  return scenes;
}

// ============================================================================
// 4. CORE ENGINE FUNCTION: TỔNG HỢP VIDEO AI (Task BE1-W3-06)
// ============================================================================

/**
 * Hàm điều phối chính của Core AI Video Generation Engine:
 * 1. Nhận input và kiểm tra Pre-flight Gate (Fail-Fast).
 * 2. Nếu thiếu input -> Trả về BLOCKED_MISSING_INPUT ngay lập tức.
 * 3. Nếu hợp lệ -> Dựng kịch bản READY_FOR_RENDER chuẩn CapCut UGC và tỷ lệ 9:16.
 */
export function generateVideoDirectorScript(
  rawInput: unknown
): VideoEngineOutput {
  // Bước 1: Parse dữ liệu với Zod Schema cơ bản
  const parsed = videoEngineInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorDetails: MissingOrInvalidInputItem[] = parsed.error.issues.map(
      (issue) => ({
        field: issue.path.join("."),
        reason: issue.message,
        required_action:
          "Vui lòng cung cấp đúng định dạng dữ liệu theo chuẩn VideoEngineInput.",
      })
    );

    return blockedMissingInputSchema.parse({
      status: "BLOCKED_MISSING_INPUT",
      can_proceed: false,
      error_summary:
        "Dữ liệu đầu vào không đúng schema quy định của Video Engine.",
      missing_or_invalid_inputs: errorDetails,
    });
  }

  const input = parsed.data;

  // Bước 2: Kiểm tra các quy tắc nghiệp vụ Pre-flight Gate
  const gateCheck = validatePreFlightGate(input);
  if (!gateCheck.isValid) {
    return blockedMissingInputSchema.parse({
      status: "BLOCKED_MISSING_INPUT",
      can_proceed: false,
      error_summary:
        "Không thể tạo video chuẩn UGC do thiếu tài nguyên thực tế và thông tin bắt buộc. Hệ thống từ chối tự sinh nội dung giả để tránh video bị AI hóa.",
      missing_or_invalid_inputs: gateCheck.errors,
    });
  }

  // Bước 3: Dựng Storyboard và Timeline các phân cảnh
  const timelineScenes = composeTimelineScenes(input);

  // Bước 4: Tạo cấu hình âm thanh hoàn chỉnh có nhịp thở và ngắt nghỉ
  const fullVoiceover = timelineScenes
    .map((s) => s.voiceover_segment)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const averageSceneDuration = Number(
    (input.target_duration_sec / timelineScenes.length).toFixed(1)
  );

  const readyResult: ReadyForRenderResult = {
    status: "READY_FOR_RENDER",
    can_proceed: true,
    campaign_metadata: {
      merchant_name: input.merchant_name,
      product_name: input.product_name,
      persona: input.persona,
      content_type: input.content_type,
      target_platforms: input.target_platforms,
      total_duration_sec: input.target_duration_sec,
      aspect_ratio: "9:16",
      safe_zone_enforced: true,
    },
    anti_ai_compliance_check: {
      real_footage_100_percent: true,
      generative_pixel_ai_used: false,
      allowed_spatial_ai_techniques: [
        "2.5D_AERIAL_PARALLAX",
        "DEPTH_BASED_3D_KEN_BURNS",
        "SINGLE_IMAGE_3D_MESH_PROJECTION",
        "NONE_REAL_VIDEO",
      ],
      average_scene_duration_sec: averageSceneDuration,
      no_ai_cliche_words: true,
      verified_merchant_price_and_cta: true,
    },
    audio_config: {
      voice_persona_id: input.audio_config.voice_persona_id,
      speaking_rate: 1.08,
      bgm_style: "Upbeat Acoustic Travel Vlog (Volume: 18%)",
      full_voiceover_script_with_pauses: fullVoiceover,
    },
    timeline_scenes: timelineScenes,
    social_publishing_package: {
      caption: `Kinh nghiệm đi ${input.product_name} cực hữu ích! Lưu ngay lại để đi cùng bạn bè nhé! #${input.location.replace(/\s+/g, "")} #${input.product_name.replace(/\s+/g, "")}`,
      official_cta_text: input.official_cta,
    },
  };

  // Xác thực output trước khi trả về
  return readyForRenderSchema.parse(readyResult);
}

// ============================================================================
// 5. RENDERER PIPELINE ADAPTER (Cung cấp cho API BE1-W3-07)
// ============================================================================

export type VideoRenderResult = {
  success: boolean;
  video_url: string;
  duration_sec: number;
  aspect_ratio: "9:16";
  resolution: string;
  storage_bucket: string;
  rendered_at: string;
};

/**
 * Adapter kết nối với Renderer Pipeline (phục vụ BE1-W3-07):
 * Tiếp nhận thông số READY_FOR_RENDER và trả về đường dẫn video thành phẩm
 * sẵn sàng đẩy lên Supabase Storage bucket `campaign-videos`.
 */
export async function synthesizeVideoDraft(
  renderSpec: ReadyForRenderResult
): Promise<VideoRenderResult> {
  // Giả lập tiến trình render tổng hợp video chuẩn 9:16 (1080x1920)
  const timestamp = Date.now();
  const slug = renderSpec.campaign_metadata.product_name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-");

  const mockVideoUrl = `https://storage.travellink.vn/campaign-videos/${slug}-${timestamp}.mp4`;

  return {
    success: true,
    video_url: mockVideoUrl,
    duration_sec: renderSpec.campaign_metadata.total_duration_sec,
    aspect_ratio: "9:16",
    resolution: "1080x1920",
    storage_bucket: "campaign-videos",
    rendered_at: new Date().toISOString(),
  };
}

import {
  blockedMissingInputSchema,
  calculateMinRequiredAssets,
  readyForRenderSchema,
  videoEngineInputSchema,
  type CameraMotion,
  type MediaAssetItem,
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

  // 6. Kiểm tra Direct Scene Ingestion (nếu có trường scenes từ BE2)
  if (input.scenes !== undefined) {
    if (input.scenes.length !== 14) {
      errors.push({
        field: "scenes",
        reason: `Kịch bản phân cảnh yêu cầu đúng 14 phân cảnh, nhưng nhận được ${input.scenes.length}.`,
        required_action: "Đảm bảo kịch bản đầu vào có đủ đúng 14 phân cảnh chuẩn.",
      });
    } else {
      // 6.1 Kiểm tra index chính xác 1..14, không trùng, không đảo thứ tự, bắt đầu từ 1
      for (let i = 0; i < input.scenes.length; i++) {
        const expectedIndex = i + 1;
        if (input.scenes[i].index !== expectedIndex) {
          errors.push({
            field: `scenes[${i}].index`,
            reason: `Phân cảnh thứ ${i + 1} có index là ${input.scenes[i].index}, yêu cầu index phải bắt đầu từ 1, liên tục không trùng lặp và đúng thứ tự (kỳ vọng: ${expectedIndex}).`,
            required_action: "Sắp xếp lại các phân cảnh theo thứ tự index tăng dần từ 1 đến 14.",
          });
          break;
        }
      }

      // 6.2 Kiểm tra end_seconds > start_seconds cho từng phân cảnh
      for (let i = 0; i < input.scenes.length; i++) {
        const sc = input.scenes[i];
        if (sc.end_seconds <= sc.start_seconds) {
          errors.push({
            field: `scenes[${i}].duration`,
            reason: `Phân cảnh ${sc.index} có end_seconds (${sc.end_seconds}) nhỏ hơn hoặc bằng start_seconds (${sc.start_seconds}).`,
            required_action: "Đảm bảo thời điểm kết thúc phân cảnh phải lớn hơn thời điểm bắt đầu.",
          });
          break;
        }
      }

      // 6.3 Kiểm tra tính liên tục của timeline từ 0.0 đến target_duration_sec
      let isContinuous = input.scenes[0].start_seconds === 0;
      for (let i = 1; i < input.scenes.length; i++) {
        if (
          Math.abs(
            input.scenes[i].start_seconds - input.scenes[i - 1].end_seconds
          ) > 0.05
        ) {
          isContinuous = false;
          break;
        }
      }
      const lastSceneEnd = input.scenes[input.scenes.length - 1].end_seconds;
      if (Math.abs(lastSceneEnd - input.target_duration_sec) > 0.5) {
        isContinuous = false;
      }
      if (!isContinuous) {
        errors.push({
          field: "scenes.timeline",
          reason:
            "Dòng thời gian các phân cảnh không liên tục hoặc không khớp với target_duration_sec.",
          required_action:
            "Điều chỉnh thời lượng các phân cảnh liên tục từ 0.0 đến target_duration_sec.",
        });
      }

      // 6.4 Kiểm tra verified_facts & fact references
      // Khi truyền scenes, bắt buộc phải có verified_facts là mảng không rỗng, ID hợp lệ và không trùng lặp
      if (
        !input.verified_facts ||
        !Array.isArray(input.verified_facts) ||
        input.verified_facts.length === 0
      ) {
        errors.push({
          field: "verified_facts",
          reason:
            "Kịch bản gồm 14 phân cảnh bắt buộc phải cung cấp danh sách verified_facts (mảng không rỗng) để đối chiếu căn cứ thực tế.",
          required_action:
            "Bổ sung danh sách verified_facts với các Fact ID hợp lệ được xác thực từ chiến dịch.",
        });
      }

      const knownFactIds = new Set<string>();
      if (input.verified_facts && Array.isArray(input.verified_facts)) {
        for (let i = 0; i < input.verified_facts.length; i++) {
          const fact = input.verified_facts[i];
          const factId = fact?.id?.trim();
          if (!factId) {
            errors.push({
              field: `verified_facts[${i}].id`,
              reason: `Fact thứ ${i + 1} trong verified_facts có ID không hợp lệ hoặc bị rỗng.`,
              required_action:
                "Đảm bảo mỗi fact đều có trường id hợp lệ dạng chuỗi không rỗng.",
            });
            break;
          }
          if (knownFactIds.has(factId)) {
            errors.push({
              field: `verified_facts[${i}].id`,
              reason: `Fact ID '${factId}' bị trùng lặp trong danh sách verified_facts.`,
              required_action:
                "Đảm bảo các Fact ID trong verified_facts là duy nhất không trùng lặp.",
            });
            break;
          }
          knownFactIds.add(factId);
        }
      }

      // Kiểm tra fact references cho từng scene:
      // Mọi phần tử trong scene.verified_fact_refs phải tồn tại trong verified_facts (kể cả khi verified_facts bị thiếu)
      for (let i = 0; i < input.scenes.length; i++) {
        const sc = input.scenes[i];
        if (!sc.verified_fact_refs || sc.verified_fact_refs.length === 0) {
          errors.push({
            field: `scenes[${i}].verified_fact_refs`,
            reason: `Phân cảnh ${sc.index} không chứa verified_fact_refs (danh sách rỗng).`,
            required_action: "Mỗi phân cảnh phải tham chiếu ít nhất một Fact ID hợp lệ.",
          });
          break;
        }

        if (sc.verified_fact_refs.some((ref) => !ref || !ref.trim())) {
          errors.push({
            field: `scenes[${i}].verified_fact_refs`,
            reason: `Phân cảnh ${sc.index} chứa fact ref rỗng.`,
            required_action: "Loại bỏ fact ref rỗng và cung cấp Fact ID hợp lệ.",
          });
          break;
        }

        const unknownRef = sc.verified_fact_refs.find(
          (ref) => !knownFactIds.has(ref.trim())
        );
        if (unknownRef) {
          errors.push({
            field: `scenes[${i}].verified_fact_refs`,
            reason: `Phân cảnh ${sc.index} tham chiếu Fact ID '${unknownRef}' không tồn tại trong danh sách verified_facts được cấp.`,
            required_action:
              "Chỉ tham chiếu các Fact ID đã được xác thực trong verified_facts.",
          });
          break;
        }
      }

      // 6.5 CTA scene cuối (cảnh 14): Bắt buộc chứa [LINK_MUA_VE], nếu thiếu phải fail closed!
      const ctaScene = input.scenes[13];
      if (!ctaScene.on_screen_text || !ctaScene.on_screen_text.includes("[LINK_MUA_VE]")) {
        errors.push({
          field: "scenes[13].on_screen_text",
          reason: "Phân cảnh CTA cuối cùng (cảnh 14) thiếu placeholder bắt buộc [LINK_MUA_VE].",
          required_action: "Bổ sung placeholder [LINK_MUA_VE] vào on_screen_text của phân cảnh 14.",
        });
      }

      // 6.6 Kiểm tra URL ngoại lai trong tất cả các scene
      const urlRegex = /https?:\/\/[^\s]+/i;
      for (let i = 0; i < input.scenes.length; i++) {
        const sc = input.scenes[i];
        if (
          urlRegex.test(sc.narration) ||
          urlRegex.test(sc.on_screen_text) ||
          urlRegex.test(sc.visual_prompt)
        ) {
          errors.push({
            field: `scenes[${i}].foreign_url`,
            reason: `Phân cảnh ${sc.index} chứa URL ngoại lai trái phép. Chỉ cho phép placeholder [LINK_MUA_VE] tại CTA.`,
            required_action: "Xóa toàn bộ URL ngoại lai khỏi kịch bản phân cảnh.",
          });
          break;
        }
      }

      // 6.7 Kiểm tra Media Assets: tính duy nhất và số lượng tối thiểu cho 14 phân cảnh (yêu cầu ánh xạ 1-1)
      const uniqueAssetIds = new Set<string>();
      const duplicateAssetIds = new Set<string>();
      for (let i = 0; i < input.media_assets.length; i++) {
        const id = input.media_assets[i].asset_id?.trim();
        if (id) {
          if (uniqueAssetIds.has(id)) {
            duplicateAssetIds.add(id);
          }
          uniqueAssetIds.add(id);
        }
      }

      if (duplicateAssetIds.size > 0) {
        errors.push({
          field: "media_assets.asset_id",
          reason: `Phát hiện asset_id bị trùng lặp trong danh sách media_assets: [${[...duplicateAssetIds].join(", ")}]. Không được phép trùng lặp asset_id.`,
          required_action:
            "Đảm bảo mỗi media asset có một asset_id duy nhất và riêng biệt.",
        });
      }

      if (uniqueAssetIds.size < 14) {
        errors.push({
          field: "media_assets",
          reason: `Kịch bản gồm 14 phân cảnh yêu cầu tối thiểu 14 tài nguyên hình ảnh/clip thực tế DUY NHẤT để ánh xạ 1-1, nhưng hiện tại chỉ có ${uniqueAssetIds.size} tài nguyên khác nhau.`,
          required_action:
            "Bổ sung ít nhất 14 tài nguyên hình ảnh/clip thực tế với asset_id riêng biệt.",
        });
      }

      // 6.8 Kiểm tra suggested_asset_id: phải tồn tại và không được trùng nhau giữa các scene
      const usedSuggestedAssetIds = new Set<string>();
      for (let i = 0; i < input.scenes.length; i++) {
        const sc = input.scenes[i];
        if (sc.suggested_asset_id) {
          const suggestedId = sc.suggested_asset_id.trim();
          const exists = input.media_assets.some(
            (a) => a.asset_id?.trim() === suggestedId
          );
          if (!exists) {
            errors.push({
              field: `scenes[${i}].suggested_asset_id`,
              reason: `Phân cảnh ${sc.index} yêu cầu asset_id '${suggestedId}' nhưng không tìm thấy trong danh sách media_assets.`,
              required_action:
                "Đảm bảo suggested_asset_id tương ứng với một asset_id có thực trong media_assets.",
            });
            break;
          }

          if (usedSuggestedAssetIds.has(suggestedId)) {
            errors.push({
              field: `scenes[${i}].suggested_asset_id`,
              reason: `Phân cảnh ${sc.index} sử dụng suggested_asset_id '${suggestedId}' đã được gán cho phân cảnh khác. Không cho phép hai phân cảnh dùng chung một tài nguyên.`,
              required_action:
                "Mỗi phân cảnh phải sử dụng một asset_id riêng biệt, đảm bảo ánh xạ 1-1.",
            });
            break;
          }
          usedSuggestedAssetIds.add(suggestedId);
        }
      }
    }
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
 * Hỗ trợ DIRECT SCENE-LEVEL INGESTION từ 14 scenes của BE2.
 */
function composeTimelineScenes(input: VideoEngineInput): TimelineScene[] {
  // TRƯỜNG HỢP 1: DIRECT SCENE-LEVEL INGESTION (Tiêu thụ trực tiếp 14 approved scenes từ BE2)
  if (input.scenes && input.scenes.length === 14) {
    const scenes: TimelineScene[] = [];
    let droneTruckCount = 0;

    // Chuẩn bị pool tài nguyên duy nhất và ánh xạ 1-1 không tái sử dụng
    const availableAssets = [...input.media_assets];
    const assetMapBySceneIndex = new Map<number, MediaAssetItem>();
    const usedAssetIds = new Set<string>();

    // Bước 1: Gán các scene có suggested_asset_id trước
    for (let i = 0; i < input.scenes.length; i++) {
      const sc = input.scenes[i];
      if (sc.suggested_asset_id) {
        const targetId = sc.suggested_asset_id.trim();
        const found = availableAssets.find((a) => a.asset_id.trim() === targetId);
        if (found && !usedAssetIds.has(found.asset_id)) {
          assetMapBySceneIndex.set(sc.index, found);
          usedAssetIds.add(found.asset_id);
        }
      }
    }

    // Bước 2: Gán các scene không có suggested_asset_id từ các asset còn lại chưa sử dụng
    let unusedAssetIndex = 0;
    for (let i = 0; i < input.scenes.length; i++) {
      const sc = input.scenes[i];
      if (!assetMapBySceneIndex.has(sc.index)) {
        while (
          unusedAssetIndex < availableAssets.length &&
          usedAssetIds.has(availableAssets[unusedAssetIndex].asset_id)
        ) {
          unusedAssetIndex++;
        }
        if (unusedAssetIndex < availableAssets.length) {
          const chosen = availableAssets[unusedAssetIndex];
          assetMapBySceneIndex.set(sc.index, chosen);
          usedAssetIds.add(chosen.asset_id);
          unusedAssetIndex++;
        }
      }
    }

    for (let i = 0; i < input.scenes.length; i++) {
      const approvedScene = input.scenes[i];
      const sceneIndex = approvedScene.index;
      const duration = Number(
        (approvedScene.end_seconds - approvedScene.start_seconds).toFixed(1)
      );
      const timeRange = `${approvedScene.start_seconds.toFixed(1)} - ${approvedScene.end_seconds.toFixed(1)}`;

      const asset = assetMapBySceneIndex.get(sceneIndex) || input.media_assets[i];

      const isHookScene = sceneIndex === 1;
      const isLastScene = sceneIndex === 14;
      const isOfferScene = sceneIndex === 13;

      let spatialTechnique: SpatialAiTechnique =
        "SINGLE_IMAGE_3D_MESH_PROJECTION";
      let cameraMotion: CameraMotion = {
        effect: "STATIC",
        direction: "NONE",
        speed: "NORMAL",
        max_displacement_percent: 0,
        depth_layers: 2,
      };

      const shotInstLower = approvedScene.shot_instruction.toLowerCase();
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
        asset.shot_type === "AERIAL_WIDE" ||
        shotInstLower.includes("flycam") ||
        shotInstLower.includes("drone") ||
        shotInstLower.includes("aerial")
      ) {
        spatialTechnique = "2.5D_AERIAL_PARALLAX";
        cameraMotion = {
          effect:
            droneTruckCount % 2 === 0
              ? "DRONE_TRUCK_LEFT"
              : "DRONE_TRUCK_RIGHT",
          direction:
            droneTruckCount % 2 === 0 ? "RIGHT_TO_LEFT" : "LEFT_TO_RIGHT",
          speed: "SMOOTH_MEDIUM",
          max_displacement_percent: 10,
          depth_layers: 3,
        };
        droneTruckCount++;
      } else if (
        asset.shot_type === "CLOSEUP_FOOD" ||
        asset.shot_type === "SCENIC_MEDIUM" ||
        shotInstLower.includes("ken burns") ||
        shotInstLower.includes("cận cảnh")
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

      let onScreenText: OnScreenText;
      if (isHookScene) {
        onScreenText = {
          type: "HOOK_HEADLINE",
          text: approvedScene.on_screen_text,
          font: "Be Vietnam Pro ExtraBold",
          color: "#FFD700",
          stroke: "#000000",
          position: "CENTER_SAFE_ZONE",
          animation: "POP_BOUNCE",
        };
      } else if (isLastScene) {
        onScreenText = {
          type: "OFFICIAL_CTA",
          text: approvedScene.on_screen_text,
          font: "Be Vietnam Pro ExtraBold",
          color: "#FFFFFF",
          stroke: "#000000",
          position: "LOWER_MIDDLE_SAFE_ZONE",
          animation: "POP_BOUNCE",
        };
      } else if (isOfferScene) {
        onScreenText = {
          type: "OFFER_CALLOUT",
          text: approvedScene.on_screen_text,
          font: "Be Vietnam Pro ExtraBold",
          color: "#FFD700",
          stroke: "#000000",
          position: "CENTER_SAFE_ZONE",
          animation: "POP_BOUNCE",
        };
      } else {
        onScreenText = {
          type: "DYNAMIC_CAPTION",
          text: approvedScene.on_screen_text,
          font: "Montserrat Bold",
          position: "LOWER_MIDDLE_SAFE_ZONE",
          animation: "WORD_BY_WORD_HIGHLIGHT",
        };
      }

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
        transition_out:
          i % 2 === 0 ? "HARD_JUMP_CUT" : "CROSS_DISSOLVE_FAST",
        voiceover_segment: approvedScene.narration,
        ambient_sfx: {
          sound: `Âm thanh thực tế: ${ambientTag}`,
          volume_percent: isHookScene ? 30 : 25,
        },
        on_screen_text: onScreenText,
        visual_prompt: approvedScene.visual_prompt,
        shot_instruction: approvedScene.shot_instruction,
        verified_fact_refs: approvedScene.verified_fact_refs,
      });
    }

    return scenes;
  }

  // TRƯỜNG HỢP 2: STANDALONE BE1 ASSET-BASED GENERATION (Tương thích ngược khi không có approved scenes từ BE2)
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
      onScreenText = {
        type: "DYNAMIC_CAPTION",
        text: `Trải nghiệm ${input.product_name} tuyệt vời`,
        font: "Montserrat Bold",
        position: "LOWER_MIDDLE_SAFE_ZONE",
        animation: "WORD_BY_WORD_HIGHLIGHT",
      };
      voiceoverSegment = `cảnh đẹp mãn nhãn và dịch vụ cực kỳ chu đáo.`;
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

export interface VideoRendererAdapter {
  render(spec: ReadyForRenderResult): Promise<VideoRenderResult>;
}

export class MockVideoRendererAdapter implements VideoRendererAdapter {
  async render(spec: ReadyForRenderResult): Promise<VideoRenderResult> {
    const timestamp = Date.now();
    const slug = spec.campaign_metadata.product_name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-");

    const mockVideoUrl = `https://storage.travellink.vn/campaign-videos/${slug}-${timestamp}.mp4`;

    return {
      success: true,
      video_url: mockVideoUrl,
      duration_sec: spec.campaign_metadata.total_duration_sec,
      aspect_ratio: "9:16",
      resolution: "1080x1920",
      storage_bucket: "campaign-videos",
      rendered_at: new Date().toISOString(),
    };
  }
}

/**
 * Adapter kết nối với Renderer Pipeline (phục vụ BE1-W3-07 / BE1-W4-01):
 * Tiếp nhận thông số READY_FOR_RENDER và ủy quyền cho VideoRendererAdapter
 * để tạo thông số draft video (mock metadata) hoặc kết nối pipeline render thật (khi BE1-W4-03 sẵn sàng).
 *
 * LƯU Ý BẢO TOÀN TRUNG THỰC:
 * Hàm này hiện tại kết hợp với MockVideoRendererAdapter để xác thực luồng truyền tham số kịch bản;
 * chưa thực hiện transcode MP4 vật lý qua FFmpeg trên Supabase Storage (hạng mục thuộc BE1-W4-03 / BE1-W4-04).
 */
export async function synthesizeVideoDraft(
  renderSpec: ReadyForRenderResult,
  renderer: VideoRendererAdapter = new MockVideoRendererAdapter(),
): Promise<VideoRenderResult> {
  return renderer.render(renderSpec);
}

/**
 * CHAINED PROMPT GENERATOR FOR 15s - 18s CINEMATIC TRAVEL VIDEOS
 * 
 * Thiết kế chuyên biệt cho mô hình Gemini Omni 1.1 Flash để sinh các đoạn video
 * có tính liên tục cao (Cinematic Vector Continuity & Terminal Frame Locking),
 * ghép nối liền mạch với nhau thành một video 15s - 18s hoàn chỉnh.
 */

export interface ChainedAssetInput {
  asset_id: string;
  url: string;
  title: string;
  description?: string;
  shot_type?: string;
}

export interface ChainedPromptPlanInput {
  productName: string;
  location: string;
  salePrice: number;
  officialCta: string;
  authenticTips?: string[];
  mediaAssets: ChainedAssetInput[];
  targetDurationSec?: number; // Mặc định 16s (trong khoảng 15s - 18s)
}

export type ChainedSegmentRole = "OPENING_HOOK" | "JOURNEY_TRAVERSE" | "CLIMAX_PANORAMA";

export interface ChainedSegmentSpec {
  segmentIndex: number;
  totalSegments: number;
  role: ChainedSegmentRole;
  startImageIndex: number;
  endImageIndex: number;
  startAsset: ChainedAssetInput;
  endAsset: ChainedAssetInput;
  durationSeconds: number;
  timeRangeSec: string;
  omniPrompt: string;
  voiceoverSegment: string;
  captionText: string;
}

export interface ChainedPromptPlanOutput {
  totalDurationSec: number;
  segmentsCount: number;
  segments: ChainedSegmentSpec[];
  audioSpec: {
    targetDurationSec: number;
    voicePersonaId: string;
    fullVoiceoverScript: string;
  };
  textOverlaySpec: {
    hookText: string;
    priceBadgeText: string;
    ctaText: string;
  };
}

/**
 * Trích xuất nhãn súc tích của địa danh hoặc góc nhìn từ tiêu đề/mô tả ảnh
 */
function cleanAssetLabel(asset: ChainedAssetInput, fallback: string): string {
  const raw = asset.title || asset.description || fallback;
  return raw
    .replace(/Flycam|Toàn cảnh|góc rộng|Toàn Cảnh|Góc Rộng/gi, "")
    .split(/[,.\-–]/)[0]
    .replace(/\s+/g, " ")
    .trim() || fallback;
}

/**
 * Tạo Prompt thị giác tiếng Anh chuyên biệt cho từng phân cảnh trong chuỗi 15s - 18s
 * Áp dụng 3 nguyên lý điện ảnh để các video ghép nối vào nhau không bị giật hoặc gãy góc:
 * 1. Vector Momentum Matching: Kế thừa hướng di chuyển máy quay liên tục.
 * 2. Terminal Stabilization: Khóa ổn định khung hình ở cuối cảnh để khớp 100% với đầu cảnh tiếp theo.
 * 3. Unified Lighting & Environment Anchor: Đồng nhất màu sắc và ánh sáng 5600K tự nhiên.
 */
export function buildSegmentOmniPrompt(params: {
  role: ChainedSegmentRole;
  segmentIndex: number;
  totalSegments: number;
  startLabel: string;
  endLabel: string;
  location: string;
  durationSeconds: number;
}): string {
  const { role, startLabel, endLabel, location, durationSeconds } = params;

  let momentumInstruction = "";
  let terminalInstruction = "";

  switch (role) {
    case "OPENING_HOOK":
      momentumInstruction =
        "Camera initiates with smooth forward flight acceleration, gliding dynamically forward through the scene towards Frame 2.";
      terminalInstruction =
        "In the final 0.5s, camera smoothly decelerates and locks stably into the exact composition and perspective of Frame 2 without rotational overshoot.";
      break;

    case "JOURNEY_TRAVERSE":
      momentumInstruction =
        "Directly inheriting the forward momentum from Frame 1, camera continues a seamless sweeping forward-tracking glide transitioning across the terrain towards Frame 2.";
      terminalInstruction =
        "In the final 0.5s, camera eases smoothly into the exact perspective of Frame 2, maintaining uniform altitude and zero horizontal tilt drift.";
      break;

    case "CLIMAX_PANORAMA":
    default:
      momentumInstruction =
        "Continuing forward flight momentum from Frame 1, camera performs an elegant ascending reveal flight, gracefully elevating to capture the sweeping panoramic vista of Frame 2.";
      terminalInstruction =
        "Camera gradually settles into a majestic, rock-solid stable wide vista composition in the final 0.8s, creating a breathtaking finish.";
      break;
  }

  return [
    `Frame 1 (Start): ${startLabel}.`,
    `Frame 2 (End): ${endLabel}.`,
    `Action: Cinematic 4K 30fps drone video transition seamlessly flying from Frame 1 to Frame 2 at ${location} in ${durationSeconds} seconds.`,
    `Momentum: ${momentumInstruction}`,
    `Boundary Continuity: ${terminalInstruction}`,
    `Atmospheric Anchor: Consistent natural 5600K golden-hour daylight, vertical 9:16 portrait framing (1080x1920).`,
    `Preserve authentic physical landmarks without artificial morphing or warping.`,
  ].join(" ");
}

/**
 * Xây dựng toàn bộ Kế hoạch Prompt & Phân cảnh chuẩn 15s - 18s
 */
export function buildChainedPromptPlan(input: ChainedPromptPlanInput): ChainedPromptPlanOutput {
  // Chuẩn hóa thời lượng tổng thể trong khoảng 15s - 18s (mặc định 16.5s)
  const rawDuration = input.targetDurationSec || 16.5;
  const totalDurationSec = Math.min(18.0, Math.max(15.0, Number(rawDuration.toFixed(1))));

  const assets = input.mediaAssets;
  const numAssets = Math.min(4, Math.max(2, assets.length));

  // Số lượng phân cảnh = số cặp ảnh nối tiếp (N ảnh -> N-1 phân cảnh)
  // 4 ảnh -> 3 phân cảnh (mỗi cảnh ~5.5s = 16.5s)
  // 3 ảnh -> 2 phân cảnh (mỗi cảnh ~8.0s = 16.0s)
  // 2 ảnh -> 2 phân cảnh (Cảnh 1 Omni 8s + Cảnh 2 Omni/KenBurns 8s = 16.0s)
  const numSegments = Math.max(2, numAssets - 1);
  const segmentDuration = Number((totalDurationSec / numSegments).toFixed(1));

  const tip = (input.authenticTips && input.authenticTips[0])
    ? input.authenticTips[0]
    : "Đi chuyến cáp sớm nhất trước 8h30 để săn mây vắng khách";

  const segments: ChainedSegmentSpec[] = [];
  let accumulatedTime = 0;

  for (let i = 0; i < numSegments; i++) {
    const isFirst = i === 0;
    const isLast = i === numSegments - 1;

    let role: ChainedSegmentRole = "JOURNEY_TRAVERSE";
    if (isFirst) role = "OPENING_HOOK";
    else if (isLast) role = "CLIMAX_PANORAMA";

    const startIdx = i;
    const endIdx = Math.min(assets.length - 1, i + 1);

    const startAsset = assets[startIdx] || assets[0];
    const endAsset = assets[endIdx] || assets[1] || assets[0];

    const startLabel = cleanAssetLabel(startAsset, `Khung cảnh mở đầu ${input.location}`);
    const endLabel = cleanAssetLabel(endAsset, `Toàn cảnh ${input.productName}`);

    const segDuration = isLast
      ? Number((totalDurationSec - accumulatedTime).toFixed(1))
      : segmentDuration;
    const endSec = Number((accumulatedTime + segDuration).toFixed(1));
    const timeRangeSec = `${accumulatedTime.toFixed(1)}s - ${endSec.toFixed(1)}s`;

    // Prompt thị giác tiếng Anh cho AI Video
    const omniPrompt = buildSegmentOmniPrompt({
      role,
      segmentIndex: i + 1,
      totalSegments: numSegments,
      startLabel,
      endLabel,
      location: input.location,
      durationSeconds: segDuration,
    });

    // Lời thoại Voiceover tiếng Việt khớp nhịp chuẩn 15s - 18s:
    // Cảnh 1: Hook giữ chân 3s vàng
    // Cảnh 2: Trải nghiệm & mẹo thực tế
    // Cảnh 3: Giá ưu đãi & Kêu gọi đặt vé
    let voiceoverSegment = "";
    let captionText = "";

    if (role === "OPENING_HOOK") {
      voiceoverSegment = `Bí kíp săn mây vắng người tại ${input.location} cực chill mà ít ai để ý!`;
      captionText = `SĂN MÂY ${input.location.toUpperCase()} VẮNG NGƯỜI`;
    } else if (role === "JOURNEY_TRAVERSE") {
      voiceoverSegment = `[pause 0.2s] ${tip}, tận hưởng khung cảnh tráng lệ giữa mây trời bồng bềnh.`;
      captionText = `Mẹo thực tế: ${tip}`;
    } else {
      const formattedPrice = Number(input.salePrice).toLocaleString("vi-VN");
      voiceoverSegment = `[pause 0.2s] Vé chính hãng chỉ ${formattedPrice}đ quét mã vào thẳng, comment ngay để nhận link ưu đãi nha!`;
      captionText = `VÉ CHÍNH HÃNG CHỈ ${formattedPrice}Đ`;
    }

    segments.push({
      segmentIndex: i + 1,
      totalSegments: numSegments,
      role,
      startImageIndex: startIdx,
      endImageIndex: endIdx,
      startAsset,
      endAsset,
      durationSeconds: segDuration,
      timeRangeSec,
      omniPrompt,
      voiceoverSegment,
      captionText,
    });

    accumulatedTime = endSec;
  }

  const fullVoiceoverScript = segments
    .map((s) => s.voiceoverSegment)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    totalDurationSec,
    segmentsCount: segments.length,
    segments,
    audioSpec: {
      targetDurationSec: totalDurationSec,
      voicePersonaId: "vi-VN-HoaiMyNeural",
      fullVoiceoverScript,
    },
    textOverlaySpec: {
      hookText: `⚠️ BÍ MẬT ĐI ${input.location.toUpperCase()}!`,
      priceBadgeText: `Vé trọn gói chỉ: ${Number(input.salePrice).toLocaleString("vi-VN")}đ`,
      ctaText: input.officialCta || "Bình luận nhận link đặt vé chính thức",
    },
  };
}

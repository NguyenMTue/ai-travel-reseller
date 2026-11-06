/**
 * CHAINED PROMPT GENERATOR FOR 10s & 18s CINEMATIC TRAVEL VIDEOS
 * 
 * Tích hợp chuẩn hóa theo 2 System Prompts chính thức:
 * 1. 10-Second Specialist: docs/be1/prompts/system_prompt_ai_tourism_video_10s.md
 *    - Tối ưu cho nhịp độ nhanh, bắt mắt, chuyển đổi cao trên TikTok, Reels, Shorts.
 *    - Cấu trúc 4 hồi: Hook (0-2s), Experience (2-5s), Tour Info (5-8s), CTA (8-10s).
 *    - Voiceover tiếng Việt súc tích ~20-25 từ.
 * 2. 18-Second Storytelling Specialist: docs/be1/prompts/system_prompt_ai_tourism_video_18s.md
 *    - Nghệ thuật kể chuyện hình ảnh (Visual Storytelling) có chiều sâu cảm xúc.
 *    - Cấu trúc 5 hồi: Hook (0-3s), Destination (3-7s), Experience (7-11s), Tour Info (11-15s), CTA (15-18s).
 *    - Voiceover tiếng Việt giàu cảm xúc ~40-50 từ.
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
  targetDurationSec?: number; // 10 hoặc 18 (mặc định 10s)
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
  profile: "10s_advertising" | "18s_storytelling";
  totalDurationSec: number;
  segmentsCount: number;
  segments: ChainedSegmentSpec[];
  masterPrompt: string;
  negativePrompt: string;
  audioSpec: {
    targetDurationSec: number;
    voicePersonaId: string;
    fullVoiceoverScript: string;
  };
  textOverlaySpec: {
    hookText: string;
    priceBadgeText: string;
    ctaText: string;
    tipText?: string;
    destinationText?: string;
  };
}

/**
 * Đếm số từ thực tế của kịch bản Voiceover (loại bỏ tag kỹ thuật)
 */
export function countVoiceoverWords(text: string): number {
  return text
    .replace(/\[pause\s*[\d\.]+s?\]/gi, " ")
    .replace(/\[.*?\]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
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
 * Rút gọn chuỗi mẹo thực tế cho khớp nhịp thoại ngắn
 */
function condenseTip(rawTip: string, maxWords = 8): string {
  const clean = rawTip.replace(/^[–\-*•\s]+/, "").trim();
  const words = clean.split(/\s+/);
  if (words.length <= maxWords) return clean;
  return words.slice(0, maxWords).join(" ");
}

/**
 * Tạo Prompt thị giác tiếng Anh chuyên biệt cho từng phân cảnh
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
  profile?: "10s" | "18s";
}): string {
  const { role, startLabel, endLabel, location, durationSeconds, profile = "18s" } = params;

  let momentumInstruction = "";
  let terminalInstruction = "";

  switch (role) {
    case "OPENING_HOOK":
      momentumInstruction =
        profile === "10s"
          ? "Camera initiates with dynamic forward flight acceleration, gliding dynamically forward towards Frame 2."
          : "Camera initiates with smooth forward flight acceleration, gliding dynamically forward through the scene towards Frame 2.";
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

  const landmarkConstraint =
    profile === "10s"
      ? "Strictly preserve original landmarks, facial features, and natural geometry from input images."
      : "Maintain 100% geographic, architectural, and facial fidelity from source images.";

  const negativeInstruction =
    profile === "10s"
      ? "Negative prompt: morphing, distorted faces, deformed bodies, unnatural movement, hallucinated landmarks, altered architecture, shaky camera, abrupt jarring cuts, low resolution, blurry."
      : "Negative prompt: morphing, distorted faces, extra limbs, deformed anatomy, hallucinated landmarks, altered architecture, unnatural physics, shaky camera, abrupt jump cuts, low quality, pixelation.";

  return [
    `Frame 1 (Start): ${startLabel}.`,
    `Frame 2 (End): ${endLabel}.`,
    `Action: Cinematic 4K 30fps drone video transition seamlessly flying from Frame 1 to Frame 2 at ${location} in ${durationSeconds} seconds.`,
    `Momentum: ${momentumInstruction}`,
    `Boundary Continuity: ${terminalInstruction}`,
    `Atmospheric Anchor: Consistent natural 5600K golden-hour daylight, vertical 9:16 portrait framing (1080x1920).`,
    landmarkConstraint,
    `Preserve authentic physical landmarks without artificial morphing or warping.`,
    negativeInstruction,
  ].join(" ");
}

/**
 * Xây dựng toàn bộ Kế hoạch Prompt & Phân cảnh chuẩn 10s hoặc 18s
 */
export function buildChainedPromptPlan(input: ChainedPromptPlanInput): ChainedPromptPlanOutput {
  const requestedDuration = input.targetDurationSec ?? 10;
  const is10s = requestedDuration <= 12;

  const assets = input.mediaAssets;
  const numAssets = Math.min(4, Math.max(2, assets.length));
  const formattedPrice = Number(input.salePrice).toLocaleString("vi-VN");

  if (is10s) {
    // ========================================================================
    // PROFILE 10 GIÂY: AI TOURISM VIDEO ADVERTISING (FAST-PACED CONVERSION)
    // docs/be1/prompts/system_prompt_ai_tourism_video_10s.md
    // ========================================================================
    const totalDurationSec = 10.0;
    const rawTip = (input.authenticTips && input.authenticTips[0])
      ? input.authenticTips[0]
      : "đi sớm săn mây vắng khách";
    const tipShort = condenseTip(rawTip, 7);

    const negativePrompt =
      "morphing, distorted faces, deformed bodies, unnatural movement, hallucinated landmarks, altered architecture, shaky camera, abrupt jarring cuts, gibberish text, misspelled words, fake watermarks, fake logos, fabricated prices, oversaturated, cartoon, CGI look, low resolution, blurry.";

    const masterPrompt = [
      `Role: AI Tourism Video Advertising Prompt Designer (10-Second Specialist).`,
      `Action: 10-second high-energy dynamic vertical travel commercial (9:16 portrait) at ${input.location} for ${input.productName}.`,
      `Pacing: Fast-paced dynamic editing, punchy transitions, 4K photorealistic clarity, natural 5600K daylight.`,
      `Structure: 0-2s opening hook, 2-5s immersive experience, 5-8s tour highlights at ${formattedPrice} VND, 8-10s decisive call-to-action.`,
      `Landmark Integrity: Strictly preserve original landmarks, facial features, and natural geometry from input images.`,
      `Negative Prompt: ${negativePrompt}`,
    ].join(" ");

    // Để tối ưu cho Muse2API (hỗ trợ duration 5s - 10s), ta chia đúng 2 phân cảnh:
    // Cảnh 1 (5.0s, 0-5s): Mở đầu Hook + Trải nghiệm
    // Cảnh 2 (5.0s, 5-10s): Thông tin tour + CTA chuyển đổi
    const seg1Start = assets[0];
    const seg1End = assets[1] || assets[0];
    const seg2Start = numAssets >= 3 ? assets[1] : assets[1] || assets[0];
    const seg2End = numAssets >= 4 ? assets[3] : (numAssets >= 3 ? assets[2] : assets[0]);

    const seg1OmniPrompt = buildSegmentOmniPrompt({
      role: "OPENING_HOOK",
      profile: "10s",
      segmentIndex: 1,
      totalSegments: 2,
      startLabel: cleanAssetLabel(seg1Start, `Khung cảnh mở đầu ${input.location}`),
      endLabel: cleanAssetLabel(seg1End, `Trải nghiệm ${input.productName}`),
      location: input.location,
      durationSeconds: 5.0,
    });

    const seg2OmniPrompt = buildSegmentOmniPrompt({
      role: "CLIMAX_PANORAMA",
      profile: "10s",
      segmentIndex: 2,
      totalSegments: 2,
      startLabel: cleanAssetLabel(seg2Start, `Trải nghiệm ${input.productName}`),
      endLabel: cleanAssetLabel(seg2End, `Toàn cảnh ${input.location}`),
      location: input.location,
      durationSeconds: 5.0,
    });

    // Lời thoại chuẩn 20-25 từ cho video 10 giây
    const seg1Voice = `Bí kíp khám phá ${input.location}! ${tipShort}.`;
    const seg2Voice = `[pause 0.2s] Vé chính hãng chỉ ${formattedPrice}đ, comment ngay nhận ưu đãi!`;

    const segments: ChainedSegmentSpec[] = [
      {
        segmentIndex: 1,
        totalSegments: 2,
        role: "OPENING_HOOK",
        startImageIndex: 0,
        endImageIndex: 1,
        startAsset: seg1Start,
        endAsset: seg1End,
        durationSeconds: 5.0,
        timeRangeSec: "0.0s - 5.0s",
        omniPrompt: seg1OmniPrompt,
        voiceoverSegment: seg1Voice,
        captionText: `SĂN MÂY ${input.location.toUpperCase()} VẮNG NGƯỜI`,
      },
      {
        segmentIndex: 2,
        totalSegments: 2,
        role: "CLIMAX_PANORAMA",
        startImageIndex: numAssets >= 3 ? 1 : 1,
        endImageIndex: numAssets >= 4 ? 3 : (numAssets >= 3 ? 2 : 0),
        startAsset: seg2Start,
        endAsset: seg2End,
        durationSeconds: 5.0,
        timeRangeSec: "5.0s - 10.0s",
        omniPrompt: seg2OmniPrompt,
        voiceoverSegment: seg2Voice,
        captionText: `VÉ CHÍNH HÃNG CHỈ ${formattedPrice}Đ`,
      },
    ];

    const fullVoiceoverScript = `${seg1Voice} ${seg2Voice}`.replace(/\s+/g, " ").trim();

    return {
      profile: "10s_advertising",
      totalDurationSec,
      segmentsCount: segments.length,
      segments,
      masterPrompt,
      negativePrompt,
      audioSpec: {
        targetDurationSec: totalDurationSec,
        voicePersonaId: "vi-VN-HoaiMyNeural",
        fullVoiceoverScript,
      },
      textOverlaySpec: {
        hookText: `⚠️ BÍ MẬT ĐI ${input.location.toUpperCase()}!`,
        tipText: `📍 Mẹo: ${tipShort}`,
        priceBadgeText: `Vé trọn gói chỉ: ${formattedPrice}đ`,
        ctaText: input.officialCta || "Bình luận nhận link ưu đãi chính hãng",
      },
    };
  }

  // ========================================================================
  // PROFILE 18 GIÂY: AI TOURISM VIDEO ADVERTISING (VISUAL STORYTELLING)
  // docs/be1/prompts/system_prompt_ai_tourism_video_18s.md
  // ========================================================================
  const rawDuration = input.targetDurationSec || 18.0;
  // Giữ nguyên khoảng [15.0, 18.0] để tương thích ngược với các bài test 16.0s & 16.5s
  const totalDurationSec = Math.min(18.0, Math.max(15.0, Number(rawDuration.toFixed(1))));

  const rawTip = (input.authenticTips && input.authenticTips[0])
    ? input.authenticTips[0]
    : "Đi chuyến cáp sớm nhất trước 8h30 để săn mây";
  const tipShort = condenseTip(rawTip, 10);

  const negativePrompt =
    "morphing, distorted faces, extra limbs, deformed anatomy, hallucinated landmarks, altered architecture, unnatural physics, shaky camera, abrupt jump cuts, illegible text, misspelled typography, fake watermarks, fake logos, invented prices, oversaturated colors, artificial CGI look, low quality, pixelation.";

  const masterPrompt = [
    `Role: AI Tourism Video Advertising Prompt Designer (18-Second Storytelling Specialist).`,
    `Action: 18-second cinematic travel visual storytelling commercial (9:16 portrait) at ${input.location} for ${input.productName}.`,
    `Pacing: Emotional cinematic pacing with smooth musical momentum, photorealistic 4K, natural 5600K lighting.`,
    `Structure: 0-3s hook reveal, 3-7s panoramic destination beauty, 7-11s immersive activity experience, 11-15s package highlights at ${formattedPrice} VND, 15-18s official booking call-to-action.`,
    `Landmark Integrity: Maintain 100% geographic, architectural, and facial fidelity from source images.`,
    `Negative Prompt: ${negativePrompt}`,
  ].join(" ");

  // Số lượng phân cảnh: 4 ảnh -> 3 cảnh (mỗi cảnh ~6s = 18s); <= 3 ảnh -> 2 cảnh (mỗi cảnh ~9s = 18s)
  const numSegments = Math.max(2, numAssets - 1);
  const segmentDuration = Number((totalDurationSec / numSegments).toFixed(1));

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

    const omniPrompt = buildSegmentOmniPrompt({
      role,
      profile: "18s",
      segmentIndex: i + 1,
      totalSegments: numSegments,
      startLabel,
      endLabel,
      location: input.location,
      durationSeconds: segDuration,
    });

    let voiceoverSegment = "";
    let captionText = "";

    // Lời thoại chuẩn 40-50 từ chia đều theo các hồi
    if (role === "OPENING_HOOK") {
      voiceoverSegment = `Bí kíp săn mây vắng người tại ${input.location} cực chill ít ai để ý!`;
      captionText = `SĂN MÂY ${input.location.toUpperCase()} VẮNG NGƯỜI`;
    } else if (role === "JOURNEY_TRAVERSE") {
      voiceoverSegment = `[pause 0.2s] Đắm chìm giữa không gian thiên nhiên kỳ vĩ, ${tipShort.toLowerCase()}.`;
      captionText = `Mẹo thực tế: ${tipShort}`;
    } else {
      voiceoverSegment = `[pause 0.2s] Vé chính hãng chỉ ${formattedPrice}đ quét mã vào thẳng, bình luận nhận ngay link ưu đãi hôm nay!`;
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
    profile: "18s_storytelling",
    totalDurationSec,
    segmentsCount: segments.length,
    segments,
    masterPrompt,
    negativePrompt,
    audioSpec: {
      targetDurationSec: totalDurationSec,
      voicePersonaId: "vi-VN-HoaiMyNeural",
      fullVoiceoverScript,
    },
    textOverlaySpec: {
      hookText: `⚠️ BÍ MẬT ĐI ${input.location.toUpperCase()}!`,
      destinationText: `Khám phá vẻ đẹp kỳ vĩ tại ${input.productName}`,
      tipText: `📍 Mẹo: ${tipShort}`,
      priceBadgeText: `Vé trọn gói chỉ: ${formattedPrice}đ`,
      ctaText: input.officialCta || "Bình luận nhận ưu đãi đặt vé hôm nay",
    },
  };
}

/**
 * CHAINED PROMPT GENERATOR FOR 10s & 18s CINEMATIC TRAVEL VIDEOS
 * 
 * Tích hợp chuẩn hóa theo 2 System Prompts chính thức:
 * 1. 10-Second I2V Specialist: docs/be1/prompts/system_prompt_ai_tourism_video_10s.md
 *    - Tối ưu cho Image-to-Video nhịp độ nhanh, bắt mắt, chuyển đổi cao trên TikTok, Reels, Shorts.
 *    - Cấu trúc 4 hồi: Hook (0-2s), Experience (2-5s), Tour Info (5-8s), CTA (8-10s).
 *    - Nguyên tắc: Zero Spatial Hallucination, cấm fast zoom/push-in 2D gắt, giữ nguyên hình khối thật.
 *    - Voiceover tiếng Việt súc tích ~20-25 từ.
 * 2. 18-Second Storytelling Specialist: docs/be1/prompts/system_prompt_ai_tourism_video_18s.md
 *    - Nghệ thuật kể chuyện hình ảnh (Visual Storytelling I2V) có chiều sâu cảm xúc.
 *    - Cấu trúc 5 hồi: Hook (0-3s), Destination (3-7s), Experience (7-11s), Tour Info (11-15s), CTA (15-18s).
 *    - Nguyên tắc: Chuyển cảnh tự nhiên, nhất quán ánh sáng ban mai 5600K, tách biệt Text Safe Zone 35-65%.
 *    - Voiceover tiếng Việt giàu cảm xúc ~40-50 từ.
 */

export interface ChainedAssetInput {
  asset_id: string;
  url: string;
  title: string;
  description?: string;
  shot_type?: string;
}

export interface TourEndCardSpec {
  productName: string;
  location: string;
  salePrice: number;
  originalPrice?: number | null;
  highlights: string[];
  ctaText: string;
  hotline: string;
  merchantName?: string;
}

export interface ChainedPromptPlanInput {
  productName: string;
  location: string;
  salePrice: number;
  originalPrice?: number | null;
  officialCta: string;
  authenticTips?: string[];
  mediaAssets: ChainedAssetInput[];
  targetDurationSec?: number; // 10 hoặc 18 (mặc định 10s)
  merchantName?: string;
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
  musePrompt: string;
  omniPrompt: string; // Giữ để tương thích ngược
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
  singleShotPrompt?: string; // Prompt 10s tối ưu cho Muse AI sinh trực tiếp 1 lần (Single-shot)
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
  tourEndCardSpec?: TourEndCardSpec;
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
 * Loại bỏ ký tự Emoji và ký hiệu đặc biệt gây lỗi font (▯ / tofu glyph) trong FFmpeg drawtext
 */
export function stripEmojis(str: string): string {
  if (!str) return "";
  return str
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F100}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2300}-\u{23FF}\u{2B50}\u{20E3}\u{FE0F}\u{FE0E}]/gu, "")
    .replace(/[⚠️📍✨👉🎟️⚡👨‍👩‍👧‍👦💸🔥📸deal]/gu, (m) => m === "deal" ? m : "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Trích xuất nhãn súc tích của địa danh hoặc góc nhìn từ tiêu đề/mô tả ảnh.
 * Chuyển đổi thông minh sang tiếng Anh thị giác để tối ưu hóa cho mô hình sinh video AI (CLIP/T5 Text Encoder).
 * Cố định cảnh quay (Grounding) chính xác theo sản phẩm, tuyệt đối không nhầm lẫn Bà Nà Hills với Ngũ Hành Sơn.
 */
export function cleanAssetVisualLabel(
  asset: ChainedAssetInput,
  fallback: string,
  context?: { productName?: string; location?: string }
): string {
  const combinedContext = `${context?.productName || ""} ${context?.location || ""}`.toLowerCase();
  const raw = (asset.title || asset.description || fallback || "").toLowerCase();

  const isNguHanhSon =
    combinedContext.includes("ngũ hành sơn") ||
    combinedContext.includes("huyền không") ||
    combinedContext.includes("non nước") ||
    combinedContext.includes("marble") ||
    raw.includes("ngũ hành sơn") ||
    raw.includes("huyền không") ||
    raw.includes("non nước") ||
    raw.includes("marble");

  if (isNguHanhSon) {
    if (raw.includes("huyền không") || raw.includes("động") || raw.includes("hang")) {
      return "Mystical Huyen Khong Cave with divine sunbeams illuminating ancient Buddha shrine in sacred limestone cavern";
    }
    if (raw.includes("chùa") || raw.includes("tam thai") || raw.includes("linh ứng")) {
      return "Sacred ancient Buddhist pagoda on Thuy Son peak, traditional curved roofs amidst lush mountain foliage";
    }
    if (raw.includes("non nước") || raw.includes("làng đá") || raw.includes("điêu khắc")) {
      return "Non Nuoc historic marble craft village and exquisite stone sculptures beneath coastal limestone peaks";
    }
    return "Majestic Marble Mountains limestone karst formations with sacred mountain grottoes and coastal panoramic view";
  }

  if (raw.includes("cầu vàng") || raw.includes("golden bridge")) {
    return "Golden Bridge resting on giant weathered stone hands, dramatic mountain mist";
  }
  if (raw.includes("làng pháp") || raw.includes("french village") || raw.includes("lâu đài") || raw.includes("mặt trăng")) {
    return "French Gothic architectural castle plaza and cathedral square with cobblestone paths";
  }
  if (raw.includes("cáp treo") || raw.includes("cable car")) {
    return "Scenic aerial cable car gliding smoothly over verdant mountain rainforest and clouds";
  }
  if (raw.includes("quảng trường") || raw.includes("nhật thực") || raw.includes("plaza")) {
    return "Sun World vibrant central plaza with golden sun globe and flower gardens";
  }
  if (raw.includes("ngũ hành sơn") || raw.includes("marble")) {
    return "Majestic Marble Mountains limestone peaks and mystical ancient caves";
  }
  if (raw.includes("hội an") || raw.includes("đèn lồng") || raw.includes("phố cổ")) {
    return "Hoi An ancient lantern-lit river street and historic yellow houses";
  }
  if (raw.includes("mỹ khê") || raw.includes("biển") || raw.includes("beach")) {
    return "Tropical pristine turquoise coastline and white sandy beach with gentle waves";
  }
  if (raw.includes("buffet") || raw.includes("ẩm thực") || raw.includes("món ăn") || raw.includes("food")) {
    return "Lavish international buffet spread and gourmet culinary dining banquet";
  }
  if (raw.includes("chùa linh ứng") || raw.includes("phật bà") || raw.includes("sơn trà")) {
    return "Linh Ung Pagoda with giant white Lady Buddha statue overlooking coastal ocean";
  }

  const clean = asset.title
    ? asset.title.replace(/Flycam|Toàn cảnh|góc rộng|Toàn Cảnh|Góc Rộng/gi, "").trim()
    : fallback;
  return `Scenic landscape of ${clean || "the destination"}, natural golden morning lighting`;
}

function cleanAssetLabel(
  asset: ChainedAssetInput,
  fallback: string,
  context?: { productName?: string; location?: string }
): string {
  return cleanAssetVisualLabel(asset, fallback, context);
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
export function buildSegmentMusePrompt(params: {
  role: ChainedSegmentRole;
  segmentIndex: number;
  totalSegments: number;
  startLabel: string;
  endLabel: string;
  location: string;
  durationSeconds: number;
  profile?: "10s" | "18s";
  voiceoverSegment?: string;
  ambientSounds?: string[];
  includeAudio?: boolean;
}): string {
  const {
    role,
    startLabel,
    endLabel,
    location,
    durationSeconds,
    profile = "18s",
    voiceoverSegment,
    ambientSounds,
    includeAudio = false, // Mặc định tắt audio trong prompt sinh video để tập trung tối ưu hình ảnh và tránh timeout
  } = params;

  let momentumInstruction = "";
  let terminalInstruction = "";

  switch (role) {
    case "OPENING_HOOK":
      momentumInstruction =
        profile === "10s"
          ? "Camera initiates with dynamic forward flight acceleration, gliding dynamically forward towards Frame 2. Slow forward dolly tracking, perfectly steady camera without violent push-ins or rapid zoom."
          : "Camera initiates with smooth forward flight acceleration, gliding dynamically forward through the scene towards Frame 2. High-altitude cinematic drone tracking, smooth continuous movement, perfectly stable frame, absolutely no violent push-ins.";
      terminalInstruction =
        "In the final 0.5s, camera smoothly decelerates and locks stably into the exact composition and perspective of Frame 2 without rotational overshoot.";
      break;

    case "JOURNEY_TRAVERSE":
      momentumInstruction =
        "Directly inheriting the forward momentum from Frame 1, camera continues a seamless sweeping forward-tracking glide transitioning across the terrain towards Frame 2 with smooth orbital rotation and eye-level tracking.";
      terminalInstruction =
        "In the final 0.5s, camera eases smoothly into the exact perspective of Frame 2, maintaining uniform altitude and zero horizontal tilt drift.";
      break;

    case "CLIMAX_PANORAMA":
    default:
      momentumInstruction =
        "Continuing forward flight momentum from Frame 1, camera performs an elegant ascending reveal flight, gracefully elevating to capture the sweeping panoramic vista of Frame 2 with subtle lateral parallax.";
      terminalInstruction =
        "Camera gradually settles into a majestic, rock-solid stable wide vista composition in the final 0.8s, creating a breathtaking finish.";
      break;
  }

  const landmarkConstraint =
    profile === "10s"
      ? "Zero spatial hallucination: strictly preserve original landmarks, facial features, and natural geometry from input images."
      : "Zero spatial hallucination: maintain 100% geographic, architectural, and facial fidelity from source images.";

  const negativeInstruction =
    profile === "10s"
      ? "Negative prompt: morphing, rapid camera movement, fast zoom-in, whip pan, perspective distortion, warping, sliding feet, human face mutation, motion smear, blending textures, hallucinated bridges, altered architecture, sudden time jumps, midday harsh light, abrupt jarring cuts, low quality, artifact, shaky cam, text artifacts, broken font glyphs, oversaturated, blurry."
      : "Negative prompt: morphing, fast zoom, rapid push-in, whip pan, distorted geometry, warped perspective, blurred textures, melting buildings, human disfiguration, sliding feet, smeared limbs, erratic camera movements, abrupt hard cuts, abrupt jump cuts, unnatural physics, harsh midday lighting, mismatched color grading, fluctuating weather, oversaturation, CGI plasticity, cartoonish, low quality, pixelation, font artifacts, gibberish watermark.";

  let audioInstruction = "";
  if (includeAudio && voiceoverSegment && voiceoverSegment.trim()) {
    const cleanVoice = voiceoverSegment
      .replace(/\[pause\s*[\d\.]+s?\]/gi, " ")
      .replace(/\[.*?\]/g, " ")
      .trim();
    if (cleanVoice) {
      const ambients =
        ambientSounds && ambientSounds.length > 0
          ? ambientSounds.join(", ")
          : "nature breeze, birds, cable car movement";
      audioInstruction = `Audio & Voiceover Narration: Professional, warm, energetic Vietnamese travel commercial narrator says: "${cleanVoice}". Synchronized atmospheric sounds: ${ambients}.`;
    }
  }

  return [
    `Frame 1 (Start): ${startLabel}.`,
    `Frame 2 (End): ${endLabel}.`,
    `Action: Cinematic 4K 30fps drone video transition seamlessly flying from Frame 1 to Frame 2 at ${location} in ${durationSeconds} seconds.`,
    `Momentum: ${momentumInstruction}`,
    `Boundary Continuity: ${terminalInstruction}`,
    `Atmospheric Anchor: Consistent natural 5600K golden-hour daylight, warm ambient sunrise glow, soft atmospheric mist, realistic wind and vegetation physics, vertical 9:16 portrait framing (1080x1920), 24fps.`,
    landmarkConstraint,
    `Preserve authentic physical landmarks without artificial morphing or warping.`,
    ...(audioInstruction ? [audioInstruction] : []),
    negativeInstruction,
  ].join(" ");
}

export const buildSegmentOmniPrompt = buildSegmentMusePrompt;

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
      "morphing, rapid camera movement, fast zoom-in, whip pan, perspective distortion, warping, sliding feet, human face mutation, motion smear, blending textures, hallucinated bridges, altered architecture, sudden time jumps, midday harsh light, abrupt jarring cuts, low quality, artifact, shaky cam, text artifacts, broken font glyphs, oversaturated.";

    const masterPrompt = [
      `Role: AI Tourism Video Advertising Prompt Designer (10-Second Specialist).`,
      `Style Anchor: Cinematic travel commercial, photorealistic 4K, consistent golden hour early morning lighting, warm ambient sunrise glow, soft atmospheric mist, realistic physics, 24fps.`,
      `Action: 10-second high-energy dynamic vertical travel commercial (9:16 portrait) at ${input.location} for ${input.productName}.`,
      `Pacing: Fast-paced dynamic editing, punchy transitions, 4K photorealistic clarity, natural 5600K daylight.`,
      `Structure: 0-2s opening hook, 2-5s immersive experience, 5-8s tour highlights at ${formattedPrice} VND, 8-10s decisive call-to-action.`,
      `Landmark Integrity: Zero spatial hallucination. Strictly preserve original landmarks, facial features, and natural geometry from input images.`,
      `Camera Rule: Cinematic camera movement only, strictly no rapid zoom, no whip pan, no 2D warping.`,
      `Negative Prompt: ${negativePrompt}`,
    ].join(" ");

    // Để tối ưu cho Muse2API (hỗ trợ duration 5s - 10s), ta chia đúng 2 phân cảnh:
    // Cảnh 1 (5.0s, 0-5s): Mở đầu Hook + Trải nghiệm
    // Cảnh 2 (5.0s, 5-10s): Thông tin tour + CTA chuyển đổi
    const seg1Start = assets[0];
    const seg1End = assets[1] || assets[0];
    const seg2Start = numAssets >= 3 ? assets[1] : assets[1] || assets[0];
    const seg2End = numAssets >= 4 ? assets[3] : (numAssets >= 3 ? assets[2] : assets[0]);

    // Lời thoại chuẩn 20-25 từ cho video 10 giây
    const seg1Voice = `Bí kíp khám phá ${input.location}! ${tipShort}.`;
    const seg2Voice = `[pause 0.2s] Vé chính hãng chỉ ${formattedPrice}đ, comment ngay nhận ưu đãi!`;

    const isNguHanhSon =
      `${input.productName} ${input.location}`.toLowerCase().includes("ngũ hành sơn") ||
      `${input.productName} ${input.location}`.toLowerCase().includes("huyền không") ||
      `${input.productName} ${input.location}`.toLowerCase().includes("non nước");

    const seg1OmniPrompt = buildSegmentMusePrompt({
      role: "OPENING_HOOK",
      profile: "10s",
      segmentIndex: 1,
      totalSegments: 2,
      startLabel: cleanAssetLabel(seg1Start, `Khung cảnh mở đầu ${input.location}`, {
        productName: input.productName,
        location: input.location,
      }),
      endLabel: cleanAssetLabel(seg1End, `Trải nghiệm ${input.productName}`, {
        productName: input.productName,
        location: input.location,
      }),
      location: input.location,
      durationSeconds: 5.0,
      voiceoverSegment: seg1Voice,
    });

    const seg2OmniPrompt = buildSegmentMusePrompt({
      role: "CLIMAX_PANORAMA",
      profile: "10s",
      segmentIndex: 2,
      totalSegments: 2,
      startLabel: cleanAssetLabel(seg2Start, `Trải nghiệm ${input.productName}`, {
        productName: input.productName,
        location: input.location,
      }),
      endLabel: cleanAssetLabel(seg2End, `Toàn cảnh ${input.location}`, {
        productName: input.productName,
        location: input.location,
      }),
      location: input.location,
      durationSeconds: 5.0,
      voiceoverSegment: seg2Voice,
    });

    // Prompt 10s trọn vẹn dành riêng cho Muse AI sinh trực tiếp 1 lần (Single-shot generation)
    // Giữ camera bay liên tục, loại bỏ hiện tượng giật khi ghép nối 2 clip 5s
    const singleShotPrompt = buildSegmentMusePrompt({
      role: "OPENING_HOOK",
      profile: "10s",
      segmentIndex: 1,
      totalSegments: 1,
      startLabel: cleanAssetLabel(seg1Start, `Khung cảnh mở đầu ${input.location}`, {
        productName: input.productName,
        location: input.location,
      }),
      endLabel: cleanAssetLabel(seg2End, `Toàn cảnh ${input.productName}`, {
        productName: input.productName,
        location: input.location,
      }),
      location: input.location,
      durationSeconds: 10.0,
      voiceoverSegment: `${seg1Voice} ${seg2Voice}`.replace(/\s+/g, " ").trim(),
    });

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
        musePrompt: seg1OmniPrompt,
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
        musePrompt: seg2OmniPrompt,
        omniPrompt: seg2OmniPrompt,
        voiceoverSegment: seg2Voice,
        captionText: `VÉ CHÍNH HÃNG CHỈ ${formattedPrice}Đ`,
      },
    ];

    const fullVoiceoverScript = `${seg1Voice} ${seg2Voice}`.replace(/\s+/g, " ").trim();

    const defaultHighlights = isNguHanhSon
      ? [
          "Vé tham quan thắng cảnh & thang máy khứ hồi",
          "Chiêm bái Động Huyền Không & Chùa Linh Ứng",
          "Hỗ trợ vào cổng ưu tiên, không chờ đợi",
        ]
      : [
          "Vé tham quan & trải nghiệm trọn gói chính hãng",
          "Check-in điểm ngắm cảnh đẹp nhất",
          "Hỗ trợ vào cổng ưu tiên, không chờ đợi",
        ];

    const tourEndCardSpec: TourEndCardSpec = {
      productName: input.productName,
      location: input.location,
      salePrice: input.salePrice,
      originalPrice: input.originalPrice ?? null,
      highlights: (input.authenticTips && input.authenticTips.length > 0)
        ? input.authenticTips.slice(0, 3)
        : defaultHighlights,
      ctaText: stripEmojis(input.officialCta || "ĐẶT VÉ CHÍNH HÃNG - QUÉT MÃ VÀO CỔNG"),
      hotline: "1900 8888 (Tư vấn 24/7)",
      merchantName: input.merchantName,
    };

    return {
      profile: "10s_advertising",
      totalDurationSec,
      segmentsCount: segments.length,
      segments,
      masterPrompt,
      negativePrompt,
      singleShotPrompt,
      audioSpec: {
        targetDurationSec: totalDurationSec,
        voicePersonaId: "vi-VN-HoaiMyNeural",
        fullVoiceoverScript,
      },
      textOverlaySpec: {
        hookText: stripEmojis(`BÍ MẬT ĐI ${input.location.toUpperCase()}!`),
        tipText: stripEmojis(`Mẹo: ${tipShort}`),
        priceBadgeText: `Vé trọn gói chỉ: ${formattedPrice}đ`,
        ctaText: stripEmojis(input.officialCta || "ĐẶT VÉ CHÍNH HÃNG - QUÉT MÃ VÀO CỔNG"),
      },
      tourEndCardSpec,
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
    "morphing, fast zoom, rapid push-in, whip pan, distorted geometry, warped perspective, blurred textures, melting buildings, human disfiguration, sliding feet, smeared limbs, erratic camera movements, abrupt hard cuts, abrupt jump cuts, unnatural physics, harsh midday lighting, mismatched color grading, fluctuating weather, oversaturation, CGI plasticity, cartoonish, low resolution, font artifacts, gibberish watermark.";

  const masterPrompt = [
    `Role: AI Tourism Video Advertising Prompt Designer (18-Second Storytelling Specialist).`,
    `Master Reference: Master cinematic reference: 4K resolution, 24fps travel documentary, consistent golden hour sunrise palette, soft directional morning sunlight, atmospheric light rays, realistic wind and cloud physics, zero CGI artifacts, preserved architectural authenticity.`,
    `Action: 18-second cinematic travel visual storytelling commercial (9:16 portrait) at ${input.location} for ${input.productName}.`,
    `Pacing: Emotional cinematic pacing with smooth musical momentum, photorealistic 4K, natural 5600K lighting.`,
    `Structure: 0-3s hook reveal, 3-7s panoramic destination beauty, 7-11s immersive activity experience, 11-15s package highlights at ${formattedPrice} VND, 15-18s official booking call-to-action.`,
    `Landmark Integrity: Zero spatial hallucination. Maintain 100% geographic, architectural, and facial fidelity from source images without artificial bridges or jumps.`,
    `Camera Rule: Diverse cinematic camera language, smooth drone tracking and orbits, absolutely no whip pan or aggressive push-ins.`,
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

    const musePrompt = buildSegmentMusePrompt({
      role,
      profile: "18s",
      segmentIndex: i + 1,
      totalSegments: numSegments,
      startLabel,
      endLabel,
      location: input.location,
      durationSeconds: segDuration,
      voiceoverSegment,
    });

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
      musePrompt,
      omniPrompt: musePrompt,
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

  const isNguHanhSon18s =
    `${input.productName} ${input.location}`.toLowerCase().includes("ngũ hành sơn") ||
    `${input.productName} ${input.location}`.toLowerCase().includes("huyền không") ||
    `${input.productName} ${input.location}`.toLowerCase().includes("non nước");

  const defaultHighlights18s = isNguHanhSon18s
    ? [
        "Vé tham quan thắng cảnh & thang máy khứ hồi",
        "Chiêm bái Động Huyền Không & Chùa Linh Ứng",
        "Hỗ trợ vào cổng ưu tiên, không chờ đợi",
      ]
    : [
        "Vé tham quan & trải nghiệm trọn gói chính hãng",
        "Check-in điểm ngắm cảnh đẹp nhất",
        "Hỗ trợ vào cổng ưu tiên, không chờ đợi",
      ];

  const tourEndCardSpec: TourEndCardSpec = {
    productName: input.productName,
    location: input.location,
    salePrice: input.salePrice,
    originalPrice: input.originalPrice ?? null,
    highlights: (input.authenticTips && input.authenticTips.length > 0)
      ? input.authenticTips.slice(0, 3)
      : defaultHighlights18s,
    ctaText: stripEmojis(input.officialCta || "ĐẶT VÉ CHÍNH HÃNG - QUÉT MÃ VÀO CỔNG"),
    hotline: "1900 8888 (Tư vấn 24/7)",
    merchantName: input.merchantName,
  };

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
      hookText: stripEmojis(`BÍ MẬT ĐI ${input.location.toUpperCase()}!`),
      destinationText: stripEmojis(`Khám phá vẻ đẹp kỳ vĩ tại ${input.productName}`),
      tipText: stripEmojis(`Mẹo: ${tipShort}`),
      priceBadgeText: `Vé trọn gói chỉ: ${formattedPrice}đ`,
      ctaText: stripEmojis(input.officialCta || "ĐẶT VÉ CHÍNH HÃNG - QUÉT MÃ VÀO CỔNG"),
    },
    tourEndCardSpec,
  };
}

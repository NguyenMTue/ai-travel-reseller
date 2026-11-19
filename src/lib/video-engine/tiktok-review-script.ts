import { z } from "zod";

/**
 * TikTok Review Script Schema (BE2 Week 6)
 * Upgraded from 15s static-image format to 40-50s dynamic review with 4 scenes:
 * 1. Hook: 5.0 - 7.0s
 * 2. Experience: 16.0 - 22.0s
 * 3. Pricing: 10.0 - 14.0s
 * 4. CTA: 8.0 - 11.0s
 * Total Duration: 40.0 - 50.0s
 */

export const TIKTOK_REVIEW_ROLES = ["hook", "experience", "pricing", "cta"] as const;
export type TikTokReviewRole = (typeof TIKTOK_REVIEW_ROLES)[number];

export const tiktokReviewSceneSchema = z.object({
  sceneNumber: z.number().int().min(1).max(4),
  role: z.enum(TIKTOK_REVIEW_ROLES),
  duration: z.number().min(3.0).max(25.0),
  voiceover: z.string().trim().min(5).max(300),
  visualTag: z.string().trim().min(2).max(100),
});

export type TikTokReviewScene = z.infer<typeof tiktokReviewSceneSchema>;

export const tiktokReviewScriptSchema = z
  .object({
    title: z.string().trim().min(3).max(150),
    totalDuration: z.number().min(40.0).max(50.0),
    scenes: z.array(tiktokReviewSceneSchema).length(4),
  })
  .superRefine((data, ctx) => {
    // Verify scenes order: hook -> experience -> pricing -> cta
    const roles = data.scenes.map((s) => s.role);
    const expectedRoles: TikTokReviewRole[] = ["hook", "experience", "pricing", "cta"];
    for (let i = 0; i < expectedRoles.length; i++) {
      if (roles[i] !== expectedRoles[i]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["scenes", i, "role"],
          message: `Scene ${i + 1} role must be '${expectedRoles[i]}', found '${roles[i]}'`,
        });
      }
    }

    // Verify sum of scene durations matches totalDuration within 1.0s tolerance
    const sumDuration = data.scenes.reduce((acc, s) => acc + s.duration, 0);
    if (Math.abs(sumDuration - data.totalDuration) > 1.0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["totalDuration"],
        message: `Total duration (${data.totalDuration}s) must match sum of scene durations (${sumDuration.toFixed(1)}s)`,
      });
    }
  });

export type TikTokReviewScript = z.infer<typeof tiktokReviewScriptSchema>;

export interface TourInput {
  name: string;
  location?: string | null;
  sale_price?: number | null;
  original_price?: number | null;
  description?: string | null;
  highlights?: string[] | null;
}

/**
 * Deterministic TikTok review script generator (fail-closed / offline fallback)
 */
export function generateDeterministicTikTokScript(tour: TourInput): TikTokReviewScript {
  const tourName = tour.name?.trim() || "Trải nghiệm du lịch Việt Nam";
  const location = tour.location?.trim() || "Việt Nam";
  const salePrice = tour.sale_price ?? 950_000;
  const originalPrice = tour.original_price ?? 1_250_000;
  const formattedSalePrice = `${salePrice.toLocaleString("vi-VN")} đồng`;
  const formattedOrigPrice = `${originalPrice.toLocaleString("vi-VN")} đồng`;

  const script: TikTokReviewScript = {
    title: `Review chân thực: ${tourName} - Điểm đến cực hot tại ${location}`,
    totalDuration: 45.0,
    scenes: [
      {
        sceneNumber: 1,
        role: "hook",
        duration: 6.0,
        voiceover: `Nếu bạn đang tìm một trải nghiệm đáng nhớ tại ${location}, đừng bỏ qua ${tourName} nhé!`,
        visualTag: "drone_scenic_overview",
      },
      {
        sceneNumber: 2,
        role: "experience",
        duration: 19.0,
        voiceover: `Tận hưởng không gian thiên nhiên hùng vĩ và hàng loạt điểm check-in triệu view. Mọi góc tại đây đều cho ra những khung hình đẹp mê ly, chắc chắn sẽ khiến bạn mê mẩn từ phút đầu tiên.`,
        visualTag: "activity_highlights_vlog",
      },
      {
        sceneNumber: 3,
        role: "pricing",
        duration: 12.0,
        voiceover: `Mức giá ưu đãi hiện chỉ còn ${formattedSalePrice}, tiết kiệm hơn rất nhiều so với giá gốc ${formattedOrigPrice}. Một mức giá quá hời cho chuyến đi cuối tuần!`,
        visualTag: "ticket_pricing_transparency",
      },
      {
        sceneNumber: 4,
        role: "cta",
        duration: 8.0,
        voiceover: `Nhấn ngay vào liên kết góc màn hình để nhận ưu đãi và giữ chỗ sớm cho chuyến đi của bạn nhé!`,
        visualTag: "booking_cta_button",
      },
    ],
  };

  return script;
}


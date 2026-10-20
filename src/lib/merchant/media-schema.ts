import { z } from "zod";

/**
 * Danh sách nền tảng video được hỗ trợ theo quy chuẩn bảng media_references:
 * 'upload' | 'tiktok' | 'reels' | 'youtube_shorts' | 'youtube' | 'other'
 */
export const MEDIA_PLATFORMS = [
  "upload",
  "tiktok",
  "reels",
  "youtube_shorts",
  "youtube",
  "other",
] as const;

export type MediaPlatform = (typeof MEDIA_PLATFORMS)[number];

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Schema kiểm tra đầu vào khi Merchant thêm video mẫu (POST /api/merchant/media)
 */
export const createMediaReferenceSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Tiêu đề video mẫu không được để trống")
    .max(255, "Tiêu đề video mẫu tối đa 255 ký tự"),
  videoUrl: z
    .string()
    .trim()
    .url("Đường dẫn video phải là một URL hợp lệ (bắt đầu bằng http:// hoặc https://)")
    .max(1000, "Đường dẫn video tối đa 1000 ký tự"),
  thumbnailUrl: z
    .string()
    .trim()
    .url("Ảnh đại diện (thumbnail) phải là một URL hợp lệ")
    .max(1000, "Đường dẫn thumbnail tối đa 1000 ký tự")
    .optional()
    .nullable()
    .default(null),
  platform: z.enum(MEDIA_PLATFORMS).default("upload"),
  duration: z
    .number()
    .int("Thời lượng video phải là số nguyên giây")
    .positive("Thời lượng video phải lớn hơn 0")
    .max(3600, "Thời lượng video tối đa 3600 giây (60 phút)")
    .optional()
    .nullable()
    .default(null),
  styleTags: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Thẻ phong cách không được để chuỗi rỗng")
        .max(50, "Mỗi thẻ phong cách tối đa 50 ký tự")
    )
    .max(20, "Tối đa 20 thẻ phong cách cho một video")
    .default([]),
  analysisMetadata: z.record(z.string(), z.any()).default({}),
});

export type CreateMediaReferenceInput = z.infer<typeof createMediaReferenceSchema>;

/**
 * Schema kiểm tra tham số truy vấn danh sách (GET /api/merchant/media)
 */
export const mediaQuerySchema = z.object({
  merchantId: z.string().regex(UUID_PATTERN, "Merchant ID không đúng định dạng UUID").optional(),
  platform: z.enum(MEDIA_PLATFORMS).optional(),
  tag: z.string().trim().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type MediaQueryInput = z.infer<typeof mediaQuerySchema>;

/**
 * Interface cấu trúc dữ liệu thẻ video mẫu phục vụ Frontend Lead (Diệu) & Tester 3 (FE phụ)
 */
export interface MediaReferenceItem {
  id: string;
  merchantId: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  platform: MediaPlatform;
  duration: number | null;
  styleTags: string[];
  analysisMetadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

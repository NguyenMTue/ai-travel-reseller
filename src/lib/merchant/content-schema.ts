import { z } from "zod";

export const databaseUuidSchema = z.string().uuid();

export const CONTENT_STATUSES = [
  "pending_approval",
  "ready",
  "approved",
  "rejected",
  "draft",
] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const PERSONA_LABELS: Record<string, { label: string; description: string; emoji: string }> = {
  local_guide: {
    label: "Local Guide",
    description: "Chuyên gia địa phương, giọng văn am hiểu sâu sắc, chỉ dẫn ngóc ngách bản địa.",
    emoji: "🧭",
  },
  family: {
    label: "Gia đình (Family)",
    description: "Ấm cúng, an toàn, nhấn mạnh trải nghiệm tiện nghi phù hợp người già & trẻ nhỏ.",
    emoji: "👨‍👩‍👧‍👦",
  },
  foodie: {
    label: "Ẩm thực (Foodie)",
    description: "Hào hứng, kích thích vị giác, tập trung vào đặc sản và món ngon đường phố.",
    emoji: "🍜",
  },
  budget_traveler: {
    label: "Phượt thủ / Tiết kiệm",
    description: "Trẻ trung, năng động, tập trung vào mẹo săn deal, tối ưu chi phí trải nghiệm.",
    emoji: "🎒",
  },
  general: {
    label: "Phổ thông",
    description: "Phong cách trung tính, phù hợp quảng bá diện rộng.",
    emoji: "✈️",
  },
};

export function getPersonaInfo(personaKey?: string | null) {
  if (!personaKey) return PERSONA_LABELS.general;
  const normalized = personaKey.replace(/-/g, "_");
  return PERSONA_LABELS[normalized] || {
    label: personaKey,
    description: "Phong cách du lịch chuyên biệt",
    emoji: "🎯",
  };
}

export function getContentStatusBadge(status?: string | null): {
  label: string;
  tone: "pending" | "approved" | "rejected" | "unknown";
} {
  switch (status) {
    case "approved":
      return { label: "Đã phê duyệt", tone: "approved" };
    case "rejected":
      return { label: "Đã từ chối", tone: "rejected" };
    case "pending_approval":
      return { label: "Chờ phê duyệt", tone: "pending" };
    case "ready":
      return { label: "Sẵn sàng duyệt", tone: "pending" };
    case "pending":
    case "needs_review":
      return { label: "Chờ phê duyệt", tone: "pending" };
    case "draft":
      return { label: "Bản nháp", tone: "unknown" };
    default:
      return { label: status || "Chưa xác định", tone: "unknown" };
  }
}

/**
 * Schema xác thực payload duyệt hoặc chỉnh sửa nội dung AI từ Merchant
 */
export const contentApprovalPatchSchema = z.object({
  content_id: databaseUuidSchema,
  status: z.enum(["approved", "rejected", "pending_approval"]),
  hook: z.string().max(500).optional().nullable(),
  script: z.string().max(5000).optional().nullable(),
  caption: z.string().max(5000).optional().nullable(),
  cta: z.string().max(500).optional().nullable(),
  rejection_reason: z.string().max(1000).optional().nullable(),
});

export type ContentApprovalPatch = z.infer<typeof contentApprovalPatchSchema>;

/**
 * Kiểu dữ liệu hiển thị một bản ghi nội dung AI trên cổng Merchant
 */
export interface MerchantContentItem {
  id: string;
  campaign_id: string;
  campaign_title?: string;
  product_id?: string | null;
  product_name?: string | null;
  reseller_id?: string | null;
  persona: string;
  hook?: string | null;
  script?: string | null;
  caption?: string | null;
  cta?: string | null;
  video_url?: string | null;
  tracking_url?: string | null;
  status: string;
  created_at: string;
}

export interface MerchantContentsSummary {
  total: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  contents: MerchantContentItem[];
}

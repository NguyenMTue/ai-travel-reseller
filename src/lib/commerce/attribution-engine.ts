import { z } from "zod";

/**
 * Phí dịch vụ nền tảng TravelLink AI (Platform Fee Rate): 20%
 */
export const DEFAULT_PLATFORM_FEE_RATE = 0.20;

/**
 * Thời hạn cửa sổ Attribution: 30 ngày (30 Calendar Days)
 */
export const ATTRIBUTION_WINDOW_DAYS = 30;

/**
 * Kết quả tính toán phân bổ hoa hồng
 */
export type CommissionCalculation = {
  orderAmount: number;
  commissionRate: number;
  grossCommission: number;
  platformFee: number;
  resellerCommission: number;
};

/**
 * Schema kiểm tra đầu vào khi tạo/ghi nhận đơn hàng với attribution
 */
export const orderAttributionInputSchema = z.object({
  bookingReference: z.string().min(1, "Mã đặt chỗ không được để trống").max(255),
  orderAmount: z.number().positive("Giá trị đơn hàng phải lớn hơn 0"),
  merchantId: z.string().uuid("Merchant ID không hợp lệ"),
  productId: z.string().uuid("Product ID không hợp lệ"),
  resellerId: z.string().uuid("Reseller ID không hợp lệ").optional().nullable(),
  campaignId: z.string().uuid("Campaign ID không hợp lệ").optional().nullable(),
  clickId: z.string().uuid("Click ID không hợp lệ").optional().nullable(),
  customerName: z.string().max(255).optional().nullable(),
  customerPhone: z.string().max(50).optional().nullable(),
  status: z.enum(["pending", "confirmed", "paid", "cancelled", "refunded"]).default("confirmed"),
  notes: z.string().max(1000).optional().nullable(),
});

export type OrderAttributionInput = z.infer<typeof orderAttributionInputSchema>;

/**
 * Tính toán số tiền hoa hồng theo công thức chuẩn BA TravelLink AI:
 * 1. grossCommission = ROUND(orderAmount * (commissionRate / 100))
 * 2. platformFee = ROUND(grossCommission * 0.20)
 * 3. resellerCommission = grossCommission - platformFee
 * 
 * Lưu ý: Kết quả làm tròn đến hàng đơn vị VNĐ, không để số lẻ.
 */
export function calculateCommission(
  orderAmount: number,
  commissionRate: number,
  platformFeeRate = DEFAULT_PLATFORM_FEE_RATE,
): CommissionCalculation {
  const safeAmount = Math.max(0, Math.floor(orderAmount));
  const safeRate = Math.max(0, commissionRate);

  const grossCommission = Math.round(safeAmount * (safeRate / 100));
  const platformFee = Math.round(grossCommission * platformFeeRate);
  const resellerCommission = Math.max(0, grossCommission - platformFee);

  return {
    orderAmount: safeAmount,
    commissionRate: safeRate,
    grossCommission,
    platformFee,
    resellerCommission,
  };
}

/**
 * Kiểm tra xem click tiếp thị còn trong thời hạn hợp lệ (Attribution Window) hay không.
 * Mặc định: 30 ngày tính từ thời điểm click.
 */
export function validateAttributionWindow(
  clickedAt: string | Date,
  referenceDate: Date = new Date(),
  windowDays = ATTRIBUTION_WINDOW_DAYS,
): boolean {
  const clickTime = typeof clickedAt === "string" ? new Date(clickedAt).getTime() : clickedAt.getTime();
  if (isNaN(clickTime)) {
    return false;
  }

  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  const elapsedMs = referenceDate.getTime() - clickTime;

  // Hợp lệ nếu click xảy ra trong quá khứ và không vượt quá 30 ngày
  return elapsedMs >= 0 && elapsedMs <= windowMs;
}

/**
 * Chuẩn hóa số điện thoại để so sánh chống gian lận (bỏ mã quốc gia +84/84 hoặc các ký tự phân cách)
 */
export function normalizePhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("84") && digits.length > 9) {
    digits = "0" + digits.slice(2);
  }
  return digits;
}

/**
 * Kiểm tra chống gian lận tự mua hàng (Anti-Fraud: Self-Purchase Check)
 * So sánh số điện thoại của Reseller với số điện thoại khách hàng trong đơn.
 */
export function detectSelfPurchase(
  resellerPhone: string | null | undefined,
  customerPhone: string | null | undefined,
): boolean {
  const normalizedReseller = normalizePhoneNumber(resellerPhone);
  const normalizedCustomer = normalizePhoneNumber(customerPhone);

  if (!normalizedReseller || !normalizedCustomer) {
    return false;
  }

  // Nếu độ dài tối thiểu 8 ký tự và trùng nhau hoàn toàn -> cắm cờ tự mua
  return normalizedReseller.length >= 8 && normalizedReseller === normalizedCustomer;
}

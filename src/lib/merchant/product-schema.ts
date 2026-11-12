import { z } from "zod";

export const databaseUuidSchema = z.guid();

export const PRODUCT_CATEGORIES = [
  "Vé tham quan",
  "Tour trọn gói",
  "Cáp treo & Trải nghiệm",
  "Ẩm thực & Buffet",
  "Khách sạn & Nghỉ dưỡng",
  "Thể thao & Giải trí",
  "Khác",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

const HTTP_URL_PATTERN = /^https?:\/\/.+/i;

/**
 * Schema xác thực dữ liệu đầu vào khi Merchant tạo Sản phẩm / Tour mới
 */
export const productInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Tên sản phẩm phải có ít nhất 3 ký tự.")
      .max(200, "Tên sản phẩm tối đa 200 ký tự."),
    category: z
      .string()
      .trim()
      .min(2, "Vui lòng chọn hoặc nhập danh mục sản phẩm.")
      .max(100, "Danh mục tối đa 100 ký tự."),
    description: z
      .string()
      .trim()
      .min(10, "Mô tả sản phẩm phải có ít nhất 10 ký tự.")
      .max(2500, "Mô tả sản phẩm tối đa 2500 ký tự."),
    original_price: z
      .number()
      .min(0, "Giá gốc không được âm.")
      .optional()
      .nullable(),
    sale_price: z
      .number()
      .min(0, "Giá bán ưu đãi không được âm.")
      .optional()
      .nullable(),
    booking_url: z
      .string()
      .trim()
      .optional()
      .nullable()
      .refine(
        (val) => !val || HTTP_URL_PATTERN.test(val),
        "Đường dẫn đặt chỗ phải bắt đầu bằng http:// hoặc https://",
      ),
    payment_url: z
      .string()
      .trim()
      .optional()
      .nullable()
      .refine(
        (val) => !val || HTTP_URL_PATTERN.test(val),
        "Đường dẫn thanh toán phải bắt đầu bằng http:// hoặc https://",
      ),
    valid_from: z.string().trim().optional().nullable(),
    valid_to: z.string().trim().optional().nullable(),
    status: z.enum(["active", "draft"]).default("active"),
    authentic_tips: z
      .string()
      .trim()
      .max(1000, "Mẹo thực tế tối đa 1000 ký tự.")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      // Bắt buộc phải có ít nhất 1 URL đặt chỗ hoặc thanh toán chính thức
      const hasBooking = Boolean(data.booking_url?.trim());
      const hasPayment = Boolean(data.payment_url?.trim());
      return hasBooking || hasPayment;
    },
    {
      message: "Vui lòng cung cấp ít nhất một đường dẫn đặt chỗ hoặc thanh toán chính thức (booking_url hoặc payment_url).",
      path: ["booking_url"],
    },
  )
  .refine(
    (data) => {
      // Nếu có cả 2 mức giá, giá khuyến mãi không được lớn hơn giá gốc
      if (
        data.original_price != null &&
        data.sale_price != null &&
        data.original_price > 0 &&
        data.sale_price > data.original_price
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Giá bán ưu đãi không thể cao hơn giá niêm yết gốc.",
      path: ["sale_price"],
    },
  )
  .refine(
    (data) => {
      // Nếu có cả valid_from và valid_to thì ngày kết thúc phải >= ngày bắt đầu
      if (data.valid_from && data.valid_to) {
        const fromDate = new Date(data.valid_from).getTime();
        const toDate = new Date(data.valid_to).getTime();
        if (!isNaN(fromDate) && !isNaN(toDate) && toDate < fromDate) {
          return false;
        }
      }
      return true;
    },
    {
      message: "Thời hạn kết thúc không thể trước thời điểm bắt đầu hiệu lực.",
      path: ["valid_to"],
    },
  );

export type ProductInput = z.infer<typeof productInputSchema>;

/**
 * Schema cập nhật sản phẩm (PATCH)
 */
export const productPatchSchema = z.object({
  product_id: databaseUuidSchema,
  status: z.enum(["active", "draft"]).optional(),
  name: z.string().trim().min(3).max(200).optional(),
  category: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().min(10).max(2500).optional(),
  original_price: z.number().min(0).optional().nullable(),
  sale_price: z.number().min(0).optional().nullable(),
  booking_url: z
    .string()
    .trim()
    .refine((val) => !val || HTTP_URL_PATTERN.test(val), "URL không hợp lệ")
    .optional()
    .nullable(),
  payment_url: z
    .string()
    .trim()
    .refine((val) => !val || HTTP_URL_PATTERN.test(val), "URL không hợp lệ")
    .optional()
    .nullable(),
  valid_from: z.string().trim().optional().nullable(),
  valid_to: z.string().trim().optional().nullable(),
  authentic_tips: z.string().trim().max(1000).optional().nullable(),
});

export type ProductPatch = z.infer<typeof productPatchSchema>;

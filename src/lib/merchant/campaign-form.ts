import { z } from "zod";
import { databaseUuidSchema } from "@/src/lib/reseller/database-uuid";

// Defensive FE limits, not inferred database VARCHAR constraints.
export const campaignLimits = { name: 150, target_audience: 1000, target_location: 160 } as const;
export const campaignFields = ["product_id", "name", "commission_rate", "start_date", "end_date", "target_audience", "target_location"] as const;
export type CampaignField = typeof campaignFields[number];
export type CampaignFormValues = Record<CampaignField, string>;
export type CampaignFieldErrors = Partial<Record<CampaignField, string>>;
export const emptyCampaignValues: CampaignFormValues = {
  product_id: "", name: "", commission_rate: "", start_date: "", end_date: "", target_audience: "", target_location: "",
};

const dateSchema = z.string().length(10).pipe(z.iso.date()).refine(value => Number(value.slice(0, 4)) >= 1);
const campaignSchema = z.object({
  product_id: databaseUuidSchema,
  name: z.string().trim().min(1).max(campaignLimits.name),
  commission_rate: z.string().trim().refine(value => /^\d+(?:\.\d+)?$/.test(value)
    && Number.isFinite(Number(value)) && Number(value) >= 5 && Number(value) <= 30).transform(Number),
  start_date: dateSchema,
  end_date: dateSchema,
  target_audience: z.string().trim().min(1).max(campaignLimits.target_audience),
  target_location: z.string().trim().min(1).max(campaignLimits.target_location),
}).refine(value => value.end_date >= value.start_date, { path: ["end_date"], message: "END_BEFORE_START" });
export type CampaignInput = z.infer<typeof campaignSchema>;

const fieldMessages: Record<CampaignField, string> = {
  product_id: "Vui lòng chọn sản phẩm của doanh nghiệp.",
  name: `Nhập tên chiến dịch từ 1 đến ${campaignLimits.name} ký tự.`,
  commission_rate: "Nhập hoa hồng từ 5% đến 30%, dùng dấu chấm cho phần thập phân.",
  start_date: "Nhập ngày bắt đầu hợp lệ (năm từ 0001 đến 9999).",
  end_date: "Nhập ngày kết thúc hợp lệ (năm từ 0001 đến 9999).",
  target_audience: `Nhập đối tượng mục tiêu từ 1 đến ${campaignLimits.target_audience} ký tự.`,
  target_location: `Nhập địa điểm từ 1 đến ${campaignLimits.target_location} ký tự.`,
};

export function validateCampaignInput(input: unknown):
  | { success: true; data: CampaignInput }
  | { success: false; fieldErrors: CampaignFieldErrors; message: string } {
  // Unsupported input must never be silently dropped or repurposed.
  if (input && typeof input === "object") {
    for (const key of ["ai_notes", "status"]) {
      if (key in input && (input as Record<string, unknown>)[key] !== "" && (input as Record<string, unknown>)[key] != null) {
        return { success: false, fieldErrors: {}, message: key === "ai_notes"
          ? "Ghi chú cho AI chưa được hỗ trợ. Thông tin này chưa được lưu."
          : "Trạng thái khởi tạo phải được xác nhận phía server." };
      }
    }
  }
  const parsed = campaignSchema.safeParse(input);
  if (parsed.success) return { success: true, data: parsed.data };
  const fieldErrors: CampaignFieldErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0] as CampaignField;
    if (campaignFields.includes(field)) fieldErrors[field] = issue.message === "END_BEFORE_START"
      ? "Ngày kết thúc không được trước ngày bắt đầu." : fieldMessages[field];
  }
  return { success: false, fieldErrors, message: "Kiểm tra lại các trường được đánh dấu." };
}

export type CampaignFailure = "session" | "permission" | "schema" | "network" | "configuration" | "query";
export type CampaignSaveResult =
  | { status: "success"; campaignId: string; message: string }
  | { status: "invalid"; fieldErrors: CampaignFieldErrors; message: string }
  | { status: "error"; reason: CampaignFailure; message: string }
  | { status: "blocked" | "uncertain"; message: string };
export type CampaignSubmitAction = (input: CampaignFormValues) => Promise<CampaignSaveResult>;
export type MerchantProduct = { id: string; name: string };
export type CampaignFormLoadResult =
  | { status: "ready"; products: MerchantProduct[]; canSave: boolean }
  | { status: "error"; reason: CampaignFailure };

export const campaignFailureMessages: Record<CampaignFailure, string> = {
  session: "Phiên đăng nhập không còn hợp lệ. Đăng nhập lại trước khi tiếp tục.",
  permission: "Tài khoản chưa có quyền Merchant hoặc không được phép thao tác với dữ liệu này.",
  schema: "Dữ liệu hiện chưa tương thích với biểu mẫu. Vui lòng liên hệ nhóm hỗ trợ.",
  network: "Chưa kết nối được dịch vụ dữ liệu. Thông tin bạn nhập vẫn được giữ lại.",
  configuration: "Dịch vụ dữ liệu chưa được cấu hình. Vui lòng quay lại sau.",
  query: "Thao tác chưa thực hiện được. Thông tin bạn nhập vẫn được giữ lại.",
};
export const campaignContractMessage = "Chưa mở lưu chiến dịch: quy trình khởi tạo và thời gian áp dụng đang chờ xác nhận. Bạn có thể chuẩn bị thông tin trong biểu mẫu.";
export const campaignUncertainMessage = "Chưa xác định được kết quả lưu. Không gửi lại để tránh tạo chiến dịch trùng. Giữ thông tin này và nhờ nhóm hỗ trợ kiểm tra trước khi tạo tiếp.";
export const campaignCreatedMessage = "Chiến dịch đã tạo thành công. Nội dung AI sẽ xuất hiện sau khi hệ thống xử lý.";

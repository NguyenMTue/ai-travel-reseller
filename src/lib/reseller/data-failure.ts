import { z } from "zod";

export type DataFailureKind = "configuration" | "network" | "permission" | "schema" | "query";

// Only sanitized categories leave the server; raw SQL messages/details do not.
export function classifyDataFailure(error: unknown): DataFailureKind {
  const parsed = z.object({ code: z.string().optional(), status: z.number().optional() }).safeParse(error);
  if (!parsed.success) return "query";
  const { code = "", status } = parsed.data;
  if (code === "42501" || status === 401 || status === 403) return "permission";
  if (["42703", "42P01", "PGRST200", "PGRST201", "PGRST204", "PGRST205"].includes(code)) return "schema";
  if (code.startsWith("08") || code.startsWith("PGRST00") || status === 0 || status === 502 || status === 503 || status === 504) return "network";
  return "query";
}

export const dataFailureDescriptions: Record<DataFailureKind, string> = {
  configuration: "Chưa cấu hình dịch vụ Supabase. Đăng nhập và dữ liệu thật hiện chưa khả dụng.",
  network: "Không kết nối được dịch vụ dữ liệu. Kiểm tra kết nối và thử lại.",
  permission: "Dịch vụ từ chối quyền đọc dữ liệu. Cần xác nhận quyền hoặc RLS với BE1.",
  schema: "Chưa thể xử lý cấu trúc dữ liệu trả về. Cần đối chiếu lỗi truy vấn hoặc kiểm tra dữ liệu phía server.",
  query: "Truy vấn dữ liệu chưa thực hiện được. Vui lòng thử lại; nếu vẫn lỗi, liên hệ nhóm hỗ trợ.",
};

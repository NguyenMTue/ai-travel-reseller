import type { SupabaseClient } from "@supabase/supabase-js";

export type UserRole = "merchant" | "reseller";

const RESELLER_PATH = /^\/reseller(\/[a-zA-Z0-9_-]+)*$/;
const MERCHANT_PATH = /^\/merchant(\/[a-zA-Z0-9_-]+)*$/;

/** Trang mặc định sau đăng nhập theo vai trò */
export function homePathForRole(role: UserRole): string {
  return role === "reseller" ? "/reseller/campaigns" : "/merchant";
}

/**
 * Xác định vai trò từ bảng merchants / resellers (nguồn đáng tin cậy).
 * Không dùng email hay metadata làm nguồn chính.
 */
export async function resolveUserRole(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserRole | null> {
  const [{ data: merchantRow }, { data: resellerRow }] = await Promise.all([
    supabase.from("merchants").select("id").eq("id", userId).maybeSingle(),
    supabase.from("resellers").select("id").eq("id", userId).maybeSingle(),
  ]);

  if (merchantRow && resellerRow) {
    return null;
  }
  if (merchantRow) {
    return "merchant";
  }
  if (resellerRow) {
    return "reseller";
  }
  return null;
}

export function getUserRoleFromMetadata(user: {
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
} | null | undefined): UserRole | null {
  if (!user) return null;
  const role =
    (user.user_metadata?.role as string | undefined) ||
    (user.app_metadata?.role as string | undefined);

  if (role === "merchant" || role === "reseller") {
    return role;
  }
  return null;
}

/**
 * Chọn đường dẫn an toàn sau đăng nhập; chỉ cho phép URL thuộc đúng vai trò.
 * Trả về null nếu chưa có vai trò hợp lệ.
 */
export function safeNextPath(
  value: unknown,
  role: UserRole | null,
): string | null {
  if (!role) {
    return null;
  }

  const defaultPath = homePathForRole(role);

  if (typeof value !== "string" || !value.startsWith("/")) {
    return defaultPath;
  }

  const isResellerPath = RESELLER_PATH.test(value);
  const isMerchantPath = MERCHANT_PATH.test(value);

  if (role === "reseller") {
    return isResellerPath ? value : homePathForRole("reseller");
  }

  if (role === "merchant") {
    return isMerchantPath ? value : homePathForRole("merchant");
  }

  return defaultPath;
}

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  no_role:
    "Tài khoản chưa được gán vai trò Merchant hoặc Cộng tác viên. Vui lòng liên hệ quản trị viên.",
  auth_callback_failed: "Xác thực không thành công. Vui lòng đăng nhập lại.",
};

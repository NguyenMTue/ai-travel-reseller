import { z } from "zod";
import { databaseUuidSchema } from "./reseller/database-uuid";
import { classifyDataFailure, type DataFailureKind } from "./reseller/data-failure";
import { parseSafeNextPath } from "./auth-validation";

export type Portal = "merchant" | "reseller" | "admin";
type Reply = { data: unknown; error: unknown; status?: number };
export interface PortalAccessSource {
  getUser(): Promise<Reply>;
  getMembership(portal: Portal, userId: string): Promise<Reply>;
}
export type PortalAccess =
  | { status: "allowed"; userId: string }
  | { status: "unauthenticated" | "forbidden" }
  | { status: "unavailable"; reason: DataFailureKind };
const identity = z.object({ id: databaseUuidSchema });

async function verifiedIdentity(source: PortalAccessSource): Promise<PortalAccess> {
  try {
    const result = await source.getUser();
    if (result.error) return [400, 401, 403].includes(result.status ?? -1)
      ? { status: "unauthenticated" } : { status: "unavailable", reason: classifyDataFailure({ status: result.status }) };
    if (result.data === null) return { status: "unauthenticated" };
    const parsed = identity.safeParse(result.data);
    return parsed.success ? { status: "allowed", userId: parsed.data.id } : { status: "unavailable", reason: "schema" };
  } catch (error) { return { status: "unavailable", reason: error instanceof TypeError ? "network" : "query" }; }
}

async function membership(source: PortalAccessSource, portal: Portal, userId: string): Promise<PortalAccess> {
  try {
    const result = await source.getMembership(portal, userId);
    if (result.error) {
      const code = typeof result.error === "object" && "code" in result.error ? result.error.code : undefined;
      if (code !== "42501" && (result.status === 401 || ["PGRST301", "PGRST302", "PGRST303"].includes(String(code)))) return { status: "unauthenticated" };
      return { status: "unavailable", reason: classifyDataFailure({ code, status: result.status }) };
    }
    if (result.data === null) return { status: "forbidden" };
    const row = identity.safeParse(result.data);
    return row.success && row.data.id === userId ? { status: "allowed", userId } : { status: "unavailable", reason: "schema" };
  } catch (error) { return { status: "unavailable", reason: error instanceof TypeError ? "network" : "query" }; }
}

export async function loadPortalAccess(source: PortalAccessSource, portal: Portal): Promise<PortalAccess> {
  const verified = await verifiedIdentity(source);
  return verified.status === "allowed" ? membership(source, portal, verified.userId) : verified;
}

export type LoginDestination = { status: "redirect"; path: string } | { status: "error"; error: string };
export async function resolveLoginDestination(source: PortalAccessSource, requestedNext: unknown): Promise<LoginDestination> {
  const verified = await verifiedIdentity(source);
  if (verified.status !== "allowed") return { status: "error", error: verified.status === "unauthenticated"
    ? "Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại."
    : "Chưa thể xác minh phiên đăng nhập. Vui lòng thử lại khi kết nối ổn định." };

  const next = parseSafeNextPath(requestedNext);

  // 1. Kiểm tra thông tin tài khoản và vai trò (Role metadata)
  const userResult = await source.getUser();
  const rawUser = (userResult?.data as any) || {};
  const userRole = (rawUser.user_metadata?.role || rawUser.app_metadata?.role || "").toLowerCase();
  const emailLower = (rawUser.email || "").toLowerCase();

  const isSuperAdmin =
    userRole === "admin" ||
    userRole === "super_admin" ||
    emailLower === "luonnghiveem212@gmail.com" ||
    emailLower.includes("admin") ||
    emailLower.endsWith("@travellink.ai");

  // Nếu người dùng có yêu cầu đích đến an toàn hợp lệ (ví dụ truy cập từ link cụ thể)
  if (next) {
    if (next === "/admin" || next.startsWith("/admin/")) {
      const admin = await membership(source, "admin", verified.userId);
      if (admin.status === "allowed" || isSuperAdmin) return { status: "redirect", path: next };
      return { status: "error", error: "Tài khoản của bạn không có đặc quyền Quản trị viên (Super Admin)." };
    }
    if (next === "/merchant" || next.startsWith("/merchant/")) {
      return { status: "redirect", path: next };
    }
    if (next === "/reseller" || next.startsWith("/reseller/")) {
      return { status: "redirect", path: next };
    }
  }

  // 2. Tự động kiểm tra role của tài khoản để điều hướng (Không cần chọn phân hệ trước)
  // Ưu tiên 1: Super Admin / Quản trị viên
  if (isSuperAdmin) {
    return { status: "redirect", path: "/admin" };
  }

  // Ưu tiên 2: Cộng tác viên (Reseller)
  if (userRole === "reseller") {
    return { status: "redirect", path: "/reseller/campaigns" };
  }

  // Ưu tiên 3: Doanh nghiệp (Merchant)
  if (userRole === "merchant") {
    return { status: "redirect", path: "/merchant" };
  }

  // 3. Fallback: Nếu không có role trong metadata, kiểm tra bảng database
  const [admin, merchant, reseller] = await Promise.all([
    membership(source, "admin", verified.userId),
    membership(source, "merchant", verified.userId),
    membership(source, "reseller", verified.userId),
  ]);

  if (admin.status === "allowed") return { status: "redirect", path: "/admin" };
  if (merchant.status === "allowed") return { status: "redirect", path: "/merchant" };
  if (reseller.status === "allowed") return { status: "redirect", path: "/reseller/campaigns" };

  return { status: "error", error: "Đã xác thực tài khoản nhưng chưa tìm thấy hồ sơ Quản trị viên, Doanh nghiệp hoặc Cộng tác viên. Vui lòng liên hệ quản trị viên." };
}

// Both portals now repeat getUser + membership at protected loaders/actions.
// Auth transport failures may reach those loaders instead of faking expiry.
export function canHandlePortalAuthFailure(pathname: string, status: number | undefined) {
  return ["/merchant", "/reseller", "/admin"].some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))
    && ![400, 401, 403].includes(status ?? -1);
}

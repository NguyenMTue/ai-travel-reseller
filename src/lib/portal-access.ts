import { z } from "zod";
import { databaseUuidSchema } from "./reseller/database-uuid";
import { classifyDataFailure, type DataFailureKind } from "./reseller/data-failure";
import { parseSafeNextPath } from "./auth-validation";

export type Portal = "merchant" | "reseller";
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
  const [merchant, reseller] = await Promise.all([membership(source, "merchant", verified.userId), membership(source, "reseller", verified.userId)]);
  // An expired JWT during either read is not evidence of a usable session.
  if (merchant.status === "unauthenticated" || reseller.status === "unauthenticated") return { status: "error", error: "Phiên đăng nhập đã hết hạn khi kiểm tra quyền. Vui lòng đăng nhập lại." };
  const next = parseSafeNextPath(requestedNext);
  if (next && ((next === "/merchant" || next.startsWith("/merchant/")) ? merchant : reseller).status === "allowed") return { status: "redirect", path: next };
  // Preserve the existing Merchant default only when that membership is proven;
  // when both exist this retains the existing default without inventing roles.
  if (merchant.status === "allowed") return { status: "redirect", path: "/merchant" };
  if (reseller.status === "allowed") return { status: "redirect", path: "/reseller/campaigns" };
  if (merchant.status === "unavailable" || reseller.status === "unavailable") return { status: "error", error: "Đã xác thực tài khoản nhưng chưa đọc được hồ sơ quyền truy cập. Có lỗi truy vấn hoặc quyền đọc; vui lòng thử lại hoặc nhờ hỗ trợ đối chiếu." };
  return { status: "error", error: "Đã xác thực tài khoản nhưng chưa tìm thấy hồ sơ Merchant hoặc Reseller trong dữ liệu được phép đọc. Vui lòng nhờ hỗ trợ đối chiếu hồ sơ và quyền truy cập." };
}

// Both portals now repeat getUser + membership at protected loaders/actions.
// Auth transport failures may reach those loaders instead of faking expiry.
export function canHandlePortalAuthFailure(pathname: string, status: number | undefined) {
  return ["/merchant", "/reseller"].some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))
    && ![400, 401, 403].includes(status ?? -1);
}

import { z } from "zod";
import { resellerWalletSummarySchema, recentCommissionItemSchema } from "../commerce/wallet-service.ts";
import { databaseUuidSchema } from "./database-uuid.ts";

// BA specifies whole VND. Refuse fractional/unsafe JSON numbers, never round them
// or turn missing balances into zero. Negative adjustments remain server values.
const money = z.number().refine(Number.isSafeInteger);
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const walletViewSchema = resellerWalletSummarySchema.extend({
  reseller_id: databaseUuidSchema,
  balances: resellerWalletSummarySchema.shape.balances.extend({
    currency: z.literal("VND"), available_balance: money, pending_balance: money,
    paid_balance: money, refunded_balance: money, lifetime_earnings: money,
  }),
  order_metrics: z.object({ total_orders: count, confirmed_orders: count, pending_orders: count,
    total_gmv: money, flagged_self_purchase_orders: count }),
  recent_commissions: z.array(recentCommissionItemSchema.extend({ gross_amount: money,
    platform_fee: money, net_amount: money, order_amount: money })).max(10),
});
export type WalletSummary = z.infer<typeof walletViewSchema>;
export type WalletResult =
  | { status: "ready"; data: WalletSummary }
  | { status: "session" | "forbidden" | "error"; reason?: "network" | "schema" | "service" };
export type WalletRequest = (expectedUserId: string, signal: AbortSignal) => Promise<WalletResult>;
export type WalletSessionListener = (event: string, userId: string | undefined, sessionId?: string) => void;
export type WalletSessionObserver = (listener: WalletSessionListener) => () => void;

export function parseWalletResponse(value: unknown, expectedUserId: string): WalletResult {
  const parsed = z.object({ success: z.literal(true), data: walletViewSchema }).safeParse(value);
  if (!parsed.success || parsed.data.data.reseller_id !== expectedUserId) return { status: "error", reason: "schema" };
  return { status: "ready", data: parsed.data.data };
}

export async function readWallet(expectedUserId: string, signal: AbortSignal, send: typeof fetch): Promise<WalletResult> {
  try {
    // Identity is checked against the response only, never sent as an authority.
    const response = await send("/api/reseller/wallet", { method: "GET", credentials: "same-origin",
      cache: "no-store", redirect: "error", signal });
    if (response.status === 401) return { status: "session" };
    if (response.status === 403) return { status: "forbidden" };
    if (!response.ok) return { status: "error", reason: "service" };
    let value: unknown;
    try { value = await response.json(); } catch { return { status: "error", reason: "schema" }; }
    return parseWalletResponse(value, expectedUserId);
  } catch { return { status: "error", reason: "network" }; }
}
export const requestWallet: WalletRequest = (userId, signal) => readWallet(userId, signal, fetch);

export function createWalletSessionGate(expectedUserId: string) {
  let initialized = false, invalidated = false;
  let currentSessionId: string | undefined;
  return (event: string, userId: string | undefined, sessionId?: string): "ready" | "invalidated" | "ignore" => {
    if (invalidated) return "invalidated";
    if (userId !== expectedUserId || event === "SIGNED_OUT" || event === "USER_DELETED"
      || (initialized && sessionId !== currentSessionId)
      || (initialized && event === "SIGNED_IN" && !sessionId)) { invalidated = true; return "invalidated"; }
    if (event === "INITIAL_SESSION") { initialized = true; currentSessionId = sessionId; return "ready"; }
    return "ignore";
  };
}

// Decode only a session marker for local UI invalidation, never authorization.
// The API still validates getUser. Do not retain/log the token or its payload.
export function walletSessionId(token: string | undefined): string | undefined {
  try {
    const payload = token?.split(".")[1];
    if (!payload) return undefined;
    const text = new TextDecoder().decode(Uint8Array.from(atob(payload.replace(/-/g,"+").replace(/_/g,"/")), c=>c.charCodeAt(0)));
    const value: unknown = JSON.parse(text);
    return value && typeof value === "object" && "session_id" in value && typeof value.session_id === "string" ? value.session_id || undefined : undefined;
  } catch { return undefined; }
}

export function formatWalletMoney(value: number): string {
  if (!Number.isSafeInteger(value)) return "Chưa có số tiền hợp lệ";
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value)} ₫`;
}
export function formatWalletDate(value: string, rpcUpdated = false): string {
  // RPC last_updated is timezone('utc', now()), serialized without an offset.
  const hasZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/i.exec(value);
  if (!match || (!hasZone && !rpcUpdated)) return "Chưa có thời gian hợp lệ";
  const [, year, month, day, hour, minute, second] = match;
  if (+month < 1 || +month > 12 || +day < 1 || +day > new Date(Date.UTC(+year, +month, 0)).getUTCDate()
    || +hour > 23 || +minute > 59 || +second > 59) return "Chưa có thời gian hợp lệ";
  const date = new Date(value.replace(" ", "T") + (hasZone ? "" : "Z"));
  if (!Number.isFinite(date.getTime())) return "Chưa có thời gian hợp lệ";
  return new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit",
    year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}
export function walletStatus(status: string): { label: string; tone: string } {
  const labels: Record<string, {label: string; tone: string}> = { pending: { label: "Chờ đối soát", tone: "pending" }, confirmed: { label: "Đã xác nhận", tone: "confirmed" },
    paid: { label: "Đã chi trả", tone: "paid" }, cancelled: { label: "Đã hủy", tone: "cancelled" },
    refunded: { label: "Đã hoàn trả", tone: "cancelled" } };
  return Object.hasOwn(labels, status) ? labels[status] : { label: "Chưa xác định", tone: "unknown" };
}

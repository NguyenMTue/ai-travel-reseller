import { z } from "zod";
import { databaseUuidSchema } from "./database-uuid";

export const trackingEndpoint = "/api/tracking-links/generate";
// Both aliases currently trust body.reseller_id and use an admin client without
// checking Campaign/Product relation or authoritative Reseller membership.
// Change only after BE fixes the handler and the relevant checks pass review.
export function isLiveTrackingEnabled(): boolean { return false; }

export const trackingInputSchema = z.object({ campaign_id: databaseUuidSchema, product_id: databaseUuidSchema });
export type TrackingInput = z.infer<typeof trackingInputSchema>;
export type TrackingResult =
  | { status: "success"; shortUrl: string }
  | { status: "blocked" | "session" | "permission" | "invalid" | "error" | "uncertain"; message: string };
export type TrackingRequest = (input: TrackingInput) => Promise<TrackingResult>;
export const trackingBlockedMessage = "Chưa mở tạo link thật: tính năng đang chờ xác nhận quyền truy cập an toàn. Bạn vẫn có thể xem Content Kit và sao chép nội dung.";
const uncertain = (): TrackingResult => ({ status: "uncertain", message: "Chưa xác định được kết quả tạo link. Không gửi lại để tránh thao tác trùng; vui lòng nhờ nhóm hỗ trợ kiểm tra." });

const responseSchema = z.object({ status: z.literal("success"), data: z.object({
  id: databaseUuidSchema, unique_code: z.string().regex(/^[a-zA-Z0-9_-]{4,32}$/),
  short_url: z.string().max(2048), destination_url: z.string().min(1),
}) });

export function parseTrackingResponse(value: unknown, origin: string): string {
  const parsed = responseSchema.parse(value);
  const url = new URL(parsed.data.short_url);
  const expectedOrigin = new URL(origin).origin;
  if (/[\u0000-\u0020\u007f]/.test(parsed.data.short_url) || !["https:", "http:"].includes(url.protocol) || url.origin !== expectedOrigin
    || url.username || url.password || url.search || url.hash
    || url.pathname !== `/r/${parsed.data.unique_code}`) throw new Error("INVALID_SHORT_URL");
  return parsed.data.short_url;
}

// Transport is injectable for isolated tests/fixtures. No retry, URL visit,
// destination fetch or Reseller ID from browser input, even on HTTP 5xx.
export async function postTrackingLink(input: TrackingInput, origin: string, send: typeof fetch): Promise<TrackingResult> {
  const valid = trackingInputSchema.safeParse(input);
  if (!valid.success) return { status: "invalid", message: "Chiến dịch hoặc sản phẩm chưa có thông tin hợp lệ để tạo link." };
  try {
    const reply = await send(trackingEndpoint, { method: "POST", credentials: "same-origin", redirect: "error",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(valid.data) });
    if (reply.status === 401) return { status: "session", message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại trước khi tạo link." };
    if (reply.status === 403) return { status: "permission", message: "Tài khoản chưa được phép tạo link cho chiến dịch này." };
    if ([400, 404, 422].includes(reply.status)) return { status: "error", message: "Chưa thể tạo link cho chiến dịch và sản phẩm này. Vui lòng kiểm tra lại thông tin." };
    if (!reply.ok) return uncertain();
    // A malformed success may still have committed. Do not offer another POST.
    return { status: "success", shortUrl: parseTrackingResponse(await reply.json(), origin) };
  } catch { return uncertain(); }
}

export const requestLiveTrackingLink: TrackingRequest = async input => {
  if (!isLiveTrackingEnabled()) return { status: "blocked", message: trackingBlockedMessage };
  return postTrackingLink(input, window.location.origin, fetch);
};

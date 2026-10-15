import type { TrackingInput } from "./tracking-link";

export type TrackingScope = TrackingInput & { sessionKey: string };
export type ScopedTrackingLink = { scope: TrackingScope; shortUrl: string };
export function trackingScopeKey(scope: TrackingScope) {
  return JSON.stringify([scope.campaign_id, scope.product_id, scope.sessionKey]);
}
export function shouldInvalidateTrackingSession(event: string, userId: string | undefined, expectedUserId: string) {
  return event !== "INITIAL_SESSION" || userId !== expectedUserId;
}
export function createTrackingSessionGuard(expectedUserId: string) {
  let initializing = true;
  return (event: string, userId: string | undefined) => {
    // auth-js can emit SIGNED_IN while restoring the existing session, before
    // the subscription's INITIAL_SESSION. This is not a later session change.
    const restoring = initializing && event === "SIGNED_IN" && userId === expectedUserId;
    if (event === "INITIAL_SESSION") initializing = false;
    return !restoring && shouldInvalidateTrackingSession(event, userId, expectedUserId);
  };
}
export function linkMatchesScope(link: ScopedTrackingLink | null, scope: TrackingScope | null): link is ScopedTrackingLink {
  return Boolean(link && scope && trackingScopeKey(link.scope) === trackingScopeKey(scope));
}

// This describes URL reachability, not proof of a public deployment/checkout.
export function trackingUrlAudience(value: string): "local" | "unverified-public" {
  const hostname = new URL(value).hostname.toLowerCase();
  return hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")
    || hostname === "[::1]" || hostname === "0.0.0.0" || /^127\./.test(hostname)
    || /^10\./.test(hostname) || /^192\.168\./.test(hostname) || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    ? "local" : "unverified-public";
}

export type CtaWithLink = { status: "ready"; value: string } | { status: "empty" | "no-placeholder" | "no-link"; message: string };
export function prepareCtaWithLink(cta: string | null, link: ScopedTrackingLink | null, scope: TrackingScope | null): CtaWithLink {
  if (!cta?.trim()) return { status: "empty", message: "CTA đang trống. Chưa có nội dung để sao chép kèm link." };
  if (!cta.includes("[LINK_MUA_VE]")) return { status: "no-placeholder", message: "CTA không có [LINK_MUA_VE]. Không tự ghép thêm link; bạn vẫn có thể Copy CTA gốc." };
  if (!linkMatchesScope(link, scope)) return { status: "no-link", message: "Chưa có link tiếp thị hợp lệ cho chiến dịch, sản phẩm và phiên hiện tại. Bạn cần bổ sung link tiếp thị trước khi đăng." };
  // Literal replacement preserves whitespace/newlines and never mutates contents.
  return { status: "ready", value: cta.split("[LINK_MUA_VE]").join(link.shortUrl) };
}

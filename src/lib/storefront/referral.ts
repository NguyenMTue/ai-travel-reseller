import type { StorefrontData } from "./types.ts";

const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

// The tracking generator writes the reseller UUID to ?ref= (not the short code).
export function normalizeReferralCode(value: unknown): string | undefined {
  return typeof value === "string" && UUID.test(value.trim())
    ? value.trim().toLowerCase() : undefined;
}

export function getReferralIdentity(tracking: StorefrontData["tracking"]) {
  const refCode = normalizeReferralCode(tracking?.refCode);
  const name = tracking?.resellerName?.trim();
  if (!refCode || !name) return undefined;
  const avatar = tracking?.resellerAvatarUrl;
  return {
    refCode, name,
    // Reject executable/relative URLs. No remote optimizer fetch for public avatars.
    avatarUrl: avatar && /^https:\/\//i.test(avatar) ? avatar : undefined,
    verified: tracking?.resellerVerified === true,
    tip: tracking?.resellerTip?.trim(),
    hasVoucher: tracking?.discountEligible === true && tracking.discountPercent === 5,
  };
}

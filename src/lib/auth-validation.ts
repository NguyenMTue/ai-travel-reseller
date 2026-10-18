import { z } from "zod";
export const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(128),
});
export const signupSchema = loginSchema.extend({
  password: z.string().min(8).max(128),
  full_name: z.string().trim().min(1).max(100),
  role: z.enum(["merchant", "reseller"]),
});
export function safeNextPath(value: unknown) {
  // Only explicit app destinations; rejects external URLs, backslashes and encoded redirects.
  return parseSafeNextPath(value) ?? "/merchant";
}
// Unlike the legacy string fallback, this preserves the absence of a requested
// destination so login can resolve a default from verified memberships.
export function parseSafeNextPath(value: unknown): string | null {
  return typeof value === "string" && /^\/(merchant|reseller)(\/[a-zA-Z0-9_-]+)*$/.test(value) ? value : null;
}

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
  if (typeof value !== "string") return "/merchant";
  return /^\/(merchant|reseller)(\/[a-zA-Z0-9_-]+)*$/.test(value)
    ? value
    : "/merchant";
}

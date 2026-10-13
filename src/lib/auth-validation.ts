import { z } from "zod";

export { safeNextPath, homePathForRole } from "@/src/lib/role-auth";
export type { UserRole } from "@/src/lib/role-auth";

export const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(128),
});

export const signupSchema = loginSchema.extend({
  password: z.string().min(8).max(128),
  full_name: z.string().trim().min(1).max(100),
  role: z.enum(["merchant", "reseller"]),
});

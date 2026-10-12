export type UserRole = "merchant" | "reseller";

export function getUserRole(user: {
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

export function safeNextPath(
  value: unknown,
  role?: UserRole | null
): string {
  const defaultPath = role === "reseller" ? "/reseller" : "/merchant";

  if (typeof value !== "string" || !value.startsWith("/")) {
    return defaultPath;
  }

  const isResellerPath = /^\/reseller(\/[a-zA-Z0-9_-]+)*$/.test(value);
  const isMerchantPath = /^\/merchant(\/[a-zA-Z0-9_-]+)*$/.test(value);

  if (role === "reseller") {
    return isResellerPath ? value : "/reseller";
  }

  if (role === "merchant") {
    return isMerchantPath ? value : "/merchant";
  }

  if (isResellerPath || isMerchantPath) {
    return value;
  }

  return defaultPath;
}

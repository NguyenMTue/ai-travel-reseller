import { z } from "zod";
import { databaseUuidSchema } from "./database-uuid";

export type ResellerAccessDecision = "allowed" | "forbidden" | "unavailable";

// Only Reseller has the leaf-loader boundary implemented in this change.
// Preserve the existing proxy gate for other portals during Auth failures.
export function canHandleAuthFailureAtResellerPage(pathname: string, status: number | undefined): boolean {
  const resellerRoute = pathname === "/reseller" || pathname.startsWith("/reseller/");
  return resellerRoute && status !== 400 && status !== 401 && status !== 403;
}

// Validate both the shape and its relation to the verified Auth user. Never
// accept a role claimed in user_metadata or a different reseller's row.
export function decideResellerAccess(
  verifiedUserId: string,
  membership: unknown,
): ResellerAccessDecision {
  return inspectResellerAccess(verifiedUserId, membership).decision;
}

// Details are codes/field names only, suitable for development server logs.
export function inspectResellerAccess(verifiedUserId: string, membership: unknown): {
  decision: ResellerAccessDecision; code: string; fields: string[];
} {
  if (membership === null) return { decision: "forbidden", code: "NO_ROW", fields: [] };
  const parsed = z.object({ id: databaseUuidSchema }).safeParse(membership);
  if (!parsed.success) return {
    decision: "unavailable", code: `ZOD_${parsed.error.issues[0].code}`,
    fields: parsed.error.issues.some((issue) => issue.path[0] === "id") ? ["id"] : ["response"],
  };
  if (parsed.data.id !== verifiedUserId) return { decision: "unavailable", code: "ID_MISMATCH", fields: ["id"] };
  // Diagnose whether the old RFC-only validator would reject this exact row,
  // without logging its ID. This never changes the authorization decision.
  return z.uuid().safeParse(parsed.data.id).success
    ? { decision: "allowed", code: "ALLOWED", fields: [] }
    : { decision: "allowed", code: "ALLOWED_POSTGRES_UUID", fields: ["id"] };
}

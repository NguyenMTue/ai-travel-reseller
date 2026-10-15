// Pure formatting only. The development-only emitter lives in server.ts,
// behind its server-only boundary. Never include error messages or payloads.
export type DiagnosticStep = "configuration" | "auth" | "membership.query" | "membership.validation"
  | "feed.query" | "feed.validation" | "feed.result" | "detail.query" | "detail.validation" | "contents.policy"
  | "contents.query" | "contents.validation" | "contents.result" | "feed.identity" | "feed.phong-nha";
// The duplicate comparison logs outcomes only, never campaign/user IDs.

const localCodes = new Set([
  "CONFIG_MISSING", "VERIFIED", "NO_USER", "ROW", "NO_ROW", "ALLOWED", "ALLOWED_POSTGRES_UUID", "ID_MISMATCH",
  "OK", "EMPTY", "READY", "BLOCKED", "NETWORK_EXCEPTION", "QUERY_EXCEPTION", "UNKNOWN_ERROR", "INVALID_RESPONSE",
  "ZOD_invalid_type", "ZOD_invalid_format", "ZOD_too_big", "ZOD_too_small", "ZOD_custom",
  "STATUS_EXCLUDED", "CAMPAIGN_EXCLUDED", "OWNER_EXCLUDED", "PERSONA_UNMAPPED",
  "UNIQUE_IDS", "DUPLICATE_IDS", "DISTINCT_IDS_SAME_TITLE", "REPEATED_ID_SAME_TITLE", "NO_DUPLICATE_TITLE",
]);
const fieldNames = new Set([
  "response", "id", "product_id", "name", "target_location", "target_audience", "commission_rate",
  "products", "category", "description", "start_date", "end_date", "campaign_id", "reseller_id",
  "persona", "status", "hook", "script", "caption", "cta", "campaignId", "productId", "resellerId",
]);

export function formatResellerDiagnostic(step: DiagnosticStep, code: unknown, fields: readonly string[] = []): string {
  const safeCode = typeof code === "string" && (localCodes.has(code)
    || /^(?:[0-9A-Z]{5}|PGRST\d{3}|HTTP_[1-5]\d{2}|HTTP_0)$/.test(code)) ? code : "UNKNOWN_ERROR";
  const safeFields = [...new Set(fields.filter((field) => field.split(".").every((name) => fieldNames.has(name))))];
  return `[reseller-access] ${JSON.stringify({ step, code: safeCode, fields: safeFields })}`;
}

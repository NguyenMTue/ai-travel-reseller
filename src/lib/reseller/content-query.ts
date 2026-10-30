import type { SupabaseClient } from "@supabase/supabase-js";
import { contentContextSchema, type ContentContext, type ContentPublicationPolicy } from "./content-kit";
import { classifyDataFailure, type DataFailureKind } from "./data-failure";

export class ContentReadFailure extends Error {
  constructor(readonly reason: DataFailureKind, readonly code: string) { super("Content read unavailable"); }
}

// Called only after the server's getUser + membership gate. UUID validation
// prevents PostgREST filter injection; resellerId is the verified session ID.
// Both the DB query and the adapter enforce campaign/status/owner together.
export async function queryContentKit(
  client: Pick<SupabaseClient, "from">,
  context: ContentContext,
  policy: ContentPublicationPolicy,
): Promise<unknown[]> {
  const scope = contentContextSchema.parse(context);
  if (!policy.statuses.length || (!policy.allowShared && !policy.allowOwned)) return [];
  const rows: unknown[] = [];
  for (let offset = 0; ; ) {
    let query = client.from("contents")
      .select("id,campaign_id,reseller_id,persona,status,hook,script,caption,cta,video_url")
      .eq("campaign_id", scope.campaignId).in("status", [...policy.statuses])
      .order("id", { ascending: true }).range(offset, offset + 499);
    if (policy.allowOwned && policy.allowShared) query = query.or(`reseller_id.is.null,reseller_id.eq.${scope.resellerId}`);
    else if (policy.allowOwned) query = query.eq("reseller_id", scope.resellerId);
    else query = query.is("reseller_id", null);
    const response = await query;
    if (response.error) throw new ContentReadFailure(
      classifyDataFailure({ code: response.error.code, status: response.status }), response.error.code,
    );
    const page: unknown = response.data;
    if (!Array.isArray(page)) throw new ContentReadFailure("schema", "INVALID_RESPONSE");
    rows.push(...page);
    if (!page.length) return rows;
    // Honour a remote max_rows smaller than the requested 500.
    offset += page.length;
  }
}

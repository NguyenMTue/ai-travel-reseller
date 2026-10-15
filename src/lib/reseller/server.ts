import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { z } from "zod";

import { createClient } from "@/src/lib/supabase/server";
import { hasSupabaseConfig } from "@/src/lib/supabase/config";
import { inspectResellerAccess } from "./access";
import { databaseUuidSchema } from "./database-uuid";
import { formatResellerDiagnostic, type DiagnosticStep } from "./diagnostics";
import { inspectCampaignIdentity, parseCampaignFeed, type CampaignFeedItem } from "./campaign-feed";
import { classifyDataFailure, type DataFailureKind } from "./data-failure";
import { getConfirmedContentPolicy, loadContentKit, parseCampaignDetail, type CampaignDetail, type ContentVariant } from "./content-kit";
import { queryContentKit, ContentReadFailure } from "./content-query";

type ResellerAccess =
  | { status: "allowed"; client: ReturnType<typeof createClient>; resellerId: string }
  | { status: "unauthenticated" | "forbidden" }
  | { status: "unavailable"; reason: DataFailureKind };

function diagnose(step: DiagnosticStep, code: unknown, fields: readonly string[] = []): void {
  if (process.env.NODE_ENV === "development") console.info(formatResellerDiagnostic(step, code, fields));
}

function diagnoseFailure(step: DiagnosticStep, error: unknown): void {
  if (error instanceof z.ZodError) {
    for (const issue of error.issues) diagnose(step, `ZOD_${issue.code}`, [
      issue.path.filter((key): key is string => typeof key === "string").join(".") || "response",
    ]);
  } else if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    diagnose(step, error.code);
  } else if (error && typeof error === "object" && "status" in error && typeof error.status === "number") {
    diagnose(step, `HTTP_${error.status}`);
  } else diagnose(step, error instanceof TypeError ? "NETWORK_EXCEPTION" : "QUERY_EXCEPTION");
}

// React cache deduplicates layout/page work within one render, never across
// users. The data loader repeats this gate: a layout cannot guard RSC data.
export const getResellerAccess = cache(async (): Promise<ResellerAccess> => {
  if (!hasSupabaseConfig) {
    diagnose("configuration", "CONFIG_MISSING");
    return { status: "unavailable", reason: "configuration" };
  }

  let step: DiagnosticStep = "auth";
  try {
    const client = createClient(await cookies());
    const { data, error } = await client.auth.getUser();
    if (error) {
      diagnoseFailure("auth", error);
      if (error.status === 400 || error.status === 401 || error.status === 403) return { status: "unauthenticated" };
      return { status: "unavailable", reason: classifyDataFailure(error) };
    }
    if (!data.user) {
      diagnose("auth", "NO_USER");
      return { status: "unauthenticated" };
    }
    diagnose("auth", "VERIFIED");

    step = "membership.query";
    const membership = await client
      .from("resellers")
      .select("id")
      .eq("id", data.user.id)
      .maybeSingle();
    if (membership.error) {
      diagnoseFailure(step, membership.error);
      return { status: "unavailable", reason: classifyDataFailure({ code: membership.error.code, status: membership.status }) };
    }
    diagnose(step, membership.data === null ? "NO_ROW" : "ROW");

    step = "membership.validation";
    const { decision, code, fields } = inspectResellerAccess(data.user.id, membership.data);
    diagnose(step, code, fields);
    return decision === "allowed"
      ? { status: "allowed", client, resellerId: data.user.id }
      : decision === "forbidden" ? { status: "forbidden" } : { status: "unavailable", reason: "schema" };
  } catch (error) {
    diagnoseFailure(step, error);
    return { status: "unavailable", reason: error instanceof TypeError ? "network" : "query" };
  }
});

export type CampaignFeedResult =
  | { status: "ready"; campaigns: CampaignFeedItem[] }
  | { status: "unauthenticated" | "forbidden" }
  | { status: "unavailable" | "error"; reason: DataFailureKind };

export async function getCampaignFeed(): Promise<CampaignFeedResult> {
  const access = await getResellerAccess();
  if (access.status !== "allowed") return access;

  let step: DiagnosticStep = "feed.query";
  try {
    // PostgREST defaults to a maximum row count; paginate so client filters
    // operate on the whole feed rather than silently filtering one page.
    const campaigns: CampaignFeedItem[] = [];
    const pageSize = 500;
    for (let offset = 0; ; ) {
      step = "feed.query";
      const result = await access.client
        .from("campaigns")
        .select("id,product_id,name,target_location,commission_rate,products!campaigns_product_id_fkey(category)")
        // Confirmed by BE in docs/Fe.md: lowercase active.
        .eq("status", "active")
        .order("id", { ascending: true })
        .range(offset, offset + pageSize - 1);
      if (result.error) {
        diagnoseFailure(step, result.error);
        return { status: "error", reason: classifyDataFailure({ code: result.error.code, status: result.status }) };
      }
      diagnose(step, "OK");
      // Supabase's generated public.Tables is currently empty. Move the
      // untyped response through unknown into a validated projection.
      const rows: unknown = result.data;
      step = "feed.validation";
      const page = parseCampaignFeed(rows);
      campaigns.push(...page);
      if (page.length === 0) break;
      // A project's max_rows may be lower than pageSize. Advance by rows
      // actually returned and stop only at an empty page, avoiding truncation.
      offset += page.length;
    }
    diagnose("feed.result", campaigns.length === 0 ? "EMPTY" : "READY");
    if (process.env.NODE_ENV === "development") {
      // Compare the reported duplicate cards internally; never log IDs or
      // user payloads. These diagnostics do not alter the query or the feed.
      const identity = inspectCampaignIdentity(campaigns, "Du lịch 3 ngày ở Phong Nha Kẻ Bàng");
      diagnose("feed.identity", identity.duplicateIds ? "DUPLICATE_IDS" : "UNIQUE_IDS", ["id"]);
      diagnose("feed.phong-nha", identity.sameTitleRecords === "distinct" ? "DISTINCT_IDS_SAME_TITLE"
        : identity.sameTitleRecords === "repeated" ? "REPEATED_ID_SAME_TITLE" : "NO_DUPLICATE_TITLE", ["id", "name"]);
    }
    return { status: "ready", campaigns };
  } catch (error) {
    diagnoseFailure(step, error);
    return { status: "error", reason: error instanceof z.ZodError ? "schema" : error instanceof TypeError ? "network" : "query" };
  }
}

export type CampaignDetailResult =
  | { status: "ready"; campaign: CampaignDetail; contentStatus: "blocked" | "ready" | "error"; variants: ContentVariant[]; contentReason?: DataFailureKind }
  | { status: "not-found" | "unauthenticated" | "forbidden" }
  | { status: "unavailable" | "error"; reason: DataFailureKind };

export async function getCampaignDetail(id: string): Promise<CampaignDetailResult> {
  if (!databaseUuidSchema.safeParse(id).success) return { status: "not-found" };
  const access = await getResellerAccess();
  if (access.status !== "allowed") return access;
  let step: DiagnosticStep = "detail.query";
  try {
    // One joined read, no product-per-card or content-per-persona requests.
    const result = await access.client.from("campaigns")
      .select("id,product_id,name,target_location,target_audience,commission_rate,start_date,end_date,products!campaigns_product_id_fkey(id,name,description,category)")
      .eq("id", id).eq("status", "active").maybeSingle();
    if (result.error) {
      diagnoseFailure(step, result.error);
      return { status: "error", reason: classifyDataFailure({ code: result.error.code, status: result.status }) };
    }
    diagnose(step, result.data === null ? "NO_ROW" : "ROW");
    if (result.data === null) return { status: "not-found" };
    step = "detail.validation";
    const campaign = parseCampaignDetail(result.data);
    diagnose(step, "OK");
    const policy = getConfirmedContentPolicy();
    diagnose("contents.policy", "READY");
    // Preserve campaign/product information if only the Content Kit read fails.
    // Identity is from getUser + membership, never route/query/body input.
    const context = { campaignId: campaign.id, resellerId: access.resellerId };
    try {
      const kit = await loadContentKit(context, policy, async () => {
        step = "contents.query";
        const rows = await queryContentKit(access.client, context, policy);
        diagnose(step, "OK");
        diagnose(step, rows.length ? "ROW" : "NO_ROW");
        step = "contents.validation";
        return rows;
      }, (code, fields) => diagnose("contents.validation", code, fields));
      diagnose("contents.validation", "OK");
      diagnose("contents.result", kit.variants.length ? "READY" : "EMPTY");
      return { status: "ready", campaign, contentStatus: kit.status, variants: kit.variants };
    } catch (error) {
      diagnoseFailure(step, error);
      return { status: "ready", campaign, contentStatus: "error", variants: [],
        contentReason: error instanceof ContentReadFailure ? error.reason : error instanceof z.ZodError ? "schema" : error instanceof TypeError ? "network" : "query" };
    }
  } catch (error) {
    diagnoseFailure(step, error);
    return { status: "error", reason: error instanceof ContentReadFailure ? error.reason : error instanceof z.ZodError ? "schema" : error instanceof TypeError ? "network" : "query" };
  }
}

import { z } from "zod";
import { databaseUuidSchema } from "./database-uuid";

export const personas = [
  { id: "local-guide", label: "Local Guide" },
  { id: "family", label: "Family" },
  { id: "foodie", label: "Foodie" },
  { id: "budget-traveler", label: "Budget Traveler" },
] as const;
export type Persona = (typeof personas)[number]["id"];
export type ContentVariant = {
  id: string;
  persona: Persona;
  hook: string | null;
  script: string | null;
  caption: string | null;
  cta: string | null;
};

export type ContentPublicationPolicy = {
  statuses: readonly string[];
  personaValues: Readonly<Record<string, Persona>>;
  allowShared: boolean;
  allowOwned: boolean;
};

// The 15/10/2026 addendum in docs/Fe-update-2026-10-15.md supersedes
// the older published/public rule: only the exact lowercase approved is visible.
// No browser/env input controls this policy or the current reseller identity.
export const confirmedContentPolicy: ContentPublicationPolicy = {
  statuses: ["approved"], allowShared: true, allowOwned: true,
  personaValues: { local_guide: "local-guide", family: "family", foodie: "foodie", budget_traveler: "budget-traveler" },
};
export function getConfirmedContentPolicy(): ContentPublicationPolicy { return confirmedContentPolicy; }

export type ContentContext = { campaignId: string; resellerId: string };
export const contentContextSchema = z.object({ campaignId: databaseUuidSchema, resellerId: databaseUuidSchema });
const optionalContentText = z.string().nullish().transform((value) => value ?? null);
const contentRowSchema = z.object({
  id: databaseUuidSchema, campaign_id: databaseUuidSchema.nullable(),
  reseller_id: databaseUuidSchema.nullable(), persona: z.string().nullable(), status: z.string().nullable(),
  hook: optionalContentText, script: optionalContentText, caption: optionalContentText, cta: optionalContentText,
});

export type ContentExclusionCode = "STATUS_EXCLUDED" | "CAMPAIGN_EXCLUDED" | "OWNER_EXCLUDED" | "PERSONA_UNMAPPED";
type OnContentExcluded = (code: ContentExclusionCode, fields: readonly string[]) => void;

export function parseContentVariants(data: unknown, context: ContentContext, policy: ContentPublicationPolicy, onExcluded?: OnContentExcluded): ContentVariant[] {
  const scope = contentContextSchema.parse(context);
  return z.array(contentRowSchema).parse(data).flatMap((row) => {
    const persona = row.persona !== null && Object.prototype.hasOwnProperty.call(policy.personaValues, row.persona)
      ? policy.personaValues[row.persona] : undefined;
    const visibleOwner = (row.reseller_id === null && policy.allowShared)
      || (row.reseller_id === scope.resellerId && policy.allowOwned);
    if (row.status === null || !policy.statuses.includes(row.status)) { onExcluded?.("STATUS_EXCLUDED", ["status"]); return []; }
    if (row.campaign_id !== scope.campaignId) { onExcluded?.("CAMPAIGN_EXCLUDED", ["campaign_id"]); return []; }
    if (!visibleOwner) { onExcluded?.("OWNER_EXCLUDED", ["reseller_id"]); return []; }
    if (!persona) { onExcluded?.("PERSONA_UNMAPPED", ["persona"]); return []; }
    return [{ id: row.id, persona, hook: row.hook, script: row.script, caption: row.caption, cta: row.cta }];
  });
}

// Kept independent of Supabase so the publication boundary is testable with
// an isolated source. With no confirmed policy, it must not even fetch contents.
export async function loadContentKit(
  context: ContentContext,
  policy: ContentPublicationPolicy | null,
  queryContents: () => Promise<unknown>,
  onExcluded?: OnContentExcluded,
): Promise<{ status: "blocked" | "ready"; variants: ContentVariant[] }> {
  if (!policy) return { status: "blocked", variants: [] };
  const scope = contentContextSchema.parse(context);
  if (!policy.allowShared && !policy.allowOwned) return { status: "ready", variants: [] };
  return { status: "ready", variants: parseContentVariants(await queryContents(), scope, policy, onExcluded) };
}

const campaignDetailSchema = z.object({
  id: databaseUuidSchema, product_id: databaseUuidSchema.nullable(), name: z.string(),
  target_location: z.string().nullable(), target_audience: z.string().nullable(),
  commission_rate: z.number().finite().nullable(), start_date: z.string().nullable(), end_date: z.string().nullable(),
  products: z.object({ id: databaseUuidSchema, name: z.string(), description: z.string().nullable(), category: z.string().nullable() }).nullable(),
}).refine((row) => row.products === null || row.products.id === row.product_id);

export type CampaignDetail = z.infer<typeof campaignDetailSchema>;
export function parseCampaignDetail(data: unknown): CampaignDetail { return campaignDetailSchema.parse(data); }

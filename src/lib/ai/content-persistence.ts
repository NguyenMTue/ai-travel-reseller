import { z } from "zod";

import type { ContentGuardrailResult } from "./guardrails/content-validator.ts";
import {
  campaignContentOutputSchema,
  type CampaignContentOutput,
  type CampaignScript,
} from "./schemas/content-schema.ts";

const persistenceContextSchema = z.object({
  // PostgreSQL accepts the checked-in deterministic seed GUIDs even when
  // their variant bits are not RFC UUID variants, so use the DB shape here.
  campaign_id: z.guid(),
  product_id: z.guid(),
  reseller_id: z.guid().nullable().default(null),
});

export type ContentPersistenceContext = z.input<
  typeof persistenceContextSchema
>;

export type ContentPersistenceStatus = "approved" | "needs_review";

export type ContentPersistenceRow = {
  campaign_id: string;
  product_id: string;
  reseller_id: string | null;
  persona: CampaignContentOutput["persona"];
  hook: string;
  script: string | null;
  caption: string | null;
  cta: string | null;
  status: ContentPersistenceStatus;
};

export function formatCampaignScript(script: CampaignScript): string {
  return [
    script.title,
    `Thời lượng: ${script.duration} giây`,
    ...script.scenes.map((scene, index) => `${index + 1}. ${scene}`),
  ].join("\n");
}

export function toPersistenceStatus(
  guardrail: ContentGuardrailResult,
): ContentPersistenceStatus {
  const isConsistentApproval =
    guardrail.isValid &&
    guardrail.flags.length === 0 &&
    guardrail.recommended_status === "APPROVED";
  const isConsistentReview =
    !guardrail.isValid &&
    guardrail.flags.length > 0 &&
    guardrail.recommended_status === "NEEDS_REVIEW";

  if (!isConsistentApproval && !isConsistentReview) {
    throw new Error("Inconsistent content guardrail result");
  }

  return isConsistentApproval ? "approved" : "needs_review";
}

/**
 * Maps one persona generation to ten database rows without cycling or
 * duplicating the five scripts, captions, or CTAs. Rows 0-4 contain complete
 * content kits; rows 5-9 intentionally contain hooks only.
 */
export function mapCampaignContentToRows(
  value: CampaignContentOutput,
  guardrail: ContentGuardrailResult,
  context: ContentPersistenceContext,
): ContentPersistenceRow[] {
  const output = campaignContentOutputSchema.parse(value);
  const scope = persistenceContextSchema.parse(context);
  const status = toPersistenceStatus(guardrail);

  return output.hooks.map((hook, index) => ({
    ...scope,
    persona: output.persona,
    hook,
    script:
      index < output.scripts.length
        ? formatCampaignScript(output.scripts[index])
        : null,
    caption: output.captions[index] ?? null,
    cta: output.ctas[index] ?? null,
    status,
  }));
}

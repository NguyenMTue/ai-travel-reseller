import { z } from "zod";

import {
  campaignContentOutputSchema,
  type CampaignContentOutput,
  type CampaignScript,
} from "./schemas/content-schema.ts";

const campaignBatchContextSchema = z
  .object({
    campaign_id: z.guid(),
  })
  .strict();

export type CampaignContentBatchRecord = {
  persona: CampaignContentOutput["persona"];
  hook: string;
  script: CampaignScript | null;
  caption: string | null;
  cta: string | null;
};

export type CampaignContentBatchPayload = {
  campaign_id: string;
  records: CampaignContentBatchRecord[];
};

/**
 * Builds the exact request body accepted by BE3's POST /contents/batch API.
 * The mapper preserves the agreed 10/5 contract: five complete content kits
 * followed by five hook-only records. It never cycles generated assets.
 */
export function mapCampaignContentToBatchPayload(
  value: CampaignContentOutput,
  campaignId: string,
): CampaignContentBatchPayload {
  const output = campaignContentOutputSchema.parse(value);
  const { campaign_id } = campaignBatchContextSchema.parse({
    campaign_id: campaignId,
  });

  return {
    campaign_id,
    records: output.hooks.map((hook, index) => ({
      persona: output.persona,
      hook,
      script: output.scripts[index] ?? null,
      caption: output.captions[index] ?? null,
      cta: output.ctas[index] ?? null,
    })),
  };
}

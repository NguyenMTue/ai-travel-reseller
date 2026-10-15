"use server";

import { createMerchantCampaign } from "@/src/lib/merchant/campaign-server";

export async function createCampaignAction(input: unknown) {
  return createMerchantCampaign(input);
}

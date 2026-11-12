import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import { hasSupabaseConfig } from "@/src/lib/supabase/config";
import { campaignFailureMessages, type CampaignFormLoadResult, type CampaignSaveResult } from "./campaign-form";
import { getConfirmedCampaignCreatePolicy } from "./campaign-policy";
import { createMerchantCampaignSource } from "./campaign-source";
import { loadMerchantCampaignForm, saveMerchantCampaign } from "./campaign-service";
import { triggerCampaignContentGeneration } from "@/src/lib/automation/database-webhooks";

export async function getMerchantCampaignForm(): Promise<CampaignFormLoadResult> {
  if (!hasSupabaseConfig) return { status: "error", reason: "configuration" };
  try {
    const client = createClient(await cookies());
    return await loadMerchantCampaignForm(createMerchantCampaignSource(client), getConfirmedCampaignCreatePolicy());
  } catch {
    return { status: "error", reason: "configuration" };
  }
}

export async function createMerchantCampaign(input: unknown): Promise<CampaignSaveResult> {
  if (!hasSupabaseConfig) return { status: "error", reason: "configuration", message: campaignFailureMessages.configuration };
  try {
    const client = createClient(await cookies());
    const result = await saveMerchantCampaign(createMerchantCampaignSource(client), input, getConfirmedCampaignCreatePolicy());

    // Kích hoạt tự động n8n Webhook sinh Content Kit khi chiến dịch tạo thành công
    if (result.status === "success" && "campaignId" in result && result.campaignId) {
      triggerCampaignContentGeneration(result.campaignId, { id: result.campaignId });
    }

    return result;
  } catch {
    return { status: "error", reason: "configuration", message: campaignFailureMessages.configuration };
  }
}

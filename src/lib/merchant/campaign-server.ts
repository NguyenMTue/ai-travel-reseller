import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import { hasSupabaseConfig } from "@/src/lib/supabase/config";
import { campaignFailureMessages, type CampaignFormLoadResult, type CampaignSaveResult } from "./campaign-form";
import { getConfirmedCampaignCreatePolicy } from "./campaign-policy";
import { createMerchantCampaignSource } from "./campaign-source";
import { loadMerchantCampaignForm, saveMerchantCampaign } from "./campaign-service";
import { triggerCampaignContentGeneration, runNonBlocking } from "@/src/lib/automation/database-webhooks";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { executeAutoVideoPipeline } from "@/src/lib/video-engine/auto-pipeline-worker";

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

    // 1. Kích hoạt tự động n8n Webhook sinh Content Kit khi chiến dịch tạo thành công
    if (result.status === "success" && "campaignId" in result && result.campaignId) {
      triggerCampaignContentGeneration(result.campaignId, { id: result.campaignId });

      // 2. [BE1-W6-01] Tự động kích hoạt luồng Auto-Generate Video Review 40-50s ngầm (Zero-friction)
      const campaignId = result.campaignId;
      runNonBlocking(async () => {
        try {
          const adminClient = createAdminClient();
          const { data: cRow } = await adminClient
            .from("campaigns")
            .select("id, merchant_id, product_id, name, target_location, target_audience")
            .eq("id", campaignId)
            .maybeSingle();

          if (cRow) {
            await executeAutoVideoPipeline(
              {
                campaignId: cRow.id,
                merchantId: cRow.merchant_id,
                productId: cRow.product_id,
                tourName: cRow.name,
                location: cRow.target_location || "Miền Trung",
                targetAudience: cRow.target_audience || "Du khách trẻ",
                targetDurationSec: 46,
              },
              `auto-campaign-trigger-${Date.now()}`
            );
          }
        } catch (err) {
          console.warn("[AUTO_VIDEO_PIPELINE_CAMPAIGN_CREATE_WARN] Non-blocking worker error:", err);
        }
      });
    }

    return result;
  } catch {
    return { status: "error", reason: "configuration", message: campaignFailureMessages.configuration };
  }
}

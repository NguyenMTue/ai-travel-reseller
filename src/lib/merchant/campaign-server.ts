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
import {
  computeOptimalCampaignDurationSec,
  executeAutoVideoPipeline,
} from "@/src/lib/video-engine/auto-pipeline-worker";

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

      // 2. Tự động chọn ảnh phù hợp từ kho tư liệu và sinh Video Chiến dịch 30-45s chạy ngầm (Zero-friction)
      const campaignId = result.campaignId;
      runNonBlocking(async () => {
        try {
          const adminClient = createAdminClient();
          const { data: cRow } = await adminClient
            .from("campaigns")
            .select("id, merchant_id, product_id, name, target_location, target_audience, ai_custom_instructions")
            .eq("id", campaignId)
            .maybeSingle();

          if (cRow) {
            let productName = cRow.name;
            let productHighlights: string | undefined = undefined;
            let salePrice: number | undefined = undefined;
            let originalPrice: number | null = null;

            if (cRow.product_id) {
              const { data: pRow } = await adminClient
                .from("products")
                .select("name, description, sale_price, original_price")
                .eq("id", cRow.product_id)
                .maybeSingle();

              if (pRow) {
                productName = pRow.name || cRow.name;
                productHighlights = pRow.description || undefined;
                salePrice = pRow.sale_price != null ? Number(pRow.sale_price) : undefined;
                originalPrice = pRow.original_price != null ? Number(pRow.original_price) : null;
              }
            }

            const pipelineInput = {
              campaignId: cRow.id,
              merchantId: cRow.merchant_id,
              productId: cRow.product_id,
              tourName: productName,
              campaignName: cRow.name,
              location: cRow.target_location || "Đà Nẵng - Miền Trung",
              highlights: productHighlights,
              targetAudience: cRow.target_audience || "Du khách đam mê trải nghiệm",
              price: salePrice,
              originalPrice,
              customInstructions: cRow.ai_custom_instructions || undefined,
            };

            const optimalDurationSec = computeOptimalCampaignDurationSec(pipelineInput);

            await executeAutoVideoPipeline(
              {
                ...pipelineInput,
                targetDurationSec: optimalDurationSec,
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

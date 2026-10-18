import type { SupabaseClient } from "@supabase/supabase-js";
import type { MerchantCampaignSource } from "./campaign-service";

export function createMerchantCampaignSource(client: SupabaseClient): MerchantCampaignSource {
  return {
    async getUser() {
      const { data, error } = await client.auth.getUser();
      return { data: data.user, error, status: error?.status };
    },
    async getMerchant(userId) {
      return await client.from("merchants").select("id").eq("id", userId).maybeSingle();
    },
    async listProducts(merchantId, offset) {
      return await client.from("products").select("id,merchant_id,name")
        .eq("merchant_id", merchantId).order("id", { ascending: true }).range(offset, offset + 499);
    },
    async getProduct(merchantId, productId) {
      return await client.from("products").select("id,merchant_id,name")
        .eq("merchant_id", merchantId).eq("id", productId).maybeSingle();
    },
    async insertCampaign(values) {
      // The installed PostgREST SDK retries by default. Explicitly forbid POST retries.
      return await client.from("campaigns").insert(values)
        .select("id,merchant_id,product_id,name").single().retry(false);
    },
  };
}

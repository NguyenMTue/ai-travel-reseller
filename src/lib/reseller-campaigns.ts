import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import { hasSupabaseConfig } from "@/src/lib/supabase/config";
import {
  sampleCampaigns,
  sampleContents,
  type CampaignItem,
  type ResellerCampaignContent,
} from "@/src/lib/reseller-data";

type DataResult<T> = {
  data: T;
  source: "database" | "demo";
  error: string | null;
};

function formatDate(value: string | null): string {
  if (!value) return "Chưa xác định";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("vi-VN").format(date);
}

function mapCampaign(
  row: {
    id: string;
    name: string;
    merchant_id: string | null;
    product_id: string | null;
    start_date: string | null;
    end_date: string | null;
    target_audience: string | null;
    target_location: string | null;
    commission_rate: number | null;
    status: string | null;
  },
  product?: {
    name: string;
    description: string | null;
    category: string | null;
    original_price: number | null;
    sale_price: number | null;
    commission_rate: number | null;
    booking_url: string | null;
    payment_url: string | null;
    status: string | null;
  },
  merchant?: { name: string },
): CampaignItem {
  const status = row.status?.toLowerCase();
  return {
    id: row.id,
    name: row.name,
    merchant_id: row.merchant_id ?? "",
    merchant_name: merchant?.name ?? "Đối tác du lịch",
    product_id: row.product_id ?? "",
    product_name: product?.name ?? "Sản phẩm chưa được liên kết",
    description: product?.description ?? undefined,
    category: product?.category ?? "Chưa phân loại",
    original_price: Number(product?.original_price ?? 0),
    sale_price: Number(product?.sale_price ?? 0),
    commission_rate: Number(
      row.commission_rate ?? product?.commission_rate ?? 0,
    ),
    start_date: formatDate(row.start_date),
    end_date: formatDate(row.end_date),
    target_audience: row.target_audience ?? "Chưa cập nhật",
    target_location: row.target_location ?? "Chưa cập nhật",
    status: status === "draft" || status === "ended" ? status : "active",
    booking_url: product?.booking_url ?? "",
    payment_url: product?.payment_url ?? "",
  };
}

export async function getResellerCampaignFeed(): Promise<
  DataResult<CampaignItem[]>
> {
  if (!hasSupabaseConfig) {
    return { data: sampleCampaigns, source: "demo", error: null };
  }

  const supabase = createClient(await cookies());
  const { data: campaigns, error: campaignError } = await supabase
    .from("campaigns")
    .select("*")
    .order("start_date", { ascending: false });

  if (campaignError) {
    return {
      data: [],
      source: "database",
      error: "Không tải được danh sách chiến dịch. Vui lòng thử lại sau.",
    };
  }

  const productIds = [...new Set(campaigns.map((item) => item.product_id).filter(Boolean))] as string[];
  const merchantIds = [...new Set(campaigns.map((item) => item.merchant_id).filter(Boolean))] as string[];
  const [productsResult, merchantsResult] = await Promise.all([
    productIds.length
      ? supabase.from("products").select("*").in("id", productIds)
      : Promise.resolve({ data: [], error: null }),
    merchantIds.length
      ? supabase.from("merchants").select("id,name").in("id", merchantIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (productsResult.error || merchantsResult.error) {
    return {
      data: [],
      source: "database",
      error: "Không tải được thông tin sản phẩm chiến dịch. Vui lòng thử lại.",
    };
  }

  const products = new Map(productsResult.data.map((item) => [item.id, item]));
  const merchants = new Map(merchantsResult.data.map((item) => [item.id, item]));
  const rows = campaigns
    .filter((item) => item.status?.toLowerCase() === "active")
    .filter((item) => {
      const product = item.product_id ? products.get(item.product_id) : undefined;
      return !product?.status || product.status.toLowerCase() === "active";
    })
    .map((item) =>
      mapCampaign(
        item,
        item.product_id ? products.get(item.product_id) : undefined,
        item.merchant_id ? merchants.get(item.merchant_id) : undefined,
      ),
    );

  return { data: rows, source: "database", error: null };
}

export async function getResellerCampaignDetail(
  id: string,
): Promise<
  DataResult<{ campaign: CampaignItem | null; contents: ResellerCampaignContent[] }>
> {
  if (!hasSupabaseConfig) {
    const campaign = sampleCampaigns.find((item) => item.id === id) ?? null;
    const contents = sampleContents
      .filter((item) => item.campaign_id === id && item.status === "approved")
      .map((item) => ({
        id: item.id,
        campaign_id: item.campaign_id,
        persona: item.persona,
        hook: item.hook,
        script: item.script,
        caption: item.caption,
        cta: item.cta,
        status: item.status,
      }));
    return { data: { campaign, contents }, source: "demo", error: null };
  }

  const supabase = createClient(await cookies());
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (campaignError) {
    return {
      data: { campaign: null, contents: [] },
      source: "database",
      error: "Không tải được thông tin chiến dịch. Vui lòng thử lại sau.",
    };
  }
  if (!campaign) {
    return { data: { campaign: null, contents: [] }, source: "database", error: null };
  }

  const [productResult, merchantResult, contentsResult] = await Promise.all([
    campaign.product_id
      ? supabase.from("products").select("*").eq("id", campaign.product_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    campaign.merchant_id
      ? supabase.from("merchants").select("id,name").eq("id", campaign.merchant_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("contents")
      .select("id,campaign_id,persona,hook,script,caption,cta,status")
      .eq("campaign_id", id)
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
  ]);

  if (productResult.error || merchantResult.error || contentsResult.error) {
    return {
      data: { campaign: null, contents: [] },
      source: "database",
      error: "Không tải được nội dung đã duyệt của chiến dịch. Vui lòng thử lại.",
    };
  }

  return {
    data: {
      campaign: mapCampaign(campaign, productResult.data ?? undefined, merchantResult.data ?? undefined),
      contents: (contentsResult.data ?? []) as ResellerCampaignContent[],
    },
    source: "database",
    error: null,
  };
}

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import { getMerchantPortalAccess } from "@/src/lib/merchant/portal-server";
import { MerchantPortalAccessNotice } from "@/src/components/merchant/portal-access-notice";
import { CampaignList, type MerchantCampaignListItem } from "@/src/components/merchant/campaign-list";

export const metadata = { title: "Quản lý Chiến dịch Merchant" };
export const dynamic = "force-dynamic";

export default async function MerchantCampaignsPage() {
  const access = await getMerchantPortalAccess();
  if (access.status === "unauthenticated") {
    redirect("/login?next=/merchant/campaigns");
  }
  if (access.status !== "allowed") {
    return <MerchantPortalAccessNotice access={access} />;
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: rawCampaigns, error } = await supabase
    .from("campaigns")
    .select(
      "id, name, product_id, commission_rate, status, start_date, end_date, target_location, products:product_id (id, name)"
    )
    .eq("merchant_id", access.userId)
    .order("id", { ascending: false });

  if (error) {
    console.warn("[MerchantCampaigns] Lỗi truy vấn danh sách chiến dịch:", error.message);
  }

  const campaigns: MerchantCampaignListItem[] = (rawCampaigns || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    productId: c.product_id,
    productName: c.products?.name ?? "Sản phẩm chiến dịch",
    commissionRate: c.commission_rate != null ? Number(c.commission_rate) : null,
    status: c.status || "active",
    startDate: c.start_date,
    endDate: c.end_date,
    targetLocation: c.target_location,
  }));

  return <CampaignList initialCampaigns={campaigns} />;
}

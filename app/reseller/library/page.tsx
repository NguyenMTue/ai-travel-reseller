import { redirect } from "next/navigation";
import { getResellerAccess } from "@/src/lib/reseller/server";
import { ResellerAccessNotice } from "@/src/components/reseller/access-notice";
import { ResellerLibraryView, type ResellerMediaItem } from "@/src/components/reseller/library-view";

export const metadata = {
  title: "Thư viện Media & Video AI | Cộng tác viên",
};

export const dynamic = "force-dynamic";

export default async function ResellerLibraryPage() {
  const access = await getResellerAccess();
  if (access.status === "unauthenticated") {
    redirect("/login?next=%2Freseller%2Flibrary");
  }

  if (access.status !== "allowed") {
    return (
      <ResellerAccessNotice
        status={access.status}
        reason={access.status === "unavailable" ? access.reason : undefined}
        next="/reseller/library"
      />
    );
  }

  // Truy vấn danh sách video khả dụng cho Reseller từ bảng contents kèm thông tin chiến dịch
  const { data: contentsData, error } = await access.client
    .from("contents")
    .select(`
      id,
      campaign_id,
      product_id,
      persona,
      hook,
      script,
      caption,
      cta,
      video_url,
      status,
      created_at,
      campaigns:campaign_id (
        id,
        name,
        target_location,
        commission_rate,
        products:product_id (
          name,
          category
        )
      )
    `)
    .not("video_url", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[RESELLER_LIBRARY] Lỗi truy vấn contents video:", error.message);
  }

  const items: ResellerMediaItem[] = (contentsData || [])
    .filter((c: any) => c.video_url && typeof c.video_url === "string" && c.video_url.trim().length > 0)
    .map((c: any) => {
      const cmp = c.campaigns;
      return {
        id: c.id,
        campaignId: c.campaign_id,
        campaignName: cmp?.name || "Chiến dịch du lịch",
        location: cmp?.target_location || "Toàn quốc",
        commissionRate: cmp?.commission_rate || null,
        productName: cmp?.products?.name || null,
        category: cmp?.products?.category || null,
        persona: c.persona || "local_guide",
        hook: c.hook,
        script: c.script,
        caption: c.caption,
        cta: c.cta,
        videoUrl: c.video_url,
        status: c.status,
        createdAt: c.created_at,
      };
    });

  return <ResellerLibraryView items={items} resellerId={access.resellerId} />;
}

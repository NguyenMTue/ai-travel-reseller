import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import { getMerchantPortalAccess } from "@/src/lib/merchant/portal-server";
import { MerchantPortalAccessNotice } from "@/src/components/merchant/portal-access-notice";
import { getMerchantContentsList } from "@/src/lib/merchant/content-approval-service";
import { ContentApprovalList } from "@/src/components/merchant/content-approval-list";

export const metadata = {
  title: "Kiểm duyệt Nội dung AI | Merchant Portal",
};

export const dynamic = "force-dynamic";

export default async function MerchantContentsPage() {
  const access = await getMerchantPortalAccess();
  if (access.status === "unauthenticated") {
    redirect("/login?next=%2Fmerchant%2Fcontents");
  }

  if (access.status !== "allowed") {
    return <MerchantPortalAccessNotice access={access} />;
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Lấy danh sách chiến dịch để làm filter
  const { data: campaignsData } = await (supabase as any)
    .from("campaigns")
    .select("id, name")
    .eq("merchant_id", access.userId);

  const campaigns = (campaignsData || []).map((c: any) => ({
    id: c.id,
    title: c.name || c.title || "Chiến dịch #" + String(c.id).slice(0, 8),
  }));

  // Lấy danh sách nội dung ban đầu
  const result = await getMerchantContentsList(supabase, access.userId);

  const initialSummary = result.data || {
    total: 0,
    pending_count: 0,
    approved_count: 0,
    rejected_count: 0,
    contents: [],
  };

  return (
    <ContentApprovalList
      initialContents={initialSummary.contents}
      initialSummary={initialSummary}
      campaigns={campaigns}
      preview={false}
    />
  );
}

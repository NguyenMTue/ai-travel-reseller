import { notFound, redirect } from "next/navigation";
import { getCampaignDetail } from "@/src/lib/reseller/server";
import { CampaignDetailView } from "@/src/components/reseller/campaign-detail";
import { ResellerAccessNotice } from "@/src/components/reseller/access-notice";
import { FeedNotice } from "@/src/components/reseller/feed-states";
import { FeedRetry } from "@/src/components/reseller/campaign-feed";
import { dataFailureDescriptions } from "@/src/lib/reseller/data-failure";

export const metadata = { title: "Chi tiết chiến dịch & Content Kit" };
export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getCampaignDetail(id);
  if (result.status === "not-found") notFound();
  if (result.status === "unauthenticated") redirect(`/login?next=${encodeURIComponent(`/reseller/campaigns/${id}`)}`);
  if (result.status === "ready") return <CampaignDetailView campaign={result.campaign} contentStatus={result.contentStatus} contentReason={result.contentReason} variants={result.variants} />;
  if (result.status === "forbidden" || result.status === "unavailable") return <ResellerAccessNotice status={result.status}
    reason={result.status === "unavailable" ? result.reason : undefined} next={`/reseller/campaigns/${id}`} />;
  return <><h1 className="mb-6 text-3xl">Chi tiết chiến dịch</h1>
    <FeedNotice title="Chưa thể tải chiến dịch" description={result.status === "error" ? dataFailureDescriptions[result.reason] : "Vui lòng thử lại."}><FeedRetry /></FeedNotice></>;
}

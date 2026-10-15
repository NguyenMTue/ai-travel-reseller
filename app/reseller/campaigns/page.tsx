import { redirect } from "next/navigation";

import { CampaignFeed, FeedRetry } from "@/src/components/reseller/campaign-feed";
import { FeedNotice } from "@/src/components/reseller/feed-states";
import { ResellerAccessNotice } from "@/src/components/reseller/access-notice";
import { getCampaignFeed } from "@/src/lib/reseller/server";
import { dataFailureDescriptions } from "@/src/lib/reseller/data-failure";

export const metadata = { title: "Chiến dịch dành cho Cộng tác viên" };

export default async function CampaignsPage() {
  const result = await getCampaignFeed();
  if (result.status === "unauthenticated") redirect("/login?next=/reseller/campaigns");
  if (result.status === "forbidden" || result.status === "unavailable") {
    return <ResellerAccessNotice status={result.status} reason={result.status === "unavailable" ? result.reason : undefined} />;
  }
  if (result.status === "ready") return <CampaignFeed campaigns={result.campaigns} />;
  return (
      <>
        <h1 className="mb-6 font-[var(--font-display)] text-3xl">Chiến dịch dành cho bạn</h1>
        <FeedNotice title="Chưa thể tải chiến dịch" description={result.status === "error" ? dataFailureDescriptions[result.reason] : "Danh sách chưa tải được. Vui lòng thử lại."}>
          <FeedRetry />
        </FeedNotice>
      </>
  );
}

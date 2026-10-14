import { ResellerOverview } from "@/src/components/reseller/reseller-overview";
import { getResellerCampaignFeed, getResellerContentFeed, getResellerTrackingMetrics } from "@/src/lib/reseller-campaigns";

export const metadata = {
  title: "Tổng quan cộng tác viên — TravelLink AI",
};

export default async function ResellerOverviewPage() {
  const [campaignResult, contentResult, trackingMetrics] = await Promise.all([
    getResellerCampaignFeed(),
    getResellerContentFeed(),
    getResellerTrackingMetrics(),
  ]);
  return (
    <ResellerOverview
      campaigns={campaignResult.data}
      contents={contentResult.data}
      trackingMetrics={trackingMetrics}
      error={campaignResult.error ?? contentResult.error}
    />
  );
}

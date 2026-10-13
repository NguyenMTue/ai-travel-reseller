import { ResellerCampaignsView } from "@/src/components/reseller/reseller-campaigns-view";
import { getResellerCampaignFeed } from "@/src/lib/reseller-campaigns";

export const metadata = {
  title: "Danh sách chiến dịch — TravelLink AI",
};

export default async function ResellerCampaignsPage() {
  const result = await getResellerCampaignFeed();
  return (
    <ResellerCampaignsView
      campaigns={result.data}
      source={result.source}
      error={result.error}
    />
  );
}

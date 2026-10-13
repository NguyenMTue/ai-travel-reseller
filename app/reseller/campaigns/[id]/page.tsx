import { ResellerCampaignDetail } from "@/src/components/reseller/reseller-campaign-detail";
import { getResellerCampaignDetail } from "@/src/lib/reseller-campaigns";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Chi tiết chiến dịch — TravelLink AI",
};

export default async function ResellerCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getResellerCampaignDetail(id);
  if (!result.data.campaign && !result.error) notFound();

  return (
    <ResellerCampaignDetail
      campaign={result.data.campaign}
      contents={result.data.contents}
      source={result.source}
      error={result.error}
    />
  );
}

import { ResellerCampaignDetail } from "@/src/components/reseller/reseller-campaign-detail";

export const metadata = {
  title: "Chi tiết chiến dịch — TravelLink AI",
};

export default async function ResellerCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ResellerCampaignDetail id={id} />;
}

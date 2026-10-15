import { notFound } from "next/navigation";

export const metadata = { title: "Kiểm thử form Campaign", robots: { index: false, follow: false } };

export default async function MerchantCampaignPreviewPage({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const [{ MerchantCampaignPreview }, { campaignPreviewStates }] = await Promise.all([
    import("./preview"), import("@/tests/fixtures/merchant-campaigns"),
  ]);
  const { state } = await searchParams;
  const scenario = campaignPreviewStates.find(value => value === state) || "success";
  return <MerchantCampaignPreview key={scenario} scenario={scenario} />;
}

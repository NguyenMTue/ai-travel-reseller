import { redirect } from "next/navigation";
import { CampaignCreateScreen } from "@/src/components/merchant/campaign-create";
import { getMerchantCampaignForm } from "@/src/lib/merchant/campaign-server";
import { createCampaignAction } from "./actions";

export const metadata = { title: "Tạo chiến dịch" };

export default async function NewMerchantCampaignPage() {
  const result = await getMerchantCampaignForm();
  if (result.status === "error" && result.reason === "session") redirect("/login?next=/merchant/campaigns/new");
  return <CampaignCreateScreen result={result} submitAction={createCampaignAction} />;
}

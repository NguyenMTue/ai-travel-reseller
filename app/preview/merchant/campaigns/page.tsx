import { notFound } from "next/navigation";
import { CampaignList } from "@/src/components/merchant/campaign-list";
export default function Preview() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <><p className="notice mx-6 mt-5">BẢN XEM TRƯỚC · Dữ liệu mô phỏng, không ghi vào hệ thống thật.</p><CampaignList preview initialCampaigns={[]} /></>;
}

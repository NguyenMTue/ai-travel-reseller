import { ResellerContentView } from "@/src/components/reseller/reseller-content-view";
import { getResellerContentFeed } from "@/src/lib/reseller-campaigns";

export const metadata = {
  title: "Nội dung mẫu — TravelLink AI",
};

export default async function ResellerContentPage() {
  const result = await getResellerContentFeed();
  return <ResellerContentView contents={result.data} error={result.error} />;
}

import Link from "next/link";
import { FeedNotice } from "@/src/components/reseller/feed-states";
import { Button } from "@/src/components/ui/button";
import { ResellerShell } from "@/src/components/reseller/shell";

export default function PreviewCampaignNotFound() {
  return <ResellerShell preview><h1 className="mb-6 text-3xl">Không tìm thấy chiến dịch fixture</h1>
    <FeedNotice title="Không có dữ liệu fixture cho ID này" description="Không truy vấn Supabase và không thay thế dữ liệu thật.">
      <Button asChild variant="outline"><Link href="/preview/reseller">Về danh sách fixture</Link></Button>
    </FeedNotice></ResellerShell>;
}

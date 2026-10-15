import Link from "next/link";
import { FeedNotice } from "@/src/components/reseller/feed-states";
import { Button } from "@/src/components/ui/button";

export default function CampaignNotFound() {
  return <><h1 className="mb-6 text-3xl">Không tìm thấy chiến dịch</h1>
    <FeedNotice title="Chiến dịch không khả dụng" description="ID không hợp lệ hoặc chiến dịch không tồn tại, chưa hoạt động hay không được trả về theo quyền hiện tại.">
      <Button asChild variant="outline"><Link href="/reseller/campaigns">Về danh sách chiến dịch</Link></Button>
    </FeedNotice></>;
}

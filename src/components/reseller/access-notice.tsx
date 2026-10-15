import Link from "next/link";

import { Button } from "@/src/components/ui/button";
import { FeedRetry } from "./campaign-feed";
import { FeedNotice } from "./feed-states";
import { dataFailureDescriptions, type DataFailureKind } from "@/src/lib/reseller/data-failure";

export function ResellerAccessNotice({ status, reason, next = "/reseller/campaigns" }: { status: "forbidden" | "unavailable"; reason?: DataFailureKind; next?: string }) {
  return (
    <>
      <h1 className="mb-6 font-[var(--font-display)] text-3xl">Không gian Cộng tác viên</h1>
      <FeedNotice
        title={status === "forbidden" ? "Bạn chưa có quyền Cộng tác viên" : "Chưa thể xác minh quyền truy cập"}
        description={status === "forbidden"
          ? "Không tìm thấy hồ sơ Cộng tác viên trong dữ liệu được phép đọc. Kết quả này chưa xác định nguyên nhân; vui lòng nhờ hỗ trợ đối chiếu hồ sơ và quyền đọc."
          : reason ? dataFailureDescriptions[reason] : "Dịch vụ xác thực hoặc kiểm tra tài khoản đang không khả dụng. Vui lòng thử lại."}
      >
        {status === "unavailable" && <FeedRetry />}
        <Button asChild variant="outline">
          <Link href={`/login?next=${encodeURIComponent(next)}`}>Đến trang đăng nhập</Link>
        </Button>
      </FeedNotice>
    </>
  );
}

import Link from "next/link";
import type { PortalAccess } from "@/src/lib/portal-access";
import { dataFailureDescriptions } from "@/src/lib/reseller/data-failure";

export function MerchantPortalAccessNotice({ access }: { access: Exclude<PortalAccess, { status: "allowed" }> }) {
  return <main id="main-content" className="container py-12">
    <h1 className="mb-5 text-3xl [font-family:var(--font-display)]">Không gian Doanh nghiệp</h1>
    <div role="alert" className="notice">
      <h2>{access.status === "forbidden" ? "Bạn chưa có quyền Merchant" : "Chưa thể xác minh quyền truy cập"}</h2>
      <p>{access.status === "forbidden" ? "Chưa đọc thấy hồ sơ Merchant phù hợp với phiên đăng nhập. Kết quả này chưa xác định nguyên nhân; vui lòng nhờ hỗ trợ đối chiếu hồ sơ và quyền đọc."
        : access.status === "unavailable" ? dataFailureDescriptions[access.reason] : "Phiên đăng nhập không còn hợp lệ."}</p>
    </div>
    <Link className="mt-5 inline-block" href="/login">Về trang đăng nhập</Link>
    <Link className="ml-5 inline-block" href="/">Trang chủ</Link>
  </main>;
}

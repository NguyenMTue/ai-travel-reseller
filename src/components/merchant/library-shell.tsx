import Link from "next/link";
import { Film } from "lucide-react";
import styles from "./library.module.css";

export function LibraryShell({children}:{children:React.ReactNode;preview?:boolean}) {
  return <div className={styles.shell}><div className={styles.main}>
    <section className={styles.heading}><p className="eyebrow">MERCHANT · MEDIA LIBRARY</p><h1>Thư viện <em>media.</em></h1><p>Chất liệu cho câu chuyện hành trình của bạn. Khám phá video tham khảo và chọn cảm hứng cho bước tiếp theo.</p></section>
    {children}
  </div><footer className={styles.footer}>TravelLink AI · Những hành trình bắt đầu từ cảm hứng.</footer></div>;
}

export function LibraryPending() {
  return <section className={styles.pending} aria-labelledby="library-pending-title"><span className={styles.icon}><Film size={28} aria-hidden="true" /></span>
    <p className="eyebrow">ĐANG CHUẨN BỊ</p><h2 id="library-pending-title">Thư viện đang được hoàn thiện</h2>
    <p>Thư viện dành riêng cho từng Merchant. Danh sách media thật chưa được bật trong lúc nhóm phụ trách kiểm chứng quyền truy cập.</p>
    <p>Hiện chưa tải dữ liệu tài khoản. Bạn có thể tiếp tục quản lý chiến dịch trong lúc chờ thư viện sẵn sàng.</p>
    <Link prefetch={false} className="button button-outline" href="/merchant">Về tổng quan</Link>
  </section>;
}

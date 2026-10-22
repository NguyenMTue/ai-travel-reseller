import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Film, ShieldCheck } from "lucide-react";
import { Brand } from "@/src/components/brand";
import styles from "./library.module.css";

export function LibraryShell({children,preview=false}:{children:React.ReactNode;preview?:boolean}) {
  const root=preview?"/preview/merchant":"/merchant";
  return <div className={styles.shell}>
    <header className={styles.header}><Brand /><span className={styles.workspace}><ShieldCheck size={16} aria-hidden="true" />Không gian doanh nghiệp</span></header>
    <main id="main-content" className={styles.main}>
      <nav aria-label="Điều hướng Merchant" className={styles.nav}>
        <Link prefetch={false} href={root}><ArrowLeft size={16} aria-hidden="true" />Tổng quan</Link>
        <Link prefetch={false} href={`${root}/library`} aria-current="page"><Film size={17} aria-hidden="true" />Thư viện media</Link>
        <Link prefetch={false} href={`${root}/campaigns/new`}>Tạo chiến dịch<ArrowUpRight size={15} aria-hidden="true" /></Link>
      </nav>
      <section className={styles.heading}><p className="eyebrow">MERCHANT · MEDIA LIBRARY</p><h1>Thư viện <em>media.</em></h1><p>Chất liệu cho câu chuyện hành trình của bạn. Khám phá video tham khảo và chọn cảm hứng cho bước tiếp theo.</p></section>
      {children}
    </main>
    <footer className={styles.footer}>TravelLink AI · Những hành trình bắt đầu từ cảm hứng.</footer>
  </div>;
}

export function LibraryPending() {
  return <section className={styles.pending} aria-labelledby="library-pending-title"><span className={styles.icon}><Film size={28} aria-hidden="true" /></span>
    <p className="eyebrow">ĐANG CHUẨN BỊ</p><h2 id="library-pending-title">Thư viện đang được hoàn thiện</h2>
    <p>Thư viện dành riêng cho từng Merchant. Danh sách media thật chưa được bật trong lúc nhóm phụ trách kiểm chứng quyền truy cập.</p>
    <p>Hiện chưa tải dữ liệu tài khoản. Bạn có thể tiếp tục quản lý chiến dịch trong lúc chờ thư viện sẵn sàng.</p>
    <Link prefetch={false} className="button button-outline" href="/merchant">Về tổng quan</Link>
  </section>;
}

import Link from "next/link";
import { Brand } from "./brand";
import { Button } from "./ui/button";
export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand />
        <nav aria-label="Điều hướng chính">
          <Link href="/#how-it-works">Cách hoạt động</Link>
          <Link href="/chat">Trợ lý AI</Link>
          <Link href="/preview/merchant">Xem Dashboard</Link>
        </nav>
        <div className="header-actions">
          <Link href="/login" className="login-link">
            Đăng nhập
          </Link>
          <Button asChild size="sm">
            <Link href="/register">
              Bắt đầu ngay <span aria-hidden>↗</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

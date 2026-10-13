import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { Brand } from "@/src/components/brand";

export const metadata = {
  title: "Không tìm thấy trang — TravelLink AI",
};

export default function NotFound() {
  return (
    <main id="main-content" className="system-state-page">
      <div className="system-state-brand">
        <Brand />
      </div>
      <section className="system-state-content" aria-labelledby="not-found-title">
        <span className="system-state-icon" aria-hidden="true">
          <Compass size={27} />
        </span>
        <p className="system-state-code">404</p>
        <p className="eyebrow">LỆCH MỘT NHỊP TRÊN HÀNH TRÌNH</p>
        <h1 id="not-found-title">Không tìm thấy trang</h1>
        <p className="system-state-description">
          Đường dẫn này có thể đã thay đổi hoặc không còn tồn tại. Hãy quay về
          trang chủ để tiếp tục khám phá TravelLink AI.
        </p>
        <div className="system-state-actions">
          <Link href="/" className="button button-primary">
            <ArrowLeft aria-hidden="true" /> Về trang chủ
          </Link>
          <Link href="/chat" className="button button-outline">
            Khám phá cùng trợ lý AI
          </Link>
        </div>
      </section>
    </main>
  );
}

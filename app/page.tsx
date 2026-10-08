import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  Network,
  ShieldCheck,
  MessageCircle,
  Package,
  Send,
} from "lucide-react";
import { SiteHeader } from "@/src/components/site-header";
import { Brand } from "@/src/components/brand";
import { Button } from "@/src/components/ui/button";
export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="container hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="dot" /> KẾT NỐI DU LỊCH, MỞ RỘNG CƠ HỘI
            </div>
            <h1>
              Trải nghiệm hay.
              <br />
              Kết nối đúng.
              <br />
              <em>Vươn xa cùng AI.</em>
            </h1>
            <p className="hero-description">
              Đưa sản phẩm du lịch của bạn đến gần hơn với khách hàng qua mạng
              lưới cộng tác viên và trợ lý bán hàng AI.
            </p>
            <div className="hero-buttons">
              <Button asChild>
                <Link href="/register">
                  Tôi là doanh nghiệp <ArrowUpRight />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/register?role=reseller">
                  Trở thành cộng tác viên <ArrowRight />
                </Link>
              </Button>
            </div>
            <div className="hero-note">
              <ShieldCheck size={18} />
              <span>Khách hàng thanh toán trực tiếp với doanh nghiệp.</span>
            </div>
            <div className="destination-line">
              <span>KHỞI ĐẦU TẠI MIỀN TRUNG</span>
              <strong>
                Đà Nẵng <i>✦</i> Hội An
              </strong>
            </div>
          </div>
          <div className="hero-art">
            <Image
              src="/coast.svg"
              fill
              priority
              alt="Minh họa núi, biển và bờ cát miền Trung trong ánh nắng ấm"
              sizes="(max-width: 760px) 100vw, 50vw"
            />
            <div className="art-top">
              <span>ĐIỂM ĐẾN CỦA NHỮNG KẾT NỐI</span>
              <span>16°03′ N · 108°12′ E</span>
            </div>
            <div className="art-title">
              Local stories.
              <br />
              <em>Wider horizons.</em>
            </div>
            <div className="floating-note">
              <span className="note-icon">
                <Sparkles />
              </span>
              <div>
                <strong>Mỗi trải nghiệm, một câu chuyện</strong>
                <p>AI hỗ trợ. Con người kết nối.</p>
              </div>
            </div>
            <div className="art-caption">
              01 / ĐÀ NẴNG — HỘI AN <ArrowUpRight />
            </div>
          </div>
        </section>
        <section className="value-strip">
          <div className="container value-grid">
            <span>
              <Package /> Sản phẩm từ doanh nghiệp
            </span>
            <span>
              <Sparkles /> Nội dung hỗ trợ bởi AI
            </span>
            <span>
              <Network /> Mạng lưới cộng tác viên
            </span>
            <span>
              <ShieldCheck /> Thanh toán chính thức
            </span>
          </div>
        </section>
        <section className="container section" id="how-it-works">
          <div className="section-heading">
            <div>
              <p className="eyebrow">MỘT KẾT NỐI. NHIỀU CƠ HỘI.</p>
              <h2>
                Từ trải nghiệm địa phương
                <br />
                đến hành trình của khách hàng.
              </h2>
            </div>
            <p>
              Một quy trình liền mạch, để bạn tập trung vào điều mình làm tốt
              nhất.
            </p>
          </div>
          <div className="steps">
            {[
              {
                icon: Package,
                title: "Bạn mang đến trải nghiệm",
                text: "Doanh nghiệp cung cấp sản phẩm, thông tin chính xác và đường dẫn đặt dịch vụ chính thức.",
              },
              {
                icon: Send,
                title: "Cộng tác viên lan tỏa",
                text: "AI hỗ trợ chuẩn bị nội dung. Cộng tác viên lựa chọn và chia sẻ trên kênh của mình.",
              },
              {
                icon: MessageCircle,
                title: "AI kết nối cuộc trò chuyện",
                text: "Trợ lý giải đáp từ thông tin đã duyệt và hướng khách đến trang thanh toán của doanh nghiệp.",
              },
            ].map((s, i) => (
              <article className="step" key={s.title}>
                <div className="step-top">
                  <s.icon />
                  <span>0{i + 1}</span>
                </div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="container cta-panel">
          <div>
            <p className="eyebrow">HÀNH TRÌNH TIẾP THEO</p>
            <h2>Cùng mở rộng những kết nối.</h2>
            <p>Khám phá không gian dành cho doanh nghiệp của bạn.</p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/preview/merchant">
              Khám phá Dashboard <ArrowUpRight />
            </Link>
          </Button>
        </section>
      </main>
      <footer className="container footer">
        <Brand />
        <p>Được xây dựng cho những trải nghiệm Việt Nam.</p>
        <Link href="/chat">Trò chuyện cùng AI ↗</Link>
      </footer>
    </>
  );
}

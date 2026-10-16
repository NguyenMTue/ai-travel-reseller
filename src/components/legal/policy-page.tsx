import Link from "next/link";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";

type PolicySection = { title: string; paragraphs: string[] };

export function PolicyPage({
  title,
  description,
  updatedLabel,
  sections,
  kind,
}: {
  title: string;
  description: string;
  updatedLabel: string;
  sections: PolicySection[];
  kind: "terms" | "privacy";
}) {
  const Icon = kind === "terms" ? FileText : ShieldCheck;

  return (
    <main className="legal-page">
      <div className="legal-page-inner">
        <Link className="legal-back-link" href="/" aria-label="Quay về trang chủ TravelLink AI">
          <ArrowLeft size={16} /> Về trang chủ
        </Link>

        <header className="legal-hero">
          <span className="legal-icon"><Icon size={22} /></span>
          <p className="legal-eyebrow">TRAVELLINK AI · CHÍNH SÁCH NỀN TẢNG</p>
          <h1>{title}</h1>
          <p className="legal-description">{description}</p>
          <p className="legal-updated">{updatedLabel}</p>
        </header>

        <div className="legal-notice" role="note">
          Nội dung này là bản thông tin giao diện và cần được đơn vị vận hành rà soát, bổ sung các thông tin pháp lý và liên hệ trước khi phát hành chính thức.
        </div>

        <article className="legal-content">
          {sections.map((section, index) => (
            <section className="legal-section" key={section.title}>
              <h2><span>{String(index + 1).padStart(2, "0")}</span>{section.title}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}
        </article>

        <footer className="legal-footer">
          <span>Bạn đang sử dụng TravelLink AI với vai trò Merchant hoặc Reseller.</span>
          <div>
            <Link href="/terms-of-service">Terms of Service</Link>
            <Link href="/privacy-policy">Privacy Policy</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

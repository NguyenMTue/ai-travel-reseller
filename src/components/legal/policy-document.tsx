import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUp, FilePenLine } from "lucide-react";
import { SiteHeader } from "@/src/components/site-header";
import { SiteFooter } from "@/src/components/site-footer";
import { Button } from "@/src/components/ui/button";
import { SectionLink } from "./section-link";
import styles from "./policy-document.module.css";

type PolicySection = {
  id: string;
  title: string;
  description: string;
  pending: string;
};

type PolicyDocumentProps = {
  title: string;
  introduction: string;
  sections: readonly PolicySection[];
  related: { href: "/terms" | "/privacy"; title: string };
};

export function PolicyDocument({
  title,
  introduction,
  sections,
  related,
}: PolicyDocumentProps) {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className={`container ${styles.page}`}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={16} aria-hidden="true" /> Trở về trang chủ
        </Link>
        <header className={styles.hero}>
          <p className="eyebrow">TRAVELLINK AI · TÀI LIỆU CHÍNH SÁCH</p>
          <h1 id="legal-title" tabIndex={-1}>{title}</h1>
          <p className={styles.introduction}>{introduction}</p>
          <aside className={styles.draft} aria-labelledby="legal-draft-title">
            <FilePenLine size={23} aria-hidden="true" />
            <div>
              <p id="legal-draft-title" className={styles.draftTitle}>
                Bản nháp — chờ công ty phê duyệt
              </p>
              <p>
                Đây là khung nội dung đang chờ bổ sung và phê duyệt, chưa phải
                chính sách có hiệu lực. Các ghi chú bên dưới nêu những thông tin
                còn chờ công ty xác nhận.
              </p>
            </div>
          </aside>
        </header>
        <div className={styles.layout}>
          <nav className={styles.toc} aria-labelledby="legal-toc-title">
            <h2 id="legal-toc-title">Trong trang này</h2>
            <ol>
              {sections.map((section, index) => (
                <li key={section.id}>
                  <SectionLink href={`#${section.id}`}>
                    <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    {section.title}
                  </SectionLink>
                </li>
              ))}
            </ol>
          </nav>
          <div className={styles.content}>
            {sections.map((section, index) => (
              <section key={section.id} className={styles.section} aria-labelledby={section.id}>
                <p className={styles.sectionNumber} aria-hidden="true">
                  MỤC {String(index + 1).padStart(2, "0")}
                </p>
                <h2 id={section.id} tabIndex={-1}>{section.title}</h2>
                <p>{section.description}</p>
                <p className={styles.pending}>
                  <strong>Chờ công ty bổ sung: </strong>{section.pending}
                </p>
              </section>
            ))}
            <nav className={styles.documentNavigation} aria-label="Điều hướng tài liệu">
              <SectionLink href="#legal-title" className={styles.backLink}>
                <ArrowUp size={16} aria-hidden="true" /> Về đầu trang
              </SectionLink>
              <Button asChild variant="outline" className={styles.relatedLink}>
                <Link href={related.href}>
                  {related.title} <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </nav>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

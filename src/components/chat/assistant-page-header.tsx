import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Brand } from "@/src/components/brand";

type AssistantPageHeaderProps = {
  homeHref: string;
  homeLabel?: string;
};

export function AssistantPageHeader({
  homeHref,
          homeLabel = "← Quay về trang chủ",
}: AssistantPageHeaderProps) {
  return (
    <header className="assistant-page-header">
      <div className="container assistant-page-header-inner">
        <div className="assistant-page-header-top">
          <Link href={homeHref} className="assistant-back-link">
            <ArrowLeft size={18} aria-hidden />
            <span>{homeLabel}</span>
          </Link>
          <Brand />
        </div>
        <div className="assistant-page-title-block">
          <span className="assistant-page-icon" aria-hidden>
            <Sparkles size={20} />
          </span>
          <div>
            <p className="eyebrow">TRAVELLINK AI</p>
            <h1 className="assistant-page-title">Trợ lý AI du lịch</h1>
            <p className="assistant-page-subtitle">
              Tư vấn trải nghiệm, chính sách và cách đặt dịch vụ từ dữ liệu
              doanh nghiệp đã duyệt.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

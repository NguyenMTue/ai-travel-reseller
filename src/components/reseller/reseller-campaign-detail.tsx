"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Copy,
  MapPin,
  ShieldCheck,
  Sparkles,
  Ticket,
} from "lucide-react";
import { useReseller } from "./reseller-shell";
import {
  formatVND,
  type CampaignItem,
  type ResellerCampaignContent,
} from "@/src/lib/reseller-data";

type ResellerCampaignDetailProps = {
  campaign: CampaignItem | null;
  contents: ResellerCampaignContent[];
  source: "database" | "demo";
  error?: string | null;
};

export function ResellerCampaignDetail({
  campaign,
  contents,
  source,
  error = null,
}: ResellerCampaignDetailProps) {
  const { showToast } = useReseller();
  const [activeTab, setActiveTab] = useState<"content" | "info">("content");

  async function copyContent(text: string, label: string) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      showToast(`Đã sao chép ${label}`);
    } catch {
      showToast("Không thể sao chép. Hãy kiểm tra quyền clipboard và thử lại.");
    }
  }

  if (!campaign) {
    return (
      <div className="reseller-card campaign-state" role="alert">
        <h1>Chưa tải được chiến dịch</h1>
        <p>{error ?? "Vui lòng thử lại sau."}</p>
        <Link href="/reseller/campaigns" className="reseller-primary-btn">Quay lại danh sách</Link>
      </div>
    );
  }

  const sections = [
    { title: "Hooks", key: "hook" as const, icon: Sparkles },
    { title: "Captions", key: "caption" as const, icon: Copy },
    { title: "CTAs", key: "cta" as const, icon: ArrowLeft },
  ];

  return (
    <div className="campaign-detail-page">
      <Link href="/reseller/campaigns" className="campaign-back-link">
        <ArrowLeft size={16} aria-hidden /> Quay lại danh sách chiến dịch
      </Link>

      <header className="campaign-detail-heading">
        <div className="campaign-detail-icon" aria-hidden><Ticket size={25} /></div>
        <div className="campaign-detail-title">
          <p className="eyebrow">CHIẾN DỊCH RESELLER</p>
          <h1 className="reseller-heading-title">{campaign.name}</h1>
          <p className="reseller-heading-subtitle">
            {campaign.merchant_name} · {campaign.product_name}
          </p>
        </div>
        <span className="reseller-badge-mint">Hoa hồng {campaign.commission_rate}%</span>
      </header>

      {source === "demo" ? (
        <div className="reseller-alert-banner" role="note">
          <ShieldCheck size={17} className="reseller-alert-icon" aria-hidden />
          <span>Dữ liệu chiến dịch và nội dung dưới đây chỉ để minh họa; không phải nội dung AI trực tiếp đã được xác nhận.</span>
        </div>
      ) : null}

      {error ? <div className="reseller-alert-banner campaign-error" role="alert">{error}</div> : null}

      <div className="campaign-detail-tabs" role="tablist" aria-label="Thông tin chiến dịch">
        <button
          type="button"
          role="tab"
          id="campaign-content-tab"
          aria-controls="campaign-content-panel"
          aria-selected={activeTab === "content"}
          className={activeTab === "content" ? "active" : ""}
          onClick={() => setActiveTab("content")}
        >
          Nội dung quảng bá ({contents.length})
        </button>
        <button
          type="button"
          role="tab"
          id="campaign-info-tab"
          aria-controls="campaign-info-panel"
          aria-selected={activeTab === "info"}
          className={activeTab === "info" ? "active" : ""}
          onClick={() => setActiveTab("info")}
        >
          Chi tiết chiến dịch
        </button>
      </div>

      {activeTab === "content" ? (
        <div
          id="campaign-content-panel"
          role="tabpanel"
          aria-labelledby="campaign-content-tab"
          tabIndex={0}
        >
          {contents.length ? (
            <div className="campaign-content-sections">
              {sections.map(({ title, key, icon: Icon }) => {
                const entries = contents
                  .map((content) => ({ id: content.id, persona: content.persona, text: content[key] }))
                  .filter((entry): entry is { id: string; persona: string | null; text: string } => Boolean(entry.text?.trim()));

                return (
                  <section className="reseller-card campaign-content-group" key={key}>
                    <div className="campaign-content-group-heading">
                      <div className="campaign-detail-icon small" aria-hidden><Icon size={18} /></div>
                      <div>
                        <h2 className="reseller-card-title">{title}</h2>
                        <p className="reseller-card-subtitle">{entries.length} nội dung đã duyệt</p>
                      </div>
                    </div>
                    {entries.length ? (
                      <ul className="campaign-copy-list">
                        {entries.map((entry, index) => (
                          <li className="campaign-copy-item" key={`${entry.id}-${key}`}>
                            <div>
                              <span className="campaign-copy-index">{title.slice(0, -1)} {index + 1}</span>
                              {entry.persona ? <span className="reseller-badge-gray">{entry.persona}</span> : null}
                              <p>{entry.text}</p>
                            </div>
                            <button
                              type="button"
                              className="reseller-action-btn campaign-copy-button"
                              onClick={() => copyContent(entry.text, title.toLowerCase())}
                            >
                              <Copy size={14} aria-hidden /> Copy
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="campaign-content-empty">Chưa có {title.toLowerCase()} cho chiến dịch này.</p>
                    )}
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="reseller-card campaign-state" role="status">
              <Sparkles size={23} aria-hidden />
              <h2>Chưa có nội dung được duyệt</h2>
              <p>Nội dung Hooks, Captions và CTAs sẽ xuất hiện ở đây sau khi được tạo và phê duyệt.</p>
            </div>
          )}
        </div>
      ) : (
        <section
          id="campaign-info-panel"
          className="reseller-card campaign-info-card"
          role="tabpanel"
          aria-labelledby="campaign-info-tab"
          tabIndex={0}
        >
          <div className="campaign-info-intro">
            <div className="campaign-detail-icon small" aria-hidden><Ticket size={18} /></div>
            <div>
              <h2 className="reseller-card-title">{campaign.product_name}</h2>
              <p className="reseller-card-subtitle">{campaign.merchant_name}</p>
            </div>
          </div>
          {campaign.description ? <p className="campaign-product-description">{campaign.description}</p> : null}
          <div className="reseller-info-grid">
            <div className="reseller-info-item"><span className="reseller-info-label">Danh mục</span><span className="reseller-info-val">{campaign.category}</span></div>
            <div className="reseller-info-item"><span className="reseller-info-label">Giá bán</span><span className="reseller-info-val">{campaign.sale_price ? formatVND(campaign.sale_price) : "Chưa cập nhật"}</span></div>
            <div className="reseller-info-item"><span className="reseller-info-label">Hoa hồng</span><span className="reseller-info-val">{campaign.commission_rate}%</span></div>
            <div className="reseller-info-item"><span className="reseller-info-label">Đối tượng</span><span className="reseller-info-val">{campaign.target_audience}</span></div>
            <div className="reseller-info-item"><span className="reseller-info-label">Địa điểm</span><span className="reseller-info-val"><MapPin size={14} aria-hidden /> {campaign.target_location}</span></div>
            <div className="reseller-info-item"><span className="reseller-info-label">Thời gian</span><span className="reseller-info-val"><CalendarDays size={14} aria-hidden /> {campaign.start_date} – {campaign.end_date}</span></div>
          </div>
          <div className="campaign-trust-note"><ShieldCheck size={17} aria-hidden /> Khách hàng thanh toán trực tiếp với Merchant qua kênh chính thức.</div>
        </section>
      )}
    </div>
  );
}

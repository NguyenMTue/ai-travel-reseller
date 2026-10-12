"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Info,
  Link2,
  Eye,
  Copy,
  Clock,
  Check,
  X,
  FileText,
  Sparkles,
} from "lucide-react";
import { useReseller } from "./reseller-shell";
import { sampleCampaigns, sampleContents, formatVND, ContentItem } from "@/src/lib/reseller-data";

export function ResellerOverview() {
  const { showToast, user } = useReseller();
  const [contentModal, setContentModal] = useState<ContentItem | null>(null);

  const featuredCampaign = sampleCampaigns[0];
  const featuredContent = sampleContents[0];

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`Đã sao chép ${label}`);
    } catch {
      showToast(`Không thể sao chép tự động: ${text.slice(0, 30)}...`);
    }
  };

  return (
    <>
      <div className="reseller-heading-title">Tổng quan</div>
      <div className="reseller-heading-subtitle">
        <span>Xin chào, {user.name}</span>
        <span className="reseller-pill-badge" style={{ padding: "3px 10px", fontSize: 11 }}>
          <Clock size={12} />
          Dữ liệu mô phỏng
        </span>
      </div>

      {/* Thông báo an toàn */}
      <div className="reseller-alert-banner">
        <Info size={18} className="reseller-alert-icon" />
        <div>
          Bạn tự đăng nội dung lên TikTok hoặc Facebook. Nền tảng không tự động đăng bài và không yêu cầu mật khẩu mạng xã hội.
        </div>
      </div>

      {/* Chỉ số nhanh */}
      <div className="reseller-stats-grid">
        <div className="reseller-stat-card">
          <div className="reseller-stat-label">Thu nhập</div>
          <div className="reseller-stat-value">Chưa có dữ liệu</div>
        </div>

        <div className="reseller-stat-card">
          <div className="reseller-stat-label">
            <Link2 size={14} />
            <span>Tracking link</span>
          </div>
          <div className="reseller-stat-value">Chưa được cấp</div>
        </div>
      </div>

      {/* Chiến dịch mẫu */}
      <div className="reseller-section-header">
        <div className="reseller-section-title">Chiến dịch mẫu</div>
        <Link href="/reseller/campaigns" className="reseller-section-link">
          Xem tất cả
        </Link>
      </div>

      <div className="reseller-card">
        <div className="reseller-card-title">{featuredCampaign.name}</div>
        <div className="reseller-card-subtitle">{featuredCampaign.merchant_name}</div>

        <div className="reseller-info-grid">
          <div className="reseller-info-item">
            <span className="reseller-info-label">Sản phẩm</span>
            <span className="reseller-info-val">{featuredCampaign.product_name}</span>
          </div>

          <div className="reseller-info-item">
            <span className="reseller-info-label">Giá bán</span>
            <span className="reseller-info-val">{formatVND(featuredCampaign.sale_price)}</span>
          </div>

          <div className="reseller-info-item">
            <span className="reseller-info-label">Tỷ lệ hoa hồng</span>
            <span className="reseller-info-val">{featuredCampaign.commission_rate}%</span>
          </div>

          <div className="reseller-info-item">
            <span className="reseller-info-label">Thời gian</span>
            <span className="reseller-info-val">
              {featuredCampaign.start_date} – {featuredCampaign.end_date}
            </span>
          </div>

          <div className="reseller-info-item">
            <span className="reseller-info-label">Đối tượng</span>
            <span className="reseller-info-val">{featuredCampaign.target_audience}</span>
          </div>

          <div className="reseller-info-item">
            <span className="reseller-info-label">Khu vực</span>
            <span className="reseller-info-val">{featuredCampaign.target_location}</span>
          </div>
        </div>

        <Link
          href={`/reseller/campaigns/${featuredCampaign.id}`}
          className="reseller-primary-btn"
        >
          Tham gia chiến dịch
        </Link>
      </div>

      {/* Nội dung đã duyệt để tham khảo */}
      <div className="reseller-section-header">
        <div className="reseller-section-title">Nội dung đã duyệt để tham khảo</div>
      </div>

      <div className="reseller-card">
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <span className="reseller-badge-mint">Local Guide</span>
          <span className="reseller-badge-gray">Đã duyệt (mô phỏng)</span>
        </div>

        <div className="reseller-card-title" style={{ fontSize: 17, marginBottom: 8 }}>
          {featuredContent.hook}
        </div>

        <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.6, marginBottom: 16 }}>
          {featuredContent.caption}
        </p>

        <div className="reseller-cta-box">
          <strong>CTA:</strong> {featuredContent.cta}
        </div>

        <div className="reseller-action-row">
          <button
            type="button"
            className="reseller-action-btn"
            onClick={() => setContentModal(featuredContent)}
          >
            <Eye size={14} />
            <span>Xem nội dung</span>
          </button>

          <button
            type="button"
            className="reseller-action-btn"
            onClick={() => handleCopy(featuredContent.caption, "caption")}
          >
            <Copy size={14} />
            <span>Sao chép caption</span>
          </button>

          <button
            type="button"
            className="reseller-action-btn"
            onClick={() => handleCopy(featuredContent.cta, "CTA")}
          >
            <Copy size={14} />
            <span>Sao chép CTA</span>
          </button>
        </div>
      </div>

      {/* Modal xem chi tiết nội dung */}
      {contentModal && (
        <div
          className="reseller-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setContentModal(null)}
        >
          <div
            className="reseller-modal-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="reseller-badge-mint">{contentModal.persona}</span>
                <span className="reseller-badge-gray">Đã duyệt</span>
              </div>
              <button
                onClick={() => setContentModal(null)}
                aria-label="Đóng"
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#6B7280" }}
              >
                <X size={20} />
              </button>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1F2937", marginBottom: 16 }}>
              {contentModal.hook}
            </h3>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 4, textTransform: "uppercase" }}>
                Kịch bản gợi ý (Script):
              </div>
              <div style={{ background: "#FAF9F5", border: "1px solid #E5E7EB", borderRadius: 8, padding: 12, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                {contentModal.script}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 4, textTransform: "uppercase" }}>
                Caption bài đăng:
              </div>
              <div style={{ background: "#FAF9F5", border: "1px solid #E5E7EB", borderRadius: 8, padding: 12, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                {contentModal.caption}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 4, textTransform: "uppercase" }}>
                Lời kêu gọi hành động (CTA):
              </div>
              <div className="reseller-cta-box" style={{ marginBottom: 0 }}>
                {contentModal.cta}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                className="reseller-action-btn"
                onClick={() => handleCopy(contentModal.script, "toàn bộ kịch bản")}
              >
                <Copy size={14} /> Sao chép Script
              </button>
              <button
                type="button"
                className="reseller-primary-btn"
                onClick={() => {
                  handleCopy(`${contentModal.caption}\n\n${contentModal.cta}`, "nội dung hoàn chỉnh");
                  setContentModal(null);
                }}
              >
                Sao chép bài đăng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

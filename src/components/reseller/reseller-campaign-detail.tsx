"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Link2,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Eye,
  BarChart2,
  Share2,
} from "lucide-react";
import { useReseller } from "./reseller-shell";
import {
  sampleCampaigns,
  sampleContents,
  formatVND,
  CampaignItem,
} from "@/src/lib/reseller-data";

export function ResellerCampaignDetail({ id }: { id: string }) {
  const { showToast, user } = useReseller();
  const [activeTab, setActiveTab] = useState<"content" | "info" | "stats">("content");

  // Tìm chiến dịch theo id, fallback sang chiến dịch đầu tiên nếu id không khớp
  const campaign =
    sampleCampaigns.find((c) => c.id === id) || sampleCampaigns[0];

  // Tìm nội dung mẫu của chiến dịch này
  const contents = sampleContents.filter((c) => c.campaign_id === campaign.id);
  const relevantContents =
    contents.length > 0 ? contents : [sampleContents[0]];

  // Tracking link chuẩn hoá
  const trackingLink = `http://localhost:3000/chat?reseller_id=22222222-2222-2222-2222-111111111111&campaign_id=${campaign.id}&product_id=${campaign.product_id}`;

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`Đã sao chép ${label}`);
    } catch {
      showToast(`Sao chép thất bại: ${text.slice(0, 30)}`);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <Link
          href="/reseller/campaigns"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "#6B7280",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={16} />
          <span>Quay lại danh sách chiến dịch</span>
        </Link>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <div>
          <div className="reseller-heading-title" style={{ fontSize: 28 }}>
            {campaign.name}
          </div>
          <div className="reseller-heading-subtitle" style={{ marginBottom: 0 }}>
            {campaign.merchant_name} · <span>Khu vực: {campaign.target_location}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <span className="reseller-badge-mint">
            Hoa hồng: {campaign.commission_rate}%
          </span>
          <span className="reseller-badge-gray">Đang diễn ra</span>
        </div>
      </div>

      {/* Box Tracking Link */}
      <div className="reseller-card" style={{ background: "#FAFDFB", borderColor: "#D5E7DB", padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "#1C4438", marginBottom: 8 }}>
          <Link2 size={18} />
          <span>Đường dẫn theo dõi (Tracking Link của bạn)</span>
        </div>
        <p style={{ fontSize: 13, color: "#4B5563", margin: "0 0 12px" }}>
          Khách hàng bấm vào link này sẽ được kết nối với Trợ lý AI tư vấn và tự động ghi nhận hoa hồng khi đặt mua:
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            readOnly
            value={trackingLink}
            style={{
              flex: 1,
              minWidth: 260,
              background: "#FFFFFF",
              border: "1px solid #D1D5DB",
              borderRadius: 8,
              padding: "9px 12px",
              fontSize: 12,
              fontFamily: "monospace",
              color: "#374151",
            }}
          />
          <button
            type="button"
            className="reseller-primary-btn"
            onClick={() => handleCopy(trackingLink, "Tracking link")}
          >
            <Copy size={14} />
            <span>Sao chép Link</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: 12, borderBottom: "1px solid #E5E7EB", marginBottom: 24 }}>
        <button
          type="button"
          onClick={() => setActiveTab("content")}
          style={{
            padding: "10px 16px",
            border: "none",
            background: "transparent",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            borderBottom: activeTab === "content" ? "2px solid #1C4438" : "2px solid transparent",
            color: activeTab === "content" ? "#1C4438" : "#6B7280",
          }}
        >
          Nội dung quảng bá AI ({relevantContents.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("info")}
          style={{
            padding: "10px 16px",
            border: "none",
            background: "transparent",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            borderBottom: activeTab === "info" ? "2px solid #1C4438" : "2px solid transparent",
            color: activeTab === "info" ? "#1C4438" : "#6B7280",
          }}
        >
          Thông tin sản phẩm & Điều kiện
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("stats")}
          style={{
            padding: "10px 16px",
            border: "none",
            background: "transparent",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            borderBottom: activeTab === "stats" ? "2px solid #1C4438" : "2px solid transparent",
            color: activeTab === "stats" ? "#1C4438" : "#6B7280",
          }}
        >
          Hiệu quả hoạt động
        </button>
      </div>

      {/* Tab 1: Nội dung quảng bá */}
      {activeTab === "content" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="reseller-alert-banner">
            <Sparkles size={18} className="reseller-alert-icon" />
            <div>
              Hooks, kịch bản video và caption được tạo sẵn từ thông tin đã duyệt của nhà cung cấp. Bạn có thể sao chép nhanh và tùy biến theo giọng văn riêng.
            </div>
          </div>

          {relevantContents.map((content) => (
            <div key={content.id} className="reseller-card" style={{ marginBottom: 0 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <span className="reseller-badge-mint">{content.persona}</span>
                <span className="reseller-badge-gray">Đã duyệt (mô phỏng)</span>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", marginBottom: 4 }}>
                  Hook gợi ý:
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1F2937" }}>
                  {content.hook}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", marginBottom: 4 }}>
                  Kịch bản video ngắn (Script):
                </div>
                <div style={{ background: "#F9FAF8", border: "1px solid #E5E7EB", borderRadius: 8, padding: 12, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                  {content.script}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", marginBottom: 4 }}>
                  Caption bài đăng:
                </div>
                <div style={{ background: "#F9FAF8", border: "1px solid #E5E7EB", borderRadius: 8, padding: 12, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                  {content.caption}
                </div>
              </div>

              <div className="reseller-cta-box">
                <strong>CTA:</strong> {content.cta}
              </div>

              <div className="reseller-action-row">
                <button
                  type="button"
                  className="reseller-action-btn"
                  onClick={() => handleCopy(content.hook, "Hook")}
                >
                  <Copy size={13} />
                  <span>Sao chép Hook</span>
                </button>

                <button
                  type="button"
                  className="reseller-action-btn"
                  onClick={() => handleCopy(content.script, "Kịch bản (Script)")}
                >
                  <Copy size={13} />
                  <span>Sao chép Script</span>
                </button>

                <button
                  type="button"
                  className="reseller-action-btn"
                  onClick={() => handleCopy(content.caption, "Caption")}
                >
                  <Copy size={13} />
                  <span>Sao chép Caption</span>
                </button>

                <button
                  type="button"
                  className="reseller-action-btn"
                  onClick={() => handleCopy(content.cta, "CTA")}
                >
                  <Copy size={13} />
                  <span>Sao chép CTA</span>
                </button>

                <button
                  type="button"
                  className="reseller-primary-btn"
                  style={{ marginLeft: "auto" }}
                  onClick={() => handleCopy(`${content.caption}\n\n${content.cta}\n${trackingLink}`, "trọn bộ nội dung và link")}
                >
                  <Share2 size={14} />
                  <span>Sao chép trọn bộ</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Thông tin sản phẩm */}
      {activeTab === "info" && (
        <div className="reseller-card">
          <div className="reseller-card-title">Thông tin chi tiết sản phẩm</div>
          <p style={{ fontSize: 13, color: "#4B5563", marginBottom: 20 }}>
            Cung cấp bởi: <strong>{campaign.merchant_name}</strong>
          </p>

          <div className="reseller-info-grid">
            <div className="reseller-info-item">
              <span className="reseller-info-label">Tên sản phẩm</span>
              <span className="reseller-info-val">{campaign.product_name}</span>
            </div>

            <div className="reseller-info-item">
              <span className="reseller-info-label">Danh mục</span>
              <span className="reseller-info-val">{campaign.category}</span>
            </div>

            <div className="reseller-info-item">
              <span className="reseller-info-label">Giá niêm yết</span>
              <span className="reseller-info-val" style={{ textDecoration: "line-through", color: "#6B7280" }}>
                {formatVND(campaign.original_price)}
              </span>
            </div>

            <div className="reseller-info-item">
              <span className="reseller-info-label">Giá ưu đãi cho khách</span>
              <span className="reseller-info-val" style={{ color: "#1C4438", fontSize: 16 }}>
                {formatVND(campaign.sale_price)}
              </span>
            </div>

            <div className="reseller-info-item">
              <span className="reseller-info-label">Tỷ lệ hoa hồng</span>
              <span className="reseller-info-val">{campaign.commission_rate}%</span>
            </div>

            <div className="reseller-info-item">
              <span className="reseller-info-label">Hoa hồng ước tính mỗi đơn</span>
              <span className="reseller-info-val">
                {formatVND((campaign.sale_price * campaign.commission_rate) / 100)}
              </span>
            </div>

            <div className="reseller-info-item">
              <span className="reseller-info-label">Thời hạn áp dụng</span>
              <span className="reseller-info-val">
                {campaign.start_date} – {campaign.end_date}
              </span>
            </div>

            <div className="reseller-info-item">
              <span className="reseller-info-label">Khu vực phục vụ</span>
              <span className="reseller-info-val">{campaign.target_location}</span>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 16, marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#4B5563" }}>
              <ShieldCheck size={16} style={{ color: "#1C4438" }} />
              <span>
                Thanh toán chính thức: Khách hàng thanh toán trực tiếp qua checkout của đối tác{" "}
                <a
                  href={campaign.booking_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#1C4438", fontWeight: 600, textDecoration: "underline" }}
                >
                  {campaign.booking_url} ↗
                </a>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Hiệu quả hoạt động */}
      {activeTab === "stats" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="reseller-stats-grid">
            <div className="reseller-stat-card">
              <div className="reseller-stat-label">Tổng lượt click</div>
              <div className="reseller-stat-value">12 lượt</div>
            </div>
            <div className="reseller-stat-card">
              <div className="reseller-stat-label">Khách hỏi mua (Leads)</div>
              <div className="reseller-stat-value">3 lượt</div>
            </div>
            <div className="reseller-stat-card">
              <div className="reseller-stat-label">Đơn hoàn thành</div>
              <div className="reseller-stat-value">1 đơn</div>
            </div>
            <div className="reseller-stat-card">
              <div className="reseller-stat-label">Hoa hồng ghi nhận</div>
              <div className="reseller-stat-value" style={{ color: "#1C4438" }}>
                {formatVND((campaign.sale_price * campaign.commission_rate) / 100)}
              </div>
            </div>
          </div>

          <div className="reseller-card">
            <div className="reseller-card-title">Nhật ký chuyển đổi gần đây</div>
            <div style={{ fontSize: 13, color: "#6B7280", marginTop: 12 }}>
              Dữ liệu được cập nhật tự động từ hệ thống tracking affiliate và đối soát đơn hàng.
            </div>
          </div>
        </div>
      )}
    </>
  );
}

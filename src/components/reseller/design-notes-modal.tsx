"use client";

import { X, Sparkles, Shield, Palette, Layers, Link as LinkIcon } from "lucide-react";

export function DesignNotesModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="reseller-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="reseller-modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "#1C4438" }}><Sparkles size={20} /></span>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#1C4438" }}>
              Design & Architecture Notes
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: "#6B7280",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: 13, lineHeight: 1.6, color: "#374151" }}>
          <div style={{ background: "#F3F5F2", padding: 14, borderRadius: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "#1C4438", marginBottom: 6 }}>
              <Palette size={16} /> Phong cách "Coastal Editorial"
            </div>
            <p style={{ margin: 0 }}>
              Không gian cộng tác viên được thiết kế riêng biệt với tông màu <strong>Xanh thông trầm (#1C4438)</strong>, nền giấy ấm kem <strong>(#FAF9F5)</strong>, badge xanh ngọc dịu <strong>(#DDF2ED)</strong> và typography serif sang trọng kết hợp sans-serif hiện đại.
            </p>
          </div>

          <div style={{ background: "#F3F5F2", padding: 14, borderRadius: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "#1C4438", marginBottom: 6 }}>
              <Layers size={16} /> Phân quyền độc lập (RBAC)
            </div>
            <p style={{ margin: 0 }}>
              Giao diện Merchant được giữ nguyên hoàn toàn. Reseller được bảo vệ qua middleware/proxy và server action: tài khoản Reseller chỉ truy cập <code>/reseller/*</code>, tài khoản Merchant chỉ truy cập <code>/merchant/*</code>.
            </p>
          </div>

          <div style={{ background: "#F3F5F2", padding: 14, borderRadius: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "#1C4438", marginBottom: 6 }}>
              <Shield size={16} /> Nguyên tắc an toàn & AI
            </div>
            <p style={{ margin: 0 }}>
              Nền tảng <strong>không tự động đăng bài</strong> và không yêu cầu mật khẩu mạng xã hội của cộng tác viên. Mọi thanh toán đều dẫn trực tiếp về checkout chính thức của Merchant.
            </p>
          </div>

          <div style={{ background: "#F3F5F2", padding: 14, borderRadius: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "#1C4438", marginBottom: 6 }}>
              <LinkIcon size={16} /> Tracking & Attribution
            </div>
            <p style={{ margin: 0 }}>
              Cộng tác viên nhận link tracking chuẩn hóa với attribution context (reseller_id, campaign_id, product_id) để tích hợp liền mạch với Chatbot RAG và ghi nhận hoa hồng minh bạch.
            </p>
          </div>
        </div>

        <div style={{ marginTop: 24, textAlign: "right" }}>
          <button
            onClick={onClose}
            className="reseller-primary-btn"
            style={{ width: "auto" }}
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}

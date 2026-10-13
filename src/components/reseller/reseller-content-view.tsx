"use client";

import { useEffect, useState } from "react";
import { Info, Eye, Copy, X } from "lucide-react";
import { useReseller } from "./reseller-shell";
import { sampleContents, ContentItem } from "@/src/lib/reseller-data";

export function ResellerContentView() {
  const { showToast } = useReseller();
  const [modalItem, setModalItem] = useState<ContentItem | null>(null);

  useEffect(() => {
    if (!modalItem) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setModalItem(null);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [modalItem]);

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`Đã sao chép ${label}`);
    } catch {
      showToast(`Không thể sao chép tự động: ${text.slice(0, 30)}`);
    }
  };

  return (
    <>
      <div className="reseller-heading-title">Nội dung mẫu</div>
      <div className="reseller-heading-subtitle" style={{ marginBottom: 20 }}>
        Nội dung đã duyệt để tham khảo. Bạn tự đăng lên TikTok hoặc Facebook.
      </div>

      {/* Thông báo an toàn */}
      <div className="reseller-alert-banner">
        <Info size={18} className="reseller-alert-icon" />
        <div>
          Bạn tự đăng nội dung lên TikTok hoặc Facebook. Nền tảng không tự động đăng bài và không yêu cầu mật khẩu mạng xã hội.
        </div>
      </div>

      {/* Danh sách nội dung */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {sampleContents.map((item) => (
          <div key={item.id} className="reseller-card" style={{ marginBottom: 0 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <span className="reseller-badge-mint">{item.badges[0] || item.persona}</span>
              <span className="reseller-badge-gray">
                {item.badges[1] || "Đã duyệt (mô phỏng)"}
              </span>
            </div>

            <div className="reseller-card-title" style={{ fontSize: 17, marginBottom: 8 }}>
              {item.hook}
            </div>

            <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.6, marginBottom: 16 }}>
              {item.caption}
            </p>

            <div className="reseller-cta-box">
              <strong>CTA:</strong> {item.cta}
            </div>

            <div style={{ display: "flex", gap: 40, fontSize: 12, color: "#6B7280", marginBottom: 18 }}>
              <div>
                <span style={{ color: "#9CA3AF" }}>Tracking link: </span>
                <span style={{ fontWeight: 500, color: "#374151" }}>
                  {item.tracking_url ? "Đã liên kết" : "Chưa được cấp"}
                </span>
              </div>
              <div>
                <span style={{ color: "#9CA3AF" }}>Video: </span>
                <span style={{ fontWeight: 500, color: "#374151" }}>
                  {item.video_url ? "Có sẵn" : "Chưa có"}
                </span>
              </div>
            </div>

            <div className="reseller-action-row">
              <button
                type="button"
                className="reseller-action-btn"
                onClick={() => setModalItem(item)}
              >
                <Eye size={14} />
                <span>Xem nội dung</span>
              </button>

              <button
                type="button"
                className="reseller-action-btn"
                onClick={() => handleCopy(item.caption, "caption")}
              >
                <Copy size={14} />
                <span>Sao chép caption</span>
              </button>

              <button
                type="button"
                className="reseller-action-btn"
                onClick={() => handleCopy(item.cta, "CTA")}
              >
                <Copy size={14} />
                <span>Sao chép CTA</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal xem toàn bộ script */}
      {modalItem && (
        <div
          className="reseller-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reseller-content-modal-title"
          onClick={() => setModalItem(null)}
        >
          <div
            className="reseller-modal-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="reseller-badge-mint">{modalItem.persona}</span>
                <span className="reseller-badge-gray">Đã duyệt</span>
              </div>
              <button
                onClick={() => setModalItem(null)}
                aria-label="Đóng"
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#6B7280" }}
              >
                <X size={20} />
              </button>
            </div>

            <h3 id="reseller-content-modal-title" style={{ fontSize: 18, fontWeight: 700, color: "#1F2937", marginBottom: 16 }}>
              {modalItem.hook}
            </h3>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 4, textTransform: "uppercase" }}>
                Kịch bản video ngắn (Script):
              </div>
              <div style={{ background: "#FAF9F5", border: "1px solid #E5E7EB", borderRadius: 8, padding: 12, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                {modalItem.script}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 4, textTransform: "uppercase" }}>
                Caption bài đăng:
              </div>
              <div style={{ background: "#FAF9F5", border: "1px solid #E5E7EB", borderRadius: 8, padding: 12, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                {modalItem.caption}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 4, textTransform: "uppercase" }}>
                CTA:
              </div>
              <div className="reseller-cta-box" style={{ marginBottom: 0 }}>
                {modalItem.cta}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                className="reseller-action-btn"
                onClick={() => handleCopy(modalItem.script, "script")}
              >
                <Copy size={14} /> Sao chép Script
              </button>
              <button
                type="button"
                className="reseller-primary-btn"
                onClick={() => {
                  handleCopy(`${modalItem.caption}\n\n${modalItem.cta}`, "nội dung bài đăng");
                  setModalItem(null);
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

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Edit3,
  Film,
  Package,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import { Brand } from "@/src/components/brand";
import {
  type MerchantContentItem,
  type MerchantContentsSummary,
  getPersonaInfo,
  getContentStatusBadge,
} from "@/src/lib/merchant/content-schema";
import styles from "./content-approval-list.module.css";

export interface ContentApprovalListProps {
  initialContents: MerchantContentItem[];
  initialSummary: MerchantContentsSummary;
  campaigns: Array<{ id: string; title: string }>;
  preview?: boolean;
}

export function ContentApprovalList({
  initialContents,
  initialSummary,
  campaigns,
  preview = false,
}: ContentApprovalListProps) {
  const [contents, setContents] = useState<MerchantContentItem[]>(initialContents);
  const [summary, setSummary] = useState<MerchantContentsSummary>(initialSummary);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [selectedPersona, setSelectedPersona] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingItem, setEditingItem] = useState<MerchantContentItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit form state
  const [editHook, setEditHook] = useState("");
  const [editScript, setEditScript] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [editCta, setEditCta] = useState("");

  const root = preview ? "/preview/merchant" : "/merchant";

  function openEditModal(item: MerchantContentItem) {
    setEditingItem(item);
    setEditHook(item.hook || "");
    setEditScript(item.script || "");
    setEditCaption(item.caption || "");
    setEditCta(item.cta || "");
  }

  async function handleStatusChange(contentId: string, newStatus: "approved" | "rejected") {
    setActionLoading(contentId);
    setNotification(null);

    try {
      if (preview) {
        // Mô phỏng preview
        applyLocalStatusUpdate(contentId, newStatus);
        setNotification({
          type: "success",
          text: `Mô phỏng: Đã chuyển trạng thái nội dung sang "${newStatus === "approved" ? "Đã phê duyệt" : "Đã từ chối"}"`,
        });
        return;
      }

      const res = await fetch("/api/merchant/contents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_id: contentId,
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Lỗi cập nhật trạng thái phê duyệt.");
      }

      applyLocalStatusUpdate(contentId, newStatus);
      setNotification({
        type: "success",
        text: `Đã ${newStatus === "approved" ? "phê duyệt" : "từ chối"} nội dung thành công!`,
      });
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Không thể cập nhật trạng thái. Vui lòng thử lại.",
      });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSaveAndApprove() {
    if (!editingItem) return;
    const contentId = editingItem.id;
    setActionLoading(contentId);

    try {
      if (preview) {
        setContents((prev) =>
          prev.map((item) =>
            item.id === contentId
              ? {
                  ...item,
                  status: "approved",
                  hook: editHook,
                  script: editScript,
                  caption: editCaption,
                  cta: editCta,
                }
              : item
          )
        );
        setEditingItem(null);
        setNotification({ type: "success", text: "Mô phỏng: Đã lưu chỉnh sửa và phê duyệt bài viết." });
        return;
      }

      const res = await fetch("/api/merchant/contents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_id: contentId,
          status: "approved",
          hook: editHook,
          script: editScript,
          caption: editCaption,
          cta: editCta,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Lỗi lưu chỉnh sửa nội dung.");
      }

      setContents((prev) =>
        prev.map((item) =>
          item.id === contentId
            ? {
                ...item,
                status: "approved",
                hook: editHook,
                script: editScript,
                caption: editCaption,
                cta: editCta,
              }
            : item
        )
      );

      // Cập nhật lại số liệu thống kê
      setSummary((prev: MerchantContentsSummary) => ({
        ...prev,
        pending_count: Math.max(0, prev.pending_count - (editingItem.status !== "approved" ? 1 : 0)),
        approved_count: prev.approved_count + (editingItem.status !== "approved" ? 1 : 0),
      }));

      setEditingItem(null);
      setNotification({ type: "success", text: "Đã lưu chỉnh sửa và phê duyệt bài viết xuất bản cho Reseller!" });
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Lỗi lưu chỉnh sửa." });
    } finally {
      setActionLoading(null);
    }
  }

  function applyLocalStatusUpdate(contentId: string, newStatus: "approved" | "rejected") {
    setContents((prev) =>
      prev.map((c) => {
        if (c.id === contentId) {
          const oldStatus = c.status;
          // Điều chỉnh thống kê
          setSummary((s: MerchantContentsSummary) => {
            let pending_count = s.pending_count;
            let approved_count = s.approved_count;
            let rejected_count = s.rejected_count;

            if (oldStatus === "pending_approval" || oldStatus === "ready" || oldStatus === "draft") {
              pending_count = Math.max(0, pending_count - 1);
            } else if (oldStatus === "approved") {
              approved_count = Math.max(0, approved_count - 1);
            } else if (oldStatus === "rejected") {
              rejected_count = Math.max(0, rejected_count - 1);
            }

            if (newStatus === "approved") approved_count++;
            if (newStatus === "rejected") rejected_count++;

            return { ...s, pending_count, approved_count, rejected_count };
          });

          return { ...c, status: newStatus };
        }
        return c;
      })
    );
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Lọc nội dung hiển thị theo bộ lọc đang chọn
  const filteredContents = contents.filter((c) => {
    if (selectedCampaign !== "all" && c.campaign_id !== selectedCampaign) return false;
    if (selectedPersona !== "all" && c.persona !== selectedPersona) return false;
    if (selectedStatus !== "all") {
      if (selectedStatus === "pending_approval") {
        return c.status === "pending_approval" || c.status === "ready" || c.status === "draft";
      }
      return c.status === selectedStatus;
    }
    return true;
  });

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Brand />
        <span className={styles.workspace}>
          <ShieldCheck size={16} aria-hidden="true" />
          Không gian doanh nghiệp
        </span>
      </header>

      <main id="main-content" className={styles.main}>
        <nav aria-label="Điều hướng Merchant" className={styles.nav}>
          <Link prefetch={false} href={root}>
            <ArrowLeft size={16} aria-hidden="true" />
            Tổng quan
          </Link>
          <Link prefetch={false} href={`${root}/products`}>
            <Package size={17} aria-hidden="true" />
            Sản phẩm
          </Link>
          <Link prefetch={false} href={`${root}/campaigns`}>
            <SlidersHorizontal size={17} aria-hidden="true" />
            Chiến dịch
          </Link>
          <Link prefetch={false} href={`${root}/contents`} aria-current="page">
            <Sparkles size={17} aria-hidden="true" />
            Kiểm duyệt AI
          </Link>
          <Link prefetch={false} href={`${root}/library`}>
            <Film size={17} aria-hidden="true" />
            Thư viện media
          </Link>
          <Link prefetch={false} href={`${root}/campaigns/new`}>
            Tạo chiến dịch
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </nav>

        <section className={styles.heading}>
          <p className="eyebrow">AI CONTENT FACTORY · APPROVAL PORTAL</p>
          <h1>Kiểm duyệt & Phê duyệt Nội dung AI</h1>
          <p>
            Xem trước kịch bản, lời thoại, bài đăng và video do AI khởi tạo. Phê duyệt để các cộng tác viên Reseller
            ngay lập tức nhận được tài nguyên tiếp thị chuẩn xác.
          </p>
        </section>

        {notification && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              background: notification.type === "success" ? "#dcfce7" : "#fee2e2",
              color: notification.type === "success" ? "#166534" : "#991b1b",
              border: `1px solid ${notification.type === "success" ? "#86efac" : "#fca5a5"}`,
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
            role="status"
          >
            <span>{notification.text}</span>
            <button
              onClick={() => setNotification(null)}
              style={{ background: "transparent", border: "none", cursor: "pointer" }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Thẻ thống kê số lượng */}
        <div className={styles.statsGrid}>
          <div
            className={`${styles.statCard} ${selectedStatus === "all" ? styles.statCardActive : ""}`}
            onClick={() => setSelectedStatus("all")}
          >
            <span className={styles.statLabel}>Tổng nội dung AI</span>
            <span className={styles.statValue}>{summary.total}</span>
          </div>

          <div
            className={`${styles.statCard} ${selectedStatus === "pending_approval" ? styles.statCardActive : ""}`}
            onClick={() => setSelectedStatus("pending_approval")}
          >
            <span className={styles.statLabel}>Chờ phê duyệt</span>
            <span className={`${styles.statValue} ${styles.pending}`}>{summary.pending_count}</span>
          </div>

          <div
            className={`${styles.statCard} ${selectedStatus === "approved" ? styles.statCardActive : ""}`}
            onClick={() => setSelectedStatus("approved")}
          >
            <span className={styles.statLabel}>Đã phê duyệt (Reseller thấy)</span>
            <span className={`${styles.statValue} ${styles.approved}`}>{summary.approved_count}</span>
          </div>

          <div
            className={`${styles.statCard} ${selectedStatus === "rejected" ? styles.statCardActive : ""}`}
            onClick={() => setSelectedStatus("rejected")}
          >
            <span className={styles.statLabel}>Đã từ chối</span>
            <span className={`${styles.statValue} ${styles.rejected}`}>{summary.rejected_count}</span>
          </div>
        </div>

        {/* Thanh công cụ lọc */}
        <div className={styles.filtersBar}>
          <div className={styles.filterGroup}>
            <label htmlFor="filter-campaign" style={{ fontSize: "13px", fontWeight: 500, color: "#64748b" }}>
              Chiến dịch:
            </label>
            <select
              id="filter-campaign"
              className={styles.filterSelect}
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
            >
              <option value="all">Tất cả chiến dịch ({campaigns.length})</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            <label htmlFor="filter-persona" style={{ fontSize: "13px", fontWeight: 500, color: "#64748b", marginLeft: "8px" }}>
              Persona:
            </label>
            <select
              id="filter-persona"
              className={styles.filterSelect}
              value={selectedPersona}
              onChange={(e) => setSelectedPersona(e.target.value)}
            >
              <option value="all">Tất cả phong cách</option>
              <option value="local_guide">🧭 Local Guide</option>
              <option value="family">👨‍👩‍👧‍👦 Gia đình</option>
              <option value="foodie">🍜 Ẩm thực</option>
              <option value="budget_traveler">🎒 Tiết kiệm</option>
              <option value="general">✈️ Phổ thông</option>
            </select>
          </div>

          <div style={{ fontSize: "13px", color: "#64748b" }}>
            Hiển thị <strong>{filteredContents.length}</strong> bài viết
          </div>
        </div>

        {/* Danh sách thẻ nội dung */}
        {filteredContents.length === 0 ? (
          <div className={styles.emptyState}>
            <Sparkles size={40} color="#94a3b8" />
            <h3>Chưa có nội dung phù hợp bộ lọc</h3>
            <p>
              Hệ thống chưa tìm thấy kịch bản AI nào thuộc tiêu chí đã chọn. Bạn có thể chọn &quot;Tất cả chiến dịch&quot;
              hoặc kiểm tra các chiến dịch mới tạo.
            </p>
          </div>
        ) : (
          <div className={styles.cardsList}>
            {filteredContents.map((item) => {
              const personaInfo = getPersonaInfo(item.persona);
              const statusBadge = getContentStatusBadge(item.status);
              const isLoading = actionLoading === item.id;
              const isApproved = item.status === "approved";

              return (
                <article key={item.id} className={styles.contentCard}>
                  <div className={styles.cardHeader}>
                    <div>
                      <span className={styles.campaignBadge}>
                        <SlidersHorizontal size={14} />
                        {item.campaign_title}
                      </span>
                    </div>

                    <div className={styles.badgesGroup}>
                      <span className={styles.personaBadge}>
                        <span>{personaInfo.emoji}</span>
                        <span>{personaInfo.label}</span>
                      </span>

                      <span
                        className={`${styles.statusBadge} ${
                          statusBadge.tone === "approved"
                            ? styles.statusApproved
                            : statusBadge.tone === "rejected"
                            ? styles.statusRejected
                            : styles.statusPending
                        }`}
                      >
                        {statusBadge.tone === "approved" ? (
                          <CheckCircle2 size={13} />
                        ) : statusBadge.tone === "rejected" ? (
                          <XCircle size={13} />
                        ) : (
                          <Clock size={13} />
                        )}
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <div>
                      {item.hook && (
                        <div className={styles.hookBox}>
                          <div className={styles.hookLabel}>HOOK THU HÚT (3S ĐẦU TIÊN)</div>
                          <div className={styles.hookText}>&ldquo;{item.hook}&rdquo;</div>
                        </div>
                      )}

                      {item.caption && (
                        <div className={styles.sectionBlock}>
                          <div className={styles.sectionTitle}>
                            <span>BÀI VIẾT QUẢNG BÁ (CAPTION)</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(item.caption || "", item.id)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "12px",
                                color: copiedId === item.id ? "#16a34a" : "#0284c7",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              {copiedId === item.id ? <Check size={13} /> : <Copy size={13} />}
                              {copiedId === item.id ? "Đã sao chép" : "Sao chép"}
                            </button>
                          </div>
                          <div className={styles.textContent}>{item.caption}</div>
                        </div>
                      )}

                      {item.script && (
                        <div className={styles.sectionBlock}>
                          <div className={styles.sectionTitle}>
                            <span>KỊCH BẢN LỜI THOẠI (VOICEOVER SCRIPT)</span>
                          </div>
                          <div className={styles.textContent}>{item.script}</div>
                        </div>
                      )}

                      {item.cta && (
                        <div className={styles.ctaBox}>
                          <strong>Lời kêu gọi (CTA):</strong> {item.cta}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className={styles.sectionTitle}>VIDEO SÁNG TẠO AI</div>
                      {item.video_url ? (
                        <div className={styles.videoBox}>
                          <video
                            controls
                            playsInline
                            src={item.video_url}
                            className={styles.videoPlayer}
                          />
                        </div>
                      ) : (
                        <div className={styles.videoBox}>
                          <div className={styles.videoPlaceholder}>
                            <Film size={32} />
                            <span>Chưa có video render sẵn hoặc dạng bài viết văn bản</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                      Tạo lúc: {new Date(item.created_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })} · ID: <code>{item.id.slice(0, 8)}</code>
                    </div>

                    <div className={styles.actionBtnGroup}>
                      <button
                        type="button"
                        className={styles.btnEdit}
                        onClick={() => openEditModal(item)}
                        disabled={isLoading}
                      >
                        <Edit3 size={15} />
                        Chỉnh sửa
                      </button>

                      {item.status !== "rejected" && (
                        <button
                          type="button"
                          className={styles.btnReject}
                          onClick={() => handleStatusChange(item.id, "rejected")}
                          disabled={isLoading}
                        >
                          <XCircle size={15} />
                          Từ chối
                        </button>
                      )}

                      {!isApproved && (
                        <button
                          type="button"
                          className={styles.btnApprove}
                          onClick={() => handleStatusChange(item.id, "approved")}
                          disabled={isLoading}
                        >
                          <CheckCircle2 size={15} />
                          Phê duyệt xuất bản
                        </button>
                      )}

                      {isApproved && (
                        <span style={{ fontSize: "13px", color: "#16a34a", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Check size={16} /> Đã sẵn sàng cho Reseller
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Modal chỉnh sửa câu chữ */}
        {editingItem && (
          <div className={styles.modalOverlay} onClick={() => setEditingItem(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                  Chỉnh sửa nội dung & Phê duyệt
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Hook giật tít mở đầu</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={editHook}
                  onChange={(e) => setEditHook(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nội dung bài viết (Caption mạng xã hội)</label>
                <textarea
                  className={styles.formTextarea}
                  style={{ minHeight: "140px" }}
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Lời thoại kịch bản (Script voiceover)</label>
                <textarea
                  className={styles.formTextarea}
                  value={editScript}
                  onChange={(e) => setEditScript(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Lời kêu gọi hành động (CTA)</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={editCta}
                  onChange={(e) => setEditCta(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button
                  type="button"
                  className={styles.btnEdit}
                  onClick={() => setEditingItem(null)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  className={styles.btnApprove}
                  onClick={handleSaveAndApprove}
                  disabled={actionLoading === editingItem.id}
                >
                  <CheckCircle2 size={15} />
                  Lưu & Phê duyệt ngay
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer style={{ padding: "24px", textAlign: "center", fontSize: "13px", color: "#64748b", borderTop: "1px solid #e2e8f0", background: "#ffffff" }}>
        TravelLink AI · Hệ thống Kiểm duyệt & Tiếp thị Du lịch Tự động
      </footer>
    </div>
  );
}

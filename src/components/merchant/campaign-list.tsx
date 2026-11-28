"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderPlus, PauseCircle, PlayCircle, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import styles from "./campaign-list.module.css";

export interface MerchantCampaignListItem {
  id: string;
  name: string;
  productId: string;
  productName: string;
  commissionRate: number | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  targetLocation?: string | null;
}

export function CampaignList({
  initialCampaigns = [],
  preview = false,
}: {
  initialCampaigns: MerchantCampaignListItem[];
  preview?: boolean;
}) {
  const [campaigns, setCampaigns] = useState<MerchantCampaignListItem[]>(initialCampaigns);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [generatingVideoId, setGeneratingVideoId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const root = preview ? "/preview/merchant" : "/merchant";

  async function handleAutoGenerateVideo(c: MerchantCampaignListItem) {
    setGeneratingVideoId(c.id);
    setActionMessage(null);

    try {
      const res = await fetch("/api/merchant/video/auto-pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: c.id,
          productId: c.productId,
          tourName: c.name,
          location: c.targetLocation || "Miền Trung",
          targetDurationSec: 46,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể khởi động luồng tạo video.");
      }

      setActionMessage(
        `🎬 Đã kích hoạt luồng tự động dựng Video Review 45s ngầm cho chiến dịch "${c.name}". Hệ thống tự động khớp B-roll và kịch bản 4 phân cảnh (Zero manual picking). Bạn hãy vào mục "Quản lý nội dung AI" (/merchant/contents) để duyệt video khi hoàn tất.`
      );
    } catch (err: any) {
      console.error("[handleAutoGenerateVideo] Error:", err);
      setActionMessage(`Lỗi: ${err.message || "Vui lòng thử lại sau."}`);
    } finally {
      setGeneratingVideoId(null);
    }
  }

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.productName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && c.status === "active") ||
      (statusFilter === "paused" && c.status === "paused") ||
      (statusFilter === "expired" && c.status === "expired");
    return matchesSearch && matchesStatus;
  });

  async function handleToggleStatus(campaignId: string, currentStatus: string) {
    const targetStatus = currentStatus === "active" ? "paused" : "active";
    setLoadingId(campaignId);
    setActionMessage(null);

    // Cập nhật Optimistic trên UI
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, status: targetStatus } : c))
    );

    try {
      const response = await fetch("/api/merchant/campaigns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaignId,
          status: targetStatus,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Không thể cập nhật trạng thái chiến dịch.");
      }

      setActionMessage(
        `Đã ${targetStatus === "active" ? "kích hoạt" : "tạm dừng"} chiến dịch thành công.`
      );
    } catch (err: any) {
      console.error("[CampaignList] Lỗi toggle status:", err);
      // Rollback
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaignId ? { ...c, status: currentStatus } : c))
      );
      setActionMessage(`Lỗi: ${err.message || "Vui lòng thử lại sau."}`);
    } finally {
      setLoadingId(null);
    }
  }

  function formatDate(d: string | null) {
    if (!d) return "Không thời hạn";
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return d;
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return d;
    }
  }

  function renderStatusBadge(status: string) {
    if (status === "active") {
      return (
        <span className={`${styles.badge} ${styles.badgeActive}`}>
          <span className={`${styles.dot} ${styles.dotActive}`} />
          Đang chạy
        </span>
      );
    }
    if (status === "paused") {
      return (
        <span className={`${styles.badge} ${styles.badgePaused}`}>
          <span className={`${styles.dot} ${styles.dotPaused}`} />
          Tạm dừng
        </span>
      );
    }
    return (
      <span className={`${styles.badge} ${styles.badgeExpired}`}>
        <span className={`${styles.dot} ${styles.dotExpired}`} />
        Hết hạn
      </span>
    );
  }

  return (
    <div className={styles.shell}>
      <div className={styles.main}>
        <section className={styles.heading}>
          <div>
            <p className="eyebrow">MERCHANT · CHIẾN DỊCH QUẢNG BÁ</p>
            <h1>Quản lý <em>chiến dịch.</em></h1>
            <p>
              Theo dõi tình trạng hoạt động, tỷ lệ hoa hồng và điều phối chiến dịch tiếp thị của doanh nghiệp.
            </p>
          </div>
          <Button asChild>
            <Link href={`${root}/campaigns/new`}>
              <FolderPlus size={18} />
              Tạo chiến dịch mới
            </Link>
          </Button>
        </section>

        {actionMessage && (
          <div
            role="status"
            style={{
              padding: "12px 16px",
              marginBottom: "20px",
              borderRadius: "8px",
              background: actionMessage.startsWith("Lỗi") ? "#fef2f2" : "#f0fdf4",
              border: `1px solid ${actionMessage.startsWith("Lỗi") ? "#fecaca" : "#bbf7d0"}`,
              color: actionMessage.startsWith("Lỗi") ? "#b91c1c" : "#15803d",
              fontSize: "14px",
            }}
          >
            {actionMessage}
          </div>
        )}

        <div className={styles.controls}>
          <div className={styles.searchBox}>
            <Search size={18} color="var(--muted-foreground)" />
            <input
              type="text"
              placeholder="Tìm theo tên chiến dịch hoặc sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Tìm kiếm chiến dịch"
            />
          </div>

          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Lọc theo trạng thái"
          >
            <option value="all">Tất cả trạng thái ({campaigns.length})</option>
            <option value="active">Đang chạy</option>
            <option value="paused">Tạm dừng</option>
            <option value="expired">Hết hạn</option>
          </select>
        </div>

        <div className={styles.tableContainer}>
          {filteredCampaigns.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>TÊN CHIẾN DỊCH</th>
                  <th>SẢN PHẨM LIÊN KẾT</th>
                  <th>HOA HỒNG</th>
                  <th>THỜI GIAN HIỆU LỰC</th>
                  <th>TRẠNG THÁI</th>
                  <th style={{ textAlign: "right" }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((c) => {
                  const isLoading = loadingId === c.id;
                  const isPaused = c.status === "paused";
                  return (
                    <tr key={c.id}>
                      <td>
                        <span className={styles.campaignName}>{c.name}</span>
                        {c.targetLocation && (
                          <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                            Khu vực: {c.targetLocation}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={styles.productName}>{c.productName}</span>
                      </td>
                      <td>
                        <span className={styles.rate}>
                          {c.commissionRate != null ? `${c.commissionRate}%` : "Mặc định"}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
                          {formatDate(c.startDate)} – {formatDate(c.endDate)}
                        </span>
                      </td>
                      <td>{renderStatusBadge(c.status)}</td>
                      <td style={{ textAlign: "right" }}>
                        <div className={styles.actionGroup}>
                          <button
                            type="button"
                            className={styles.btnAutoVideo}
                            disabled={generatingVideoId === c.id}
                            onClick={() => handleAutoGenerateVideo(c)}
                            title="Tự động sinh video review 40–50s ngầm mà không cần chọn từng ảnh thủ công"
                          >
                            <Sparkles size={14} />
                            <span>
                              {generatingVideoId === c.id ? "Đang gửi lệnh..." : "Tự sinh Video 45s"}
                            </span>
                          </button>
                          <button
                            type="button"
                            className={`${styles.toggleBtn} ${
                              isPaused ? styles.btnActivate : styles.btnPause
                            } ${isLoading ? styles.btnLoading : ""}`}
                            disabled={isLoading || c.status === "expired"}
                            onClick={() => handleToggleStatus(c.id, c.status)}
                            aria-label={`${isPaused ? "Kích hoạt" : "Tạm dừng"} chiến dịch ${c.name}`}
                          >
                            {isPaused ? (
                              <>
                                <PlayCircle size={15} />
                                {isLoading ? "Đang xử lý..." : "Kích hoạt lại"}
                              </>
                            ) : (
                              <>
                                <PauseCircle size={15} />
                                {isLoading ? "Đang xử lý..." : "Tạm dừng"}
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>
              <SlidersHorizontal size={40} strokeWidth={1.5} />
              <h3>Chưa có chiến dịch nào</h3>
              <p>
                {search || statusFilter !== "all"
                  ? "Không tìm thấy chiến dịch phù hợp với điều kiện lọc."
                  : "Bắt đầu tạo chiến dịch đầu tiên để kết nối với mạng lưới Reseller."}
              </p>
              <Button asChild variant="outline">
                <Link href={`${root}/campaigns/new`}>Tạo chiến dịch ngay</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      <footer className={styles.footer}>
        TravelLink AI · Không gian quản trị doanh nghiệp Merchant.
      </footer>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Compass,
  Film,
  FolderPlus,
  LayoutDashboard,
  Package,
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
} from "lucide-react";
import { Brand } from "@/src/components/brand";
import { Button } from "@/src/components/ui/button";
import type { MerchantProductDetail } from "@/src/lib/merchant/product-service";
import styles from "./product-list.module.css";

export function ProductList({
  initialProducts = [],
  preview = false,
}: {
  initialProducts: MerchantProductDetail[];
  preview?: boolean;
}) {
  const [products, setProducts] = useState<MerchantProductDetail[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const root = preview ? "/preview/merchant" : "/merchant";

  // Danh sách categories độc nhất từ sản phẩm
  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean)),
  );

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || p.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || p.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalCount = products.length;
  const activeCount = products.filter((p) => p.status === "active").length;
  const draftCount = products.filter((p) => p.status === "draft").length;

  async function handleToggleStatus(productId: string, currentStatus: "active" | "draft") {
    const targetStatus = currentStatus === "active" ? "draft" : "active";
    setLoadingId(productId);
    setActionMessage(null);

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, status: targetStatus } : p)),
    );

    try {
      const response = await fetch("/api/merchant/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          status: targetStatus,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Không thể cập nhật trạng thái sản phẩm.");
      }

      setActionMessage({
        type: "success",
        text: `Đã ${targetStatus === "active" ? "kích hoạt" : "chuyển sang bản nháp"} sản phẩm thành công.`,
      });
    } catch (err: any) {
      console.error("[ProductList] Lỗi toggle status:", err);
      // Rollback
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status: currentStatus } : p)),
      );
      setActionMessage({
        type: "error",
        text: `Lỗi: ${err.message || "Vui lòng thử lại sau."}`,
      });
    } finally {
      setLoadingId(null);
    }
  }

  function formatMoney(amount: number | null) {
    if (amount == null) return "Chưa đặt giá";
    return `${new Intl.NumberFormat("vi-VN").format(amount)} ₫`;
  }

  function calculateDiscount(original: number | null, sale: number | null) {
    if (!original || !sale || original <= sale) return null;
    const pct = Math.round(((original - sale) / original) * 100);
    return pct > 0 ? `-${pct}%` : null;
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Brand />
          <span className={styles.workspace}>
            <ShieldCheck size={16} /> MERCHANT PORTAL
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild size="sm">
            <Link href={`${root}/products/new`}>
              <Plus size={16} /> Thêm sản phẩm mới
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={root}>
              <ArrowLeft size={16} /> Về Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <main className={styles.main}>
        <nav className={styles.nav} aria-label="Điều hướng phân hệ">
          <Link href={root}>
            <LayoutDashboard size={16} /> Tổng quan
          </Link>
          <Link href={`${root}/products`} aria-current="page">
            <Package size={16} /> Quản lý sản phẩm ({totalCount})
          </Link>
          <Link href={`${root}/campaigns`}>
            <SlidersHorizontal size={16} /> Chiến dịch
          </Link>
          <Link href={`${root}/library`}>
            <Film size={16} /> Thư viện media
          </Link>
        </nav>

        <div className={styles.heading}>
          <div>
            <p className="eyebrow">DANH MỤC TRẢI NGHIỆM DU LỊCH</p>
            <h1>Quản lý Sản phẩm / Tour</h1>
            <p>
              Đăng tải và quản lý các tour, vé tham quan chính thức của doanh nghiệp bạn trên sàn TravelLink AI.
            </p>
          </div>
          <Button asChild>
            <Link href={`${root}/products/new`}>
              <Plus size={18} /> Thêm sản phẩm mới
            </Link>
          </Button>
        </div>

        {/* Thống kê nhanh */}
        <section className={styles.statsGrid} aria-label="Tóm tắt kho sản phẩm">
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Tổng sản phẩm trong kho</p>
            <p className={styles.statValue}>{totalCount}</p>
            <p className={styles.statHint}>Tour & dịch vụ đã tạo</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Đang hoạt động</p>
            <p className={styles.statValue} style={{ color: "#059669" }}>
              {activeCount}
            </p>
            <p className={styles.statHint}>Sẵn sàng gắn vào chiến dịch</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Bản nháp / Tạm dừng</p>
            <p className={styles.statValue} style={{ color: "#d97706" }}>
              {draftCount}
            </p>
            <p className={styles.statHint}>Chưa mở bán công khai</p>
          </div>
        </section>

        {actionMessage && (
          <div
            className={`${styles.messageBanner} ${actionMessage.type === "success" ? styles.messageSuccess : styles.messageError}`}
            role="alert"
          >
            <span>{actionMessage.text}</span>
            <button
              type="button"
              onClick={() => setActionMessage(null)}
              style={{ background: "none", border: "none", cursor: "pointer", fontWeight: "bold" }}
            >
              ×
            </button>
          </div>
        )}

        {/* Thanh tìm kiếm và bộ lọc */}
        <div className={styles.controls}>
          <div className={styles.controlsLeft}>
            <div className={styles.searchBox}>
              <Search size={16} color="var(--muted-foreground)" />
              <input
                type="text"
                placeholder="Tìm theo tên sản phẩm, mã hoặc mô tả..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Tìm kiếm sản phẩm"
              />
            </div>

            <select
              className={styles.filterSelect}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Lọc theo danh mục"
            >
              <option value="all">Tất cả danh mục ({totalCount})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Lọc theo trạng thái"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="draft">Bản nháp</option>
            </select>
          </div>
        </div>

        {/* Bảng danh sách sản phẩm */}
        {filteredProducts.length === 0 ? (
          <div className={styles.tableContainer}>
            <div className={styles.emptyState}>
              <Package size={44} strokeWidth={1.5} />
              <h3>Chưa có sản phẩm phù hợp</h3>
              <p>
                {products.length === 0
                  ? "Doanh nghiệp của bạn chưa tạo sản phẩm nào. Hãy bấm 'Thêm sản phẩm mới' để bắt đầu đăng tour đầu tiên."
                  : "Không tìm thấy sản phẩm nào khớp với từ khóa tìm kiếm hoặc bộ lọc hiện tại."}
              </p>
              {products.length === 0 ? (
                <Button asChild>
                  <Link href={`${root}/products/new`}>
                    <Plus size={16} /> Tạo sản phẩm đầu tiên
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setCategoryFilter("all");
                  }}
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table} aria-label="Danh sách sản phẩm">
              <thead>
                <tr>
                  <th>SẢN PHẨM / TOUR</th>
                  <th>DANH MỤC</th>
                  <th>GIÁ BÁN & ƯU ĐÃI</th>
                  <th>CỔNG THANH TOÁN CHÍNH THỨC</th>
                  <th>TRẠNG THÁI</th>
                  <th style={{ textAlign: "right" }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const discount = calculateDiscount(p.originalPrice, p.salePrice);
                  const officialUrl = p.paymentUrl || p.bookingUrl;
                  const isBusy = loadingId === p.id;

                  return (
                    <tr key={p.id}>
                      <td>
                        <div className={styles.productCell}>
                          <div className={styles.productIcon}>
                            <Compass size={20} />
                          </div>
                          <div>
                            <span className={styles.productName}>{p.name}</span>
                            <span className={styles.productId}>ID: {p.id.slice(0, 8)}...</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={styles.categoryBadge}>
                          <Tag size={12} style={{ marginRight: 4 }} />
                          {p.category}
                        </span>
                      </td>
                      <td>
                        <div className={styles.priceBlock}>
                          <span className={styles.salePrice}>{formatMoney(p.salePrice)}</span>
                          {p.originalPrice != null && p.originalPrice > (p.salePrice || 0) && (
                            <span className={styles.originalPrice}>
                              {formatMoney(p.originalPrice)}
                            </span>
                          )}
                          {discount && <span className={styles.discountBadge}>{discount}</span>}
                        </div>
                      </td>
                      <td>
                        {officialUrl ? (
                          <a
                            href={officialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.urlBadge}
                            title={officialUrl}
                          >
                            <ArrowUpRight size={13} />
                            {officialUrl.replace(/^https?:\/\//, "").slice(0, 22)}...
                          </a>
                        ) : (
                          <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                            Chưa gắn link
                          </span>
                        )}
                      </td>
                      <td>
                        {p.status === "active" ? (
                          <span className={`${styles.badge} ${styles.badgeActive}`}>
                            <span className={`${styles.dot} ${styles.dotActive}`} />
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className={`${styles.badge} ${styles.badgeDraft}`}>
                            <span className={`${styles.dot} ${styles.dotDraft}`} />
                            Bản nháp
                          </span>
                        )}
                      </td>
                      <td>
                        <div className={styles.actionsGroup}>
                          <Link
                            href={`${root}/campaigns/new?product_id=${p.id}`}
                            className={styles.campaignBtn}
                            title="Tạo chiến dịch phân phối cho tour này"
                          >
                            <FolderPlus size={14} /> Tạo chiến dịch
                          </Link>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleToggleStatus(p.id, p.status)}
                            className={`${styles.toggleBtn} ${p.status === "active" ? styles.btnDraft : styles.btnActive} ${isBusy ? styles.btnLoading : ""}`}
                            aria-label={`${p.status === "active" ? "Tạm dừng" : "Kích hoạt"} sản phẩm ${p.name}`}
                          >
                            {p.status === "active" ? (
                              <>
                                <PauseCircle size={14} /> Chuyển nháp
                              </>
                            ) : (
                              <>
                                <PlayCircle size={14} /> Kích hoạt
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
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        TravelLink AI · Nền tảng phân phối du lịch B2B2C ứng dụng AI · Merchant Product Center
      </footer>
    </div>
  );
}

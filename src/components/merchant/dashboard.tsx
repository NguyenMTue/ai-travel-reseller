"use client";
import { useState } from "react";
import Link from "next/link";
import { Package, MessageSquare, ArrowUpRight, Search, Compass, X, ShieldCheck, Plus, Trophy } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { demoProducts, demoMetrics } from "@/src/lib/merchant-demo";
import { CampaignCreatedNotice } from "./campaign-created-notice";
import { MerchantPointsWidget } from "./merchant-points-widget";
import { ResellerLeaderboardModal } from "./reseller-leaderboard-modal";

export interface DashboardMetricProp {
  label: string;
  value: string;
  unit: string;
  detail: string;
}

export interface DashboardProductProp {
  id: string;
  name: string;
  category: string;
  status: string;
  tone: string;
  detail: string;
  salePrice?: number | null;
  originalPrice?: number | null;
}

export function Dashboard({
  preview = false,
  initialMetrics,
  initialProducts,
}: {
  preview?: boolean;
  initialMetrics?: DashboardMetricProp[];
  initialProducts?: DashboardProductProp[];
}) {
  const [tab, setTab] = useState("overview");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState("sample");
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const effectiveProducts: DashboardProductProp[] = preview
    ? demoProducts
    : (initialProducts ?? demoProducts);

  const effectiveMetrics: DashboardMetricProp[] = preview
    ? demoMetrics
    : (initialMetrics ?? demoMetrics);

  const products =
    preview && view === "empty"
      ? []
      : effectiveProducts.filter(
          (p) =>
            p.name
              .toLocaleLowerCase("vi")
              .includes(query.toLocaleLowerCase("vi")) &&
            (status === "all" ||
              p.status.toLocaleLowerCase("vi") === status.toLocaleLowerCase("vi") ||
              (status === "Đang hoạt động" && (p.status === "Đang hoạt động" || p.status === "active")) ||
              (status === "Bản nháp" && (p.status === "Bản nháp" || p.status === "draft"))),
        );
  const product = effectiveProducts.find((p) => p.id === selected);
  return (
    <>
        <div className="dashboard-main">
          <CampaignCreatedNotice preview={preview} />
          <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Nội dung Tổng quan">
            <Button variant={tab === "overview" ? "default" : "outline"} aria-pressed={tab === "overview"} onClick={() => setTab("overview")}>Tổng quan</Button>
            <Button variant={tab === "products" ? "default" : "outline"} aria-pressed={tab === "products"} onClick={() => setTab("products")}>Sản phẩm</Button>
          </div>
          {preview && (
            <div className="preview-banner">
              <span>
                <span className="dot" /> BẢN XEM TRƯỚC · Toàn bộ số liệu bên dưới là dữ liệu minh họa.
              </span>
              <label>
                Trạng thái{" "}
                <select
                  aria-label="Trạng thái giao diện"
                  value={view}
                  onChange={(e) => setView(e.target.value)}
                >
                  <option value="sample">Có dữ liệu</option>
                  <option value="empty">Trống</option>
                  <option value="loading">Đang tải</option>
                  <option value="error">Lỗi</option>
                </select>
              </label>
            </div>
          )}
          <div className="dashboard-title">
            <div>
              <p className="eyebrow">MERCHANT PORTAL</p>
              <h1>
                {tab === "overview"
                  ? "Tổng quan hoạt động"
                  : "Sản phẩm của bạn"}
              </h1>
              <p>
                {tab === "overview"
                  ? "Một góc nhìn trọn vẹn về những kết nối của bạn."
                  : "Thông tin sản phẩm là điểm bắt đầu cho mọi kết nối."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLeaderboard(true)}
                className="border-amber-300 bg-amber-50/60 text-amber-950 hover:bg-amber-100/80 font-medium"
              >
                <Trophy className="h-4 w-4 text-amber-600 mr-1.5" />
                Top Reseller & Budget
              </Button>
              <Button asChild>
                <Link href={preview ? "/preview/merchant/campaigns/new" : "/merchant/campaigns/new"}>
                  Tạo chiến dịch <ArrowUpRight />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/chat">
                  <MessageSquare />
                  Khám phá trợ lý AI
                </Link>
              </Button>
            </div>
          </div>
          {preview && view === "loading" ? (
            <div
              role="status"
              aria-label="Đang tải Dashboard"
              className="skeleton-grid"
            >
              {[1, 2, 3, 4].map((x) => (
                <div className="skeleton" key={x} />
              ))}
              <p>Đang tải dữ liệu…</p>
            </div>
          ) : preview && view === "error" ? (
            <div className="empty-state" role="alert">
              <h2>Chưa tải được dữ liệu</h2>
              <p>Đây là trạng thái lỗi minh họa. Bạn có thể thử lại.</p>
              <Button onClick={() => setView("sample")}>Thử lại</Button>
            </div>
          ) : (
            <>
              {tab === "overview" && (
                <>
                  <MerchantPointsWidget className="mb-6" />
                  <div className="metrics">
                    {effectiveMetrics.map((m, i) => (
                      <article
                        key={m.label}
                        className={`metric ${i === 0 ? "metric-featured" : ""}`}
                      >
                        <span>
                          {m.label}
                          <ArrowUpRight size={16} />
                        </span>
                        <h2>
                          {preview && view === "empty" ? "—" : m.value}{" "}
                          <small>{m.unit}</small>
                        </h2>
                        <p>{preview && view === "empty" ? "Chưa có dữ liệu" : m.detail}</p>
                      </article>
                    ))}
                  </div>
                  <div className="dashboard-feature">
                    <div>
                      <span className="eyebrow">CÙNG BẠN PHÁT TRIỂN</span>
                      <h2>
                        Trải nghiệm tốt xứng đáng
                        <br />
                        được nhiều người biết đến.
                      </h2>
                      <p>Bắt đầu từ thông tin sản phẩm rõ ràng và chính xác.</p>
                      <Button
                        variant="secondary"
                        onClick={() => setTab("products")}
                      >
                        Khám phá sản phẩm <ArrowUpRight />
                      </Button>
                    </div>
                    <Compass className="feature-compass" strokeWidth={0.7} />
                  </div>
                </>
              )}
              <section className="product-panel">
                <div className="panel-heading">
                  <div>
                    <h2>
                      {tab === "overview"
                        ? "Sản phẩm nổi bật"
                        : "Danh sách sản phẩm"}
                    </h2>
                    <p>
                      {preview
                        ? `${products.length} sản phẩm minh họa · Dữ liệu mẫu`
                        : `${products.length} sản phẩm thực tế từ hệ thống`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild size="sm">
                      <Link href={preview ? "/preview/merchant/products/new" : "/merchant/products/new"}>
                        <Plus size={15} /> Thêm sản phẩm
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={preview ? "/preview/merchant/products" : "/merchant/products"}>
                        Quản lý chi tiết ↗
                      </Link>
                    </Button>
                  </div>
                </div>
                <div className="product-filters">
                  <div className="search-input">
                    <Search size={18} />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Tìm tên sản phẩm…"
                      aria-label="Tìm sản phẩm"
                    />
                  </div>
                  <select
                    aria-label="Lọc trạng thái sản phẩm"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="Đang hoạt động">Đang hoạt động</option>
                    <option value="Bản nháp">Bản nháp</option>
                  </select>
                </div>
                {products.length ? (
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>SẢN PHẨM</th>
                          <th>DANH MỤC</th>
                          <th>GIÁ BÁN</th>
                          <th>TRẠNG THÁI</th>
                          <th>
                            <span className="sr-only">Chi tiết</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p) => (
                          <tr key={p.id}>
                            <td>
                              <div className="product-name">
                                <span className={`product-thumbnail ${p.tone}`}>
                                  <Compass />
                                </span>
                                <span>
                                  <strong>{p.name}</strong>
                                  <small>{p.id.toUpperCase()}</small>
                                </span>
                              </div>
                            </td>
                            <td>{p.category}</td>
                            <td>
                              {p.salePrice != null
                                ? `${new Intl.NumberFormat("vi-VN").format(p.salePrice)} ₫`
                                : "Chưa cung cấp"}
                            </td>
                            <td>
                              <span
                                className={`status-pill ${p.status === "Bản nháp" || p.status === "draft" ? "draft" : ""}`}
                              >
                                {p.status}
                              </span>
                            </td>
                            <td>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Xem ${p.name}`}
                                onClick={() =>
                                  setSelected(selected === p.id ? null : p.id)
                                }
                              >
                                <ArrowUpRight />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <Package />
                    <h3>Chưa có sản phẩm phù hợp</h3>
                    <p>
                      {effectiveProducts.length === 0
                        ? "Chưa có sản phẩm nào được tạo. Hãy tạo chiến dịch hoặc sản phẩm mới để bắt đầu."
                        : "Thử tên khác hoặc bỏ bộ lọc để xem lại danh sách."}
                    </p>
                    {effectiveProducts.length > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setQuery("");
                          setStatus("all");
                        }}
                      >
                        Xóa bộ lọc
                      </Button>
                    )}
                  </div>
                )}
                {product && (
                  <div
                    className="product-detail"
                    role="region"
                    aria-label="Chi tiết sản phẩm"
                  >
                    <div>
                      <h3>{product.name}</h3>
                      <p>{product.detail}</p>
                      <p>
                        {product.salePrice != null
                          ? `Giá ưu đãi: ${new Intl.NumberFormat("vi-VN").format(product.salePrice)} ₫`
                          : "Giá, hoa hồng, lịch hoạt động: chưa có thông tin xác nhận."}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Đóng chi tiết"
                      onClick={() => setSelected(null)}
                    >
                      <X />
                    </Button>
                  </div>
                )}
              </section>
              <p className="dashboard-footnote">
                <ShieldCheck size={16} /> Khách hàng thanh toán trực tiếp trên
                trang chính thức của doanh nghiệp.
              </p>
            </>
          )}
        </div>
      <ResellerLeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />
    </>
  );
}

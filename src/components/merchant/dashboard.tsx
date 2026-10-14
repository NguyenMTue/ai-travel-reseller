"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Megaphone,
  MessageSquare,
  ArrowUpRight,
  Search,
  Compass,
  SlidersHorizontal,
  X,
  ShieldCheck,
} from "lucide-react";
import { Brand } from "@/src/components/brand";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { demoProducts, demoMetrics } from "@/src/lib/merchant-demo";
import { MerchantHeader } from "@/src/components/merchant/merchant-header";
import { CampaignCreateForm } from "@/src/components/merchant/campaign-create-form";
import { MerchantProductsPanel } from "@/src/components/merchant/merchant-products-panel";
export function Dashboard({ preview = false, initialTab = "overview" }: { preview?: boolean; initialTab?: string }) {
  const pathname = usePathname();
  const [tab, setTab] = useState(initialTab);
  const activeTab = pathname === "/merchant/campaigns/create"
    ? "create-campaign"
    : pathname === "/merchant/products"
      ? "products"
      : tab === "create-campaign" ? "overview" : tab;
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [menu, setMenu] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState("sample");
  const products =
    view === "empty"
      ? []
      : demoProducts.filter(
          (p) =>
            p.name
              .toLocaleLowerCase("vi")
              .includes(query.toLocaleLowerCase("vi")) &&
            (status === "all" || p.status === status),
        );
  const product = demoProducts.find((p) => p.id === selected);

  useEffect(() => {
    if (!menu) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenu(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [menu]);

  return (
    <div className="dashboard-shell">
      {menu ? (
        <button
          type="button"
          className="merchant-menu-backdrop"
          aria-label="Đóng menu điều hướng"
          onClick={() => setMenu(false)}
        />
      ) : null}
      <aside id="merchant-navigation" className={`sidebar ${menu ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <Brand />
          <button
            className="mobile-close"
            aria-label="Đóng điều hướng"
            onClick={() => setMenu(false)}
          >
            <X />
          </button>
        </div>
        <div className="workspace">
          <span className="workspace-avatar">M</span>
          <div>
            <strong>Không gian doanh nghiệp</strong>
            <small>Merchant Portal</small>
          </div>
        </div>
        <p className="nav-label">KHÔNG GIAN LÀM VIỆC</p>
        <nav aria-label="Điều hướng Merchant">
          {preview ? (
            <button
              aria-current={activeTab === "overview" ? "page" : undefined}
              onClick={() => {
                setTab("overview");
                setMenu(false);
              }}
            >
              <LayoutDashboard size={19} />
              Tổng quan
            </button>
          ) : (
            <Link
              href="/merchant"
              onClick={() => setMenu(false)}
              aria-current={pathname === "/merchant" ? "page" : undefined}
            >
              <LayoutDashboard size={19} />
              Tổng quan
            </Link>
          )}
          {preview ? (
            <button
              aria-current={activeTab === "products" ? "page" : undefined}
              onClick={() => {
                setTab("products");
                setMenu(false);
              }}
            >
              <Package size={19} />
              Sản phẩm<span className="nav-count">{demoProducts.length}</span>
            </button>
          ) : (
            <Link
              href="/merchant/products"
              onClick={() => setMenu(false)}
              aria-current={pathname === "/merchant/products" ? "page" : undefined}
            >
              <Package size={19} />
              Sản phẩm<span className="nav-count">{demoProducts.length}</span>
            </Link>
          )}
          <Link
            href="/merchant/campaigns/create"
            onClick={() => setMenu(false)}
            aria-current={pathname === "/merchant/campaigns/create" ? "page" : undefined}
          >
            <Megaphone size={19} />
            Tạo chiến dịch
          </Link>
          <Link href="/chat" onClick={() => setMenu(false)}>
            <MessageSquare size={19} />
            Trợ lý AI
            <ArrowUpRight size={15} />
          </Link>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <Compass />
            <h3>
              Mỗi kết nối,
              <br />
              một cơ hội mới.
            </h3>
            <p>Khám phá cách TravelLink đồng hành cùng bạn.</p>
            <Link href="/#how-it-works">Tìm hiểu thêm ↗</Link>
          </div>
          {preview ? (
            <Link className="sidebar-login" href="/login">
              Đăng nhập tài khoản <ArrowUpRight size={16} />
            </Link>
          ) : null}
        </div>
      </aside>
      <div className="dashboard-body">
        <MerchantHeader
          preview={preview}
          menuOpen={menu}
          onToggleMenu={() => setMenu(!menu)}
          breadcrumb={activeTab === "overview" ? "Tổng quan" : activeTab === "products" ? "Sản phẩm" : "Tạo chiến dịch"}
        />
        <main id="main-content" className="dashboard-main page-enter">
          <div className="preview-banner">
            <span>
              <span className="dot" />{" "}
              {preview ? "BẢN XEM TRƯỚC · DỮ LIỆU MINH HỌA" : "KHU VỰC DOANH NGHIỆP · SẢN PHẨM ĐƯỢC TẢI TỪ SUPABASE"}
            </span>
            {preview ? (
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
            ) : null}
          </div>
          <div className="dashboard-title">
            <div>
              <p className="eyebrow">MERCHANT PORTAL</p>
              <h1>
                {activeTab === "overview"
                  ? "Tổng quan hoạt động"
                  : activeTab === "products" ? "Sản phẩm của bạn" : "Tạo chiến dịch"}
              </h1>
              <p>
                {activeTab === "overview"
                  ? "Một góc nhìn trọn vẹn về những kết nối của bạn."
                  : activeTab === "products" ? "Thông tin sản phẩm là điểm bắt đầu cho mọi kết nối." : "Tạo chiến dịch để giới thiệu sản phẩm đến mạng lưới cộng tác viên."}
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/chat">
                <MessageSquare />
                Khám phá trợ lý AI
              </Link>
            </Button>
          </div>
          {activeTab === "create-campaign" ? (
            <CampaignCreateForm />
          ) : activeTab === "products" ? (
            <MerchantProductsPanel preview={preview} />
          ) : view === "loading" ? (
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
          ) : view === "error" ? (
            <div className="empty-state" role="alert">
              <h2>Chưa tải được dữ liệu</h2>
              <p>Đây là trạng thái lỗi minh họa. Bạn có thể thử lại.</p>
              <Button onClick={() => setView("sample")}>Thử lại</Button>
            </div>
          ) : (
            <>
              {activeTab === "overview" && (
                <>
                  <div className="metrics">
                    {demoMetrics.map((m, i) => (
                      <article
                        key={m.label}
                        className={`metric ${i === 0 ? "metric-featured" : ""}`}
                      >
                        <span>
                          {m.label}
                          <ArrowUpRight size={16} />
                        </span>
                        <h2>
                          {view === "empty" ? "—" : m.value}{" "}
                          <small>{m.unit}</small>
                        </h2>
                        <p>{view === "empty" ? "Chưa có dữ liệu" : m.detail}</p>
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
                      {activeTab === "overview"
                        ? "Sản phẩm nổi bật"
                        : "Danh sách sản phẩm"}
                    </h2>
                    <p>
                      {products.length} sản phẩm minh họa · Chưa kết nối dữ liệu
                      thật
                    </p>
                  </div>
                  <SlidersHorizontal size={20} />
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
                          <tr
                            key={p.id}
                            className={
                              selected === p.id ? "table-row-selected" : undefined
                            }
                          >
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
                            <td>Chưa cung cấp</td>
                            <td>
                              <span
                                className={`status-pill ${p.status === "Bản nháp" ? "draft" : ""}`}
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
                      {view === "empty"
                        ? "Sản phẩm sẽ xuất hiện tại đây sau khi doanh nghiệp cung cấp dữ liệu."
                        : "Thử tên khác hoặc bỏ bộ lọc để xem lại danh sách."}
                    </p>
                    {view !== "empty" && (
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
                        Giá, hoa hồng, lịch hoạt động: chưa có thông tin xác
                        nhận.
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
        </main>
      </div>
    </div>
  );
}


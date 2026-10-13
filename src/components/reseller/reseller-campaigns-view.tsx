"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  RotateCcw,
  Search,
  Tag,
  Ticket,
} from "lucide-react";
import { formatVND, type CampaignItem } from "@/src/lib/reseller-data";

type ResellerCampaignsViewProps = {
  campaigns: CampaignItem[];
  source: "database" | "demo";
  error?: string | null;
};

export function ResellerCampaignsView({
  campaigns,
  source,
  error = null,
}: ResellerCampaignsViewProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [location, setLocation] = useState("all");
  const [minimumCommission, setMinimumCommission] = useState("all");
  const [commissionOrder, setCommissionOrder] = useState("highest");

  const categories = useMemo(
    () => [...new Set(campaigns.map((campaign) => campaign.category).filter(Boolean))].sort(),
    [campaigns],
  );
  const locations = useMemo(
    () =>
      [...new Set(campaigns.flatMap((campaign) => campaign.target_location.split(",").map((item) => item.trim())).filter(Boolean))].sort(),
    [campaigns],
  );

  const filteredCampaigns = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("vi");
    return campaigns
      .filter((campaign) => {
        const searchable = [
          campaign.name,
          campaign.product_name,
          campaign.merchant_name,
          campaign.description ?? "",
        ]
          .join(" ")
          .toLocaleLowerCase("vi");
        const locationsInCampaign = campaign.target_location
          .split(",")
          .map((item) => item.trim());

        return (
          (!query || searchable.includes(query)) &&
          (category === "all" || campaign.category === category) &&
          (location === "all" || locationsInCampaign.includes(location)) &&
          (minimumCommission === "all" ||
            campaign.commission_rate >= Number(minimumCommission))
        );
      })
      .sort((a, b) =>
        commissionOrder === "lowest"
          ? a.commission_rate - b.commission_rate
          : b.commission_rate - a.commission_rate,
      );
  }, [campaigns, category, commissionOrder, location, minimumCommission, search]);

  const hasFilters =
    Boolean(search) ||
    category !== "all" ||
    location !== "all" ||
    minimumCommission !== "all" ||
    commissionOrder !== "highest";

  function resetFilters() {
    setSearch("");
    setCategory("all");
    setLocation("all");
    setMinimumCommission("all");
    setCommissionOrder("highest");
  }

  return (
    <>
      <div className="reseller-section-header campaign-page-heading">
        <div>
          <h1 className="reseller-heading-title">Chiến dịch dành cho bạn</h1>
          <p className="reseller-heading-subtitle">
            Khám phá sản phẩm du lịch và chọn chiến dịch phù hợp với cộng đồng của bạn.
          </p>
        </div>
      </div>

      {source === "demo" ? (
        <div className="reseller-alert-banner" role="note">
          <Tag size={17} className="reseller-alert-icon" aria-hidden />
          <span>Dữ liệu minh họa để xem giao diện; chưa được tải từ cơ sở dữ liệu.</span>
        </div>
      ) : null}

      <section className="campaign-filters" aria-label="Bộ lọc chiến dịch">
        <label className="campaign-search-field">
          <span className="sr-only">Tìm chiến dịch</span>
          <Search size={17} aria-hidden />
          <input
            type="search"
            className="reseller-filter-search"
            placeholder="Tìm chiến dịch, sản phẩm, nhà cung cấp..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label>
          <span className="sr-only">Lọc danh mục</span>
          <select className="reseller-filter-select" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">Tất cả danh mục</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Lọc địa điểm</span>
          <select className="reseller-filter-select" value={location} onChange={(event) => setLocation(event.target.value)}>
            <option value="all">Tất cả địa điểm</option>
            {locations.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Lọc mức hoa hồng tối thiểu</span>
          <select className="reseller-filter-select" value={minimumCommission} onChange={(event) => setMinimumCommission(event.target.value)}>
            <option value="all">Mọi mức hoa hồng</option>
            <option value="8">Từ 8% trở lên</option>
            <option value="10">Từ 10% trở lên</option>
            <option value="12">Từ 12% trở lên</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Sắp xếp hoa hồng</span>
          <select className="reseller-filter-select" value={commissionOrder} onChange={(event) => setCommissionOrder(event.target.value)}>
            <option value="highest">Hoa hồng cao nhất</option>
            <option value="lowest">Hoa hồng thấp nhất</option>
          </select>
        </label>
        {hasFilters ? (
          <button type="button" className="reseller-action-btn campaign-reset" onClick={resetFilters}>
            <RotateCcw size={14} aria-hidden /> Đặt lại
          </button>
        ) : null}
      </section>

      {error ? (
        <div className="reseller-card campaign-state" role="alert">
          <h2>Chưa tải được chiến dịch</h2>
          <p>{error}</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="reseller-card campaign-state" role="status">
          <h2>Chưa có chiến dịch đang mở</h2>
          <p>Các chiến dịch khả dụng sẽ xuất hiện tại đây khi được Merchant phê duyệt.</p>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="reseller-card campaign-state" role="status">
          <h2>Không tìm thấy chiến dịch phù hợp</h2>
          <p>Thử thay đổi từ khóa hoặc bộ lọc để xem thêm chiến dịch.</p>
          <button type="button" className="reseller-action-btn" onClick={resetFilters}>Đặt lại bộ lọc</button>
        </div>
      ) : (
        <div className="campaign-grid" aria-live="polite">
          {filteredCampaigns.map((campaign) => (
            <article className="reseller-card campaign-card" key={campaign.id}>
              <div className="campaign-card-cover" aria-hidden>
                <Ticket size={27} strokeWidth={1.6} />
                <span>{campaign.category}</span>
              </div>
              <div className="campaign-card-content">
                <div className="campaign-card-topline">
                  <span className="reseller-badge-mint">Hoa hồng {campaign.commission_rate}%</span>
                  <span className="reseller-badge-gray">{campaign.status === "active" ? "Đang mở" : campaign.status}</span>
                </div>
                <h2 className="reseller-card-title">{campaign.name}</h2>
                <p className="reseller-card-subtitle">{campaign.merchant_name} · {campaign.product_name}</p>
                {campaign.description ? <p className="campaign-description">{campaign.description}</p> : null}
                <div className="campaign-card-meta">
                  <span><MapPin size={15} aria-hidden />{campaign.target_location}</span>
                  <span>{formatVND(campaign.sale_price)}</span>
                </div>
                <div className="campaign-card-footer">
                  <span>{campaign.start_date} – {campaign.end_date}</span>
                  <Link href={`/reseller/campaigns/${campaign.id}`} className="reseller-primary-btn">
                    Xem chiến dịch <ArrowRight size={15} aria-hidden />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

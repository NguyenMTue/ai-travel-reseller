"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Filter, ArrowRight, Tag, MapPin, Percent } from "lucide-react";
import { sampleCampaigns, formatVND, CampaignItem } from "@/src/lib/reseller-data";

export function ResellerCampaignsView() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [location, setLocation] = useState("all");
  const [minCommission, setMinCommission] = useState("all");

  const categories = [
    "all",
    "Tour trong ngày",
    "Vé tham quan & Ẩm thực",
    "Vé công viên chủ đề",
    "Trải nghiệm đêm",
  ];

  const locations = [
    "all",
    "Đà Nẵng",
    "Hội An",
    "Quảng Nam",
    "Toàn quốc",
  ];

  const filteredCampaigns = sampleCampaigns.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.product_name.toLowerCase().includes(search.toLowerCase()) ||
      c.merchant_name.toLowerCase().includes(search.toLowerCase());

    const matchCategory = category === "all" || c.category === category;
    const matchLocation =
      location === "all" || c.target_location.includes(location);

    const matchCommission =
      minCommission === "all" ||
      (minCommission === "10" && c.commission_rate >= 10) ||
      (minCommission === "12" && c.commission_rate >= 12) ||
      (minCommission === "8" && c.commission_rate >= 8);

    return matchSearch && matchCategory && matchLocation && matchCommission;
  });

  return (
    <>
      <div className="reseller-heading-title">Chiến dịch</div>
      <div className="reseller-heading-subtitle" style={{ marginBottom: 20 }}>
        Danh sách chiến dịch mẫu từ nhà cung cấp.
      </div>

      {/* Bộ lọc chiến dịch */}
      <div className="reseller-filter-bar">
        <input
          type="text"
          className="reseller-filter-search"
          placeholder="Tìm chiến dịch, sản phẩm, nhà cung cấp..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="reseller-filter-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Lọc danh mục"
        >
          <option value="all">Tất cả danh mục</option>
          <option value="Tour trong ngày">Tour trong ngày</option>
          <option value="Vé tham quan & Ẩm thực">Vé tham quan & Ẩm thực</option>
          <option value="Vé công viên chủ đề">Vé công viên chủ đề</option>
          <option value="Trải nghiệm đêm">Trải nghiệm đêm</option>
        </select>

        <select
          className="reseller-filter-select"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          aria-label="Lọc địa điểm"
        >
          <option value="all">Tất cả địa điểm</option>
          <option value="Đà Nẵng">Đà Nẵng</option>
          <option value="Hội An">Hội An</option>
          <option value="Quảng Nam">Quảng Nam</option>
          <option value="Toàn quốc">Toàn quốc</option>
        </select>

        <select
          className="reseller-filter-select"
          value={minCommission}
          onChange={(e) => setMinCommission(e.target.value)}
          aria-label="Lọc mức hoa hồng"
        >
          <option value="all">Tất cả mức hoa hồng</option>
          <option value="8">Từ 8% trở lên</option>
          <option value="10">Từ 10% trở lên</option>
          <option value="12">Từ 12% trở lên</option>
        </select>
      </div>

      {filteredCampaigns.length === 0 ? (
        <div className="reseller-card" style={{ textAlign: "center", padding: 48 }}>
          <p style={{ color: "#6B7280", fontSize: 15, marginBottom: 16 }}>
            Không tìm thấy chiến dịch nào phù hợp với bộ lọc hiện tại.
          </p>
          <button
            type="button"
            className="reseller-action-btn"
            onClick={() => {
              setSearch("");
              setCategory("all");
              setLocation("all");
              setMinCommission("all");
            }}
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {filteredCampaigns.map((camp) => (
            <div key={camp.id} className="reseller-card" style={{ marginBottom: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div className="reseller-card-title">{camp.name}</div>
                  <div className="reseller-card-subtitle">{camp.merchant_name}</div>
                </div>
                <span className="reseller-badge-mint">
                  Hoa hồng: {camp.commission_rate}%
                </span>
              </div>

              <div className="reseller-info-grid">
                <div className="reseller-info-item">
                  <span className="reseller-info-label">Sản phẩm</span>
                  <span className="reseller-info-val">{camp.product_name}</span>
                </div>

                <div className="reseller-info-item">
                  <span className="reseller-info-label">Giá bán</span>
                  <span className="reseller-info-val">{formatVND(camp.sale_price)}</span>
                </div>

                <div className="reseller-info-item">
                  <span className="reseller-info-label">Tỷ lệ hoa hồng</span>
                  <span className="reseller-info-val">
                    {camp.commission_rate}% (~{formatVND(camp.commission_amount_est || (camp.sale_price * camp.commission_rate) / 100)} / đơn)
                  </span>
                </div>

                <div className="reseller-info-item">
                  <span className="reseller-info-label">Thời gian</span>
                  <span className="reseller-info-val">
                    {camp.start_date} – {camp.end_date}
                  </span>
                </div>

                <div className="reseller-info-item">
                  <span className="reseller-info-label">Đối tượng</span>
                  <span className="reseller-info-val">{camp.target_audience}</span>
                </div>

                <div className="reseller-info-item">
                  <span className="reseller-info-label">Khu vực</span>
                  <span className="reseller-info-val">{camp.target_location}</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, borderTop: "1px solid #F3F4F1", paddingTop: 18 }}>
                <span style={{ fontSize: 12, color: "#6B7280" }}>
                  Danh mục: <strong>{camp.category}</strong>
                </span>
                <Link
                  href={`/reseller/campaigns/${camp.id}`}
                  className="reseller-primary-btn"
                >
                  <span>Tham gia chiến dịch</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

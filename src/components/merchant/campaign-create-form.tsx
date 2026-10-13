"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, Megaphone } from "lucide-react";
import Link from "next/link";
import { demoProducts } from "@/src/lib/merchant-demo";

export function CampaignCreateForm() {
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Biểu mẫu đã được kiểm tra. Chức năng lưu chiến dịch chưa được kết nối.");
  }

  return (
    <section className="merchant-campaign-form-card" aria-labelledby="merchant-campaign-form-title">
      <Link href="/merchant" className="merchant-campaign-back"><ArrowLeft size={16} /> Về tổng quan</Link>
      <div className="merchant-campaign-form-heading">
        <span><Megaphone size={20} aria-hidden /></span>
        <div>
          <h2 id="merchant-campaign-form-title">Thông tin chiến dịch</h2>
          <p>Cung cấp thông tin để cộng tác viên có thể giới thiệu sản phẩm của bạn.</p>
        </div>
      </div>
      <form className="merchant-campaign-form" onSubmit={handleSubmit}>
        <label>
          Tên chiến dịch
          <input name="name" required maxLength={120} placeholder="Ví dụ: Ưu đãi nghỉ dưỡng mùa thu" />
        </label>
        <label>
          Sản phẩm
          <select name="product" required defaultValue="">
            <option value="" disabled>Chọn sản phẩm</option>
            {demoProducts.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
          </select>
        </label>
        <label className="merchant-campaign-form-wide">
          Mô tả
          <textarea name="description" required rows={4} maxLength={1000} placeholder="Mô tả điểm nổi bật và ưu đãi của chiến dịch" />
        </label>
        <label>
          Địa điểm áp dụng
          <input name="location" required placeholder="Ví dụ: Đà Nẵng" />
        </label>
        <label>
          Hoa hồng (%)
          <input name="commission" type="number" min="0" max="100" step="0.1" required placeholder="10" />
        </label>
        <label>
          Ngày bắt đầu
          <input name="startDate" type="date" required />
        </label>
        <label>
          Ngày kết thúc
          <input name="endDate" type="date" required />
        </label>
        <div className="merchant-campaign-form-actions">
          <button type="submit" className="merchant-campaign-submit">Kiểm tra thông tin</button>
          <p role="status" aria-live="polite">{message}</p>
        </div>
      </form>
      <p className="merchant-campaign-form-note">Dữ liệu sản phẩm hiện là dữ liệu minh họa. Biểu mẫu chưa lưu dữ liệu hoặc tạo chiến dịch trên hệ thống.</p>
    </section>
  );
}

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Megaphone } from "lucide-react";
import Link from "next/link";

import {
  createMerchantCampaign,
  getMerchantCampaignProducts,
  type MerchantCampaignProduct,
} from "@/app/actions/campaigns";

export function CampaignCreateForm() {
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [products, setProducts] = useState<MerchantCampaignProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    getMerchantCampaignProducts()
      .then((result) => {
        if (!active) return;
        setProducts(result.data);
        if (result.error) {
          setIsError(true);
          setMessage(result.error);
        }
      })
      .catch(() => {
        if (!active) return;
        setIsError(true);
        setMessage("Không tải được sản phẩm. Vui lòng tải lại trang.");
      })
      .finally(() => {
        if (active) setLoadingProducts(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmitting(true);
    setMessage("");
    setIsError(false);

    try {
      const result = await createMerchantCampaign(new FormData(form));
      if (!result.success) {
        setIsError(true);
        setMessage(result.error ?? "Không thể lưu chiến dịch.");
        return;
      }

      form.reset();
      setMessage("Đã lưu chiến dịch lên Supabase. Webhook sẽ xử lý campaign mới.");
    } catch {
      setIsError(true);
      setMessage("Không thể lưu chiến dịch. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
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
          <input name="name" required minLength={3} maxLength={120} placeholder="Ví dụ: Ưu đãi nghỉ dưỡng mùa thu" />
        </label>
        <label>
          Sản phẩm
          <select name="productId" required defaultValue="" disabled={loadingProducts || products.length === 0}>
            <option value="" disabled>
              {loadingProducts ? "Đang tải sản phẩm…" : products.length ? "Chọn sản phẩm" : "Chưa có sản phẩm"}
            </option>
            {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
          </select>
          {!loadingProducts && products.length === 0 ? (
            <Link href="/merchant/products" className="merchant-campaign-add-product">Thêm sản phẩm trước để tạo chiến dịch ↗</Link>
          ) : null}
        </label>
        <label className="merchant-campaign-form-wide">
          Mô tả
          <textarea name="description" required rows={4} maxLength={3000} placeholder="Mô tả điểm nổi bật và ưu đãi của chiến dịch" />
        </label>
        <label>
          Địa điểm áp dụng
          <input name="location" required maxLength={160} placeholder="Ví dụ: Đà Nẵng" />
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
          <button type="submit" className="merchant-campaign-submit" disabled={submitting || loadingProducts || products.length === 0}>
            {submitting ? "Đang lưu…" : "Tạo chiến dịch"}
          </button>
          <p role={isError ? "alert" : "status"} aria-live="polite">{message}</p>
        </div>
      </form>
      <p className="merchant-campaign-form-note">
        Khi lưu thành công, Supabase tạo campaign mới và Database Webhook có thể kích hoạt workflow n8n.
      </p>
    </section>
  );
}




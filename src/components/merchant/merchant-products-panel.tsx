"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Package, Plus, X } from "lucide-react";

import { createMerchantProduct, getMerchantProducts, type MerchantProduct } from "@/app/actions/products";
import { Button } from "@/src/components/ui/button";
import { demoProducts } from "@/src/lib/merchant-demo";

type Props = { preview?: boolean };

export function MerchantProductsPanel({ preview = false }: Props) {
  const [products, setProducts] = useState<MerchantProduct[]>([]);
  const [loading, setLoading] = useState(!preview);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadProducts = useCallback(async () => {
    const result = await getMerchantProducts();
    setProducts(result.data);
    setError(result.error ?? "");
    setLoading(false);
  }, []);

  useEffect(() => {
    if (preview) return;
    let active = true;
    getMerchantProducts()
      .then((result) => {
        if (!active) return;
        setProducts(result.data);
        setError(result.error ?? "");
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError("Không kết nối được Supabase. Vui lòng thử lại.");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [preview]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const result = await createMerchantProduct({
      name: String(form.get("name") ?? ""),
      description: String(form.get("description") ?? ""),
      category: String(form.get("category") ?? ""),
      originalPrice: Number(form.get("originalPrice")),
      salePrice: Number(form.get("salePrice")),
      commissionRate: Number(form.get("commissionRate") || 0),
      bookingUrl: String(form.get("bookingUrl") ?? ""),
    });
    setSaving(false);
    if (!result.success) {
      setError(result.error ?? "Không lưu được sản phẩm.");
      return;
    }
    formElement.reset();
    setShowForm(false);
    setMessage("Đã lưu sản phẩm. Sản phẩm này có thể chọn khi tạo chiến dịch.");
    await loadProducts();
  }

  const visibleProducts = preview
    ? demoProducts.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.detail,
        category: product.category,
        original_price: null,
        sale_price: null,
        commission_rate: null,
        booking_url: null,
        status: product.status === "Bản nháp" ? "draft" : "active",
      }))
    : products;

  return (
    <section className="product-panel merchant-products-panel">
      <div className="panel-heading">
        <div>
          <h2>Danh sách sản phẩm</h2>
          <p>{preview ? "Dữ liệu minh họa" : "Sản phẩm thật của doanh nghiệp đang đăng nhập"}</p>
        </div>
        {!preview ? (
          <Button type="button" onClick={() => setShowForm(!showForm)}>
            {showForm ? <X size={17} /> : <Plus size={17} />}
            {showForm ? "Đóng biểu mẫu" : "Tạo sản phẩm"}
          </Button>
        ) : null}
      </div>

      {message ? <p className="product-panel-message" role="status">{message}</p> : null}
      {error ? <p className="product-panel-error" role="alert">{error}</p> : null}

      {showForm && !preview ? (
        <form className="product-create-form" onSubmit={handleSubmit}>
          <label>Tên sản phẩm<input name="name" required minLength={2} maxLength={160} /></label>
          <label>Danh mục<input name="category" maxLength={100} placeholder="Tour, lưu trú, trải nghiệm…" /></label>
          <label className="product-create-wide">Mô tả<textarea name="description" rows={3} maxLength={3000} /></label>
          <label>Giá gốc (VND)<input name="originalPrice" type="number" min="0" step="1" required /></label>
          <label>Giá bán (VND)<input name="salePrice" type="number" min="0" step="1" required /></label>
          <label>Hoa hồng (%)<input name="commissionRate" type="number" min="0" max="100" step="0.1" defaultValue="0" /></label>
          <label className="product-create-wide">Link đặt chỗ<input name="bookingUrl" type="url" placeholder="https://..." /></label>
          <div className="product-create-wide">
            <Button type="submit" disabled={saving}>{saving ? "Đang lưu…" : "Lưu sản phẩm"}</Button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <p className="product-panel-message" role="status">Đang tải sản phẩm…</p>
      ) : visibleProducts.length ? (
        <div className="table-scroll">
          <table>
            <thead><tr><th>SẢN PHẨM</th><th>DANH MỤC</th><th>GIÁ BÁN</th><th>HOA HỒNG</th><th>TRẠNG THÁI</th></tr></thead>
            <tbody>
              {visibleProducts.map((product) => (
                <tr key={product.id}>
                  <td><strong>{product.name}</strong></td>
                  <td>{product.category || "—"}</td>
                  <td>{product.sale_price == null ? "—" : Number(product.sale_price).toLocaleString("vi-VN") + " ₫"}</td>
                  <td>{product.commission_rate == null ? "—" : Number(product.commission_rate) + "%"}</td>
                  <td><span className={"status-pill " + (product.status === "draft" ? "draft" : "")}>{product.status === "draft" ? "Bản nháp" : "Đang hoạt động"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !error ? (
        <div className="empty-state">
          <Package />
          <h3>Chưa có sản phẩm thật</h3>
          <p>Tạo sản phẩm trước, sau đó mở mục Tạo chiến dịch để chọn sản phẩm này.</p>
          {!preview ? <Button type="button" onClick={() => setShowForm(true)}>Tạo sản phẩm đầu tiên</Button> : null}
        </div>
      ) : null}
    </section>
  );
}



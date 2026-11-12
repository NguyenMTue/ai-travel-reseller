"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  FolderPlus,
  LoaderCircle,
  Package,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Brand } from "@/src/components/brand";
import { Button } from "@/src/components/ui/button";
import {
  PRODUCT_CATEGORIES,
  productInputSchema,
  type ProductInput,
} from "@/src/lib/merchant/product-schema";
import styles from "./product-create.module.css";

export function ProductCreateScreen({
  preview = false,
}: {
  preview?: boolean;
}) {
  const router = useRouter();
  const root = preview ? "/preview/merchant" : "/merchant";

  const [form, setForm] = useState({
    name: "",
    category: "Vé tham quan",
    description: "",
    original_price: "",
    sale_price: "",
    booking_url: "",
    payment_url: "",
    valid_from: "",
    valid_to: "",
    authentic_tips: "",
    status: "active" as "active" | "draft",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdProduct, setCreatedProduct] = useState<{ id: string; name: string } | null>(null);

  function handleChange(
    field: string,
    value: string,
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    setGlobalError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    setFieldErrors({});
    setGlobalError(null);

    // Chuẩn bị payload dạng số và null cho các trường không bắt buộc
    const payload: Record<string, any> = {
      name: form.name.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      status: form.status,
      original_price: form.original_price ? Number(form.original_price) : null,
      sale_price: form.sale_price ? Number(form.sale_price) : null,
      booking_url: form.booking_url.trim() || null,
      payment_url: form.payment_url.trim() || null,
      valid_from: form.valid_from ? new Date(form.valid_from).toISOString() : null,
      valid_to: form.valid_to ? new Date(form.valid_to).toISOString() : null,
      authentic_tips: form.authentic_tips.trim() || null,
    };

    // Client-side validation với Zod
    const validation = productInputSchema.safeParse(payload);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const fieldName = issue.path[0]?.toString() || "global";
        if (!errors[fieldName]) {
          errors[fieldName] = issue.message;
        }
      }
      setFieldErrors(errors);
      setGlobalError("Vui lòng kiểm tra và hoàn thiện các trường thông tin bên dưới.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/merchant/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Không thể tạo sản phẩm.");
      }

      setCreatedProduct({
        id: result.data.id,
        name: result.data.name,
      });
    } catch (err: any) {
      console.error("[ProductCreate] Lỗi gửi form:", err);
      setGlobalError(err.message || "Đã xảy ra lỗi khi tạo sản phẩm. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
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
        <Button asChild variant="outline" size="sm">
          <Link href={`${root}/products`}>
            <ArrowLeft size={16} /> Về danh sách sản phẩm
          </Link>
        </Button>
      </header>

      <main className={styles.page}>
        <Link href={`${root}/products`} className={styles.back}>
          <ArrowLeft size={16} /> Về danh sách sản phẩm
        </Link>

        {createdProduct ? (
          <div className={styles.successState}>
            <div className={styles.successIcon}>
              <CheckCircle2 size={36} />
            </div>
            <h2>Đã tạo sản phẩm thành công!</h2>
            <p>
              Tour <strong>{createdProduct.name}</strong> đã được thêm vào kho dịch vụ của doanh nghiệp. Bạn có thể gắn tour này vào chiến dịch tiếp thị ngay bây giờ để các cộng tác viên bắt đầu chia sẻ.
            </p>
            <div className={styles.successActions}>
              <Button asChild>
                <Link href={`${root}/campaigns/new?product_id=${createdProduct.id}`}>
                  <FolderPlus size={16} /> Tạo chiến dịch cho tour này ngay <ArrowRight size={16} />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`${root}/products`}>Xem danh sách sản phẩm</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.heading}>
              <p className="eyebrow">ĐĂNG TẢI DỊCH VỤ DU LỊCH</p>
              <h1>Thêm sản phẩm / Tour mới</h1>
              <p>
                Cung cấp đầy đủ thông tin chuẩn xác, giá vé và đường dẫn thanh toán chính thức của doanh nghiệp bạn.
              </p>
            </div>

            <div className={styles.layout}>
              <div className={styles.formCard}>
                <form onSubmit={handleSubmit} noValidate className={styles.form}>
                  {globalError && (
                    <div
                      style={{
                        padding: "12px 16px",
                        borderRadius: "8px",
                        background: "#fef2f2",
                        color: "#991b1b",
                        border: "1px solid #fecaca",
                        fontSize: "14px",
                      }}
                      role="alert"
                    >
                      {globalError}
                    </div>
                  )}

                  {/* Tên sản phẩm */}
                  <div className={styles.field}>
                    <label htmlFor="name" className={styles.label}>
                      <span>
                        Tên sản phẩm / Tour <span className={styles.labelRequired}>*</span>
                      </span>
                      <span className={styles.hint}>{form.name.length}/200</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      className={styles.input}
                      placeholder="Ví dụ: Vé Cáp Treo Bà Nà Hills + Buffet Trưa Quốc Tế"
                      value={form.name}
                      maxLength={200}
                      aria-invalid={Boolean(fieldErrors.name)}
                      onChange={(e) => handleChange("name", e.target.value)}
                      required
                    />
                    {fieldErrors.name && (
                      <p className={styles.fieldError}>{fieldErrors.name}</p>
                    )}
                  </div>

                  {/* Danh mục & Trạng thái */}
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label htmlFor="category" className={styles.label}>
                        <span>
                          Danh mục dịch vụ <span className={styles.labelRequired}>*</span>
                        </span>
                      </label>
                      <select
                        id="category"
                        className={styles.select}
                        value={form.category}
                        onChange={(e) => handleChange("category", e.target.value)}
                      >
                        {PRODUCT_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.field}>
                      <label htmlFor="status" className={styles.label}>
                        <span>Trạng thái mở bán</span>
                      </label>
                      <select
                        id="status"
                        className={styles.select}
                        value={form.status}
                        onChange={(e) => handleChange("status", e.target.value)}
                      >
                        <option value="active">Đang hoạt động (Công khai)</option>
                        <option value="draft">Bản nháp (Tạm dừng)</option>
                      </select>
                    </div>
                  </div>

                  {/* Giá gốc & Giá bán ưu đãi */}
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label htmlFor="original_price" className={styles.label}>
                        <span>Giá niêm yết gốc (VNĐ)</span>
                      </label>
                      <input
                        id="original_price"
                        type="number"
                        min="0"
                        step="1000"
                        className={styles.input}
                        placeholder="Ví dụ: 1250000"
                        value={form.original_price}
                        aria-invalid={Boolean(fieldErrors.original_price)}
                        onChange={(e) => handleChange("original_price", e.target.value)}
                      />
                      {form.original_price && Number(form.original_price) > 0 && (
                        <p className={styles.hint}>
                          {new Intl.NumberFormat("vi-VN").format(Number(form.original_price))} VNĐ
                        </p>
                      )}
                      {fieldErrors.original_price && (
                        <p className={styles.fieldError}>{fieldErrors.original_price}</p>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label htmlFor="sale_price" className={styles.label}>
                        <span>Giá bán ưu đãi (VNĐ)</span>
                      </label>
                      <input
                        id="sale_price"
                        type="number"
                        min="0"
                        step="1000"
                        className={styles.input}
                        placeholder="Ví dụ: 1050000"
                        value={form.sale_price}
                        aria-invalid={Boolean(fieldErrors.sale_price)}
                        onChange={(e) => handleChange("sale_price", e.target.value)}
                      />
                      {form.sale_price && Number(form.sale_price) > 0 && (
                        <p className={styles.hint}>
                          {new Intl.NumberFormat("vi-VN").format(Number(form.sale_price))} VNĐ
                        </p>
                      )}
                      {fieldErrors.sale_price && (
                        <p className={styles.fieldError}>{fieldErrors.sale_price}</p>
                      )}
                    </div>
                  </div>

                  {/* Mô tả sản phẩm */}
                  <div className={styles.field}>
                    <label htmlFor="description" className={styles.label}>
                      <span>
                        Mô tả chi tiết tour / dịch vụ <span className={styles.labelRequired}>*</span>
                      </span>
                      <span className={styles.hint}>{form.description.length}/2500</span>
                    </label>
                    <textarea
                      id="description"
                      className={styles.textarea}
                      rows={4}
                      placeholder="Trải nghiệm ngắm Cầu Vàng trên đỉnh Bà Nà, bao gồm vé cáp treo 2 chiều và bữa trưa buffet quốc tế tại nhà hàng Beer Plaza với hơn 100 món Á - Âu đặc sắc..."
                      value={form.description}
                      maxLength={2500}
                      aria-invalid={Boolean(fieldErrors.description)}
                      onChange={(e) => handleChange("description", e.target.value)}
                      required
                    />
                    {fieldErrors.description && (
                      <p className={styles.fieldError}>{fieldErrors.description}</p>
                    )}
                  </div>

                  {/* Cổng thanh toán & Link đặt chỗ chính thức (RULE-01) */}
                  <div className={styles.field}>
                    <label htmlFor="payment_url" className={styles.label}>
                      <span>Cổng thanh toán chính thức của doanh nghiệp (Payment URL)</span>
                    </label>
                    <input
                      id="payment_url"
                      type="url"
                      className={styles.input}
                      placeholder="https://ticket.sunworld.vn/checkout/bana-hills-buffet"
                      value={form.payment_url}
                      aria-invalid={Boolean(fieldErrors.payment_url)}
                      onChange={(e) => handleChange("payment_url", e.target.value)}
                    />
                    <p className={styles.hint}>
                      Link dẫn trực tiếp đến trang thanh toán của doanh nghiệp (hệ thống tự động nối mã CTV).
                    </p>
                    {fieldErrors.payment_url && (
                      <p className={styles.fieldError}>{fieldErrors.payment_url}</p>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="booking_url" className={styles.label}>
                      <span>Trang đặt tour / thông tin chính thức (Booking URL)</span>
                    </label>
                    <input
                      id="booking_url"
                      type="url"
                      className={styles.input}
                      placeholder="https://banahills.sunworld.vn/ve-cap-treo"
                      value={form.booking_url}
                      aria-invalid={Boolean(fieldErrors.booking_url)}
                      onChange={(e) => handleChange("booking_url", e.target.value)}
                    />
                    <p className={styles.hint}>
                      Dùng làm link fallback nếu sản phẩm chưa có trang thanh toán trực tiếp.
                    </p>
                    {fieldErrors.booking_url && (
                      <p className={styles.fieldError}>{fieldErrors.booking_url}</p>
                    )}
                  </div>

                  {/* Thời hạn hiệu lực */}
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label htmlFor="valid_from" className={styles.label}>
                        <span>Hiệu lực từ ngày</span>
                      </label>
                      <input
                        id="valid_from"
                        type="date"
                        className={styles.input}
                        value={form.valid_from}
                        onChange={(e) => handleChange("valid_from", e.target.value)}
                      />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor="valid_to" className={styles.label}>
                        <span>Đến hết ngày</span>
                      </label>
                      <input
                        id="valid_to"
                        type="date"
                        className={styles.input}
                        value={form.valid_to}
                        aria-invalid={Boolean(fieldErrors.valid_to)}
                        onChange={(e) => handleChange("valid_to", e.target.value)}
                      />
                      {fieldErrors.valid_to && (
                        <p className={styles.fieldError}>{fieldErrors.valid_to}</p>
                      )}
                    </div>
                  </div>

                  {/* Mẹo thực tế cho AI (Authentic Tips) */}
                  <div className={styles.field}>
                    <label htmlFor="authentic_tips" className={styles.label}>
                      <span>Mẹo du lịch thực tế cho AI (Authentic Tips)</span>
                      <span className={styles.hint}>Tùy chọn</span>
                    </label>
                    <textarea
                      id="authentic_tips"
                      className={styles.textarea}
                      rows={2}
                      placeholder="Ví dụ: Đi tuyến cáp số 3 trước 8h30 sáng sẽ không phải xếp hàng. Nên đặt bàn buffet trước 11h30 để có view đẹp nhìn ra làng Pháp."
                      value={form.authentic_tips}
                      maxLength={1000}
                      onChange={(e) => handleChange("authentic_tips", e.target.value)}
                    />
                    <p className={styles.hint}>
                      AI Sales Agent và AI Video Engine sẽ sử dụng mẹo này để tạo nội dung tư vấn thực tế cho khách.
                    </p>
                  </div>

                  {/* Nút hành động */}
                  <div className={styles.actions}>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <LoaderCircle size={16} className="animate-spin" /> Đang lưu sản phẩm…
                        </>
                      ) : (
                        <>
                          <Package size={16} /> Lưu sản phẩm mới
                        </>
                      )}
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`${root}/products`}>Hủy bỏ</Link>
                    </Button>
                  </div>
                </form>
              </div>

              {/* Hướng dẫn tiêu chuẩn bên phải */}
              <aside className={styles.guideCard} aria-labelledby="guide-title">
                <Compass size={32} strokeWidth={1.5} color="var(--primary)" />
                <h2 id="guide-title">Quy chuẩn Đăng tải Tour</h2>
                <p>
                  Nhằm bảo vệ trải nghiệm của du khách và uy tín của cộng tác viên, vui lòng tuân thủ:
                </p>
                <ul className={styles.guideList}>
                  <li>
                    <strong>Quy tắc RULE-01:</strong> Đường dẫn thanh toán hoặc đặt chỗ phải là kênh chính thức của doanh nghiệp bạn. Sàn không thu hộ tiền.
                  </li>
                  <li>
                    <strong>Minh bạch về giá:</strong> Giá bán ưu đãi không được cao hơn giá gốc. Tuyệt đối không khai khống giá gốc.
                  </li>
                  <li>
                    <strong>Mô tả chi tiết:</strong> Nêu rõ các dịch vụ bao gồm (vé cáp, xe đưa đón, ăn uống) để AI trả lời khách có căn cứ.
                  </li>
                  <li>
                    <strong>Mẹo du lịch thực tế:</strong> Giúp video AI 9:16 và trợ lý bán hàng tăng $35\%$ tỷ lệ chốt vé.
                  </li>
                </ul>
                <div className={styles.guideNote}>
                  <Sparkles size={14} style={{ display: "inline", marginRight: 4 }} />
                  Sau khi tạo sản phẩm, bạn có thể tạo Chiến dịch ngay lập tức để cấp quyền phân phối cho cộng tác viên.
                </div>
              </aside>
            </div>
          </>
        )}
      </main>

      <footer className={styles.footer}>
        TravelLink AI · Nền tảng phân phối du lịch B2B2C ứng dụng AI · Merchant Product Center
      </footer>
    </div>
  );
}

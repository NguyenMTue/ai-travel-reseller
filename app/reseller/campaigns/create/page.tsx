import Link from "next/link";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Tạo chiến dịch — TravelLink AI",
};

export default function ResellerCreateCampaignPage() {
  return (
    <div className="campaign-create-page">
      <Link href="/reseller/campaigns" className="campaign-back-link">
        <ArrowLeft size={16} aria-hidden /> Quay lại chiến dịch
      </Link>

      <header className="campaign-create-heading">
        <div className="campaign-detail-icon" aria-hidden><LockKeyhole size={23} /></div>
        <div>
          <p className="eyebrow">KHU VỰC RESELLER</p>
          <h1 className="reseller-heading-title">Tạo chiến dịch</h1>
          <p className="reseller-heading-subtitle">Thông tin quyền tạo và quản lý chiến dịch</p>
        </div>
      </header>

      <section className="reseller-card campaign-permission-card" aria-labelledby="campaign-permission-title">
        <div className="campaign-permission-icon"><ShieldCheck size={22} aria-hidden /></div>
        <div>
          <h2 id="campaign-permission-title">Merchant là bên tạo chiến dịch</h2>
          <p>
            Theo quyền truy cập hiện tại của dự án, Merchant quản lý chiến dịch của mình.
            Reseller có thể khám phá chiến dịch đang mở, xem nội dung đã duyệt và chọn chiến dịch để quảng bá.
          </p>
          <p className="campaign-permission-source">
            Quyền này được giữ nguyên theo chính sách truy cập hiện có; màn hình không gửi hoặc lưu dữ liệu.
          </p>
          <Link href="/reseller/campaigns" className="reseller-primary-btn">Xem chiến dịch khả dụng</Link>
        </div>
      </section>

      <section className="reseller-card campaign-disabled-form" aria-labelledby="campaign-form-preview-title">
        <div className="campaign-disabled-form-heading">
          <div>
            <h2 id="campaign-form-preview-title" className="reseller-card-title">Trường thông tin chiến dịch</h2>
            <p className="reseller-card-subtitle">Bản xem trước chỉ để tham khảo; chức năng tạo bị khóa với vai trò Reseller.</p>
          </div>
          <span className="reseller-badge-gray">Chưa được cấp quyền</span>
        </div>
        <fieldset disabled>
          <label>Tên chiến dịch<input type="text" placeholder="Merchant sẽ đặt tên chiến dịch" /></label>
          <label>Mô tả<textarea rows={3} placeholder="Mô tả sản phẩm và mục tiêu chiến dịch" /></label>
          <div className="campaign-disabled-form-grid">
            <label>Sản phẩm<select defaultValue=""><option value="">Chọn sản phẩm</option></select></label>
            <label>Danh mục<select defaultValue=""><option value="">Chọn danh mục</option></select></label>
            <label>Địa điểm<input type="text" placeholder="Khu vực phục vụ" /></label>
            <label>Hoa hồng<input type="number" placeholder="Do Merchant cấu hình" /></label>
          </div>
          <button type="button" className="reseller-primary-btn" disabled>Tạo chiến dịch</button>
        </fieldset>
      </section>
    </div>
  );
}

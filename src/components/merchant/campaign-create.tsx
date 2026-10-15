import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { Brand } from "@/src/components/brand";
import { campaignFailureMessages, type CampaignFormLoadResult, type CampaignSubmitAction } from "@/src/lib/merchant/campaign-form";
import { CampaignForm, CampaignReloadButton } from "./campaign-form";
import styles from "./campaign-create.module.css";

export function CampaignPageFrame({ children, preview = false }: { children: React.ReactNode; preview?: boolean }) {
  const dashboard = preview ? "/preview/merchant" : "/merchant";
  return <>
    <header className={styles.header}><div className={`container ${styles.headerInner}`}><Brand /><span>MERCHANT PORTAL</span></div></header>
    <main id="main-content" tabIndex={-1} className={`container ${styles.page}`}>
      <Link href={dashboard} className={styles.back}><ArrowLeft size={16} aria-hidden="true" /> Về Dashboard</Link>
      {preview && <p className={`notice ${styles.preview}`}>BẢN XEM TRƯỚC · Dữ liệu mô phỏng, không lưu vào hệ thống thật.</p>}
      <div className={styles.heading}><p className="eyebrow">KẾT NỐI TRẢI NGHIỆM, MỞ RỘNG CƠ HỘI</p><h1>Tạo chiến dịch</h1><p>Chọn sản phẩm và chuẩn bị thông tin cho hành trình tiếp thị tiếp theo.</p></div>
      {children}
    </main>
  </>;
}

export function CampaignCreateScreen({ result, submitAction, preview = false }: {
  result: CampaignFormLoadResult; submitAction: CampaignSubmitAction; preview?: boolean;
}) {
  return <CampaignPageFrame preview={preview}>
    {result.status === "error" ? <section className={styles.loadError} role="alert">
      <h2>{result.reason === "permission" ? "Cần quyền Merchant" : result.reason === "session" ? "Cần đăng nhập lại" : "Chưa tải được sản phẩm"}</h2>
      <p>{campaignFailureMessages[result.reason]}</p>
      {result.reason === "session" ? <Link href="/login?next=/merchant/campaigns/new">Đăng nhập ↗</Link> : <CampaignReloadButton />}
    </section> : <div className={styles.layout}>
      <CampaignForm products={result.products} canSave={result.canSave} submitAction={submitAction} preview={preview} />
      <aside className={styles.guide} aria-labelledby="campaign-guide-title">
        <Compass size={34} strokeWidth={1} aria-hidden="true" /><h2 id="campaign-guide-title">Một chiến dịch rõ ràng.<br /><em>Nhiều kết nối đúng.</em></h2>
        <ol><li>Chọn sản phẩm thuộc doanh nghiệp của bạn.</li><li>Mô tả đối tượng và địa điểm mục tiêu.</li><li>Kiểm tra hoa hồng, thời gian và kết quả lưu.</li></ol>
        <p>Chỉ thông báo đã lưu khi có xác nhận. Nội dung AI cần được kiểm tra ở bước tiếp theo.</p>
      </aside>
    </div>}
  </CampaignPageFrame>;
}

export function CampaignCreateLoading({ preview = false }: { preview?: boolean }) {
  return <CampaignPageFrame preview={preview}><div role="status" aria-label="Đang tải sản phẩm của doanh nghiệp" className={styles.loading}><div className="skeleton" /><p>Đang tải sản phẩm của doanh nghiệp…</p></div></CampaignPageFrame>;
}

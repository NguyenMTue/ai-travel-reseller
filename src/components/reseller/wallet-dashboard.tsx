import { ArrowDownLeft, Clock3, RefreshCw, Wallet } from "lucide-react";
import { formatWalletDate, formatWalletMoney, walletStatus, type WalletSummary } from "@/src/lib/reseller/wallet";
import styles from "./wallet.module.css";

export function WalletLoading() {
  return <section className={styles.loading} aria-busy="true" aria-label="Đang tải ví hoa hồng">
    <p className="eyebrow">VÍ HOA HỒNG</p><h1>Ví hoa hồng của bạn</h1>
    <p role="status">Đang xác minh phiên và tải dữ liệu ví…</p>
    <div className={styles.skeletons} aria-hidden="true">{[0,1,2].map(i => <div key={i} />)}</div>
  </section>;
}
export function WalletDashboard({ wallet, refresh }: {wallet: WalletSummary; refresh: () => void}) {
  const b = wallet.balances, m = wallet.order_metrics;
  return <div className={styles.wallet}>
    <header className={styles.heading}>
      <div><p className="eyebrow">THÀNH QUẢ TỪ NHỮNG KẾT NỐI</p><h1>Ví hoa hồng của bạn</h1>
        <p>Theo dõi thu nhập và các giao dịch hoa hồng được ghi nhận.</p></div>
      <button className={styles.refresh} onClick={refresh}><RefreshCw size={17} aria-hidden="true" /> Tải lại ví</button>
    </header>
    <p className={styles.updated}>Cập nhật: {formatWalletDate(wallet.last_updated, true)} · Giờ Việt Nam (UTC+7) · Đơn vị: VNĐ</p>
    <section aria-label="Tóm tắt hoa hồng" className={styles.balances}>
      <article className={styles.earnings}><span className={styles.cardIcon}><Wallet size={24} aria-hidden="true" /></span>
        <h2>Tổng thu nhập tích lũy</h2><p className={styles.amount} data-testid="lifetime-earnings">{formatWalletMoney(b.lifetime_earnings)}</p>
        <p>Hoa hồng đã xác nhận và đã chi trả</p></article>
      <article className={styles.balance}><span className={styles.cardIcon}><ArrowDownLeft size={23} aria-hidden="true" /></span>
        <h2>Hoa hồng khả dụng</h2><p className={styles.amount} data-testid="available-balance">{formatWalletMoney(b.available_balance)}</p><p>Các khoản đã được xác nhận</p></article>
      <article className={styles.pending}><span className={styles.cardIcon}><Clock3 size={23} aria-hidden="true" /></span>
        <h2>Chờ đối soát</h2><p className={styles.amount} data-testid="pending-balance">{formatWalletMoney(b.pending_balance)}</p><p>Các khoản hoa hồng đang chờ duyệt</p></article>
    </section>
    <dl className={styles.secondary} aria-label="Hoa hồng đã xử lý">
      <div><dt>Đã chi trả</dt><dd>{formatWalletMoney(b.paid_balance)}</dd></div>
      <div><dt>Đã hoàn trả</dt><dd>{formatWalletMoney(b.refunded_balance)}</dd></div>
    </dl>
    <section aria-label="Thống kê đơn hàng" className={styles.orders}>
      <div><h2>Đơn hàng được ghi nhận</h2><p>Tổng quan từ dữ liệu ví hiện tại</p></div>
      <dl><div><dt>Tổng số đơn</dt><dd>{new Intl.NumberFormat("vi-VN").format(m.total_orders)}</dd></div>
        <div><dt>Đã xác nhận / thanh toán</dt><dd>{new Intl.NumberFormat("vi-VN").format(m.confirmed_orders)}</dd></div>
        <div><dt>Đang chờ xử lý</dt><dd>{new Intl.NumberFormat("vi-VN").format(m.pending_orders)}</dd></div>
        <div><dt>Doanh số đơn đã xác nhận / thanh toán</dt><dd className={styles.gmv}>{formatWalletMoney(m.total_gmv)}</dd></div></dl>
    </section>
    <section aria-labelledby="wallet-history-title" className={styles.history}>
      <div className={styles.historyHeader}><div><p className="eyebrow">LỊCH SỬ HOA HỒNG</p><h2 id="wallet-history-title">Những giao dịch gần đây</h2></div>
        <span>Tối đa 10 giao dịch gần nhất</span></div>
      <p className={styles.historyHelp}>Ngày hiển thị là ngày ghi nhận hoa hồng. Danh sách hiện chưa hỗ trợ bộ lọc hoặc phân trang.</p>
      {wallet.recent_commissions.length === 0 ? <div className={styles.empty}>
        <Wallet size={28} aria-hidden="true" /><h3>Chưa có giao dịch hoa hồng</h3>
        <p>Các khoản hoa hồng được ghi nhận sẽ xuất hiện tại đây. Số liệu tổng quan phía trên là kết quả do dịch vụ ví trả về.</p>
      </div> : <ul className={styles.transactions}>
        {wallet.recent_commissions.map(item => {
          const status = walletStatus(item.status);
          return <li key={item.id} className={styles.transaction}>
            <div className={styles.transactionTitle}><h3>{item.campaign_name.trim() || "Chưa có tên chiến dịch"}</h3>
              <span className={styles.badge} data-tone={status.tone}>{status.label}</span></div>
            <dl className={styles.transactionMeta}>
              <div><dt>Mã đặt chỗ</dt><dd>{item.booking_reference.trim() && item.booking_reference !== "N/A" ? item.booking_reference : "Chưa có mã đặt chỗ"}</dd></div>
              <div><dt>Ghi nhận lúc (UTC+7)</dt><dd>{formatWalletDate(item.created_at)}</dd></div>
              <div><dt>Giá trị đơn hàng</dt><dd>{formatWalletMoney(item.order_amount)}</dd></div>
            </dl>
            <div className={styles.commission}><div><span>Hoa hồng của bạn</span><strong>{formatWalletMoney(item.net_amount)}</strong></div>
              <p>Hoa hồng gộp: {formatWalletMoney(item.gross_amount)}<br />Phí nền tảng: {formatWalletMoney(item.platform_fee)}</p></div>
          </li>;
        })}
      </ul>}
    </section>
  </div>;
}

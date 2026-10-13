export default function ResellerCampaignDetailLoading() {
  return (
    <div className="campaign-loading" role="status" aria-label="Đang tải chi tiết chiến dịch">
      <span className="sr-only">Đang tải chi tiết chiến dịch…</span>
      <div className="skeleton campaign-loading-title" />
      <div className="campaign-content-sections">
        {[0, 1, 2].map((item) => (
          <div className="reseller-card campaign-loading-card" key={item}>
            <div className="skeleton campaign-loading-line short" />
            <div className="skeleton campaign-loading-line" />
            <div className="skeleton campaign-loading-line" />
          </div>
        ))}
      </div>
    </div>
  );
}

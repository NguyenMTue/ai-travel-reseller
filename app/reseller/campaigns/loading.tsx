export default function ResellerCampaignsLoading() {
  return (
    <div className="campaign-loading" role="status" aria-label="Đang tải chiến dịch">
      <span className="sr-only">Đang tải chiến dịch…</span>
      <div className="campaign-loading-toolbar">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
      <div className="campaign-grid">
        {[0, 1, 2, 3].map((item) => (
          <div className="reseller-card campaign-loading-card" key={item}>
            <div className="skeleton campaign-loading-cover" />
            <div className="skeleton campaign-loading-line" />
            <div className="skeleton campaign-loading-line short" />
            <div className="skeleton campaign-loading-line" />
          </div>
        ))}
      </div>
    </div>
  );
}

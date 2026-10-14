import { ResellerShell } from "@/src/components/reseller/reseller-shell";
import { ResellerOverview } from "@/src/components/reseller/reseller-overview";

export const metadata = {
  title: "Xem trước không gian cộng tác viên — TravelLink AI",
  robots: { index: false, follow: false },
};

export default function ResellerPreviewPage() {
  return (
    <ResellerShell userName="Minh Anh — Demo" initials="MA" userEmail="minhanh.demo@example.com">
      <ResellerOverview campaigns={[]} contents={[]} trackingMetrics={{ linkCount: 0, clickCount: 0 }} error={null} />
    </ResellerShell>
  );
}

import { Dashboard } from "@/src/components/merchant/dashboard";
export const metadata = {
  title: "Xem trước Dashboard",
  robots: { index: false, follow: false },
};
export default function MerchantPreviewPage() {
  return <Dashboard preview />;
}

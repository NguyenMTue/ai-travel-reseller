import { Dashboard } from "@/src/components/merchant/dashboard";

export const metadata = { title: "Sản phẩm Merchant — TravelLink AI" };

export default function MerchantProductsPage() {
  return <Dashboard initialTab="products" />;
}

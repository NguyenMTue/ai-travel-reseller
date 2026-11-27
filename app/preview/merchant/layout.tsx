import { MerchantShell } from "@/src/components/merchant/merchant-shell";
import { demoProducts } from "@/src/lib/merchant-demo";
export default function MerchantPreviewLayout({ children }: { children: React.ReactNode }) {
  return <MerchantShell preview productCount={demoProducts.length}>{children}</MerchantShell>;
}

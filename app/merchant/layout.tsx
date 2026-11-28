import { MerchantShell } from "@/src/components/merchant/merchant-shell";
import { getMerchantPortalAccess, getMerchantProducts } from "@/src/lib/merchant/portal-server";
import { MerchantPortalAccessNotice } from "@/src/components/merchant/portal-access-notice";

export default async function MerchantLayout({ children }: { children: React.ReactNode }) {
  const access = await getMerchantPortalAccess();
  const products = access.status === "allowed" ? await getMerchantProducts(access.userId) : undefined;
  // Leaves preserve their exact next path and repeat authorization, as do actions.
  return access.status === "allowed" ? <MerchantShell productCount={products?.length}>{children}</MerchantShell> : access.status === "unauthenticated" ? children : <MerchantPortalAccessNotice access={access} />;
}

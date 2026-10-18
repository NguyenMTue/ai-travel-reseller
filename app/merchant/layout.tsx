import { getMerchantPortalAccess } from "@/src/lib/merchant/portal-server";
import { MerchantPortalAccessNotice } from "@/src/components/merchant/portal-access-notice";

export default async function MerchantLayout({ children }: { children: React.ReactNode }) {
  const access = await getMerchantPortalAccess();
  // Leaves preserve their exact next path and repeat authorization, as do actions.
  return access.status === "allowed" || access.status === "unauthenticated" ? children : <MerchantPortalAccessNotice access={access} />;
}

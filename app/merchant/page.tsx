import { Dashboard } from "@/src/components/merchant/dashboard";
import { redirect } from "next/navigation";
import { getMerchantPortalAccess } from "@/src/lib/merchant/portal-server";
import { MerchantPortalAccessNotice } from "@/src/components/merchant/portal-access-notice";
export const metadata = { title: "Dashboard Merchant" };
export default async function MerchantPage() {
  const access = await getMerchantPortalAccess();
  if (access.status === "unauthenticated") redirect("/login?next=/merchant");
  if (access.status !== "allowed") return <MerchantPortalAccessNotice access={access} />;
  return <Dashboard />;
}

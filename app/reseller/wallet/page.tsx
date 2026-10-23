import { redirect } from "next/navigation";
import { getResellerAccess } from "@/src/lib/reseller/server";
import { ResellerAccessNotice } from "@/src/components/reseller/access-notice";
import { ResellerWallet } from "@/src/components/reseller/wallet-client";

export const metadata = { title: "Ví hoa hồng" };
export default async function WalletPage() {
  // Recheck at the leaf: the layout alone cannot guard data access.
  const access = await getResellerAccess();
  if (access.status === "unauthenticated") redirect("/login?next=%2Freseller%2Fwallet");
  if (access.status !== "allowed") return <ResellerAccessNotice status={access.status}
    reason={access.status === "unavailable" ? access.reason : undefined} next="/reseller/wallet" />;
  return <ResellerWallet key={access.resellerId} viewerId={access.resellerId} />;
}

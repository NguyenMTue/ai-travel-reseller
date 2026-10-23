import { ResellerShell } from "@/src/components/reseller/shell";
import { ResellerAccessNotice } from "@/src/components/reseller/access-notice";
import { getResellerAccess } from "@/src/lib/reseller/server";

export const metadata = { title: "Không gian Cộng tác viên", robots: { index: false, follow: false } };
// Scoped to the Reseller layout: allow safe-area padding on edge-to-edge devices.
export const viewport = { viewportFit: "cover" };

export default async function ResellerLayout({ children }: { children: React.ReactNode }) {
  const access = await getResellerAccess();

  return (
    <ResellerShell mobileNavigation={access.status === "allowed"}>
      {/* Leaf loaders verify access too and preserve the exact login destination. */}
      {access.status === "allowed" || access.status === "unauthenticated" ? children : <ResellerAccessNotice status={access.status} reason={access.status === "unavailable" ? access.reason : undefined} />}
    </ResellerShell>
  );
}

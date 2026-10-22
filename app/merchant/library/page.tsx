import { redirect } from "next/navigation";
import { getMerchantPortalAccess } from "@/src/lib/merchant/portal-server";
import { MerchantPortalAccessNotice } from "@/src/components/merchant/portal-access-notice";
import { LibraryPending, LibraryShell } from "@/src/components/merchant/library-shell";
export const metadata={title:"Thư viện media Merchant"};
export const dynamic="force-dynamic";
export default async function MerchantLibraryPage(){
  const access=await getMerchantPortalAccess();
  if(access.status==="unauthenticated")redirect("/login?next=%2Fmerchant%2Flibrary");
  if(access.status!=="allowed")return <MerchantPortalAccessNotice access={access}/>;
  return <LibraryShell><LibraryPending /></LibraryShell>;
}

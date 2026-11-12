import { redirect } from "next/navigation";
import { getMerchantPortalAccess } from "@/src/lib/merchant/portal-server";
import { MerchantPortalAccessNotice } from "@/src/components/merchant/portal-access-notice";
import { ProductCreateScreen } from "@/src/components/merchant/product-create";

export const metadata = { title: "Thêm Sản phẩm / Tour mới — Merchant" };
export const dynamic = "force-dynamic";

export default async function NewMerchantProductPage() {
  const access = await getMerchantPortalAccess();
  if (access.status === "unauthenticated") {
    redirect("/login?next=/merchant/products/new");
  }
  if (access.status !== "allowed") {
    return <MerchantPortalAccessNotice access={access} />;
  }

  return <ProductCreateScreen />;
}

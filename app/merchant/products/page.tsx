import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import { getMerchantPortalAccess } from "@/src/lib/merchant/portal-server";
import { MerchantPortalAccessNotice } from "@/src/components/merchant/portal-access-notice";
import { getMerchantProductList } from "@/src/lib/merchant/product-service";
import { ProductList } from "@/src/components/merchant/product-list";

export const metadata = { title: "Quản lý Sản phẩm / Tour — Merchant" };
export const dynamic = "force-dynamic";

export default async function MerchantProductsPage() {
  const access = await getMerchantPortalAccess();
  if (access.status === "unauthenticated") {
    redirect("/login?next=/merchant/products");
  }
  if (access.status !== "allowed") {
    return <MerchantPortalAccessNotice access={access} />;
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const result = await getMerchantProductList(supabase as any, access.userId);
  const products = result.success ? result.data : [];

  return <ProductList initialProducts={products} />;
}

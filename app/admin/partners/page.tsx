import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import { getAdminPortalAccess } from "@/src/lib/admin/admin-access";
import { getAdminPartners } from "@/src/lib/admin/admin-service";
import { AdminPartnersManagement } from "@/src/components/admin/admin-partners-management";
import { AdminAccessNotice } from "@/src/components/admin/admin-access-notice";

export const dynamic = "force-dynamic";

export default async function AdminPartnersPage() {
  const access = await getAdminPortalAccess();

  if (access.status !== "allowed") {
    return <AdminAccessNotice access={access} />;
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const partners = await getAdminPartners(supabase);

  return <AdminPartnersManagement initialPartners={partners} />;
}

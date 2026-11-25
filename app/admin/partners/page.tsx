import { createAdminClient } from "@/src/lib/supabase/admin";
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

  const supabase = createAdminClient();

  const partners = await getAdminPartners(supabase);

  return <AdminPartnersManagement initialPartners={partners} />;
}

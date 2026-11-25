import { createAdminClient } from "@/src/lib/supabase/admin";
import { getAdminPortalAccess } from "@/src/lib/admin/admin-access";
import { getAdminPayoutRequests } from "@/src/lib/admin/admin-service";
import { AdminPayoutsManagement } from "@/src/components/admin/admin-payouts-management";
import { AdminAccessNotice } from "@/src/components/admin/admin-access-notice";

export const dynamic = "force-dynamic";

export default async function AdminPayoutsPage() {
  const access = await getAdminPortalAccess();

  if (access.status !== "allowed") {
    return <AdminAccessNotice access={access} />;
  }

  const supabase = createAdminClient();

  const payouts = await getAdminPayoutRequests(supabase);

  return <AdminPayoutsManagement initialPayouts={payouts} />;
}

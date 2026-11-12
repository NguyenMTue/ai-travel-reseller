import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
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

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const payouts = await getAdminPayoutRequests(supabase);

  return <AdminPayoutsManagement initialPayouts={payouts} />;
}

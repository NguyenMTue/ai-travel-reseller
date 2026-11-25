import { createAdminClient } from "@/src/lib/supabase/admin";
import { getAdminPortalAccess } from "@/src/lib/admin/admin-access";
import {
  getAdminSystemOverview,
  getAdminPayoutRequests,
  getAdminFraudActivities,
} from "@/src/lib/admin/admin-service";
import { AdminDashboard } from "@/src/components/admin/admin-dashboard";
import { AdminAccessNotice } from "@/src/components/admin/admin-access-notice";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const access = await getAdminPortalAccess();

  if (access.status !== "allowed") {
    return <AdminAccessNotice access={access} />;
  }

  const supabase = createAdminClient();

  const [overview, payouts, fraud] = await Promise.all([
    getAdminSystemOverview(supabase),
    getAdminPayoutRequests(supabase, { limit: 10 }),
    getAdminFraudActivities(supabase),
  ]);

  return (
    <AdminDashboard
      overview={overview}
      recentPayouts={payouts}
      flaggedOrders={fraud.flaggedOrders}
    />
  );
}

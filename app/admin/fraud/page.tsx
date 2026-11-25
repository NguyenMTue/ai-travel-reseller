import { createAdminClient } from "@/src/lib/supabase/admin";
import { getAdminPortalAccess } from "@/src/lib/admin/admin-access";
import { getAdminFraudActivities } from "@/src/lib/admin/admin-service";
import { AdminFraudManagement } from "@/src/components/admin/admin-fraud-management";
import { AdminAccessNotice } from "@/src/components/admin/admin-access-notice";

export const dynamic = "force-dynamic";

export default async function AdminFraudPage() {
  const access = await getAdminPortalAccess();

  if (access.status !== "allowed") {
    return <AdminAccessNotice access={access} />;
  }

  const supabase = createAdminClient();

  const fraud = await getAdminFraudActivities(supabase);

  return (
    <AdminFraudManagement
      initialFlaggedOrders={fraud.flaggedOrders}
      initialBotClicks={fraud.botClicks}
    />
  );
}

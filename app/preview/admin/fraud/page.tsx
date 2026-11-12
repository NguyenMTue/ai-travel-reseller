import { AdminFraudManagement } from "@/src/components/admin/admin-fraud-management";
import {
  fixtureAdminFlaggedOrders,
  fixtureAdminBotClicks,
} from "@/src/lib/admin/admin-fixtures";

export default function PreviewAdminFraudPage() {
  return (
    <AdminFraudManagement
      preview={true}
      initialFlaggedOrders={fixtureAdminFlaggedOrders}
      initialBotClicks={fixtureAdminBotClicks}
    />
  );
}

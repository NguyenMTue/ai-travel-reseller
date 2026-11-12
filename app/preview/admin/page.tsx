import { AdminDashboard } from "@/src/components/admin/admin-dashboard";
import {
  fixtureAdminOverview,
  fixtureAdminPayouts,
  fixtureAdminFlaggedOrders,
} from "@/src/lib/admin/admin-fixtures";

export default function PreviewAdminPage() {
  return (
    <AdminDashboard
      preview={true}
      overview={fixtureAdminOverview}
      recentPayouts={fixtureAdminPayouts}
      flaggedOrders={fixtureAdminFlaggedOrders}
    />
  );
}

import { AdminPayoutsManagement } from "@/src/components/admin/admin-payouts-management";
import { fixtureAdminPayouts } from "@/src/lib/admin/admin-fixtures";

export default function PreviewAdminPayoutsPage() {
  return <AdminPayoutsManagement preview={true} initialPayouts={fixtureAdminPayouts} />;
}

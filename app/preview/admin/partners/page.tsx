import { AdminPartnersManagement } from "@/src/components/admin/admin-partners-management";
import { fixtureAdminPartners } from "@/src/lib/admin/admin-fixtures";

export default function PreviewAdminPartnersPage() {
  return (
    <AdminPartnersManagement
      preview={true}
      initialPartners={fixtureAdminPartners}
    />
  );
}

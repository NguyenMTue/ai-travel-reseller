import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { hasSupabaseConfig } from "@/src/lib/supabase/config";
import { ResellerShell } from "@/src/components/reseller/reseller-shell";
import { getInitials } from "@/src/lib/reseller-data";
import { homePathForRole, resolveUserRole } from "@/src/lib/role-auth";

export const metadata = {
  title: "Không gian cộng tác viên — TravelLink AI",
  description: "Dành cho Reseller / KOC / Kênh phân phối du lịch",
};

export default async function ResellerLayout({
  children,
}: {
  children: ReactNode;
}) {
  let userName = "Minh Anh — Demo";
  let userEmail = "reseller@example.com";
  let initials = "MA";

  if (hasSupabaseConfig) {
    const supabase = createClient(await cookies());
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login?next=/reseller");
    }

    const role = await resolveUserRole(supabase, user.id);
    if (!role) {
      redirect("/login?error=no_role");
    }
    if (role !== "reseller") {
      redirect(homePathForRole(role));
    }

    const rawName =
      (user.user_metadata?.full_name as string | undefined) ||
      user.email?.split("@")[0] ||
      "Cộng tác viên";

    userName = rawName;
    userEmail = user.email || userEmail;
    initials = getInitials(rawName);
  }

  return (
    <ResellerShell userName={userName} initials={initials} userEmail={userEmail}>
      {children}
    </ResellerShell>
  );
}

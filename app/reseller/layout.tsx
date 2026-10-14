import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { hasSupabaseConfig } from "@/src/lib/supabase/config";
import { ResellerShell } from "@/src/components/reseller/reseller-shell";
import { getInitials } from "@/src/lib/reseller-data";
import { homePathForRole, resolveUserRoleFromClaims } from "@/src/lib/role-auth";

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
    const { data, error } = await supabase.auth.getClaims();
    const claims = data?.claims;
    const userId = typeof claims?.sub === "string" ? claims.sub : null;

    if (error || !userId) {
      redirect("/login?next=/reseller");
    }

    const role = await resolveUserRoleFromClaims(supabase, claims as Record<string, unknown>);
    if (!role) {
      redirect("/login?error=no_role");
    }
    if (role !== "reseller") {
      redirect(homePathForRole(role));
    }

    const userMetadata = claims?.user_metadata as Record<string, unknown> | undefined;
    const email = typeof claims?.email === "string" ? claims.email : "";
    const rawName =
      (typeof userMetadata?.full_name === "string" ? userMetadata.full_name : undefined) ||
      email.split("@")[0] ||
      "Cộng tác viên";

    userName = rawName;
    userEmail = email || userEmail;
    initials = getInitials(rawName);
  }

  return (
    <ResellerShell userName={userName} initials={initials} userEmail={userEmail}>
      {children}
    </ResellerShell>
  );
}

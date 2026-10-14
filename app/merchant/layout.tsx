import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { hasSupabaseConfig } from "@/src/lib/supabase/config";
import { homePathForRole, resolveUserRoleFromClaims } from "@/src/lib/role-auth";
import {
  MerchantUserProvider,
  type MerchantUser,
} from "@/src/components/merchant/merchant-user-context";
import { getInitials } from "@/src/lib/reseller-data";

export default async function MerchantLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!hasSupabaseConfig) {
    return (
      <MerchantUserProvider user={null}>{children}</MerchantUserProvider>
    );
  }

  const supabase = createClient(await cookies());
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const userId = typeof claims?.sub === "string" ? claims.sub : null;

  if (error || !userId) {
    redirect("/login?next=/merchant");
  }

  const role = await resolveUserRoleFromClaims(supabase, claims as Record<string, unknown>);
  if (!role) {
    redirect(`/login?error=no_role`);
  }
  if (role !== "merchant") {
    redirect(homePathForRole(role));
  }

  const userMetadata = claims?.user_metadata as Record<string, unknown> | undefined;
  const email = typeof claims?.email === "string" ? claims.email : "";
  const displayName =
    (typeof userMetadata?.full_name === "string" ? userMetadata.full_name : undefined) ||
    email.split("@")[0] ||
    "Merchant";

  const merchantUser: MerchantUser = {
    email,
    displayName,
    initials: getInitials(displayName),
  };

  return (
    <MerchantUserProvider user={merchantUser}>{children}</MerchantUserProvider>
  );
}

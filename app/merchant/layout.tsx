import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { hasSupabaseConfig } from "@/src/lib/supabase/config";
import { homePathForRole, resolveUserRole } from "@/src/lib/role-auth";
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/merchant");
  }

  const role = await resolveUserRole(supabase, user.id);
  if (!role) {
    redirect(`/login?error=no_role`);
  }
  if (role !== "merchant") {
    redirect(homePathForRole(role));
  }

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Merchant";

  const merchantUser: MerchantUser = {
    email: user.email ?? "",
    displayName,
    initials: getInitials(displayName),
  };

  return (
    <MerchantUserProvider user={merchantUser}>{children}</MerchantUserProvider>
  );
}

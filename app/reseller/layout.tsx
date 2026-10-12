import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { hasSupabaseConfig } from "@/src/lib/supabase/config";
import { ResellerShell } from "@/src/components/reseller/reseller-shell";
import { getInitials } from "@/src/lib/reseller-data";

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

    const role =
      (user.user_metadata?.role as string | undefined) ||
      (user.app_metadata?.role as string | undefined);

    // Nếu là merchant cố truy cập reseller thì chuyển về merchant
    if (role === "merchant") {
      redirect("/merchant");
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

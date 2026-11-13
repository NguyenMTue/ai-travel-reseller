import type { Metadata } from "next";
import { getAdminPortalAccess } from "@/src/lib/admin/admin-access";
import { AdminAccessNotice } from "@/src/components/admin/admin-access-notice";
import { AdminNavbar } from "@/src/components/admin/admin-navbar";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";

export const metadata: Metadata = {
  title: "Super Admin Back-Office | TravelLink AI",
  description: "Phân hệ Quản trị Vận hành, Phê duyệt Giải ngân & Kiểm soát Gian lận",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await getAdminPortalAccess();

  if (access.status !== "allowed") {
    return <AdminAccessNotice access={access} />;
  }

  // Lấy số lượng yêu cầu rút tiền đang chờ xử lý để hiển thị badge trên Navbar
  let pendingPayoutsCount = 0;
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { count } = await (supabase as any)
      .from("payout_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    pendingPayoutsCount = count || 0;
  } catch {
    // Không làm gián đoạn layout nếu query count bị lỗi
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased">
      <AdminNavbar
        adminName={access.admin.name}
        adminRole={access.admin.role}
        pendingCount={pendingPayoutsCount}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

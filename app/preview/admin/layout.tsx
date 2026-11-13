import type { Metadata } from "next";
import { AdminNavbar } from "@/src/components/admin/admin-navbar";

export const metadata: Metadata = {
  title: "Preview Super Admin Back-Office | TravelLink AI",
  description: "Bản thử nghiệm giao diện Back-Office Super Admin",
};

export default function PreviewAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased">
      <AdminNavbar
        preview={true}
        adminName="Super Admin (Demo)"
        adminRole="super_admin"
        pendingCount={3}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

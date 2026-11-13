"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  ShieldAlert,
  Users,
  LogOut,
  ExternalLink,
  Shield,
} from "lucide-react";
import { Brand } from "@/src/components/brand";
import { logout } from "@/app/actions/auth";

export function AdminNavbar({
  preview = false,
  pendingCount = 0,
  adminName = "Super Admin",
  adminRole = "super_admin",
}: {
  preview?: boolean;
  pendingCount?: number;
  adminName?: string;
  adminRole?: string;
}) {
  const pathname = usePathname();
  const root = preview ? "/preview/admin" : "/admin";

  const navItems = [
    {
      href: root,
      label: "Tổng quan",
      icon: LayoutDashboard,
      active: pathname === root,
    },
    {
      href: `${root}/payouts`,
      label: "Duyệt rút tiền",
      icon: CreditCard,
      badge: pendingCount > 0 ? pendingCount : undefined,
      active: pathname.startsWith(`${root}/payouts`),
    },
    {
      href: `${root}/fraud`,
      label: "Chống gian lận",
      icon: ShieldAlert,
      active: pathname.startsWith(`${root}/fraud`),
    },
    {
      href: `${root}/partners`,
      label: "Quản lý đối tác",
      icon: Users,
      active: pathname.startsWith(`${root}/partners`),
    },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Portal Badge */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Brand href={root} />
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>Back-Office Super Admin</span>
            </div>
            {preview && (
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                Preview Mode
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    item.active
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User profile & actions */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-medium text-slate-200 leading-tight">
                {adminName}
              </span>
              <span className="text-[10px] text-amber-400 font-mono uppercase tracking-wider">
                {adminRole}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/merchant"
                target="_blank"
                className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded border border-slate-800 hover:bg-slate-800 transition-colors hidden sm:flex items-center gap-1"
                title="Mở Merchant Portal trong tab mới"
              >
                <span>Merchant</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <Link
                href="/reseller"
                target="_blank"
                className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded border border-slate-800 hover:bg-slate-800 transition-colors hidden sm:flex items-center gap-1"
                title="Mở Reseller Portal trong tab mới"
              >
                <span>Reseller</span>
                <ExternalLink className="w-3 h-3" />
              </Link>

              {!preview && (
                <form
                  action={async () => {
                    await logout();
                  }}
                >
                  <button
                    type="submit"
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Đăng xuất khỏi Back-Office"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-between overflow-x-auto py-2.5 border-t border-slate-800/80 gap-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                  item.active
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="px-1 py-0.2 text-[10px] font-bold rounded-full bg-red-500 text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Compass, Film, LayoutDashboard, LogOut, Menu, MessageSquare, Package, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { Brand } from "@/src/components/brand";
import { Button } from "@/src/components/ui/button";
import { logout } from "@/app/actions/auth";
import styles from "./merchant-shell.module.css";

const items = [
  { path: "", label: "Tổng quan", icon: LayoutDashboard },
  { path: "/products", label: "Sản phẩm", icon: Package },
  { path: "/campaigns", label: "Chiến dịch", icon: SlidersHorizontal },
  { path: "/contents", label: "Kiểm duyệt AI", icon: Sparkles },
  { path: "/library", label: "Thư viện media", icon: Film },
];

// Presentation only. Server layouts/pages/actions retain their existing role checks.
export function MerchantShell({ children, preview = false, productCount }: { children: ReactNode; preview?: boolean; productCount?: number }) {
  const pathname = usePathname();
  const root = preview ? "/preview/merchant" : "/merchant";
  const current = items.find(item => item.path ? pathname === root + item.path || pathname.startsWith(root + item.path + "/") : pathname === root) ?? items[0];
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    const dismiss = () => setOpen(false);
    const resize = () => { if (window.innerWidth > 760) dismiss(); };
    window.addEventListener("popstate", dismiss);
    window.addEventListener("pageshow", dismiss);
    window.addEventListener("resize", resize);
    return () => { window.removeEventListener("popstate", dismiss); window.removeEventListener("pageshow", dismiss); window.removeEventListener("resize", resize); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const opener = trigger.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebar.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => { document.body.style.overflow = overflow; opener?.focus(); };
  }, [open]);

  return <div className={"dashboard-shell " + styles.portal}>
    {open && <button type="button" className={styles.backdrop} aria-label="Đóng nền điều hướng" tabIndex={-1} onClick={close} />}
    <aside ref={sidebar} id="merchant-sidebar" className={"sidebar " + (open ? "sidebar-open" : "")} role={open ? "dialog" : undefined} aria-modal={open || undefined} aria-label="Không gian Merchant"
      onKeyDown={event => {
        if (!open) return;
        if (event.key === "Escape") { event.preventDefault(); close(); }
        if (event.key === "Tab") {
          const controls = Array.from(sidebar.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []);
          const first = controls[0], last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }
      }}>
      <div className="sidebar-brand"><Brand /><button type="button" className="mobile-close" aria-label="Đóng điều hướng" onClick={close}><X /></button></div>
      <div className="workspace"><span className="workspace-avatar">M</span><div><strong>Không gian doanh nghiệp</strong><small>Merchant Portal</small></div></div>
      <p className="nav-label">KHÔNG GIAN LÀM VIỆC</p>
      <nav aria-label="Điều hướng Merchant">
        {items.map(({ path, label, icon: Icon }) => <Link key={path} prefetch={false} href={root + path} aria-current={current.path === path ? "page" : undefined} onClick={close}>
          <Icon size={19} aria-hidden="true" />{label}{path === "/products" && productCount !== undefined && <span className="nav-count">{productCount}</span>}
        </Link>)}
        <Link href="/chat" onClick={close}><MessageSquare size={19} aria-hidden="true" />Trợ lý AI<ArrowUpRight size={15} aria-hidden="true" /></Link>
      </nav>
      <div className="sidebar-bottom">
        <div className="help-card"><Compass /><h3>Mỗi kết nối,<br />một cơ hội mới.</h3><p>Khám phá cách TravelLink đồng hành cùng bạn.</p><Link href="/#how-it-works">Tìm hiểu thêm ↗</Link></div>
        {preview ? <Link className="sidebar-login" href="/login">Đăng nhập tài khoản <ArrowUpRight size={16} /></Link> : <form action={async () => { await logout(); }}><Button variant="ghost" type="submit"><LogOut />Đăng xuất</Button></form>}
      </div>
    </aside>
    <div className="dashboard-body" inert={open}>
      <header className={"dashboard-header " + styles.header}>
        <div className={styles.breadcrumb}><button ref={trigger} type="button" className="mobile-menu" aria-controls="merchant-sidebar" aria-expanded={open} aria-label="Mở điều hướng" onClick={() => setOpen(value => !value)}><Menu /></button><span>Không gian doanh nghiệp <span className="breadcrumb">/ {current.label}</span></span></div>
        <div className={styles.actions}>{pathname !== root && <Link prefetch={false} href={root + "/campaigns/new"} className={styles.create}>Tạo chiến dịch <ArrowUpRight size={15} /></Link>}<Link href="/" className="profile-badge" aria-label="Về trang chủ">TL</Link></div>
      </header>
      <main id="main-content" tabIndex={-1} className={styles.content}>{children}</main>
    </div>
  </div>;
}

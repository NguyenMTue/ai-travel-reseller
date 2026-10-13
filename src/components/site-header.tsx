"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Brand } from "./brand";
import { Button } from "./ui/button";
export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand />
        <nav aria-label="Điều hướng chính">
          <Link href="/#how-it-works">Cách hoạt động</Link>
          <Link href="/chat">Trợ lý AI</Link>
          <Link href="/preview/merchant">Xem Dashboard</Link>
        </nav>
        <div className="header-actions">
          <Link href="/login" className="login-link">
            Đăng nhập
          </Link>
          <Button asChild size="sm">
            <Link href="/register">
              Bắt đầu ngay <span aria-hidden>↗</span>
            </Link>
          </Button>
          <button
            type="button"
            className="site-mobile-toggle"
            aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={mobileOpen}
            aria-controls="site-mobile-navigation"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X aria-hidden /> : <Menu aria-hidden />}
          </button>
        </div>
      </div>
      <nav
        id="site-mobile-navigation"
        className="site-mobile-nav"
        aria-label="Điều hướng chính trên thiết bị di động"
        hidden={!mobileOpen}
      >
        <Link href="/#how-it-works" onClick={() => setMobileOpen(false)}>Cách hoạt động</Link>
        <Link href="/chat" onClick={() => setMobileOpen(false)}>Trợ lý AI</Link>
        <Link href="/preview/merchant" onClick={() => setMobileOpen(false)}>Xem Dashboard</Link>
        <Link href="/login" onClick={() => setMobileOpen(false)}>Đăng nhập</Link>
      </nav>
    </header>
  );
}

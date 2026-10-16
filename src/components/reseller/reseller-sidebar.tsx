"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Megaphone, FileText, Sparkles, ChevronsUpDown, X, ShieldCheck } from "lucide-react";
import { Brand } from "@/src/components/brand";

export function ResellerSidebar({
  initials = "MA",
  onOpenNotes,
  isOpen = false,
  onClose,
}: {
  initials?: string;
  onOpenNotes?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  const isOverview = pathname === "/reseller";
  const isCampaigns = pathname.startsWith("/reseller/campaigns");
  const isContent = pathname.startsWith("/reseller/content");

  return (
    <aside id="reseller-navigation" className={`reseller-sidebar ${isOpen ? "open" : ""}`}>
      <div className="reseller-sidebar-brand" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Brand />
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Đóng menu"
            className="mobile-close"
            style={{ display: isOpen ? "block" : "none" }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="reseller-workspace-badge">
        <div className="reseller-avatar">{initials}</div>
        <div className="reseller-workspace-info">
          <div className="reseller-workspace-title">Không gian cộng tác viên</div>
        </div>
        <ChevronsUpDown size={14} style={{ color: "#9CA3AF" }} />
      </div>

      <div className="reseller-nav-label">KHÔNG GIAN LÀM VIỆC</div>

      <nav className="reseller-nav" aria-label="Điều hướng cộng tác viên">
        <Link
          href="/reseller"
          onClick={onClose}
          className={`reseller-nav-link ${isOverview ? "active" : ""}`}
          aria-current={isOverview ? "page" : undefined}
        >
          <LayoutGrid size={18} />
          <span>Tổng quan</span>
        </Link>

        <Link
          href="/reseller/campaigns"
          onClick={onClose}
          className={`reseller-nav-link ${isCampaigns ? "active" : ""}`}
          aria-current={isCampaigns ? "page" : undefined}
        >
          <Megaphone size={18} />
          <span>Chiến dịch</span>
        </Link>

        <Link
          href="/reseller/content"
          onClick={onClose}
          className={`reseller-nav-link ${isContent ? "active" : ""}`}
          aria-current={isContent ? "page" : undefined}
        >
          <FileText size={18} />
          <span>Nội dung mẫu</span>
        </Link>
      </nav>

      <div className="reseller-sidebar-footer">
        <Link
          href="/terms-of-service"
          onClick={onClose}
          className={`reseller-footer-link ${pathname === "/terms-of-service" ? "active" : ""}`}
          aria-current={pathname === "/terms-of-service" ? "page" : undefined}
        >
          <FileText size={16} />
          <span>Terms of Service</span>
        </Link>
        <Link
          href="/privacy-policy"
          onClick={onClose}
          className={`reseller-footer-link ${pathname === "/privacy-policy" ? "active" : ""}`}
          aria-current={pathname === "/privacy-policy" ? "page" : undefined}
        >
          <ShieldCheck size={16} />
          <span>Privacy Policy</span>
        </Link>
        <button
          type="button"
          onClick={() => {
            onClose?.();
            onOpenNotes?.();
          }}
          className="reseller-notes-btn"
        >
          <Sparkles size={16} style={{ color: "#1C4438" }} />
          <span>Design Notes</span>
        </button>
      </div>
    </aside>
  );
}

"use client";

import { Clock, Menu, X } from "lucide-react";
import { LogoutButton } from "@/src/components/auth/logout-button";

export function ResellerHeader({
  name = "Minh Anh — Demo",
  initials = "MA",
  menuOpen = false,
  onOpenMobileMenu,
}: {
  name?: string;
  initials?: string;
  menuOpen?: boolean;
  onOpenMobileMenu?: () => void;
}) {
  return (
    <header className="reseller-header">
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={menuOpen}
            aria-controls="reseller-navigation"
            className="mobile-menu-btn"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        )}

        <div className="reseller-user-profile">
          <div className="reseller-avatar lg">{initials}</div>
          <div>
            <div className="reseller-user-name">{name}</div>
            <div className="reseller-user-role">Cộng tác viên</div>
          </div>
        </div>
      </div>

      <div className="reseller-header-actions">
        <div className="reseller-pill-badge">
          <Clock size={13} />
          <span>Dữ liệu mô phỏng</span>
        </div>

        <LogoutButton className="reseller-logout-btn" />
      </div>
    </header>
  );
}

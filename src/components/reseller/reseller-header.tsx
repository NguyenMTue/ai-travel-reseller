"use client";

import { Clock, Menu } from "lucide-react";
import { LogoutButton } from "@/src/components/auth/logout-button";

export function ResellerHeader({
  name = "Minh Anh — Demo",
  initials = "MA",
  onOpenMobileMenu,
}: {
  name?: string;
  initials?: string;
  onOpenMobileMenu?: () => void;
}) {
  return (
    <header className="reseller-header">
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Mở menu"
            className="mobile-menu-btn"
            style={{
              display: "none",
              background: "transparent",
              border: "none",
              padding: 6,
              cursor: "pointer",
            }}
          >
            <Menu size={22} />
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

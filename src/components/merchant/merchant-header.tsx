"use client";

import { Menu } from "lucide-react";
import { LogoutButton } from "@/src/components/auth/logout-button";
import { MerchantAccountMenu } from "./merchant-account-menu";
import { useMerchantUser } from "./merchant-user-context";

type MerchantHeaderProps = {
  breadcrumb: string;
  menuOpen: boolean;
  onToggleMenu: () => void;
  preview?: boolean;
};

export function MerchantHeader({
  breadcrumb,
  menuOpen,
  onToggleMenu,
  preview = false,
}: MerchantHeaderProps) {
  const user = useMerchantUser();

  return (
    <header className="dashboard-header merchant-header">
      <div className="merchant-header-start">
        <button
          className="mobile-menu"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Đóng điều hướng" : "Mở điều hướng"}
          aria-controls="merchant-navigation"
          type="button"
          onClick={onToggleMenu}
        >
          <Menu />
        </button>
        <span>
          Không gian doanh nghiệp{" "}
          <span className="breadcrumb">/ {breadcrumb}</span>
        </span>
      </div>

      {!preview && user ? (
        <div className="merchant-header-actions">
          <LogoutButton className="merchant-logout-btn" />
          <MerchantAccountMenu
            email={user.email}
            initials={user.initials}
            displayName={user.displayName}
          />
        </div>
      ) : null}
    </header>
  );
}

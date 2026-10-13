"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { LogoutButton } from "@/src/components/auth/logout-button";

type MerchantAccountMenuProps = {
  email: string;
  initials: string;
  displayName?: string;
};

export function MerchantAccountMenu({
  email,
  initials,
  displayName,
}: MerchantAccountMenuProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const isOpen = open || hover;

  const close = useCallback(() => {
    setOpen(false);
    setHover(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    function onPointerDown(e: MouseEvent | TouchEvent) {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) close();
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [isOpen, close]);

  return (
    <div
      ref={rootRef}
      className="account-menu"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button
        type="button"
        className="account-menu-trigger merchant-avatar"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
      >
        <span aria-hidden>{initials}</span>
        <span className="sr-only">Menu tài khoản</span>
      </button>

      <div
        id={menuId}
        role="menu"
        className={`account-menu-dropdown ${isOpen ? "account-menu-dropdown-open" : ""}`}
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="account-menu-bridge" aria-hidden />
        <div className="account-menu-panel">
          <div className="account-menu-user">
            {displayName ? (
              <strong className="account-menu-name">{displayName}</strong>
            ) : null}
            <span className="account-menu-email">{email}</span>
          </div>
          <div role="none" className="account-menu-divider" />
          <LogoutButton
            className="account-menu-logout"
            label="Đăng xuất"
            onError={() => setOpen(true)}
          />
        </div>
      </div>
    </div>
  );
}

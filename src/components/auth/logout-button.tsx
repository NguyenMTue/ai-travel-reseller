"use client";

import { useState, useTransition } from "react";
import { Loader2, LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { cn } from "@/src/lib/utils";

type LogoutButtonProps = {
  className?: string;
  showIcon?: boolean;
  label?: string;
  onError?: (message: string) => void;
};

export function LogoutButton({
  className,
  showIcon = true,
  label = "Đăng xuất",
  onError,
}: LogoutButtonProps) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    setError("");
    startTransition(async () => {
      const result = await logout();
      if (result?.error) {
        setError(result.error);
        onError?.(result.error);
      }
    });
  }

  return (
    <span className="logout-button-wrap">
      {error ? (
        <span className="logout-inline-error" role="alert">
          {error}
        </span>
      ) : null}
      <button
        type="button"
        className={cn(className, pending && "is-pending")}
        disabled={pending}
        aria-busy={pending}
        onClick={handleLogout}
      >
        {pending ? (
          <Loader2 size={16} className="spin" aria-hidden />
        ) : showIcon ? (
          <LogOut size={16} aria-hidden />
        ) : null}
        <span>{pending ? "Đang đăng xuất…" : label}</span>
      </button>
    </span>
  );
}

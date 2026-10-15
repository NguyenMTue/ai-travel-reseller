"use client";

import { useActionState } from "react";
import { LoaderCircle, LogOut } from "lucide-react";

import { logout } from "@/app/actions/auth";
import { Button } from "@/src/components/ui/button";

export function ResellerSignout() {
  const [state, submit, pending] = useActionState(logout, undefined);

  return (
    <form action={submit} className="max-w-full">
      <Button type="submit" variant="ghost" size="sm" disabled={pending}>
        {pending ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <LogOut aria-hidden="true" />
        )}
        {pending ? "Đang đăng xuất…" : "Đăng xuất"}
      </Button>
      {state?.error && (
        <p role="alert" className="mt-2 max-w-xs text-xs text-[var(--danger)]">
          {state.error}
        </p>
      )}
    </form>
  );
}

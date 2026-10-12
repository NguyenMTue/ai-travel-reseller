"use client";

import { useState, createContext, useContext, ReactNode } from "react";
import { ResellerSidebar } from "./reseller-sidebar";
import { ResellerHeader } from "./reseller-header";
import { DesignNotesModal } from "./design-notes-modal";

interface ResellerContextType {
  showToast: (msg: string) => void;
  openNotes: () => void;
  user: {
    name: string;
    initials: string;
    email: string;
  };
}

const ResellerContext = createContext<ResellerContextType | null>(null);

export function useReseller() {
  const ctx = useContext(ResellerContext);
  if (!ctx) throw new Error("useReseller must be used within ResellerShell");
  return ctx;
}

export function ResellerShell({
  children,
  userName = "Minh Anh — Demo",
  initials = "MA",
  userEmail = "reseller@example.com",
}: {
  children: ReactNode;
  userName?: string;
  initials?: string;
  userEmail?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((current) => (current === msg ? null : current));
    }, 2400);
  };

  return (
    <ResellerContext.Provider
      value={{
        showToast,
        openNotes: () => setNotesOpen(true),
        user: { name: userName, initials, email: userEmail },
      }}
    >
      <div className="reseller-shell">
        <ResellerSidebar
          initials={initials}
          isOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
          onOpenNotes={() => setNotesOpen(true)}
        />

        <div className="reseller-body">
          <ResellerHeader
            name={userName}
            initials={initials}
            onOpenMobileMenu={() => setMobileOpen(true)}
          />

          <main className="reseller-main">{children}</main>
        </div>

        <DesignNotesModal
          open={notesOpen}
          onClose={() => setNotesOpen(false)}
        />

        {toastMsg && (
          <div className="reseller-toast" role="status">
            {toastMsg}
          </div>
        )}
      </div>
    </ResellerContext.Provider>
  );
}

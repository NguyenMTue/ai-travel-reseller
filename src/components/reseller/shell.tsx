import type { ReactNode } from "react";

import { Brand } from "@/src/components/brand";
import { ResellerSignout } from "./signout";
import { ResellerBottomNav } from "./bottom-nav";
import { ResellerDesktopNav } from "./desktop-nav";
import styles from "./bottom-nav.module.css";

export function ResellerShell({
  children,
  preview = false,
  mobileNavigation = true,
}: {
  children: ReactNode;
  preview?: boolean;
  mobileNavigation?: boolean;
}) {
  return (
    <div className={`${mobileNavigation ? styles.shell : ""} flex min-h-dvh flex-col bg-background`}>
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex w-full max-w-[1320px] flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-10">
          <Brand />
          <p className="text-xs text-muted-foreground">
            Không gian Cộng tác viên
          </p>
        </div>
        <div className={`${preview ? styles.previewToolbar : ""} mx-auto flex w-full max-w-[1320px] flex-wrap items-center justify-between gap-3 px-4 pb-4 sm:px-6 lg:px-10`}>
          <ResellerDesktopNav preview={preview} className={mobileNavigation ? styles.desktopNav : "flex"} />
          {!preview && <ResellerSignout />}
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-10"
      >
        {children}
      </main>
      <footer className="border-t border-border">
        <p className="mx-auto w-full max-w-[1320px] px-4 py-5 text-xs text-muted-foreground sm:px-6 lg:px-10">
          TravelLink AI · Kết nối trải nghiệm Việt
        </p>
      </footer>
      {mobileNavigation && <ResellerBottomNav preview={preview} />}
    </div>
  );
}

import type { ReactNode } from "react";
import Link from "next/link";
import { House, Layers3 } from "lucide-react";

import { Brand } from "@/src/components/brand";
import { Button } from "@/src/components/ui/button";
import { ResellerSignout } from "./signout";
import { ResellerBottomNav } from "./bottom-nav";
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
          <nav
            aria-label="Điều hướng Cộng tác viên"
            className={`${mobileNavigation ? styles.desktopNav : "flex"} min-w-0 flex-wrap gap-2 text-xs`}
          >
            <Button asChild size="sm">
              <Link
                href={preview ? "/preview/reseller" : "/reseller/campaigns"}
                aria-current="page"
                className="min-h-11"
              >
                <Layers3 size={17} aria-hidden="true" />
                Chiến dịch
              </Link>
            </Button>
            <Link
              href="/"
              className="flex min-h-11 items-center gap-2 rounded-lg px-4 py-3 text-muted-foreground hover:bg-secondary hover:text-primary"
            >
              <House size={17} aria-hidden="true" />
              Trang chủ
            </Link>
          </nav>
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

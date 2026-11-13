"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, House, Layers3, Wallet } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export function ResellerDesktopNav({ preview, className }: { preview: boolean; className: string }) {
  const pathname = usePathname();
  const wallet = preview ? "/preview/reseller/wallet" : "/reseller/wallet";
  const library = preview ? "/preview/reseller/library" : "/reseller/library";
  const campaigns = preview ? "/preview/reseller" : "/reseller/campaigns";
  const inWallet = pathname === wallet || pathname.startsWith(`${wallet}/`);
  const inLibrary = pathname === library || pathname.startsWith(`${library}/`);
  const inCampaigns = !inWallet && !inLibrary;

  return (
    <nav aria-label="Điều hướng Cộng tác viên" className={`${className} min-w-0 flex-wrap gap-2 text-xs`}>
      <Button asChild size="sm" variant={inCampaigns ? "default" : "outline"}>
        <Link
          href={campaigns}
          aria-current={inCampaigns ? "page" : undefined}
          className="min-h-11"
        >
          <Layers3 size={17} aria-hidden="true" />Chiến dịch
        </Link>
      </Button>
      <Button asChild size="sm" variant={inLibrary ? "default" : "outline"}>
        <Link
          href={library}
          prefetch={false}
          aria-current={inLibrary ? "page" : undefined}
          className="min-h-11"
        >
          <Film size={17} aria-hidden="true" />Thư viện Media
        </Link>
      </Button>
      <Button asChild size="sm" variant={inWallet ? "default" : "outline"}>
        <Link
          href={wallet}
          prefetch={false}
          aria-current={inWallet ? "page" : undefined}
          className="min-h-11"
        >
          <Wallet size={17} aria-hidden="true" />Ví hoa hồng
        </Link>
      </Button>
      <Link
        href="/"
        className="flex min-h-11 items-center gap-2 rounded-lg px-4 py-3 text-muted-foreground hover:bg-secondary hover:text-primary"
      >
        <House size={17} aria-hidden="true" />Trang chủ
      </Link>
    </nav>
  );
}

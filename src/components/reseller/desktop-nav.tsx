"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Layers3, Wallet } from "lucide-react";
import { Button } from "@/src/components/ui/button";
export function ResellerDesktopNav({ preview, className }: { preview: boolean; className: string }) {
  const pathname = usePathname();
  const wallet = preview ? "/preview/reseller/wallet" : "/reseller/wallet";
  const inWallet = pathname === wallet || pathname.startsWith(`${wallet}/`);
  return <nav aria-label="Điều hướng Cộng tác viên" className={`${className} min-w-0 flex-wrap gap-2 text-xs`}>
    <Button asChild size="sm" variant={inWallet ? "outline" : "default"}><Link href={preview ? "/preview/reseller" : "/reseller/campaigns"}
      aria-current={!inWallet ? "page" : undefined} className="min-h-11"><Layers3 size={17} aria-hidden="true" />Chiến dịch</Link></Button>
    <Button asChild size="sm" variant={inWallet ? "default" : "outline"}><Link href={wallet} prefetch={false}
      aria-current={inWallet ? "page" : undefined} className="min-h-11"><Wallet size={17} aria-hidden="true" />Ví hoa hồng</Link></Button>
    <Link href="/" className="flex min-h-11 items-center gap-2 rounded-lg px-4 py-3 text-muted-foreground hover:bg-secondary hover:text-primary"><House size={17} aria-hidden="true" />Trang chủ</Link>
  </nav>;
}

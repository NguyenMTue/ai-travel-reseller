import React from "react";
import { ShieldCheck, PhoneCall, Sparkles } from "lucide-react";
import type { StorefrontMerchant, StorefrontData } from "@/src/lib/storefront/types";

import { getReferralIdentity } from "@/src/lib/storefront/referral";

type StorefrontHeaderProps = {
  merchant: StorefrontMerchant;
  tracking?: StorefrontData["tracking"];
};

export function StorefrontHeader({ merchant, tracking }: StorefrontHeaderProps) {
  const identity = getReferralIdentity(tracking);
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e2e8f0] shadow-xs">
      {/* Single promotional surface; identity alone never establishes eligibility. */}
      {identity?.hasVoucher && (
        <div aria-label="Ưu đãi từ người giới thiệu" className="bg-gradient-to-r from-[#204e4c] to-[#2c6e6b] text-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <Sparkles aria-hidden="true" className="size-4 shrink-0 text-amber-300" />
              <span className="break-words">Ưu đãi từ <strong>{identity.name}</strong></span>
            </span>
            <span className="shrink-0 rounded-full bg-amber-300 px-3 py-1 font-bold text-[#173e3c]">Voucher 5%</span>
          </div>
        </div>
      )}

      {/* Main Top Navigation */}
      <div className="max-w-6xl mx-auto px-4 min-h-16 py-3 flex items-center justify-between gap-4">
        {/* Merchant Brand Identity */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-[#204e4c] to-[#bd6840] flex items-center justify-center text-white font-bold text-lg shadow-sm overflow-hidden">
            {merchant.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="break-words font-bold text-[#1e293b] text-sm sm:text-base leading-tight">
                {merchant.name}
              </span>
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Chính hãng 100%
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block truncate max-w-md">
              {merchant.tagline}
            </p>
          </div>
        </div>

        {/* Support Hotline CTA */}
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={`tel:${merchant.hotline.replace(/\s+/g, "")}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#cbd5e1] hover:border-[#204e4c] hover:bg-[#f8fafc] text-slate-700 text-xs md:text-sm font-medium transition-colors"
          >
            <PhoneCall className="w-4 h-4 text-[#204e4c]" />
            <span className="hidden md:inline text-slate-500">Hotline hỗ trợ:</span>
            <strong className="text-[#204e4c]">{merchant.hotline}</strong>
          </a>
        </div>
      </div>
    </header>
  );
}

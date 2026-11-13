import React from "react";
import { ShieldCheck, PhoneCall, Sparkles, Clock, MapPin } from "lucide-react";
import type { StorefrontMerchant, StorefrontData } from "@/src/lib/storefront/types";

type StorefrontHeaderProps = {
  merchant: StorefrontMerchant;
  tracking?: StorefrontData["tracking"];
};

export function StorefrontHeader({ merchant, tracking }: StorefrontHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e2e8f0] shadow-xs">
      {/* Reseller Affiliate Referral Banner */}
      {tracking?.refCode && (
        <div className="bg-gradient-to-r from-[#204e4c] to-[#2c6e6b] text-white px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-center gap-2 shadow-inner">
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
          <span>
            Ưu đãi độc quyền qua liên kết Đối tác Reseller: <strong>Giảm thêm 5%</strong> khi hoàn tất đặt vé hôm nay!
          </span>
          <span className="hidden sm:inline-block bg-white/20 px-2 py-0.5 rounded text-[11px] font-mono">
            MÃ: {tracking.refCode.slice(0, 8)}...
          </span>
        </div>
      )}

      {/* Main Top Navigation */}
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Merchant Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#204e4c] to-[#bd6840] flex items-center justify-center text-white font-bold text-lg shadow-sm overflow-hidden">
            {merchant.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#1e293b] text-base leading-tight">
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
        <div className="flex items-center gap-2">
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

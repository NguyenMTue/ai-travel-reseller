"use client";

import React from "react";
import { ArrowRight, Zap } from "lucide-react";
import type { StorefrontData } from "@/src/lib/storefront/types";
import { formatPrice } from "@/src/lib/storefront/format";

type StorefrontStickyCtaProps = {
  product: StorefrontData["product"];
  onOpenBooking: () => void;
};

export function StorefrontStickyCta({ product, onOpenBooking }: StorefrontStickyCtaProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-2xl flex items-center justify-between gap-3">
      <div>
        <div className="text-[11px] text-slate-500 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span>Giá chỉ từ</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-extrabold text-[#bd6840]">
            {formatPrice(product.salePrice)} ₫
          </span>
          <span className="text-[10px] text-slate-400 line-through">
            {formatPrice(product.originalPrice)} ₫
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenBooking}
        className="bg-gradient-to-r from-[#bd6840] to-[#d97746] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md flex items-center gap-1.5 active:scale-98 transition-transform cursor-pointer"
      >
        <span>ĐẶT VÉ NGAY</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

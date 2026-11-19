"use client";

import type { StorefrontPrice } from "@/src/lib/storefront/pricing";
import { formatPrice } from "@/src/lib/storefront/format";

type StorefrontStickyCtaProps = {
  price: StorefrontPrice;
  onOpenBooking: () => void;
};

export function StorefrontStickyCta({ price, onOpenBooking }: StorefrontStickyCtaProps) {
  return (
    <section aria-label="Đặt vé nhanh" className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-2xl md:hidden">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-600">{price.hasReferralDiscount ? "Giá qua đối tác" : "Giá vé / người"}</p>
          <p className="text-xs text-slate-500 line-through">{formatPrice(price.originalPrice)} ₫</p>
          <p data-testid="sticky-cta-amount" className="text-xl font-extrabold leading-tight text-[#bd6840]">{formatPrice(price.finalPrice)} ₫</p>
        </div>
        <button type="button" onClick={onOpenBooking}
          className="min-h-12 shrink-0 rounded-xl bg-[#bd6840] px-4 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#a85934] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#204e4c]">
          Đặt vé ngay
        </button>
      </div>
    </section>
  );
}

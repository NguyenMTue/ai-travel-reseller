"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Star,
  Zap,
  ShieldCheck,
  RotateCcw,
  QrCode,
  Flame,
  ArrowRight,
  Clock,
} from "lucide-react";
import type { StorefrontData } from "@/src/lib/storefront/types";

type StorefrontPriceCardProps = {
  data: StorefrontData;
  onOpenBooking: () => void;
};

export function StorefrontPriceCard({ data, onOpenBooking }: StorefrontPriceCardProps) {
  const { product, merchant, tracking } = data;

  // Flash Sale Countdown Timer (Simulated dynamic countdown)
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 28, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 4, minutes: 30, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const discountPercent = Math.round(
    ((product.originalPrice - product.salePrice) / product.originalPrice) * 100,
  );

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 md:p-6 shadow-sm sticky top-20 flex flex-col gap-4">
      {/* Category & Location Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-md">
          {product.category}
        </span>
        <span className="inline-flex items-center gap-1 text-slate-500 text-xs font-medium">
          <MapPin className="w-3.5 h-3.5 text-[#bd6840]" />
          {product.location}
        </span>
      </div>

      {/* Product Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug">
          {product.name}
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1 line-clamp-2">
          {product.subtitle}
        </p>
      </div>

      {/* Ratings & Social Proof */}
      <div className="flex items-center gap-3 text-xs md:text-sm pb-3 border-b border-slate-100">
        <div className="flex items-center gap-1 bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-md border border-amber-200">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{product.rating}</span>
        </div>
        <span className="text-slate-500 underline decoration-slate-300">
          {product.reviewCount.toLocaleString()} đánh giá
        </span>
        <span className="text-slate-300">•</span>
        <span className="text-emerald-700 font-medium">
          Đã bán {product.soldCount.toLocaleString()} vé
        </span>
      </div>

      {/* Flash Sale Banner */}
      <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-orange-500/10 border border-rose-200 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-rose-700 text-xs font-bold">
          <Flame className="w-4 h-4 fill-rose-500 text-rose-500 animate-bounce" />
          <span>ƯU ĐÃI FLASH SALE</span>
        </div>
        <div className="flex items-center gap-1 text-xs font-mono font-bold text-slate-800">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span className="bg-white px-1.5 py-0.5 rounded shadow-xs border border-slate-200">
            {String(timeLeft.hours).padStart(2, "0")}
          </span>
          :
          <span className="bg-white px-1.5 py-0.5 rounded shadow-xs border border-slate-200">
            {String(timeLeft.minutes).padStart(2, "0")}
          </span>
          :
          <span className="bg-white px-1.5 py-0.5 rounded shadow-xs border border-slate-200 text-rose-600">
            {String(timeLeft.seconds).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Price Presentation */}
      <div className="flex items-baseline justify-between pt-1">
        <div>
          <span className="text-xs text-slate-400 line-through mr-2">
            {product.originalPrice.toLocaleString()} ₫
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl md:text-3xl font-extrabold text-[#bd6840]">
              {product.salePrice.toLocaleString()} ₫
            </span>
            <span className="text-xs text-slate-500">/ người</span>
          </div>
        </div>

        <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-1 rounded-full border border-rose-200">
          Giảm {discountPercent}%
        </span>
      </div>

      {/* Urgency indicator */}
      <p className="text-[12px] text-amber-700 font-medium bg-amber-50/80 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1.5">
        <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-600 shrink-0" />
        Chỉ còn <strong>{product.remainingToday} vé</strong> ưu đãi mức giá này trong hôm nay!
      </p>

      {/* Primary Action Button */}
      <button
        type="button"
        onClick={onOpenBooking}
        className="w-full bg-gradient-to-r from-[#bd6840] to-[#d97746] hover:from-[#a85934] hover:to-[#bd6840] text-white font-bold text-base py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer"
      >
        <span>ĐẶT VÉ NGAY • QUÉT MÃ VÀO CỔNG</span>
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </button>

      {/* Trust & Guarantee Highlights */}
      <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
        <div className="flex items-center gap-1.5">
          <QrCode className="w-3.5 h-3.5 text-[#204e4c] shrink-0" />
          <span>Vé QR vào thẳng cổng</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Vé chính hãng {merchant.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <RotateCcw className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>Đổi ngày miễn phí 24h</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Xác nhận tức thì qua SMS</span>
        </div>
      </div>
    </div>
  );
}

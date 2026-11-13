import React from "react";
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  CalendarDays,
  ShieldAlert,
  Sparkles,
  Compass,
  ArrowRight,
  Info,
} from "lucide-react";
import type { StorefrontData, StorefrontPackage } from "@/src/lib/storefront/types";

type StorefrontTourContentProps = {
  data: StorefrontData;
  onSelectPackage: (pkg: StorefrontPackage) => void;
};

export function StorefrontTourContent({ data, onSelectPackage }: StorefrontTourContentProps) {
  const { product, merchant } = data;

  return (
    <div className="flex flex-col gap-8 text-slate-800">
      {/* 1. Điểm nổi bật (Highlights) */}
      <section className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-xs">
        <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[#bd6840]" />
          <span>Điểm nổi bật không thể bỏ lỡ</span>
        </h2>
        <ul className="grid sm:grid-cols-2 gap-3">
          {product.highlights.map((highlight, index) => (
            <li
              key={index}
              className="flex items-start gap-2.5 text-xs md:text-sm text-slate-700 bg-slate-50/70 p-3 rounded-xl border border-slate-100"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 2. Các gói dịch vụ & Bảng giá chi tiết */}
      <section className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#204e4c]" />
            <span>Các lựa chọn gói vé & Combo ưu đãi</span>
          </h2>
          <span className="text-xs text-slate-500">Bấm để chọn gói vé mong muốn</span>
        </div>

        <div className="flex flex-col gap-4">
          {product.packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`p-5 rounded-xl border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                pkg.isPopular
                  ? "border-[#204e4c] bg-emerald-50/20 shadow-sm"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h3 className="font-bold text-base md:text-lg text-slate-900">
                    {pkg.name}
                  </h3>
                  {pkg.badge && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                      {pkg.badge}
                    </span>
                  )}
                  {pkg.isPopular && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#204e4c] text-white">
                      Khuyên dùng
                    </span>
                  )}
                </div>

                <p className="text-xs md:text-sm text-slate-600 mb-3">
                  {pkg.description}
                </p>

                <div className="grid sm:grid-cols-2 gap-1.5">
                  {pkg.inclusions.map((inc, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[12px] text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#204e4c] shrink-0" />
                      <span>{inc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price & Selection Button */}
              <div className="shrink-0 flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                <div className="text-left md:text-right">
                  <span className="text-xs text-slate-400 line-through">
                    {pkg.originalPrice.toLocaleString()} ₫
                  </span>
                  <div className="text-xl md:text-2xl font-extrabold text-[#bd6840]">
                    {pkg.salePrice.toLocaleString()} ₫
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectPackage(pkg)}
                  className="mt-2 bg-[#204e4c] hover:bg-[#183d3b] text-white text-xs md:text-sm font-bold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span>Chọn gói này</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Mẹo du lịch thực tế từ Thổ địa (Authentic Travel Tips) */}
      <section className="bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 rounded-2xl p-6 border border-amber-200 shadow-xs">
        <h2 className="text-lg md:text-xl font-bold text-amber-900 flex items-center gap-2 mb-2">
          <Lightbulb className="w-5 h-5 text-amber-600" />
          <span>Mẹo du lịch thực tế từ Hướng dẫn viên bản địa</span>
        </h2>
        <p className="text-xs text-amber-800/80 mb-5">
          Những kinh nghiệm xương máu giúp chuyến đi trọn vẹn, chụp ảnh đẹp và không bị lỡ khung giờ vàng
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {product.authenticTips.map((tip, idx) => (
            <div
              key={idx}
              className="bg-white p-4 rounded-xl border border-amber-100 shadow-xs flex items-start gap-3"
            >
              <span className="text-2xl shrink-0 p-1 bg-amber-50 rounded-lg">{tip.icon}</span>
              <div>
                <h4 className="font-bold text-slate-900 text-xs md:text-sm mb-1">
                  {tip.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {tip.tip}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Lịch trình tham quan gợi ý (Itinerary) */}
      <section className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-xs">
        <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
          <CalendarDays className="w-5 h-5 text-[#204e4c]" />
          <span>Lịch trình trải nghiệm gợi ý</span>
        </h2>

        <div className="relative pl-6 border-l-2 border-[#204e4c]/20 space-y-6">
          {product.itinerary.map((item, i) => (
            <div key={i} className="relative">
              {/* Dot */}
              <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-[#204e4c] ring-2 ring-[#204e4c]/20" />
              <div>
                <span className="inline-block bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-md mb-1">
                  {item.time} {item.location ? `• ${item.location}` : ""}
                </span>
                <h4 className="font-bold text-slate-900 text-sm md:text-base">
                  {item.title}
                </h4>
                <p className="text-xs md:text-sm text-slate-600 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Bao gồm & Không bao gồm */}
      <section className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-xs grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Giá vé đã bao gồm</span>
          </h3>
          <ul className="space-y-2 text-xs md:text-sm text-slate-600">
            {product.inclusions.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold shrink-0">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 mb-3">
            <XCircle className="w-4 h-4 text-slate-400" />
            <span>Chưa bao gồm</span>
          </h3>
          <ul className="space-y-2 text-xs md:text-sm text-slate-500">
            {product.exclusions.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-slate-400 font-bold shrink-0">✕</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6. Chính sách & Hướng dẫn sử dụng vé điện tử */}
      <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <Info className="w-4 h-4 text-[#204e4c]" />
          <span>Chính sách hoàn hủy & Hướng dẫn vào cổng</span>
        </h3>

        <div className="grid md:grid-cols-3 gap-4 text-xs">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-1">Chính sách đổi trả</h4>
            <p className="text-slate-600 leading-relaxed">{product.policy.cancellation}</p>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-1">Hình thức vé</h4>
            <p className="text-slate-600 leading-relaxed">{product.policy.ticketType}</p>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-1">Cửa soát vé</h4>
            <p className="text-slate-600 leading-relaxed">{product.policy.entryInstructions}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

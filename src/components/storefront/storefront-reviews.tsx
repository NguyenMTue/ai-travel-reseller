import React from "react";
import { Star, ShieldCheck, ThumbsUp } from "lucide-react";
import type { StorefrontReview } from "@/src/lib/storefront/types";
import { formatNumber } from "@/src/lib/storefront/format";

type StorefrontReviewsProps = {
  reviews: StorefrontReview[];
  averageRating: number;
  totalReviews: number;
};

export function StorefrontReviews({ reviews, averageRating, totalReviews }: StorefrontReviewsProps) {
  return (
    <section className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Đánh giá từ du khách thực tế</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            100% đánh giá từ khách hàng đã đặt vé và hoàn thành chuyến tham quan
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-3xl font-extrabold text-slate-900">{averageRating}</div>
          <div>
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {formatNumber(totalReviews)} lượt đánh giá
            </div>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100 mt-4">
        {reviews.map((rev) => (
          <div key={rev.id} className="py-4 first:pt-0 last:pb-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                  {rev.author.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 text-xs md:text-sm">
                      {rev.author}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-medium">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Đã mua vé
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Gói: {rev.tourPackage} • {rev.date}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-0.5">
                {[...Array(rev.rating)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>

            <p className="text-xs md:text-sm text-slate-700 leading-relaxed pl-10">
              {rev.comment}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

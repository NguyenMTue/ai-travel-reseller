"use client";

import { ArrowRight, Gift, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export type MerchantRewardTier = "silver" | "gold" | "diamond";

export interface MerchantRewardPointsCardProps {
  pointsBalance: number;
  tier?: MerchantRewardTier;
  isRedeeming?: boolean;
  onRedeem: () => void;
}

const tierLabels: Record<MerchantRewardTier, string> = {
  silver: "Bạc",
  gold: "Vàng",
  diamond: "Kim cương",
};

function formatPoints(points: number) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(points);
}

export function MerchantRewardPointsCard({
  pointsBalance,
  tier,
  isRedeeming = false,
  onRedeem,
}: MerchantRewardPointsCardProps) {
  const safePoints = Number.isFinite(pointsBalance) ? Math.max(0, pointsBalance) : 0;

  return (
    <section aria-labelledby="merchant-reward-points-title" className="overflow-hidden rounded-2xl border border-[#d8c58b] bg-gradient-to-br from-[#fffdf5] via-background to-[#f7f0d9] shadow-sm">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-800"><Sparkles size={15} aria-hidden="true" /> Quyền lợi Merchant</p>
            <h2 id="merchant-reward-points-title" className="mt-2 text-xl font-semibold text-foreground">Điểm thưởng của bạn</h2>
          </div>
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-800"><Trophy size={21} aria-hidden="true" /></span>
        </div>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Số dư điểm</p>
            <p className="mt-1 text-4xl font-bold tracking-tight text-foreground tabular-nums">{formatPoints(safePoints)} <span className="text-base font-medium text-amber-800">điểm</span></p>
          </div>
          {tier && <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100/80 px-3 py-1.5 text-sm font-semibold text-amber-900"><Trophy size={14} aria-hidden="true" /> Hạng {tierLabels[tier]}</span>}
        </div>

        <div className="mt-5 rounded-xl border border-amber-200/80 bg-white/70 p-4">
          <h3 className="text-sm font-semibold text-foreground">Điểm được ghi nhận từ tương tác video</h3>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
            <li><strong className="text-foreground">1.000</strong> lượt xem <span aria-hidden="true">→</span> <strong className="text-foreground">10 điểm</strong></li>
            <li><strong className="text-foreground">100</strong> lượt thích <span aria-hidden="true">→</span> <strong className="text-foreground">15 điểm</strong></li>
            <li><strong className="text-foreground">10</strong> bình luận <span aria-hidden="true">→</span> <strong className="text-foreground">20 điểm</strong></li>
          </ul>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"><Gift size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-amber-700" />Dùng điểm để đổi quyền lợi như giảm phí nền tảng hoặc ưu tiên hiển thị tour.</p>
          <Button type="button" onClick={onRedeem} disabled={safePoints === 0 || isRedeeming} className="shrink-0">
            {isRedeeming ? "Đang quy đổi…" : "Quy đổi ưu đãi"}
            {!isRedeeming && <ArrowRight size={16} aria-hidden="true" />}
          </Button>
        </div>
      </div>
    </section>
  );
}

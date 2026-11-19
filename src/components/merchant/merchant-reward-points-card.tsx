"use client";

import { Gift, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export type MerchantRewardTier = "silver" | "gold" | "diamond";

export interface MerchantFeeDiscountMilestone {
  id: string;
  pointsRequired: number;
  feeDiscountPercent: number;
}

export interface MerchantRewardPointsCardProps {
  pointsBalance: number;
  feeDiscountMilestones: MerchantFeeDiscountMilestone[];
  tier?: MerchantRewardTier;
  redeemingMilestoneId?: string | null;
  onRedeem: (milestone: MerchantFeeDiscountMilestone) => void;
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
  feeDiscountMilestones,
  tier,
  redeemingMilestoneId = null,
  onRedeem,
}: MerchantRewardPointsCardProps) {
  const safePoints = Number.isFinite(pointsBalance) ? Math.max(0, pointsBalance) : 0;
  const sortedMilestones = [...feeDiscountMilestones].sort((a, b) => a.pointsRequired - b.pointsRequired);

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
          <div>
            <h3 className="text-sm font-semibold text-foreground">Mốc điểm đổi giảm phí sàn</h3>
            <p className="mt-1 text-xs text-muted-foreground">Mốc và tỷ lệ ưu đãi được truyền từ cấu hình chương trình.</p>
          </div>
          {sortedMilestones.length ? (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {sortedMilestones.map((milestone) => {
                const eligible = safePoints >= milestone.pointsRequired;
                const redeeming = redeemingMilestoneId === milestone.id;
                return (
                  <li key={milestone.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200/80 bg-background p-3">
                    <div>
                      <p className="font-semibold text-foreground">Giảm {milestone.feeDiscountPercent}% phí sàn</p>
                      <p className="mt-1 text-xs text-muted-foreground">Cần {formatPoints(milestone.pointsRequired)} điểm</p>
                      <p className="mt-1 text-xs font-medium text-amber-800">{eligible ? "Đã đủ điều kiện" : `Còn ${formatPoints(milestone.pointsRequired - safePoints)} điểm`}</p>
                    </div>
                    <Button type="button" size="sm" onClick={() => onRedeem(milestone)} disabled={!eligible || redeemingMilestoneId !== null}>
                      {redeeming ? "Đang đổi…" : "Đổi mốc này"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p role="status" className="mt-3 rounded-lg border border-dashed border-amber-300 px-3 py-4 text-center text-sm text-muted-foreground">Chưa có mốc ưu đãi được cấu hình.</p>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"><Gift size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-amber-700" />Điểm được tích lũy từ tương tác video theo quy chế của chương trình.</p>
        </div>
      </div>
    </section>
  );
}

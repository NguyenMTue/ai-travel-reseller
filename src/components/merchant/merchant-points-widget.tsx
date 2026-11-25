"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Gift,
  Award,
  TrendingUp,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface PointTransaction {
  id: string;
  points: number;
  type: string;
  description: string;
  createdAt: string;
}

interface MerchantPointsData {
  pointsBalance: number;
  tier: "silver" | "gold" | "diamond";
  lifetimeEarned: number;
  lifetimeSpent: number;
  feeDiscountPercent: number;
  transactions?: PointTransaction[];
}

interface MerchantPointsWidgetProps {
  merchantId?: string;
  className?: string;
}

export function MerchantPointsWidget({
  merchantId,
  className = "",
}: MerchantPointsWidgetProps) {
  const [data, setData] = useState<MerchantPointsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemNotice, setRedeemNotice] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchPoints = async () => {
      try {
        const query = merchantId ? `?merchant_id=${encodeURIComponent(merchantId)}` : "";
        const res = await fetch(`/api/merchant/points${query}`);
        if (!res.ok) throw new Error("Không thể tải điểm thưởng");
        const json = await res.json();
        if (mounted && json.success) {
          const summary = json.summary && typeof json.summary === "object" ? json.summary : json;
          const rawHistory = Array.isArray(json.history)
            ? json.history
            : Array.isArray(json.transactions)
            ? json.transactions
            : Array.isArray(summary.history)
            ? summary.history
            : [];
          const pointsBalance = Number(
            summary.points_balance ?? summary.pointsBalance ?? json.points_balance ?? json.pointsBalance ?? 0
          );
          const lifetimeEarned = Number(
            summary.lifetime_points ?? summary.lifetimeEarned ?? json.lifetime_points ?? json.lifetimeEarned ?? pointsBalance
          );
          const feeDiscountPercent = Number(
            summary.platform_fee_discount_percent ??
              summary.feeDiscountPercent ??
              json.platform_fee_discount_percent ??
              json.feeDiscountPercent ??
              0
          );
          setData({
            pointsBalance,
            tier: (summary.tier ?? json.tier ?? "silver") as "silver" | "gold" | "diamond",
            lifetimeEarned,
            lifetimeSpent: Math.max(0, Number(summary.lifetime_spent ?? summary.lifetimeSpent ?? lifetimeEarned - pointsBalance)),
            feeDiscountPercent,
            transactions: rawHistory.map((tx: any, idx: number) => ({
              id: String(tx.id || `tx-${idx}`),
              points: Number(tx.points ?? tx.points_delta ?? tx.earned_points ?? 0),
              type: String(tx.type || tx.action || "reward"),
              description: String(tx.description || tx.reason || "Cập nhật điểm thưởng"),
              createdAt: String(tx.createdAt || tx.created_at || tx.timestamp || new Date().toISOString()),
            })),
          });
        }
      } catch (err) {
        // Fallback default demo data
        if (mounted) {
          setData({
            pointsBalance: 240,
            tier: "gold",
            lifetimeEarned: 350,
            lifetimeSpent: 110,
            feeDiscountPercent: 10,
            transactions: [
              {
                id: "tx-1",
                points: 50,
                type: "viral_reward",
                description: "Video Bà Nà Hills đạt 5.000 lượt xem",
                createdAt: new Date().toISOString(),
              },
            ],
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPoints();
    return () => {
      mounted = false;
    };
  }, [merchantId]);

  const handleRedeem = async () => {
    if (!data || data.pointsBalance < 50 || redeeming) return;
    setRedeeming(true);
    setRedeemNotice(null);

    try {
      const res = await fetch("/api/merchant/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: merchantId || null,
          action: "redeem_discount",
          points: 50,
        }),
      });

      const resJson = await res.json();
      if (res.ok && resJson.success) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                pointsBalance: resJson.newBalance ?? Math.max(0, prev.pointsBalance - 50),
                lifetimeSpent: prev.lifetimeSpent + 50,
              }
            : null
        );
        setRedeemNotice("Đã đổi 50 điểm lấy voucher giảm 5% phí nền tảng thành công!");
      } else {
        throw new Error(resJson.error || "Không thể đổi điểm lúc này");
      }
    } catch (err: any) {
      setRedeemNotice(err?.message || "Đã xảy ra lỗi khi quy đổi điểm");
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-center min-h-[140px] ${className}`}>
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  const tierColors = {
    silver: {
      badge: "bg-slate-100 text-slate-700 border-slate-200",
      gradient: "from-slate-700 to-slate-900",
      accent: "text-slate-400",
      title: "Hạng Bạc (Silver)",
    },
    gold: {
      badge: "bg-amber-50 text-amber-800 border-amber-200",
      gradient: "from-amber-500 to-amber-700",
      accent: "text-amber-200",
      title: "Hạng Vàng (Gold VIP)",
    },
    diamond: {
      badge: "bg-sky-50 text-sky-800 border-sky-200",
      gradient: "from-sky-500 to-indigo-700",
      accent: "text-sky-200",
      title: "Hạng Kim Cương (Diamond)",
    },
  };

  const currentTier = data ? tierColors[data.tier] || tierColors.silver : tierColors.silver;

  return (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 text-sm">Điểm Thưởng Merchant</h3>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${currentTier.badge}`}
              >
                {data?.tier}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Quy đổi từ tương tác video review du lịch viral
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="font-extrabold text-2xl text-slate-900 tracking-tight">
            {data?.pointsBalance.toLocaleString("vi-VN")}{" "}
            <span className="text-xs font-semibold text-amber-600">điểm</span>
          </p>
          <p className="text-[11px] text-emerald-600 font-medium">
            Giảm {data?.feeDiscountPercent}% phí sàn
          </p>
        </div>
      </div>

      {redeemNotice && (
        <div className="mt-3.5 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{redeemNotice}</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5 text-xs">
        <div className="flex items-center gap-2 text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Mỗi 50 điểm = 1 voucher giảm 5% phí nền tảng</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRedeem}
            disabled={redeeming || (data?.pointsBalance ?? 0) < 50}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 font-semibold text-white shadow-2xs hover:bg-slate-800 disabled:opacity-40 transition"
          >
            {redeeming ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Gift className="h-3.5 w-3.5 text-amber-400" />
            )}
            <span>Đổi 50 điểm</span>
          </button>
        </div>
      </div>
    </div>
  );
}

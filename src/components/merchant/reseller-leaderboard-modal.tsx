"use client";

import React, { useState, useEffect } from "react";
import {
  Trophy,
  X,
  Filter,
  Users,
  Percent,
  TrendingUp,
  DollarSign,
  Loader2,
  Award,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface TopReseller {
  rank: number;
  resellerId: string;
  fullName: string;
  avatarUrl?: string;
  totalClicks: number;
  totalOrders: number;
  conversionRate: number;
  totalCommissionPaid: number;
  averageCommissionRate: number;
  tier?: string;
}

interface ResellerLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchantId?: string;
}

export function ResellerLeaderboardModal({
  isOpen,
  onClose,
  merchantId,
}: ResellerLeaderboardModalProps) {
  const [resellers, setResellers] = useState<TopReseller[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMaxRate, setSelectedMaxRate] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    const fetchTopResellers = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (merchantId) params.append("merchant_id", merchantId);
        if (selectedMaxRate !== null)
          params.append("max_commission_rate", selectedMaxRate.toString());

        const res = await fetch(`/api/merchant/resellers/top?${params.toString()}`);
        if (!res.ok) throw new Error("Không thể tải danh sách Reseller");
        const data = await res.json();

        if (mounted && data.success && Array.isArray(data.resellers)) {
          const mapped: TopReseller[] = data.resellers.map((item: any, idx: number) => ({
            rank: typeof item.rank === "number" ? item.rank : idx + 1,
            resellerId: String(item.resellerId || item.reseller_id || ""),
            fullName: String(item.fullName || item.reseller_name || "Reseller"),
            avatarUrl: item.avatarUrl || item.avatar_url,
            totalClicks: Number(item.totalClicks ?? item.total_clicks ?? 0),
            totalOrders: Number(item.totalOrders ?? item.total_orders ?? 0),
            conversionRate: Number(item.conversionRate ?? item.conversion_rate ?? 0),
            totalCommissionPaid: Number(item.totalCommissionPaid ?? item.total_commission_paid ?? 0),
            averageCommissionRate: Number(item.averageCommissionRate ?? item.commission_rate ?? 10),
            tier: item.tier,
          }));
          setResellers(mapped);
        }
      } catch (err) {
        console.error("[FETCH_TOP_RESELLERS_ERROR]", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchTopResellers();

    return () => {
      mounted = false;
    };
  }, [isOpen, merchantId, selectedMaxRate]);

  if (!isOpen) return null;

  const rateFilters = [
    { label: "Tất cả mức phí", value: null },
    { label: "Budget ≤ 10%", value: 10 },
    { label: "Budget ≤ 15%", value: 15 },
    { label: "Budget ≤ 20%", value: 20 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/20 text-amber-400 border border-amber-400/30">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Bảng Xếp Hạng Top Reseller
                <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                  Budget Matching
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Đối soát hiệu quả chuyển đổi và ngân sách hoa hồng để chọn đối tác phù hợp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50/70 overflow-x-auto text-xs">
          <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
          <span className="text-slate-500 font-medium shrink-0">Lọc theo ngân sách:</span>
          <div className="flex items-center gap-1.5 shrink-0">
            {rateFilters.map((f) => {
              const active = selectedMaxRate === f.value;
              return (
                <button
                  key={f.label}
                  onClick={() => setSelectedMaxRate(f.value)}
                  className={`rounded-full px-3 py-1 font-medium transition ${
                    active
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto p-6 space-y-3 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-xs font-medium">Đang đối soát dữ liệu Reseller theo ngân sách...</p>
            </div>
          ) : resellers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2 text-center">
              <Users className="h-10 w-10 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">Chưa có dữ liệu Reseller phù hợp</p>
              <p className="text-xs text-slate-400">
                Hãy thử chọn mức ngân sách hoa hồng cao hơn để tìm kiếm thêm đối tác.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {resellers.map((r) => {
                const isTop1 = r.rank === 1;
                const isTop2 = r.rank === 2;
                const isTop3 = r.rank === 3;

                return (
                  <div
                    key={r.resellerId}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 transition ${
                      isTop1
                        ? "border-amber-200 bg-amber-50/30 shadow-xs"
                        : isTop2
                        ? "border-slate-200 bg-slate-50/40"
                        : "border-slate-200/80 bg-white hover:bg-slate-50/50"
                    }`}
                  >
                    {/* Rank & Info */}
                    <div className="flex items-center gap-3.5 min-w-[200px]">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-xs ${
                          isTop1
                            ? "bg-amber-400 text-slate-950 shadow-xs"
                            : isTop2
                            ? "bg-slate-300 text-slate-900"
                            : isTop3
                            ? "bg-amber-700/20 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isTop1 ? <Sparkles className="h-4 w-4" /> : `#${r.rank}`}
                      </div>

                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 text-sm truncate">
                            {r.fullName}
                          </p>
                          {r.tier && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 uppercase">
                              {r.tier}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono truncate">
                          ID: {r.resellerId.slice(0, 8)}...
                        </p>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-4 gap-3 text-center sm:text-right flex-1 sm:max-w-md">
                      <div>
                        <p className="text-[10px] text-slate-400">Clicks</p>
                        <p className="font-bold text-slate-800 text-xs mt-0.5">
                          {r.totalClicks.toLocaleString("vi-VN")}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] text-slate-400">Đơn hàng</p>
                        <p className="font-bold text-slate-800 text-xs mt-0.5">
                          {r.totalOrders.toLocaleString("vi-VN")}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] text-slate-400">Chuyển đổi</p>
                        <p className="font-bold text-emerald-700 text-xs mt-0.5">
                          {r.conversionRate.toFixed(1)}%
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] text-slate-400">Phí hoa hồng</p>
                        <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800 text-xs mt-0.5">
                          {r.averageCommissionRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-3.5 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>Tổng số đối tác ghi nhận: <strong>{resellers.length}</strong></span>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

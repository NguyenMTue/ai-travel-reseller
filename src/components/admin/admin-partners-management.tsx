"use client";

import { useState } from "react";
import {
  Users,
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import type { AdminPartnerItem } from "@/src/lib/admin/admin-service";

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AdminPartnersManagement({
  initialPartners,
  preview = false,
}: {
  initialPartners: AdminPartnerItem[];
  preview?: boolean;
}) {
  const [partners, setPartners] = useState<AdminPartnerItem[]>(initialPartners);
  const [typeFilter, setTypeFilter] = useState<"all" | "merchant" | "reseller">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const filteredPartners = partners.filter((p) => {
    const matchesType = typeFilter === "all" || p.type === typeFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      (p.phone && p.phone.includes(q));

    return matchesType && matchesSearch;
  });

  async function handleToggleStatus(
    partnerId: string,
    partnerType: "merchant" | "reseller",
    currentStatus: string,
  ) {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";

    if (preview) {
      setPartners((prev) =>
        prev.map((p) => (p.id === partnerId ? { ...p, status: nextStatus } : p)),
      );
      setMessage(
        `Đã chuyển trạng thái đối tác thành ${nextStatus === "active" ? "Đang hoạt động" : "Tạm khóa"} (Demo Mode).`,
      );
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      setProcessingId(partnerId);
      const res = await fetch("/api/admin/partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partner_id: partnerId,
          partner_type: partnerType,
          status: nextStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPartners((prev) =>
          prev.map((p) => (p.id === partnerId ? { ...p, status: nextStatus } : p)),
        );
        setMessage(data.message || "Thao tác thành công.");
      } else {
        setMessage("Lỗi: " + (data.error || "Không thể cập nhật đối tác."));
      }
    } catch (err: any) {
      setMessage("Lỗi kết nối: " + (err?.message || err));
    } finally {
      setProcessingId(null);
      setTimeout(() => setMessage(null), 4000);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-400" />
            <span>Quản Lý Hệ Sinh Thái Đối Tác (Partners)</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Theo dõi danh sách Doanh nghiệp (Merchants) & Cộng tác viên (Resellers).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            Tổng cộng: <strong className="text-white">{partners.length}</strong> đối tác
          </span>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="underline hover:opacity-80">
            Đóng
          </button>
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTypeFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              typeFilter === "all"
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Tất cả ({partners.length})
          </button>
          <button
            onClick={() => setTypeFilter("merchant")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              typeFilter === "merchant"
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Doanh nghiệp ({partners.filter((p) => p.type === "merchant").length})</span>
          </button>
          <button
            onClick={() => setTypeFilter("reseller")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              typeFilter === "reseller"
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cộng tác viên ({partners.filter((p) => p.type === "reseller").length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên, email, SĐT đối tác..."
            className="pl-9 h-9 bg-slate-950 border-slate-800 text-xs text-slate-200"
          />
        </div>
      </div>

      {/* Partners Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Tên Đối Tác</th>
                <th className="py-3.5 px-4">Phân Loại</th>
                <th className="py-3.5 px-4">Thông tin liên hệ</th>
                <th className="py-3.5 px-4">Đơn hàng / Doanh số</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Quản trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Không tìm thấy đối tác nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredPartners.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{item.name}</div>
                      <div className="text-[10px] font-mono text-slate-500">{item.id.slice(0, 8)}...</div>
                    </td>

                    <td className="py-3.5 px-4">
                      {item.type === "merchant" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <Building2 className="w-3 h-3" /> Doanh nghiệp
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Users className="w-3 h-3" /> Cộng tác viên
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      <div>{item.email || "—"}</div>
                      {item.phone && <div className="text-slate-500 text-[11px]">{item.phone}</div>}
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      {item.totalOrders !== undefined ? (
                        <div>
                          <span className="font-semibold text-white">{item.totalOrders}</span> đơn hàng
                          {item.totalVolume !== undefined && (
                            <div className="text-emerald-400 font-mono text-[11px] mt-0.5">
                              {formatVND(item.totalVolume)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Đang hoạt động</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {item.status === "active" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Đang hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                          <Lock className="w-3 h-3" /> Tạm khóa
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={processingId === item.id}
                        onClick={() => handleToggleStatus(item.id, item.type, item.status)}
                        className={`text-xs h-7 px-2.5 ${
                          item.status === "active"
                            ? "border-red-900/40 text-red-400 hover:bg-red-950/40"
                            : "border-emerald-900/40 text-emerald-400 hover:bg-emerald-950/40"
                        }`}
                      >
                        {item.status === "active" ? (
                          <>
                            <Lock className="w-3 h-3 mr-1" /> Khóa tài khoản
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3 mr-1" /> Mở khóa
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

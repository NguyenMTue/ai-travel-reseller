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
  const [confirmSuspendPartner, setConfirmSuspendPartner] = useState<AdminPartnerItem | null>(null);
  const [suspendReason, setSuspendReason] = useState<string>("");

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

  async function executeToggleStatus(
    partnerId: string,
    partnerType: "merchant" | "reseller",
    nextStatus: "active" | "suspended",
    notes: string = ""
  ) {
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
      const res = await fetch("/api/admin/partners/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId,
          role: partnerType,
          status: nextStatus,
          notes,
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

  function handleActionClick(item: AdminPartnerItem) {
    if (item.status === "active") {
      setConfirmSuspendPartner(item);
      setSuspendReason("Tạm khóa theo yêu cầu kiểm soát gian lận hoặc vi phạm chính sách");
    } else {
      executeToggleStatus(item.id, item.type, "active", "Mở khóa kích hoạt lại đối tác");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="w-6 h-6 text-primary" />
            <span>Quản Lý Hệ Sinh Thái Đối Tác (Partners)</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi danh sách Doanh nghiệp (Merchants) & Cộng tác viên (Resellers).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-white border border-border shadow-xs text-xs text-muted-foreground">
            Tổng cộng: <strong className="text-foreground">{partners.length}</strong> đối tác
          </span>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center justify-between shadow-xs">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="underline hover:opacity-80">
            Đóng
          </button>
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-border shadow-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTypeFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all border ${
              typeFilter === "all"
                ? "bg-secondary text-primary font-semibold border-primary/20 shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border-transparent font-medium"
            }`}
          >
            Tất cả ({partners.length})
          </button>
          <button
            onClick={() => setTypeFilter("merchant")}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 border ${
              typeFilter === "merchant"
                ? "bg-secondary text-primary font-semibold border-primary/20 shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border-transparent font-medium"
            }`}
          >
            <Building2 className={`w-3.5 h-3.5 ${typeFilter === "merchant" ? "text-blue-700" : "text-blue-600"}`} />
            <span>Doanh nghiệp ({partners.filter((p) => p.type === "merchant").length})</span>
          </button>
          <button
            onClick={() => setTypeFilter("reseller")}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 border ${
              typeFilter === "reseller"
                ? "bg-secondary text-primary font-semibold border-primary/20 shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border-transparent font-medium"
            }`}
          >
            <Users className={`w-3.5 h-3.5 ${typeFilter === "reseller" ? "text-emerald-700" : "text-emerald-600"}`} />
            <span>Cộng tác viên ({partners.filter((p) => p.type === "reseller").length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên, email, SĐT đối tác..."
            className="pl-9 h-9 bg-muted/30 border-border text-xs text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Partners Table */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="bg-muted/70 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-3.5 px-4">Tên Đối Tác</th>
                <th className="py-3.5 px-4">Phân Loại</th>
                <th className="py-3.5 px-4">Thông tin liên hệ</th>
                <th className="py-3.5 px-4">Đơn hàng / Doanh số</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Quản trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    Không tìm thấy đối tác nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredPartners.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-foreground">{item.name}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">{item.id.slice(0, 8)}...</div>
                    </td>

                    <td className="py-3.5 px-4">
                      {item.type === "merchant" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Building2 className="w-3 h-3" /> Doanh nghiệp
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <Users className="w-3 h-3" /> Cộng tác viên
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-muted-foreground">
                      <div className="text-foreground">{item.email || "—"}</div>
                      {item.phone && <div className="text-muted-foreground text-[11px]">{item.phone}</div>}
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      {item.totalOrders !== undefined ? (
                        <div>
                          <span className="font-semibold text-foreground">{item.totalOrders}</span> đơn hàng
                          {item.totalVolume !== undefined && (
                            <div className="text-emerald-700 font-mono text-[11px] font-semibold mt-0.5">
                              {formatVND(item.totalVolume)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Đang hoạt động</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {item.status === "active" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Đang hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <Lock className="w-3 h-3" /> Tạm khóa
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={processingId === item.id}
                        onClick={() => handleActionClick(item)}
                        className={`text-xs h-7 px-2.5 ${
                          item.status === "active"
                            ? "border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
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

      {/* Confirmation Modal for Suspending Partner */}
      {confirmSuspendPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-border p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Xác nhận Khóa Tạm thời Đối tác</h3>
                <p className="text-xs text-muted-foreground">Tài khoản bị khóa sẽ không thể đăng nhập hoặc tạo link tiếp thị</p>
              </div>
            </div>

            <div className="p-3.5 bg-muted/40 rounded-xl text-xs space-y-1.5 border border-border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tên đối tác:</span>
                <span className="font-semibold text-foreground">{confirmSuspendPartner.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phân loại:</span>
                <span className="font-semibold text-foreground">
                  {confirmSuspendPartner.type === "merchant" ? "Doanh nghiệp (Merchant)" : "Cộng tác viên (Reseller)"}
                </span>
              </div>
              {confirmSuspendPartner.email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="text-foreground">{confirmSuspendPartner.email}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Lý do khóa tài khoản:
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Nhập lý do tạm đình chỉ hoạt động..."
                rows={3}
                className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 text-foreground"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmSuspendPartner(null)}
                className="text-xs"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const p = confirmSuspendPartner;
                  setConfirmSuspendPartner(null);
                  executeToggleStatus(p.id, p.type, "suspended", suspendReason);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Khóa tài khoản</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

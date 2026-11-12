"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  ArrowUpDown,
  Building,
  User,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import type { AdminPayoutItem } from "@/src/lib/admin/admin-service";

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AdminPayoutsManagement({
  initialPayouts,
  preview = false,
}: {
  initialPayouts: AdminPayoutItem[];
  preview?: boolean;
}) {
  const [items, setItems] = useState<AdminPayoutItem[]>(initialPayouts);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPayout, setSelectedPayout] = useState<AdminPayoutItem | null>(null);
  const [actionModal, setActionModal] = useState<"approve" | "reject" | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [transferRef, setTransferRef] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const filteredItems = items.filter((item) => {
    const matchesTab = activeTab === "all" || item.status === activeTab;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.resellerName.toLowerCase().includes(q) ||
      item.resellerEmail.toLowerCase().includes(q) ||
      item.accountNumber.toLowerCase().includes(q) ||
      item.bankName.toLowerCase().includes(q) ||
      item.accountName.toLowerCase().includes(q);

    return matchesTab && matchesSearch;
  });

  const pendingCount = items.filter((i) => i.status === "pending").length;

  function openAction(payout: AdminPayoutItem, action: "approve" | "reject") {
    setSelectedPayout(payout);
    setActionModal(action);
    setAdminNotes(
      action === "approve"
        ? `Đã chuyển khoản qua Internet Banking ${payout.bankName}.`
        : "Thông tin số tài khoản hoặc ngân hàng thụ hưởng không chính xác.",
    );
    setTransferRef(action === "approve" ? `FT${Date.now().toString().slice(-8)}` : "");
  }

  async function handleSubmitAction() {
    if (!selectedPayout || !actionModal) return;

    if (actionModal === "reject" && adminNotes.trim().length < 5) {
      setMessage({
        text: "Vui lòng nhập lý do từ chối chi tiết (tối thiểu 5 ký tự) để phản hồi cho đối tác.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);

    if (preview) {
      setItems((prev) =>
        prev.map((p) =>
          p.id === selectedPayout.id
            ? {
                ...p,
                status: actionModal === "approve" ? "completed" : "rejected",
                processedAt: new Date().toISOString(),
                adminNotes,
                transferReference: actionModal === "approve" ? transferRef : null,
              }
            : p,
        ),
      );
      setMessage({
        text:
          actionModal === "approve"
            ? `Đã duyệt thành công yêu cầu ${formatVND(selectedPayout.amount)} (Demo Mode).`
            : `Đã từ chối yêu cầu và hoàn số dư ví khả dụng cho Reseller (Demo Mode).`,
        type: "success",
      });
      setIsSubmitting(false);
      setActionModal(null);
      setSelectedPayout(null);
      return;
    }

    try {
      const res = await fetch("/api/admin/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payout_id: selectedPayout.id,
          action: actionModal,
          admin_notes: adminNotes.trim(),
          transfer_reference: actionModal === "approve" ? transferRef.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setItems((prev) =>
          prev.map((p) =>
            p.id === selectedPayout.id
              ? {
                  ...p,
                  status: actionModal === "approve" ? "completed" : "rejected",
                  processedAt: new Date().toISOString(),
                  adminNotes,
                  transferReference: actionModal === "approve" ? transferRef : null,
                }
              : p,
          ),
        );
        setMessage({ text: data.message || "Xử lý thành công.", type: "success" });
        setActionModal(null);
        setSelectedPayout(null);
      } else {
        setMessage({ text: data.error || "Không thể thực hiện thao tác.", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: "Lỗi kết nối: " + (err?.message || err), type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-emerald-400" />
            <span>Phê Duyệt & Quản Lý Rút Tiền Hoa Hồng</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Duyệt giải ngân hoa hồng và tự động hoàn trả số dư ví nếu từ chối yêu cầu.
          </p>
        </div>

        {/* Stats summary chip */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            Tổng cộng: <strong className="text-white">{items.length}</strong> yêu cầu
          </div>
          {pendingCount > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{pendingCount} chờ duyệt</span>
            </div>
          )}
        </div>
      </div>

      {/* Message feedback alert */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between animate-in fade-in ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="text-xs underline hover:opacity-80"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: "all", label: "Tất cả", count: items.length },
            { id: "pending", label: "Chờ xử lý", count: pendingCount },
            {
              id: "completed",
              label: "Đã chuyển khoản",
              count: items.filter((i) => i.status === "completed").length,
            },
            {
              id: "rejected",
              label: "Đã từ chối",
              count: items.filter((i) => i.status === "rejected").length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-slate-800 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id
                    ? "bg-slate-700 text-slate-200"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm đối tác, STK, ngân hàng..."
            className="pl-9 h-9 bg-slate-950 border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 rounded-xl focus:border-slate-700"
          />
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Đối tác (Reseller)</th>
                <th className="py-3.5 px-4">Số tiền rút</th>
                <th className="py-3.5 px-4">Tài khoản Ngân hàng</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4">Thời gian</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Không tìm thấy yêu cầu rút tiền nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Reseller info */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">
                        {item.resellerName}
                      </div>
                      <div className="text-xs text-slate-400">
                        {item.resellerEmail}
                      </div>
                      {item.resellerPhone && (
                        <div className="text-[11px] text-slate-500">
                          {item.resellerPhone}
                        </div>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-mono font-bold text-base text-rose-400">
                      {formatVND(item.amount)}
                    </td>

                    {/* Bank Details */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-blue-400" />
                        <span>{item.bankName}</span>
                      </div>
                      <div className="font-mono text-xs text-slate-300 mt-0.5">
                        STK: <strong className="text-white">{item.accountNumber}</strong>
                      </div>
                      <div className="text-[11px] text-slate-400 uppercase">
                        Tên: {item.accountName}
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="py-3.5 px-4">
                      {item.status === "pending" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                          <Clock className="w-3 h-3" /> Chờ xử lý
                        </span>
                      )}
                      {item.status === "processing" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400">
                          Đang xử lý
                        </span>
                      )}
                      {item.status === "completed" && (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" /> Đã chuyển khoản
                          </span>
                          {item.transferReference && (
                            <div className="text-[10px] font-mono text-slate-400">
                              Mã: {item.transferReference}
                            </div>
                          )}
                        </div>
                      )}
                      {item.status === "rejected" && (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400">
                            <XCircle className="w-3 h-3" /> Đã từ chối
                          </span>
                          {item.adminNotes && (
                            <div className="text-[10px] text-slate-400 truncate max-w-xs" title={item.adminNotes}>
                              {item.adminNotes}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Created date */}
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      <div>
                        {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(item.createdAt).toLocaleTimeString("vi-VN")}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      {item.status === "pending" || item.status === "processing" ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => openAction(item, "approve")}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-3"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Duyệt
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAction(item, "reject")}
                            className="border-red-900/40 text-red-400 hover:bg-red-950/40 text-xs h-8 px-2.5"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Từ chối
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Đã hoàn tất</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve / Reject Modal Dialog */}
      {actionModal && selectedPayout && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                {actionModal === "approve" ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Xác Nhận Đã Chuyển Khoản Rút Tiền</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span>Từ Chối Yêu Cầu Rút Tiền</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setActionModal(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            {/* Payout target summary */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Đối tác Reseller:</span>
                <strong className="text-white">{selectedPayout.resellerName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Số tiền giải ngân:</span>
                <strong className="text-rose-400 text-sm font-mono">
                  {formatVND(selectedPayout.amount)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ngân hàng thụ hưởng:</span>
                <span className="text-slate-200">
                  {selectedPayout.bankName} - {selectedPayout.accountNumber} ({selectedPayout.accountName})
                </span>
              </div>
            </div>

            {actionModal === "approve" ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Mã Giao Dịch Chuyển Khoản (Transfer Ref)
                  </label>
                  <Input
                    value={transferRef}
                    onChange={(e) => setTransferRef(e.target.value)}
                    placeholder="VD: FT2611129988221"
                    className="h-9 bg-slate-950 border-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Ghi Chú Kế Toán / Đối Soát
                  </label>
                  <Input
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Ghi chú đối soát nội bộ..."
                    className="h-9 bg-slate-950 border-slate-800 text-xs"
                  />
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Khi duyệt, hệ thống sẽ chuyển trạng thái sang <strong>Đã chuyển khoản</strong> và tự động trừ hoa hồng đã xác nhận tương ứng.
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Lý Do Từ Chối (Bắt buộc, gửi thông báo cho Reseller)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    placeholder="VD: Số tài khoản và tên chủ tài khoản không khớp nhau trên hệ thống ngân hàng..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-red-500/50"
                  />
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                  Khoản tiền {formatVND(selectedPayout.amount)} sẽ được tự động hoàn lại số dư khả dụng vào ví của Reseller để đối tác có thể cập nhật lại thông tin và yêu cầu rút lại.
                </div>
              </div>
            )}

            {/* Modal buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setActionModal(null)}
                className="border-slate-700 hover:bg-slate-800 text-xs"
              >
                Hủy bỏ
              </Button>
              <Button
                disabled={isSubmitting}
                onClick={handleSubmitAction}
                className={`text-xs text-white ${
                  actionModal === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-red-600 hover:bg-red-500"
                }`}
              >
                {isSubmitting
                  ? "Đang xử lý..."
                  : actionModal === "approve"
                    ? "Xác nhận duyệt chuyển tiền"
                    : "Xác nhận từ chối"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

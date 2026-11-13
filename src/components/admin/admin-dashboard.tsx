"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  CreditCard,
  ShieldAlert,
  Users,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Eye,
  Bot,
  Percent,
  Check,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import type {
  AdminSystemOverview,
  AdminPayoutItem,
  AdminFlaggedOrder,
} from "@/src/lib/admin/admin-service";

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AdminDashboard({
  overview,
  recentPayouts = [],
  flaggedOrders = [],
  preview = false,
}: {
  overview: AdminSystemOverview;
  recentPayouts?: AdminPayoutItem[];
  flaggedOrders?: AdminFlaggedOrder[];
  preview?: boolean;
}) {
  const root = preview ? "/preview/admin" : "/admin";
  const [payoutList, setPayoutList] = useState<AdminPayoutItem[]>(recentPayouts);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const pendingPayouts = payoutList.filter((p) => p.status === "pending");

  async function handleQuickAction(payoutId: string, action: "approve" | "reject") {
    if (preview) {
      setPayoutList((prev) =>
        prev.map((p) =>
          p.id === payoutId
            ? {
                ...p,
                status: action === "approve" ? "completed" : "rejected",
                processedAt: new Date().toISOString(),
                adminNotes: action === "approve" ? "Đã duyệt nhanh từ Dashboard." : "Đã từ chối từ Dashboard.",
              }
            : p,
        ),
      );
      setMessage(
        action === "approve"
          ? "Đã duyệt giải ngân thành công (Demo Mode)."
          : "Đã từ chối yêu cầu rút tiền (Demo Mode).",
      );
      setTimeout(() => setMessage(null), 4000);
      return;
    }

    try {
      setProcessingId(payoutId);
      const res = await fetch("/api/admin/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payout_id: payoutId,
          action,
          admin_notes:
            action === "approve"
              ? "Duyệt nhanh qua Admin Dashboard."
              : "Từ chối nhanh: Yêu cầu cung cấp lại thông tin đối soát.",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPayoutList((prev) =>
          prev.map((p) =>
            p.id === payoutId
              ? {
                  ...p,
                  status: action === "approve" ? "completed" : "rejected",
                  processedAt: new Date().toISOString(),
                }
              : p,
          ),
        );
        setMessage(data.message || "Xử lý thành công.");
      } else {
        setMessage("Lỗi: " + (data.error || "Không thể xử lý."));
      }
    } catch (err: any) {
      setMessage("Lỗi kết nối: " + (err?.message || err));
    } finally {
      setProcessingId(null);
      setTimeout(() => setMessage(null), 5000);
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Banner Alert Message */}
      {message && (
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 flex items-center justify-between animate-in fade-in">
          <span>{message}</span>
          <button
            onClick={() => setMessage(null)}
            className="text-xs underline text-blue-400 hover:text-blue-200"
          >
            Đóng
          </button>
        </div>
      )}

      {/* KPI Financial Cards */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span>Chỉ Số Tài Chính & Doanh Thu Toàn Sàn</span>
          </h2>
          <span className="text-xs text-muted-foreground">
            Cập nhật: {new Date(overview.generated_at || Date.now()).toLocaleTimeString("vi-VN")}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* GMV */}
          <div className="bg-white border border-border rounded-2xl p-5 shadow-xs hover:border-primary/40 hover:shadow-sm transition-all">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tổng Doanh Số GMV
            </span>
            <div className="text-2xl font-black text-foreground mt-2">
              {formatVND(overview.financials.total_gmv)}
            </div>
            <div className="mt-2 text-xs text-emerald-700 flex items-center gap-1 font-medium">
              <span>{overview.operational_counts.confirmed_orders} đơn thành công</span>
            </div>
          </div>

          {/* Commissions Paid */}
          <div className="bg-white border border-border rounded-2xl p-5 shadow-xs hover:border-primary/40 hover:shadow-sm transition-all">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Hoa Hồng Đã Chi Trả
            </span>
            <div className="text-2xl font-black text-emerald-700 mt-2">
              {formatVND(overview.financials.commissions_paid)}
            </div>
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Đã tất toán chuyển khoản</span>
            </div>
          </div>

          {/* Confirmed Balance */}
          <div className="bg-white border border-border rounded-2xl p-5 shadow-xs hover:border-primary/40 hover:shadow-sm transition-all">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Hoa Hồng Khả Dụng Ví
            </span>
            <div className="text-2xl font-black text-amber-700 mt-2">
              {formatVND(overview.financials.commissions_confirmed)}
            </div>
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-amber-600" />
              <span>Reseller có thể yêu cầu rút</span>
            </div>
          </div>

          {/* Pending Payouts */}
          <div className="bg-white border border-border rounded-2xl p-5 shadow-xs hover:border-primary/40 hover:shadow-sm transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Yêu Cầu Rút Chờ Duyệt
              </span>
              {overview.operational_counts.pending_payouts_count > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold animate-pulse border border-rose-200">
                  {overview.operational_counts.pending_payouts_count} chờ
                </span>
              )}
            </div>
            <div className="text-2xl font-black text-rose-700 mt-2">
              {formatVND(overview.financials.pending_payouts_amount)}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              <Link href={`${root}/payouts`} className="text-primary hover:underline font-medium flex items-center gap-1">
                Xem danh sách duyệt <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Risk Center */}
      <section>
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
          <span>Trung Tâm Cảnh Báo An Ninh & Rủi Ro Gian Lận</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Alert 1 */}
          <div className="bg-white border border-border rounded-2xl p-5 flex items-start gap-4 shadow-xs">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Yêu Cầu Rút Tiền Đang Khóa</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overview.security_alerts.action_required_payouts} khoản rút tiền đang giữ chỗ (chống Double-spend).
              </p>
              <Button asChild size="sm" variant="outline" className="mt-3 text-xs border-border hover:bg-muted text-foreground">
                <Link href={`${root}/payouts`}>Vào duyệt ngay</Link>
              </Button>
            </div>
          </div>

          {/* Alert 2 */}
          <div className="bg-white border border-border rounded-2xl p-5 flex items-start gap-4 shadow-xs">
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Đơn Cắm Cờ Tự Mua (Anti-Fraud)</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overview.security_alerts.flagged_self_purchase_orders} đơn hàng bị nghi vấn Reseller tự mua qua link của mình.
              </p>
              <Button asChild size="sm" variant="outline" className="mt-3 text-xs border-border hover:bg-muted text-foreground">
                <Link href={`${root}/fraud`}>Kiểm tra đơn hàng</Link>
              </Button>
            </div>
          </div>

          {/* Alert 3 */}
          <div className="bg-white border border-border rounded-2xl p-5 flex items-start gap-4 shadow-xs">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Traffic Bot Spam Bị Chặn</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overview.security_alerts.bot_clicks_detected} lượt click bot bị phát hiện và cách ly khỏi tính thưởng.
              </p>
              <Button asChild size="sm" variant="outline" className="mt-3 text-xs border-border hover:bg-muted text-foreground">
                <Link href={`${root}/fraud`}>Xem nhật ký bot</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Operational Counts Grid */}
      <section>
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <span>Hệ Sinh Thái Đối Tác & Tài Nguyên</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-white border border-border rounded-xl p-4 text-center shadow-xs">
            <span className="text-xs text-muted-foreground">Doanh nghiệp</span>
            <div className="text-xl font-bold text-foreground mt-1">
              {overview.operational_counts.merchants_count}
            </div>
          </div>
          <div className="bg-white border border-border rounded-xl p-4 text-center shadow-xs">
            <span className="text-xs text-muted-foreground">Cộng tác viên</span>
            <div className="text-xl font-bold text-foreground mt-1">
              {overview.operational_counts.resellers_count}
            </div>
          </div>
          <div className="bg-white border border-border rounded-xl p-4 text-center shadow-xs">
            <span className="text-xs text-muted-foreground">Sản phẩm / Tour</span>
            <div className="text-xl font-bold text-foreground mt-1">
              {overview.operational_counts.products_count}
            </div>
          </div>
          <div className="bg-white border border-border rounded-xl p-4 text-center shadow-xs">
            <span className="text-xs text-muted-foreground">Chiến dịch</span>
            <div className="text-xl font-bold text-foreground mt-1">
              {overview.operational_counts.campaigns_count}
            </div>
          </div>
          <div className="bg-white border border-border rounded-xl p-4 text-center shadow-xs">
            <span className="text-xs text-muted-foreground">Tổng Đơn hàng</span>
            <div className="text-xl font-bold text-foreground mt-1">
              {overview.operational_counts.total_orders}
            </div>
          </div>
          <div className="bg-white border border-border rounded-xl p-4 text-center shadow-xs">
            <span className="text-xs text-muted-foreground">Lượt Click</span>
            <div className="text-xl font-bold text-foreground mt-1">
              {overview.operational_counts.total_clicks.toLocaleString("vi-VN")}
            </div>
          </div>
        </div>
      </section>

      {/* Two Columns: Quick Payout Approvals & Flagged Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Payouts */}
        <section className="bg-white border border-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span>Yêu Cầu Rút Tiền Cần Xử Lý Nhanh</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Các khoản hoa hồng đã được hệ thống khóa an toàn.
              </p>
            </div>
            <Link
              href={`${root}/payouts`}
              className="text-xs text-primary hover:underline font-semibold"
            >
              Xem tất cả ({payoutList.length})
            </Link>
          </div>

          {pendingPayouts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-60" />
              <span>Tuyệt vời! Không có yêu cầu rút tiền nào đang chờ duyệt.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPayouts.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        {item.resellerName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({item.resellerEmail})
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.bankName} • {item.accountNumber} •{" "}
                      <span className="font-mono text-foreground font-medium">{item.accountName}</span>
                    </div>
                    <div className="text-base font-bold text-rose-700 mt-1">
                      {formatVND(item.amount)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      disabled={processingId === item.id}
                      onClick={() => handleQuickAction(item.id, "approve")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Duyệt chuyển
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={processingId === item.id}
                      onClick={() => handleQuickAction(item.id, "reject")}
                      className="border-rose-200 text-rose-700 hover:bg-rose-50 text-xs h-8 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Từ chối
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Flagged Orders */}
        <section className="bg-white border border-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Đơn Hàng Bị Cắm Cờ Tự Mua (Anti-Fraud)</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hoa hồng của các đơn này đang được giữ chờ xác minh.
              </p>
            </div>
            <Link
              href={`${root}/fraud`}
              className="text-xs text-primary hover:underline font-semibold"
            >
              Xem chi tiết
            </Link>
          </div>

          {flaggedOrders.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-60" />
              <span>Chưa phát hiện hành vi tự mua hàng trục lợi hoa hồng.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {flaggedOrders.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">
                        {item.bookingReference}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                        Cắm cờ tự mua
                      </span>
                    </div>
                    <div className="text-xs text-foreground mt-1">
                      {item.customerName || "Khách hàng"} • Reseller:{" "}
                      <span className="text-foreground font-semibold">
                        {item.resellerName}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Đối tác: {item.merchantName}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-foreground">
                      {formatVND(item.amount)}
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

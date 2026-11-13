"use client";

import { useState } from "react";
import {
  ShieldAlert,
  Bot,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Globe,
  Smartphone,
  Eye,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import type {
  AdminFlaggedOrder,
  AdminBotClick,
} from "@/src/lib/admin/admin-service";

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AdminFraudManagement({
  initialFlaggedOrders,
  initialBotClicks,
  preview = false,
}: {
  initialFlaggedOrders: AdminFlaggedOrder[];
  initialBotClicks: AdminBotClick[];
  preview?: boolean;
}) {
  const [tab, setTab] = useState<"orders" | "clicks">("orders");
  const [orders, setOrders] = useState<AdminFlaggedOrder[]>(initialFlaggedOrders);
  const [clicks] = useState<AdminBotClick[]>(initialBotClicks);
  const [unflaggedId, setUnflaggedId] = useState<string | null>(null);

  function handleDismissFlag(orderId: string) {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    setUnflaggedId(orderId);
    setTimeout(() => setUnflaggedId(null), 3000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <ShieldAlert className="w-6 h-6 text-rose-600" />
          <span>Giám Sát Rủi Ro & Chống Gian Lận (Anti-Fraud)</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Theo dõi các hành vi tự mua hàng trục lợi hoa hồng và traffic bot spam bất thường.
        </p>
      </div>

      {unflaggedId && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Đã gỡ cờ cảnh báo cho đơn hàng. Hoa hồng được giải phóng cho đối tác.</span>
        </div>
      )}

      {/* Metric summary boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-border rounded-2xl p-5 flex items-center gap-4 shadow-xs">
          <div className="p-3.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Đơn hàng tự mua bị cắm cờ
            </span>
            <div className="text-2xl font-bold text-foreground mt-0.5">
              {orders.length} đơn
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Phát hiện tên khách, email hoặc IP trùng khớp thông tin Reseller.
            </p>
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-5 flex items-center gap-4 shadow-xs">
          <div className="p-3.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Lượt click Bot nghi vấn bị cách ly
            </span>
            <div className="text-2xl font-bold text-foreground mt-0.5">
              {clicks.length} lượt
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Hệ thống Anti-Bot gắn cờ tự động, không tính hoa hồng ảo.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setTab("orders")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            tab === "orders"
              ? "bg-primary text-white shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <AlertTriangle className={`w-4 h-4 ${tab === "orders" ? "text-amber-200" : "text-rose-500"}`} />
          <span>Đơn Hàng Tự Mua ({orders.length})</span>
        </button>
        <button
          onClick={() => setTab("clicks")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            tab === "clicks"
              ? "bg-primary text-white shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <Bot className={`w-4 h-4 ${tab === "clicks" ? "text-purple-200" : "text-purple-600"}`} />
          <span>Traffic Click Bot ({clicks.length})</span>
        </button>
      </div>

      {/* Tab 1: Orders Table */}
      {tab === "orders" && (
        <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="bg-muted/70 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-3.5 px-4">Mã Đặt Chỗ (Booking Ref)</th>
                  <th className="py-3.5 px-4">Khách hàng</th>
                  <th className="py-3.5 px-4">Cộng tác viên (Reseller)</th>
                  <th className="py-3.5 px-4">Doanh nghiệp (Merchant)</th>
                  <th className="py-3.5 px-4">Giá trị đơn</th>
                  <th className="py-3.5 px-4">Trạng thái an ninh</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      Tuyệt vời! Không có đơn hàng nào bị cắm cờ tự mua gian lận.
                    </td>
                  </tr>
                ) : (
                  orders.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-700 text-xs">
                        {item.bookingReference}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-foreground">{item.customerName || "Khách ẩn danh"}</div>
                        <div className="text-[11px] text-rose-600 font-medium">Trùng danh tính Reseller</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground">{item.resellerName}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{item.resellerId.slice(0, 8)}...</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {item.merchantName}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground font-mono">
                        {formatVND(item.amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-700">
                          <Lock className="w-3 h-3" /> Giữ hoa hồng
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDismissFlag(item.id)}
                          className="border-border hover:bg-muted text-xs h-7 text-foreground"
                        >
                          Gỡ cờ
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Bot Clicks Table */}
      {tab === "clicks" && (
        <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="bg-muted/70 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-3.5 px-4">Địa chỉ IP</th>
                  <th className="py-3.5 px-4">User-Agent / Signature</th>
                  <th className="py-3.5 px-4">Điểm Rủi Ro Bot</th>
                  <th className="py-3.5 px-4">Quốc gia</th>
                  <th className="py-3.5 px-4">Thời gian</th>
                  <th className="py-3.5 px-4 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clicks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      Không phát hiện traffic bot click nghi vấn gần đây.
                    </td>
                  </tr>
                ) : (
                  clicks.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-purple-700">
                        {item.ipAddress || "N/A"}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-muted-foreground max-w-xs truncate" title={item.userAgent || ""}>
                        {item.userAgent || "Unknown Client"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-xs text-rose-600">
                          {typeof item.botScore === "number" ? `${(item.botScore * 100).toFixed(0)}%` : "100%"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-blue-600" />
                          <span>{item.country || "Quốc tế"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString("vi-VN")}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          Bị chặn ghi nhận
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

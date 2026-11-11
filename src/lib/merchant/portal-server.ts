import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/src/lib/supabase/server";
import { hasSupabaseConfig } from "@/src/lib/supabase/config";
import { loadPortalAccess, type PortalAccess } from "@/src/lib/portal-access";
import { createPortalAccessSource } from "@/src/lib/portal-access-source";

export interface MerchantDashboardMetric {
  label: string;
  value: string;
  unit: string;
  detail: string;
}

export interface MerchantProductRecord {
  id: string;
  name: string;
  category: string;
  status: string;
  tone: string;
  detail: string;
  salePrice: number | null;
  originalPrice: number | null;
}

export const getMerchantPortalAccess = cache(async (): Promise<PortalAccess> => {
  if (!hasSupabaseConfig) return { status: "unavailable", reason: "configuration" };
  return loadPortalAccess(createPortalAccessSource(createClient(await cookies())), "merchant");
});

export const getMerchantDashboardMetrics = cache(
  async (merchantId: string): Promise<MerchantDashboardMetric[]> => {
    if (!hasSupabaseConfig || !merchantId) {
      return [
        { label: "Tổng GMV", value: "0", unit: "VND", detail: "Giá trị đặt dịch vụ" },
        { label: "Lượt đặt dịch vụ", value: "0", unit: "lượt", detail: "Đơn hàng đã thanh toán" },
        { label: "Lượt nhấp", value: "0", unit: "lượt", detail: "Qua liên kết cộng tác viên" },
        { label: "Tổng hoa hồng", value: "0", unit: "VND", detail: "Hoa hồng ghi nhận" },
      ];
    }

    try {
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);

      // 1. Query orders của merchant để tính GMV & Đơn hàng đã thanh toán
      const { data: orders, error: ordersErr } = await supabase
        .from("orders")
        .select("id, amount, status")
        .eq("merchant_id", merchantId);

      if (ordersErr) {
        console.warn("[MerchantPortal] Lỗi truy vấn orders:", ordersErr.message);
      }

      const paidOrders = (orders || []).filter(
        (o) => o.status === "paid" || o.status === "confirmed"
      );
      const totalGmv = paidOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
      const totalPaidOrdersCount = paidOrders.length;

      // 2. Query campaigns và affiliate_links để tính tổng lượt clicks
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("id")
        .eq("merchant_id", merchantId);

      let totalClicks = 0;
      const campaignIds = (campaigns || []).map((c) => c.id);

      if (campaignIds.length > 0) {
        const { data: links } = await supabase
          .from("affiliate_links")
          .select("clicks_count")
          .in("campaign_id", campaignIds);

        totalClicks = (links || []).reduce(
          (sum, l) => sum + (Number(l.clicks_count) || 0),
          0
        );
      }

      // 3. Query commissions để tính tổng hoa hồng phát sinh
      const { data: commissions, error: comErr } = await supabase
        .from("commissions")
        .select("gross_amount, net_amount, status")
        .eq("merchant_id", merchantId);

      if (comErr) {
        console.warn("[MerchantPortal] Lỗi truy vấn commissions:", comErr.message);
      }

      const totalCommissions = (commissions || [])
        .filter((c) => c.status !== "cancelled" && c.status !== "refunded")
        .reduce((sum, c) => sum + (Number(c.gross_amount) || 0), 0);

      // Định dạng tiền tệ VND súc tích
      const formatCurrencyMetric = (amount: number) => {
        if (amount >= 1_000_000) {
          const inMillions = amount / 1_000_000;
          return `${inMillions.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} triệu`;
        }
        return new Intl.NumberFormat("vi-VN").format(amount);
      };

      return [
        {
          label: "Tổng GMV",
          value: formatCurrencyMetric(totalGmv),
          unit: "VND",
          detail: "Giá trị đặt dịch vụ",
        },
        {
          label: "Lượt đặt dịch vụ",
          value: new Intl.NumberFormat("vi-VN").format(totalPaidOrdersCount),
          unit: "lượt",
          detail: "Đơn hàng đã thanh toán",
        },
        {
          label: "Lượt nhấp",
          value: new Intl.NumberFormat("vi-VN").format(totalClicks),
          unit: "lượt",
          detail: "Qua liên kết cộng tác viên",
        },
        {
          label: "Tổng hoa hồng",
          value: formatCurrencyMetric(totalCommissions),
          unit: "VND",
          detail: "Hoa hồng ghi nhận",
        },
      ];
    } catch (err) {
      console.error("[MerchantPortal] Lỗi tính toán metrics:", err);
      return [
        { label: "Tổng GMV", value: "0", unit: "VND", detail: "Giá trị đặt dịch vụ" },
        { label: "Lượt đặt dịch vụ", value: "0", unit: "lượt", detail: "Đơn hàng đã thanh toán" },
        { label: "Lượt nhấp", value: "0", unit: "lượt", detail: "Qua liên kết cộng tác viên" },
        { label: "Tổng hoa hồng", value: "0", unit: "VND", detail: "Hoa hồng ghi nhận" },
      ];
    }
  }
);

export const getMerchantProducts = cache(
  async (merchantId: string): Promise<MerchantProductRecord[]> => {
    if (!hasSupabaseConfig || !merchantId) return [];

    try {
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);

      const { data: products, error } = await supabase
        .from("products")
        .select("id, name, category, original_price, sale_price, commission_rate, status, description")
        .eq("merchant_id", merchantId)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("[MerchantPortal] Lỗi lấy danh sách sản phẩm:", error.message);
        return [];
      }

      const tones = ["sea", "sand", "leaf"];

      return (products || []).map((p, index) => ({
        id: p.id,
        name: p.name,
        category: p.category || "Trải nghiệm",
        status: p.status === "active" ? "Đang hoạt động" : (p.status || "Bản nháp"),
        tone: tones[index % tones.length],
        detail: p.description || "Thông tin sản phẩm chính thức của doanh nghiệp.",
        salePrice: p.sale_price != null ? Number(p.sale_price) : null,
        originalPrice: p.original_price != null ? Number(p.original_price) : null,
      }));
    } catch (err) {
      console.error("[MerchantPortal] Lỗi fetch products:", err);
      return [];
    }
  }
);

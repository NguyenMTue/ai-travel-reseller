import type { WalletRequest, WalletSessionObserver, WalletSummary } from "../../src/lib/reseller/wallet.ts";
export const walletFixtureOwner = "22222222-2222-2222-2222-111111111111";
export type WalletScenario = "ready" | "zero" | "empty-history" | "error" | "malformed" | "session" | "forbidden" | "slow" | "long";
export function walletFixtureData(owner = walletFixtureOwner): WalletSummary {
  return {
    reseller_id: owner,
    balances: { available_balance: 1269000, pending_balance: 216000, paid_balance: 3000000,
      refunded_balance: 54000, lifetime_earnings: 4269000, currency: "VND" },
    order_metrics: { total_orders: 24, confirmed_orders: 18, pending_orders: 3, total_gmv: 28450000, flagged_self_purchase_orders: 1 },
    recent_commissions: ["pending", "confirmed", "paid", "refunded", "cancelled"].map((status, i) => ({
      id: `fixture-commission-${i}`, order_id: `fixture-order-${i}`, booking_reference: `MO-***-00${i}`,
      campaign_id: "44444444-4444-4444-4444-111111111111", campaign_name: ["Một chiều bên phố Hội", "Khám phá miền di sản", "Hành trình ven biển", "Ngày xanh bên vịnh", "Chuyến đi cuối tuần"][i],
      gross_amount: 270000, platform_fee: 54000, net_amount: 216000, status, order_amount: 1800000,
      customer_name: "K***h", flag_self_purchase: false, created_at: `2026-10-${21-i}T16:30:00+00:00`,
    })),
    last_updated: "2026-10-21T03:30:00",
  };
}
export function walletFixtureRequest(scenario: WalletScenario, onRequest: () => void): WalletRequest {
  return async owner => {
    onRequest();
    // The slow fixture intentionally ignores abort, to exercise late-response protection.
    await new Promise(resolve => setTimeout(resolve, scenario === "slow" ? 2400 : 350));
    if (scenario === "error") return {status: "error", reason: "service"};
    if (scenario === "malformed") return {status: "error", reason: "schema"};
    if (scenario === "session" || scenario === "forbidden") return {status: scenario};
    const data = walletFixtureData(owner);
    if (owner !== walletFixtureOwner) {
      data.balances.available_balance = 216000;
      data.balances.lifetime_earnings = 3216000;
      data.recent_commissions[0].campaign_name = "Dữ liệu mô phỏng tài khoản B";
    }
    if (scenario === "zero") {
      data.balances = {currency:"VND", available_balance:0, pending_balance:0, paid_balance:0, refunded_balance:0, lifetime_earnings:0};
      data.order_metrics = {total_orders:0, confirmed_orders:0, pending_orders:0, total_gmv:0, flagged_self_purchase_orders:0};
      data.recent_commissions = [];
    }
    if (scenario === "empty-history") data.recent_commissions = [];
    if (scenario === "long") {
      data.balances.lifetime_earnings = Number.MAX_SAFE_INTEGER;
      data.recent_commissions[0].campaign_name = "Hành trình qua những miền di sản Việt Nam — ".repeat(10) + "chuỗidàikhôngcókhoảngtrắng".repeat(8);
      data.recent_commissions[0].booking_reference = "MA-DAT-CHO-DAI-".repeat(12);
      data.recent_commissions[1].booking_reference = "";
      data.recent_commissions[1].created_at = "";
      data.recent_commissions[2].status = "future-status";
    }
    return {status:"ready", data};
  };
}
export function walletFixtureSession(owner: string): WalletSessionObserver {
  return listener => { let alive = true; queueMicrotask(() => { if (alive) listener("INITIAL_SESSION", owner, `fixture-session-${owner}`); }); return () => {alive = false;}; };
}

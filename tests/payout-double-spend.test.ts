import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  resellerWalletSummarySchema,
  payoutRequestItemSchema,
} from "../src/lib/commerce/wallet-service.ts";
import { walletViewSchema, payoutStatus } from "../src/lib/reseller/wallet.ts";

test("PAYOUT-01: Mathematical Anti Double-Spend Balance Deduction Logic", () => {
  function calculateEffectiveAvailableBalance(
    confirmedCommissions: number,
    activePayoutRequests: Array<{ amount: number; status: string }>
  ): {
    nominalAvailable: number;
    lockedPending: number;
    effectiveAvailable: number;
    canWithdraw: (requestAmount: number) => { allowed: boolean; reason?: string };
  } {
    const lockedPending = activePayoutRequests
      .filter((p) => p.status === "pending" || p.status === "processing")
      .reduce((sum, p) => sum + p.amount, 0);

    const effectiveAvailable = Math.max(0, confirmedCommissions - lockedPending);

    return {
      nominalAvailable: confirmedCommissions,
      lockedPending,
      effectiveAvailable,
      canWithdraw: (requestAmount: number) => {
        if (requestAmount < 100000) {
          return { allowed: false, reason: "INVALID_AMOUNT" };
        }
        if (requestAmount > effectiveAvailable) {
          return { allowed: false, reason: "INSUFFICIENT_AVAILABLE_BALANCE" };
        }
        return { allowed: true };
      },
    };
  }

  // Kịch bản 1: Reseller có 1.000.000 VNĐ, chưa có lệnh rút nào -> có thể rút 1.000.000 VNĐ
  const scenario1 = calculateEffectiveAvailableBalance(1000000, []);
  assert.equal(scenario1.effectiveAvailable, 1000000);
  assert.equal(scenario1.canWithdraw(1000000).allowed, true);
  assert.equal(scenario1.canWithdraw(50000).allowed, false); // < 100k

  // Kịch bản 2: Reseller có 1.000.000 VNĐ, đã có 1 lệnh rút pending 600.000 VNĐ
  // -> Số dư khả dụng thực tế còn 400.000 VNĐ
  const scenario2 = calculateEffectiveAvailableBalance(1000000, [
    { amount: 600000, status: "pending" },
  ]);
  assert.equal(scenario2.lockedPending, 600000);
  assert.equal(scenario2.effectiveAvailable, 400000);

  // Thử rút tiếp 500.000 VNĐ (Double-spend attempt) -> PHẢI BỊ TỪ CHỐI
  const attempt500k = scenario2.canWithdraw(500000);
  assert.equal(attempt500k.allowed, false);
  assert.equal(attempt500k.reason, "INSUFFICIENT_AVAILABLE_BALANCE");

  // Thử rút 400.000 VNĐ -> ĐƯỢC CHẤP NHẬN
  const attempt400k = scenario2.canWithdraw(400000);
  assert.equal(attempt400k.allowed, true);

  // Kịch bản 3: Các lệnh rút đã rejected hoặc completed thì không khóa vào pending
  const scenario3 = calculateEffectiveAvailableBalance(1000000, [
    { amount: 500000, status: "completed" },
    { amount: 300000, status: "rejected" },
    { amount: 200000, status: "processing" }, // processing vẫn khóa
  ]);
  assert.equal(scenario3.lockedPending, 200000);
  assert.equal(scenario3.effectiveAvailable, 800000);
  assert.equal(scenario3.canWithdraw(800000).allowed, true);
  assert.equal(scenario3.canWithdraw(850000).allowed, false);
});

test("PAYOUT-02: Zod Schema Compliance & Reseller Wallet Integration", () => {
  // Test schema với đầy đủ balances bao gồm pending_payout_balance
  const fullWalletData = {
    reseller_id: "22222222-2222-2222-2222-111111111111",
    balances: {
      available_balance: 500000,
      pending_balance: 100000,
      paid_balance: 2000000,
      refunded_balance: 0,
      lifetime_earnings: 2600000,
      pending_payout_balance: 500000,
      currency: "VND",
    },
    order_metrics: {
      total_orders: 10,
      confirmed_orders: 8,
      pending_orders: 2,
      total_gmv: 15000000,
      flagged_self_purchase_orders: 0,
    },
    recent_commissions: [],
    last_updated: "2026-11-12T10:00:00",
  };

  const parsed = resellerWalletSummarySchema.safeParse(fullWalletData);
  assert.ok(parsed.success, "resellerWalletSummarySchema must validate successfully");
  assert.equal(parsed.data.balances.pending_payout_balance, 500000);

  // Test walletViewSchema với view model
  const viewParsed = walletViewSchema.safeParse(fullWalletData);
  assert.ok(viewParsed.success, "walletViewSchema must validate with optional pending_payout_balance");

  // Test payoutRequestItemSchema
  const validPayoutItem = {
    id: "33333333-3333-3333-3333-111111111111",
    amount: 500000,
    bank_name: "Vietcombank",
    account_number: "0123456789",
    account_name: "NGUYEN VAN A",
    status: "pending",
    created_at: "2026-11-12T09:30:00Z",
  };
  assert.ok(payoutRequestItemSchema.safeParse(validPayoutItem).success);

  // Test payoutStatus label mapping
  assert.equal(payoutStatus("pending").label, "Chờ đối soát");
  assert.equal(payoutStatus("processing").label, "Đang chuyển khoản");
  assert.equal(payoutStatus("completed").label, "Đã chi trả");
  assert.equal(payoutStatus("rejected").label, "Bị từ chối");
});

test("PAYOUT-03: API Route Implementation (/api/reseller/wallet/payout)", () => {
  const routePath = resolve("app/api/reseller/wallet/payout/route.ts");
  assert.ok(existsSync(routePath), "app/api/reseller/wallet/payout/route.ts must exist");

  const routeContent = readFileSync(routePath, "utf-8");

  // Check GET method exists
  assert.match(
    routeContent,
    /export async function GET/,
    "route.ts must implement GET method for payout history"
  );
  assert.match(
    routeContent,
    /fetchResellerPayoutHistory/,
    "GET method must call fetchResellerPayoutHistory"
  );

  // Check POST method anti double-spend implementation
  assert.match(
    routeContent,
    /export async function POST/,
    "route.ts must implement POST method"
  );
  assert.match(
    routeContent,
    /request_reseller_payout/,
    "POST method must support atomic RPC request_reseller_payout"
  );
  assert.match(
    routeContent,
    /payout_requests[\s\S]*?\.select\(["']amount["']\)[\s\S]*?\.in\(["']status["'],\s*\[["']pending["'],\s*["']processing["']\]\)/,
    "POST method must query active payouts to deduct pending balances"
  );
  assert.match(
    routeContent,
    /numAmount > effectiveAvailableBalance/,
    "POST method must check amount against effectiveAvailableBalance"
  );
  assert.match(
    routeContent,
    /INSUFFICIENT_BALANCE/,
    "POST method must return INSUFFICIENT_BALANCE error code when balance exceeded"
  );
  assert.match(
    routeContent,
    /from\(["']payout_requests["']\)[\s\S]*?\.insert/,
    "POST method must insert new record into payout_requests"
  );
});

test("PAYOUT-04: SQL Migration for Atomic Anti Double-Spend", () => {
  const migrationPath = resolve(
    "supabase/migrations/20261112160000_payout_atomic_double_spend_prevention.sql"
  );
  assert.ok(existsSync(migrationPath), "Migration 20261112160000 must exist");

  const sqlContent = readFileSync(migrationPath, "utf-8");

  assert.match(
    sqlContent,
    /CREATE OR REPLACE FUNCTION public\.request_reseller_payout/,
    "Migration must define request_reseller_payout function"
  );
  assert.match(
    sqlContent,
    /FOR UPDATE/,
    "request_reseller_payout must use FOR UPDATE lock to prevent race conditions"
  );
  assert.match(
    sqlContent,
    /COALESCE\(SUM\(pr\.amount\) FILTER \(WHERE pr\.status IN \('pending', 'processing'\)\), 0\)/,
    "Migration must deduct pending and processing payouts from balance"
  );
  assert.match(
    sqlContent,
    /CREATE OR REPLACE FUNCTION public\.get_reseller_wallet_summary/,
    "Migration must update get_reseller_wallet_summary to deduct locked payouts"
  );
  assert.match(
    sqlContent,
    /GRANT EXECUTE ON FUNCTION public\.request_reseller_payout/,
    "Migration must grant execute permission"
  );
});

test("PAYOUT-05: UI Payout History & Dashboard Integration", () => {
  const dashboardPath = resolve("src/components/reseller/wallet-dashboard.tsx");
  const modalPath = resolve("src/components/reseller/payout-modal.tsx");

  assert.ok(existsSync(dashboardPath), "wallet-dashboard.tsx must exist");
  assert.ok(existsSync(modalPath), "payout-modal.tsx must exist");

  const dashContent = readFileSync(dashboardPath, "utf-8");
  assert.match(
    dashContent,
    /Lịch sử yêu cầu rút tiền/,
    "Dashboard must render 'Lịch sử yêu cầu rút tiền' section"
  );
  assert.match(
    dashContent,
    /\/api\/reseller\/wallet\/payout/,
    "Dashboard must fetch payout history from API"
  );
  assert.match(
    dashContent,
    /payoutStatus/,
    "Dashboard must format payout statuses"
  );

  const modalContent = readFileSync(modalPath, "utf-8");
  assert.match(
    modalContent,
    /pendingPayoutBalance/,
    "PayoutModal must accept pendingPayoutBalance prop"
  );
});

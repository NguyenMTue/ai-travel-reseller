import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

console.log("===============================================================================");
console.log("🧪 BE1 FINAL SPRINT TEST SUITE: 4/4 TASKS VERIFICATION");
console.log("Date: 11/11/2026 | Author: Nguyen Minh Tue (BE1 Lead & PM)");
console.log("===============================================================================\n");

test("BE1-04: Non-blocking Async Click tracking with after() in app/r/[code]/route.ts", async () => {
  const routePath = resolve("app/r/[code]/route.ts");
  assert.ok(existsSync(routePath), "app/r/[code]/route.ts must exist");

  const content = readFileSync(routePath, "utf-8");

  // 1. Must import after from next/server
  assert.match(
    content,
    /import\s*\{[^}]*after[^}]*\}\s*from\s*["']next\/server["']/,
    "Must import `after` from `next/server`"
  );

  // 2. Must wrap database click insertion inside after(async () => { ... })
  assert.match(
    content,
    /after\s*\(\s*async\s*\(\s*\)\s*=>\s*\{[\s\S]*adminClient\.from\(["']clicks["']\)\.insert/,
    "Must wrap clicks insertion inside `after(async () => { ... })`"
  );

  // 3. Must execute redirect directly without awaiting clicks insert
  assert.match(
    content,
    /NextResponse\.redirect\s*\(\s*redirectUrl/,
    "Must execute NextResponse.redirect without waiting for click DB I/O"
  );
});

test("BE1-01: Merchant Portal Real Database Metrics & Products Connection", async () => {
  const portalServerPath = resolve("src/lib/merchant/portal-server.ts");
  const dashboardComponentPath = resolve("src/components/merchant/dashboard.tsx");
  const merchantPagePath = resolve("app/merchant/page.tsx");

  assert.ok(existsSync(portalServerPath), "src/lib/merchant/portal-server.ts must exist");
  assert.ok(existsSync(dashboardComponentPath), "src/components/merchant/dashboard.tsx must exist");
  assert.ok(existsSync(merchantPagePath), "app/merchant/page.tsx must exist");

  const portalContent = readFileSync(portalServerPath, "utf-8");
  assert.match(
    portalContent,
    /export const getMerchantDashboardMetrics/,
    "portal-server.ts must export getMerchantDashboardMetrics"
  );
  assert.match(
    portalContent,
    /export const getMerchantProducts/,
    "portal-server.ts must export getMerchantProducts"
  );
  assert.match(
    portalContent,
    /from\(["']orders["']\)[\s\S]*amount[\s\S]*status/,
    "getMerchantDashboardMetrics must query orders for GMV & status"
  );
  assert.match(
    portalContent,
    /from\(["']affiliate_links["']\)[\s\S]*clicks_count/,
    "getMerchantDashboardMetrics must query clicks from affiliate links"
  );
  assert.match(
    portalContent,
    /from\(["']commissions["']\)[\s\S]*gross_amount/,
    "getMerchantDashboardMetrics must query commissions"
  );

  const pageContent = readFileSync(merchantPagePath, "utf-8");
  assert.match(
    pageContent,
    /getMerchantDashboardMetrics\s*\(\s*access\.userId\s*\)/,
    "app/merchant/page.tsx must pass access.userId to getMerchantDashboardMetrics"
  );
  assert.match(
    pageContent,
    /getMerchantProducts\s*\(\s*access\.userId\s*\)/,
    "app/merchant/page.tsx must pass access.userId to getMerchantProducts"
  );
  assert.match(
    pageContent,
    /<Dashboard[^>]*initialMetrics=\{metrics\}[^>]*initialProducts=\{products\}/,
    "app/merchant/page.tsx must pass real data into Dashboard"
  );

  const dashContent = readFileSync(dashboardComponentPath, "utf-8");
  assert.match(
    dashContent,
    /initialMetrics\?: DashboardMetricProp\[\]/,
    "Dashboard component must declare initialMetrics prop"
  );
  assert.match(
    dashContent,
    /initialProducts\?: DashboardProductProp\[\]/,
    "Dashboard component must declare initialProducts prop"
  );
  assert.match(
    dashContent,
    /\{preview && \([\s\S]*preview-banner/,
    "Preview banner and status dropdown must only render when preview=true"
  );
});

test("BE1-02: Merchant Campaign Management (/merchant/campaigns & PATCH API)", async () => {
  const campaignsPagePath = resolve("app/merchant/campaigns/page.tsx");
  const campaignListComponentPath = resolve("src/components/merchant/campaign-list.tsx");
  const campaignsApiPath = resolve("app/api/merchant/campaigns/route.ts");

  assert.ok(existsSync(campaignsPagePath), "app/merchant/campaigns/page.tsx must exist");
  assert.ok(existsSync(campaignListComponentPath), "src/components/merchant/campaign-list.tsx must exist");
  assert.ok(existsSync(campaignsApiPath), "app/api/merchant/campaigns/route.ts must exist");

  // Check API route PATCH implementation
  const apiContent = readFileSync(campaignsApiPath, "utf-8");
  assert.match(
    apiContent,
    /export async function PATCH/,
    "app/api/merchant/campaigns/route.ts must implement PATCH method"
  );
  assert.match(
    apiContent,
    /campaign_id/,
    "PATCH handler must validate campaign_id"
  );
  assert.match(
    apiContent,
    /status !== "active" && status !== "paused"/,
    "PATCH handler must restrict status to 'active' | 'paused'"
  );
  assert.match(
    apiContent,
    /campaign\.merchant_id !== merchantId/,
    "PATCH handler must verify merchant ownership before update"
  );

  // Check UI component
  const listContent = readFileSync(campaignListComponentPath, "utf-8");
  assert.match(
    listContent,
    /handleToggleStatus/,
    "CampaignList must provide handleToggleStatus"
  );
  assert.match(
    listContent,
    /fetch\(["']\/api\/merchant\/campaigns["'],\s*\{[\s\S]*method:\s*["']PATCH["']/,
    "CampaignList must call PATCH /api/merchant/campaigns"
  );
  assert.match(
    listContent,
    /badgeActive|badgePaused|badgeExpired/,
    "CampaignList must style status badges for active, paused, expired"
  );
});

test("BE1-03: Reseller Payout Request (Migration, API, Modal, & Dashboard)", async () => {
  const migrationPath = resolve("supabase/migrations/20261111180000_payout_requests.sql");
  const payoutApiPath = resolve("app/api/reseller/wallet/payout/route.ts");
  const payoutModalPath = resolve("src/components/reseller/payout-modal.tsx");
  const walletDashboardPath = resolve("src/components/reseller/wallet-dashboard.tsx");

  assert.ok(existsSync(migrationPath), "Migration 20261111180000_payout_requests.sql must exist");
  assert.ok(existsSync(payoutApiPath), "app/api/reseller/wallet/payout/route.ts must exist");
  assert.ok(existsSync(payoutModalPath), "src/components/reseller/payout-modal.tsx must exist");
  assert.ok(existsSync(walletDashboardPath), "src/components/reseller/wallet-dashboard.tsx must exist");

  // Check SQL migration
  const sqlContent = readFileSync(migrationPath, "utf-8");
  assert.match(
    sqlContent,
    /CREATE TABLE IF NOT EXISTS public\.payout_requests/,
    "Migration must create payout_requests table"
  );
  assert.match(
    sqlContent,
    /amount NUMERIC\(12,2\) NOT NULL CHECK \(amount >= 100000\)/,
    "Migration must have CHECK (amount >= 100000)"
  );
  assert.match(
    sqlContent,
    /ENABLE ROW LEVEL SECURITY/,
    "Migration must enable RLS"
  );
  assert.match(
    sqlContent,
    /CREATE POLICY "Reseller view own payout requests"/,
    "Migration must have SELECT RLS policy"
  );
  assert.match(
    sqlContent,
    /CREATE POLICY "Reseller insert own payout request"/,
    "Migration must have INSERT RLS policy"
  );

  // Check API route
  const apiContent = readFileSync(payoutApiPath, "utf-8");
  assert.match(
    apiContent,
    /export async function POST/,
    "Payout route must implement POST method"
  );
  assert.match(
    apiContent,
    /numAmount < 100000/,
    "Payout route must validate minimum withdrawal amount >= 100.000"
  );
  assert.match(
    apiContent,
    /fetchResellerWalletSummary/,
    "Payout route must check available_balance via wallet service"
  );
  assert.match(
    apiContent,
    /from\(["']payout_requests["']\)[\s\S]*?\.insert/,
    "Payout route must insert record into payout_requests table"
  );

  // Check Wallet Dashboard
  const walletContent = readFileSync(walletDashboardPath, "utf-8");
  assert.match(
    walletContent,
    /PayoutModal/,
    "wallet-dashboard.tsx must import and use PayoutModal"
  );
  assert.match(
    walletContent,
    /setIsPayoutOpen\s*\(\s*true\s*\)/,
    "wallet-dashboard.tsx must trigger payout modal on button click"
  );
  assert.match(
    walletContent,
    /Rút tiền/,
    "wallet-dashboard.tsx must render 'Rút tiền' button next to available balance"
  );
});

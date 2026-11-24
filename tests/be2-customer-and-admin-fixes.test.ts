import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("BE2-CUST-01: Viewport & Mobile Safe Area configuration", () => {
  const layoutContent = fs.readFileSync(path.resolve("app/layout.tsx"), "utf8");
  assert.match(
    layoutContent,
    /viewportFit:\s*"cover"/,
    "RootLayout must specify viewportFit: 'cover' for edge-to-edge iOS display"
  );

  const stickyCtaContent = fs.readFileSync(
    path.resolve("src/components/storefront/storefront-sticky-cta.tsx"),
    "utf8"
  );
  assert.match(
    stickyCtaContent,
    /env\(safe-area-inset-bottom\)/,
    "Sticky CTA must include safe-area-inset-bottom padding"
  );

  const checkoutModalContent = fs.readFileSync(
    path.resolve("src/components/storefront/storefront-checkout-modal.tsx"),
    "utf8"
  );
  assert.match(
    checkoutModalContent,
    /role="radiogroup"/,
    "Ticket package container must specify role='radiogroup'"
  );
  assert.match(
    checkoutModalContent,
    /role="radio"/,
    "Ticket package cards must specify role='radio' for accessibility"
  );
  assert.match(
    checkoutModalContent,
    /text-base md:text-sm/,
    "Inputs must specify text-base on mobile (>= 16px) to prevent iOS auto-zoom"
  );
  assert.match(
    checkoutModalContent,
    /\/api\/storefront\/orders\/status/,
    "Checkout modal must poll order payment status"
  );
});

test("BE2-CUST-02: Banking VietQR Webhook & Order Status endpoints verification", () => {
  const webhookFilePath = path.resolve("app/api/webhooks/bank/vietqr/route.ts");
  assert.ok(fs.existsSync(webhookFilePath), "Webhook route file must exist");
  const webhookContent = fs.readFileSync(webhookFilePath, "utf8");
  assert.match(webhookContent, /export\s+async\s+function\s+GET/);
  assert.match(webhookContent, /export\s+async\s+function\s+POST/);
  assert.match(webhookContent, /ORDER_REF_REGEX/);
  assert.match(webhookContent, /paidOrdersCache/);

  const statusFilePath = path.resolve("app/api/storefront/orders/status/route.ts");
  assert.ok(fs.existsSync(statusFilePath), "Order status route file must exist");
  const statusContent = fs.readFileSync(statusFilePath, "utf8");
  assert.match(statusContent, /export\s+async\s+function\s+GET/);
  assert.match(statusContent, /isOrderPaidInCache/);
});

test("BE2-ADM-01: Fraud Audit Logs migration and Dismiss API verification", () => {
  const migrationPath = path.resolve(
    "supabase/migrations/20261124150000_fraud_audit_logs.sql"
  );
  assert.ok(fs.existsSync(migrationPath), "Migration file must exist");

  const sqlContent = fs.readFileSync(migrationPath, "utf8");
  assert.match(sqlContent, /CREATE TABLE IF NOT EXISTS public\.fraud_audit_logs/);
  assert.match(sqlContent, /order_id UUID NOT NULL REFERENCES public\.orders\(id\)/);
  assert.match(sqlContent, /ENABLE ROW LEVEL SECURITY/);

  const dismissFilePath = path.resolve("app/api/admin/fraud/dismiss/route.ts");
  assert.ok(fs.existsSync(dismissFilePath), "Dismiss route file must exist");
  const dismissContent = fs.readFileSync(dismissFilePath, "utf8");
  assert.match(dismissContent, /export\s+async\s+function\s+POST/);
  assert.match(dismissContent, /fraud_audit_logs/);
  assert.match(dismissContent, /flag_self_purchase/);

  const fraudComponentPath = path.resolve("src/components/admin/admin-fraud-management.tsx");
  const fraudComponentContent = fs.readFileSync(fraudComponentPath, "utf8");
  assert.match(fraudComponentContent, /\/api\/admin\/fraud\/dismiss/);
  assert.match(fraudComponentContent, /dismissReason/);
});

test("BE2-ADM-02: Partner Status Management API and UI verification", () => {
  const partnerStatusPath = path.resolve("app/api/admin/partners/status/route.ts");
  assert.ok(fs.existsSync(partnerStatusPath), "Partner status route must exist");

  const partnerStatusContent = fs.readFileSync(partnerStatusPath, "utf8");
  assert.match(partnerStatusContent, /export\s+async\s+function\s+POST/);
  assert.match(partnerStatusContent, /export\s+async\s+function\s+PATCH/);
  assert.match(partnerStatusContent, /toggleAdminPartnerStatus/);

  const partnerComponentPath = path.resolve("src/components/admin/admin-partners-management.tsx");
  const partnerComponentContent = fs.readFileSync(partnerComponentPath, "utf8");
  assert.match(partnerComponentContent, /\/api\/admin\/partners\/status/);
  assert.match(partnerComponentContent, /confirmSuspendPartner/);
  assert.match(partnerComponentContent, /suspendReason/);
});

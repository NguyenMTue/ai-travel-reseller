import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import {
  getAdminSystemOverview,
  getAdminPayoutRequests,
  processAdminPayoutAction,
  getAdminFraudActivities,
  getAdminPartners,
  toggleAdminPartnerStatus,
} from "../src/lib/admin/admin-service.ts";

import {
  fixtureAdminOverview,
  fixtureAdminPayouts,
  fixtureAdminFlaggedOrders,
  fixtureAdminBotClicks,
  fixtureAdminPartners,
} from "../src/lib/admin/admin-fixtures.ts";

test("Super Admin Back-Office (/admin) Test Suite", async (t) => {
  await t.test("1. SQL Migration Verification", async (t1) => {
    const migrationPath = resolve(
      process.cwd(),
      "supabase/migrations/20261112180000_super_admin_back_office.sql",
    );

    await t1.test("Migration file exists", () => {
      assert.ok(existsSync(migrationPath), "Migration file must exist");
    });

    const sql = readFileSync(migrationPath, "utf-8");

    await t1.test("Creates public.admins table with required columns", () => {
      assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.admins/);
      assert.match(sql, /id uuid PRIMARY KEY/);
      assert.match(sql, /email text UNIQUE NOT NULL/);
      assert.match(sql, /role text NOT NULL DEFAULT 'super_admin'/);
      assert.match(sql, /status text NOT NULL DEFAULT 'active'/);
    });

    await t1.test("Configures RLS policies on public.admins", () => {
      assert.match(sql, /ALTER TABLE public\.admins ENABLE ROW LEVEL SECURITY;/);
      assert.match(sql, /CREATE POLICY service_role_all_admins/);
      assert.match(sql, /CREATE POLICY admins_view_self/);
    });

    await t1.test("Alters payout_requests with administrative auditing columns", () => {
      assert.match(sql, /ALTER TABLE public\.payout_requests/);
      assert.match(sql, /ADD COLUMN IF NOT EXISTS processed_at timestamptz/);
      assert.match(sql, /ADD COLUMN IF NOT EXISTS processed_by uuid/);
      assert.match(sql, /ADD COLUMN IF NOT EXISTS admin_notes text/);
      assert.match(sql, /ADD COLUMN IF NOT EXISTS transfer_reference text/);
    });

    await t1.test("Defines admin_process_payout_request stored procedure", () => {
      assert.match(sql, /CREATE OR REPLACE FUNCTION public\.admin_process_payout_request/);
      assert.match(sql, /SECURITY DEFINER/);
      assert.match(sql, /p_action NOT IN \('approve', 'reject'\)/);
      assert.match(sql, /status = v_target_status/);
    });

    await t1.test("Defines admin_get_system_overview stored procedure", () => {
      assert.match(sql, /CREATE OR REPLACE FUNCTION public\.admin_get_system_overview/);
      assert.match(sql, /SECURITY DEFINER/);
      assert.match(sql, /v_total_gmv/);
      assert.match(sql, /v_commissions_paid/);
      assert.match(sql, /v_pending_payouts_count/);
      assert.match(sql, /v_flagged_orders_count/);
    });
  });

  await t.test("2. Admin Service Business Logic & Mock Execution", async (t2) => {
    await t2.test("getAdminSystemOverview handles RPC data and fallback", async () => {
      const mockClientWithRpc = {
        rpc: async (fn: string) => {
          if (fn === "admin_get_system_overview") {
            return { data: fixtureAdminOverview, error: null };
          }
          return { data: null, error: new Error("RPC not found") };
        },
      };

      const result = await getAdminSystemOverview(mockClientWithRpc as any);
      assert.strictEqual(result.financials.total_gmv, 485000000);
      assert.strictEqual(result.financials.commissions_paid, 58200000);
      assert.strictEqual(result.financials.currency, "VND");
      assert.strictEqual(result.operational_counts.pending_payouts_count, 3);
      assert.strictEqual(result.security_alerts.flagged_self_purchase_orders, 2);
    });

    await t2.test("getAdminPayoutRequests maps columns and filters", async () => {
      const mockClient = {
        from: (table: string) => {
          assert.strictEqual(table, "payout_requests");
          return {
            select: () => ({
              order: () => ({
                eq: (col: string, val: string) => {
                  assert.strictEqual(col, "status");
                  assert.strictEqual(val, "pending");
                  return Promise.resolve({
                    data: [
                      {
                        id: "pr-01",
                        reseller_id: "res-01",
                        amount: 2500000,
                        bank_name: "Vietcombank",
                        account_number: "0123456789",
                        account_name: "NGUYEN VAN A",
                        status: "pending",
                        created_at: "2026-11-12T08:00:00Z",
                        resellers: {
                          id: "res-01",
                          name: "Nguyễn Văn A",
                          email: "a@reseller.vn",
                          phone: "0909000111",
                        },
                      },
                    ],
                    error: null,
                  });
                },
              }),
            }),
          };
        },
      };

      const items = await getAdminPayoutRequests(mockClient as any, { status: "pending" });
      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].resellerName, "Nguyễn Văn A");
      assert.strictEqual(items[0].amount, 2500000);
      assert.strictEqual(items[0].bankName, "Vietcombank");
      assert.strictEqual(items[0].status, "pending");
    });

    await t2.test("processAdminPayoutAction handles approve & reject via RPC", async () => {
      const mockClientApprove = {
        rpc: async (fn: string, params: any) => {
          assert.strictEqual(fn, "admin_process_payout_request");
          assert.strictEqual(params.p_action, "approve");
          return {
            data: {
              success: true,
              message: "Đã duyệt và xác nhận chuyển khoản thành công.",
              code: "APPROVED",
            },
            error: null,
          };
        },
      };

      const approveRes = await processAdminPayoutAction(mockClientApprove as any, {
        payoutId: "payout-001",
        action: "approve",
        transferReference: "FT123456",
      });
      assert.strictEqual(approveRes.success, true);
      assert.strictEqual(approveRes.code, "APPROVED");

      const mockClientReject = {
        rpc: async (fn: string, params: any) => {
          assert.strictEqual(params.p_action, "reject");
          return {
            data: {
              success: true,
              message: "Đã từ chối yêu cầu rút tiền.",
              code: "REJECTED",
            },
            error: null,
          };
        },
      };

      const rejectRes = await processAdminPayoutAction(mockClientReject as any, {
        payoutId: "payout-002",
        action: "reject",
        adminNotes: "Thông tin sai lệch",
      });
      assert.strictEqual(rejectRes.success, true);
      assert.strictEqual(rejectRes.code, "REJECTED");
    });

    await t2.test("getAdminFraudActivities fetches flagged orders and bot clicks", async () => {
      const mockClient = {
        from: (table: string) => ({
          select: () => ({
            eq: (col: string, val: any) => {
              assert.strictEqual(val, true);
              return {
                order: () => ({
                  limit: () =>
                    Promise.resolve({
                      data:
                        table === "orders"
                          ? [
                              {
                                id: "ord-fraud-01",
                                booking_reference: "BK-SELF-1",
                                amount: 1500000,
                                customer_name: "Self buyer",
                                reseller_id: "res-01",
                                merchant_id: "mer-01",
                                status: "confirmed",
                                created_at: "2026-11-12T07:00:00Z",
                                flag_self_purchase: true,
                                resellers: { name: "Reseller 1" },
                                merchants: { name: "Merchant 1" },
                              },
                            ]
                          : [
                              {
                                id: "clk-bot-01",
                                is_bot: true,
                                bot_score: 0.99,
                                ip_address: "1.2.3.4",
                                user_agent: "BotAgent",
                                country: "VN",
                                created_at: "2026-11-12T07:00:00Z",
                              },
                            ],
                      error: null,
                    }),
                }),
              };
            },
          }),
        }),
      };

      const fraud = await getAdminFraudActivities(mockClient as any);
      assert.strictEqual(fraud.flaggedOrders.length, 1);
      assert.strictEqual(fraud.flaggedOrders[0].flagSelfPurchase, true);
      assert.strictEqual(fraud.botClicks.length, 1);
      assert.strictEqual(fraud.botClicks[0].isBot, true);
    });

    await t2.test("toggleAdminPartnerStatus updates partner status", async () => {
      const mockClient = {
        from: (table: string) => {
          assert.strictEqual(table, "merchants");
          return {
            update: (payload: any) => {
              assert.strictEqual(payload.status, "suspended");
              return {
                eq: (col: string, val: string) => {
                  assert.strictEqual(col, "id");
                  assert.strictEqual(val, "mer-01");
                  return Promise.resolve({ error: null });
                },
              };
            },
          };
        },
      };

      const res = await toggleAdminPartnerStatus(
        mockClient as any,
        "mer-01",
        "merchant",
        "suspended",
      );
      assert.strictEqual(res.success, true);
      assert.match(res.message, /Tạm khóa/);
    });
  });

  await t.test("3. Portal Access & Authorization Verification", async (t3) => {
    const portalAccessPath = resolve(process.cwd(), "src/lib/portal-access.ts");
    const portalContent = readFileSync(portalAccessPath, "utf-8");

    await t3.test("Portal type includes admin", () => {
      assert.match(portalContent, /export type Portal = "merchant" \| "reseller" \| "admin"/);
    });

    await t3.test("canHandlePortalAuthFailure handles /admin path", () => {
      assert.match(portalContent, /\["\/merchant", "\/reseller", "\/admin"\]/);
    });

    const adminAccessPath = resolve(process.cwd(), "src/lib/admin/admin-access.ts");
    await t3.test("admin-access.ts exists and exports getAdminPortalAccess", () => {
      assert.ok(existsSync(adminAccessPath));
      const accessContent = readFileSync(adminAccessPath, "utf-8");
      assert.match(accessContent, /export const getAdminPortalAccess/);
      assert.match(accessContent, /admins/);
    });
  });

  await t.test("4. API Endpoints Contract Verification", async (t4) => {
    const endpoints = [
      {
        path: "app/api/admin/overview/route.ts",
        methods: ["GET"],
      },
      {
        path: "app/api/admin/payouts/route.ts",
        methods: ["GET", "PATCH"],
      },
      {
        path: "app/api/admin/fraud/route.ts",
        methods: ["GET"],
      },
      {
        path: "app/api/admin/partners/route.ts",
        methods: ["GET", "PATCH"],
      },
    ];

    for (const ep of endpoints) {
      await t4.test(`Endpoint ${ep.path} exists and exports methods`, () => {
        const fullPath = resolve(process.cwd(), ep.path);
        assert.ok(existsSync(fullPath), `${ep.path} must exist`);
        const content = readFileSync(fullPath, "utf-8");
        for (const m of ep.methods) {
          assert.match(
            content,
            new RegExp(`export async function ${m}`),
            `${ep.path} must export ${m}`,
          );
        }
      });
    }
  });

  await t.test("5. Back-Office UI Pages & Components Integration", async (t5) => {
    const uiFiles = [
      "app/admin/layout.tsx",
      "app/admin/page.tsx",
      "app/admin/payouts/page.tsx",
      "app/admin/fraud/page.tsx",
      "app/admin/partners/page.tsx",
      "src/components/admin/admin-navbar.tsx",
      "src/components/admin/admin-dashboard.tsx",
      "src/components/admin/admin-payouts-management.tsx",
      "src/components/admin/admin-fraud-management.tsx",
      "src/components/admin/admin-partners-management.tsx",
      "app/preview/admin/layout.tsx",
      "app/preview/admin/page.tsx",
      "app/preview/admin/payouts/page.tsx",
      "app/preview/admin/fraud/page.tsx",
      "app/preview/admin/partners/page.tsx",
    ];

    for (const file of uiFiles) {
      await t5.test(`UI file ${file} exists`, () => {
        assert.ok(existsSync(resolve(process.cwd(), file)), `${file} must exist`);
      });
    }
  });
});

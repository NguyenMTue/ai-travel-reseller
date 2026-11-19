import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StorefrontHeader } from "../src/components/storefront/storefront-header";
import { StorefrontReferralCard } from "../src/components/storefront/storefront-referral-card";
import { expect, test } from "@playwright/test";

const ref = "22222222-2222-2222-2222-111111111111";
const campaign = "44444444-4444-4444-4444-444444444444";
const name = "Nguyễn An — Khám phá Đà Nẵng cùng TravelLink";
for (const scenario of [
  { name: "valid-ref", query: "&ref=" + ref, identity: true },
  { name: "missing-ref", query: "", identity: false },
  { name: "invalid-ref", query: "&ref=not-a-reseller", identity: false },
  { name: "unknown-uuid", query: "&ref=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", identity: false },
]) {
  test(scenario.name, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.route("**/*", route => {
      const url = new URL(route.request().url());
      if (url.origin !== "http://127.0.0.1:3216") return route.abort();
      expect(route.request().method()).toBe("GET");
      return route.continue();
    });
    const response = await page.goto("/storefront/sunworld/ba-na-hills?campaign=" + campaign + scenario.query);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const card = page.getByRole("complementary", { name: "Người giới thiệu tour" });
    await expect(card).toHaveCount(scenario.identity ? 1 : 0);
    if (scenario.identity) {
      await expect(card).toContainText(name);
      const titleBox = await page.getByRole("heading", { level: 1 }).boundingBox();
      const cardBox = await card.boundingBox();
      expect(cardBox!.y).toBeGreaterThanOrEqual(titleBox!.y + titleBox!.height);
      await page.getByRole("button", { name: /Thư viện ảnh/ }).click();
      await expect(card).toContainText(name);
      await expect(page).toHaveURL(new RegExp("ref=" + ref));
      await page.reload();
      await expect(card).toContainText(name);
    }
    // Current server schema supplies neither verified status nor voucher eligibility.
    await expect(page.getByLabel("Ưu đãi từ người giới thiệu")).toHaveCount(0);
    await expect(page.getByText("Đối tác đã xác minh", { exact: true })).toHaveCount(0);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(scenario.name + ".png"), fullPage: true });
    expect(errors).toEqual([]);
  });
}

test("confirmed-voucher component fixture shows one badge and a verified identity", async ({ page }, testInfo) => {
  // Standalone rendering of the real components with a trusted-data fixture.
  // This is intentionally NOT an assertion that production grants this offer.
  await page.route("**/*", route => new URL(route.request().url()).origin === "http://127.0.0.1:3216" ? route.continue() : route.abort());
  await page.goto("/storefront/sunworld/ba-na-hills");
  const styles = await page.locator('link[rel="stylesheet"]').evaluateAll(nodes => nodes.map(n => n.outerHTML).join(""));
  const merchant = { id: "fixture", name: "Sun World Đà Nẵng", slug: "sunworld", brandTitle: "Sun World", tagline: "Khám phá Đà Nẵng", hotline: "1900 1888", supportEmail: "", address: "", operatingHours: "", bankName: "", bankAccount: "", bankAccountName: "", verified: true };
  const tracking = { refCode: ref, resellerName: name, resellerVerified: true, resellerTip: "Nên đến sớm để tận hưởng không khí mát lành.", discountEligible: true, discountPercent: 5 };
  const html = renderToStaticMarkup(React.createElement(React.Fragment, null,
    React.createElement(StorefrontHeader, { merchant, tracking }),
    React.createElement("main", { style: { maxWidth: 720, margin: "24px auto", padding: 16 } },
      React.createElement("h1", null, "Fixture giao diện — không phải ưu đãi thật"),
      React.createElement(StorefrontReferralCard, { tracking }))));
  await page.setContent('<!doctype html><html lang="vi"><head>' + styles + '</head><body>' + html + '</body></html>');
  await expect(page.getByText("Voucher 5%", { exact: true })).toHaveCount(1);
  await expect(page.getByLabel("Ưu đãi từ người giới thiệu")).toHaveCount(1);
  await expect(page.getByText("Đối tác đã xác minh", { exact: true })).toHaveCount(1);
  await expect(page.getByRole("complementary")).toContainText(tracking.resellerTip);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("confirmed-voucher-fixture.png"), fullPage: true });
});

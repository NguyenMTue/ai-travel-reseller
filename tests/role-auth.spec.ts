import { test, expect } from "@playwright/test";
import { homePathForRole, safeNextPath } from "@/src/lib/role-auth";

test.describe("role-auth routing helpers", () => {
  test("homePathForRole maps roles to portal entry points", () => {
    expect(homePathForRole("merchant")).toBe("/merchant");
    expect(homePathForRole("reseller")).toBe("/reseller/campaigns");
  });

  test("safeNextPath only allows paths for the authenticated role", () => {
    expect(safeNextPath("/merchant/products", "merchant")).toBe(
      "/merchant/products",
    );
    expect(safeNextPath("/reseller/campaigns", "merchant")).toBe("/merchant");
    expect(safeNextPath("/reseller/content", "reseller")).toBe(
      "/reseller/content",
    );
    expect(safeNextPath("/merchant", "reseller")).toBe("/reseller/campaigns");
    expect(safeNextPath(null, "reseller")).toBe("/reseller/campaigns");
    expect(safeNextPath("/evil", "merchant")).toBe("/merchant");
    expect(safeNextPath("/merchant", null)).toBeNull();
  });
});

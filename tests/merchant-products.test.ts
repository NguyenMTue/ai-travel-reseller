import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  PRODUCT_CATEGORIES,
  productInputSchema,
  productPatchSchema,
} from "../src/lib/merchant/product-schema.ts";
import {
  createMerchantProduct,
  updateMerchantProduct,
  getMerchantProductList,
} from "../src/lib/merchant/product-service.ts";

const MOCK_IDS = {
  merchant: "11111111-1111-4111-8111-111111111111",
  otherMerchant: "99999999-9999-4999-8999-999999999999",
  product: "33333333-3333-4333-8333-333333333333",
};

test("MP-01: productInputSchema validates valid input and rejects invalid constraints", () => {
  // 1. Hợp lệ chuẩn
  const valid = productInputSchema.safeParse({
    name: "Vé Cáp Treo Bà Nà Hills + Buffet Trưa Quốc Tế",
    category: "Cáp treo & Trải nghiệm",
    description: "Trải nghiệm cáp treo ngắm Cầu Vàng và thưởng thức buffet hơn 100 món tại nhà hàng Beer Plaza.",
    original_price: 1250000,
    sale_price: 1050000,
    booking_url: "https://banahills.sunworld.vn/ve-cap-treo",
    payment_url: "https://ticket.sunworld.vn/checkout",
    valid_from: "2026-06-01",
    valid_to: "2026-12-31",
    status: "active",
    authentic_tips: "Đi cáp số 3 trước 8h30 sáng để vắng khách.",
  });
  assert.equal(valid.success, true);

  // 2. Từ chối tên quá ngắn (< 3 ký tự)
  const shortName = productInputSchema.safeParse({
    name: "AB",
    category: "Tour trọn gói",
    description: "Mô tả đầy đủ chi tiết hơn mười ký tự.",
    booking_url: "https://example.com/tour",
  });
  assert.equal(shortName.success, false);

  // 3. Từ chối mô tả quá ngắn (< 10 ký tự)
  const shortDesc = productInputSchema.safeParse({
    name: "Tour Ngũ Hành Sơn",
    category: "Tour trọn gói",
    description: "Quá ngắn",
    booking_url: "https://example.com/tour",
  });
  assert.equal(shortDesc.success, false);

  // 4. Từ chối khi không có cả booking_url lẫn payment_url
  const noUrls = productInputSchema.safeParse({
    name: "Tour Ngũ Hành Sơn Hội An 1 Ngày",
    category: "Tour trọn gói",
    description: "Khám phá danh thắng Ngũ Hành Sơn và phố cổ Hội An về đêm lung linh ánh đèn lồng.",
    booking_url: "",
    payment_url: null,
  });
  assert.equal(noUrls.success, false);

  // 5. Từ chối URL không hợp lệ (không bắt đầu bằng http:// hoặc https://)
  const invalidUrl = productInputSchema.safeParse({
    name: "Tour Ngũ Hành Sơn Hội An 1 Ngày",
    category: "Tour trọn gói",
    description: "Khám phá danh thắng Ngũ Hành Sơn và phố cổ Hội An về đêm lung linh ánh đèn lồng.",
    booking_url: "ftp://invalid-server.com",
  });
  assert.equal(invalidUrl.success, false);

  // 6. Từ chối khi sale_price > original_price (giá bán cao hơn giá niêm yết)
  const expensiveSale = productInputSchema.safeParse({
    name: "Tour Ngũ Hành Sơn Hội An 1 Ngày",
    category: "Tour trọn gói",
    description: "Khám phá danh thắng Ngũ Hành Sơn và phố cổ Hội An về đêm lung linh ánh đèn lồng.",
    original_price: 500000,
    sale_price: 800000,
    booking_url: "https://example.com/tour",
  });
  assert.equal(expensiveSale.success, false);

  // 7. Từ chối khi valid_to < valid_from
  const invalidDates = productInputSchema.safeParse({
    name: "Tour Ngũ Hành Sơn Hội An 1 Ngày",
    category: "Tour trọn gói",
    description: "Khám phá danh thắng Ngũ Hành Sơn và phố cổ Hội An về đêm lung linh ánh đèn lồng.",
    booking_url: "https://example.com/tour",
    valid_from: "2026-12-31",
    valid_to: "2026-01-01",
  });
  assert.equal(invalidDates.success, false);
});

test("MP-02: productPatchSchema validates status toggle and field updates", () => {
  // 1. Hợp lệ toggle status sang draft
  const patchStatus = productPatchSchema.safeParse({
    product_id: MOCK_IDS.product,
    status: "draft",
  });
  assert.equal(patchStatus.success, true);

  // 2. Hợp lệ cập nhật giá bán và tên
  const patchPrice = productPatchSchema.safeParse({
    product_id: MOCK_IDS.product,
    name: "Tên Tour Mới Sau Khi Cập Nhật",
    sale_price: 990000,
  });
  assert.equal(patchPrice.success, true);

  // 3. Từ chối product_id không phải UUID
  const invalidId = productPatchSchema.safeParse({
    product_id: "not-a-uuid",
    status: "active",
  });
  assert.equal(invalidId.success, false);

  // 4. Từ chối status không thuộc active | draft
  const invalidStatus = productPatchSchema.safeParse({
    product_id: MOCK_IDS.product,
    status: "deleted",
  });
  assert.equal(invalidStatus.success, false);
});

test("MP-03: createMerchantProduct inserts product with verified merchant_id", async () => {
  let insertedData: Record<string, any> | null = null;

  const mockClient: any = {
    from: (table: string) => {
      assert.equal(table, "products");
      return {
        insert: (data: any) => {
          insertedData = data;
          return {
            select: () => ({
              single: async () => ({
                data: {
                  id: MOCK_IDS.product,
                  ...data,
                  created_at: new Date().toISOString(),
                },
                error: null,
              }),
            }),
          };
        },
      };
    },
  };

  const input = {
    name: "Vé Cù Lao Chàm Lặn Ngắm San Hô",
    category: "Vé tham quan",
    description: "Tàu cao tốc đưa đón bến Cửa Đại, bao gồm ăn trưa hải sản tươi sống và đồ lặn chuyên nghiệp.",
    original_price: 650000,
    sale_price: 550000,
    booking_url: "https://culaocham.vn/dat-ve",
    status: "active",
  };

  const result = await createMerchantProduct(mockClient, MOCK_IDS.merchant, input);

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.name, input.name);
    assert.equal(result.data.merchantId, MOCK_IDS.merchant);
    assert.equal(result.data.salePrice, 550000);
  }

  // Đảm bảo dữ liệu chèn vào database luôn gắn đúng merchant_id
  assert.ok(insertedData !== null);
  const data = insertedData as Record<string, any>;
  assert.equal(data.merchant_id, MOCK_IDS.merchant);
  assert.equal(data.name, input.name);
});

test("MP-04: updateMerchantProduct enforces merchant ownership before updating", async () => {
  const existingProduct = {
    id: MOCK_IDS.product,
    merchant_id: MOCK_IDS.merchant,
    name: "Vé Cù Lao Chàm",
    status: "active",
  };

  const mockClient: any = {
    from: (table: string) => {
      assert.equal(table, "products");
      return {
        select: () => ({
          eq: (field1: string, val1: string) => ({
            eq: (field2: string, val2: string) => ({
              maybeSingle: async () => {
                // Kiểm tra đúng product_id và merchant_id
                if (val1 === MOCK_IDS.product && val2 === MOCK_IDS.merchant) {
                  return { data: existingProduct, error: null };
                }
                return { data: null, error: null };
              },
            }),
          }),
        }),
        update: (payload: any) => ({
          eq: (field1: string, val1: string) => ({
            eq: (field2: string, val2: string) => ({
              select: () => ({
                single: async () => ({
                  data: { ...existingProduct, ...payload },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };
    },
  };

  // 1. Đúng chủ sở hữu -> Cập nhật thành công
  const successResult = await updateMerchantProduct(mockClient, MOCK_IDS.merchant, {
    product_id: MOCK_IDS.product,
    status: "draft",
  });
  assert.equal(successResult.success, true);
  if (successResult.success) {
    assert.equal(successResult.data.status, "draft");
  }

  // 2. Khác merchant_id -> Bị từ chối
  const failResult = await updateMerchantProduct(mockClient, MOCK_IDS.otherMerchant, {
    product_id: MOCK_IDS.product,
    status: "draft",
  });
  assert.equal(failResult.success, false);
  if (!failResult.success) {
    assert.equal(failResult.code, "NOT_FOUND_OR_FORBIDDEN");
  }
});

test("MP-05: Product management files and routes exist and are properly linked", () => {
  const files = [
    "src/lib/merchant/product-schema.ts",
    "src/lib/merchant/product-service.ts",
    "src/components/merchant/product-list.tsx",
    "src/components/merchant/product-list.module.css",
    "src/components/merchant/product-create.tsx",
    "src/components/merchant/product-create.module.css",
    "app/merchant/products/page.tsx",
    "app/merchant/products/new/page.tsx",
    "app/api/merchant/products/route.ts",
  ];

  for (const f of files) {
    const p = resolve(f);
    assert.ok(existsSync(p), `Expected file ${f} to exist`);
  }

  // Kiểm tra navigation trong dashboard.tsx có liên kết đến /merchant/products
  const dashboardContent = readFileSync(resolve("src/components/merchant/dashboard.tsx"), "utf-8");
  assert.match(
    dashboardContent,
    /\/merchant\/products/,
    "Dashboard must contain link to /merchant/products"
  );
  assert.match(
    dashboardContent,
    /\/merchant\/products\/new/,
    "Dashboard must contain link to /merchant/products/new"
  );

  // Kiểm tra navigation trong campaign-list.tsx có liên kết đến /products
  const campaignListContent = readFileSync(resolve("src/components/merchant/campaign-list.tsx"), "utf-8");
  assert.match(
    campaignListContent,
    /products/,
    "Campaign list must contain link to products"
  );

  // Kiểm tra campaign-form.tsx có liên kết tạo sản phẩm khi chưa có sản phẩm
  const campaignFormContent = readFileSync(resolve("src/components/merchant/campaign-form.tsx"), "utf-8");
  assert.match(
    campaignFormContent,
    /\/products\/new/,
    "Campaign form must contain link to create new product when noProducts is true"
  );
});

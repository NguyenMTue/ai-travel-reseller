import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";
import {
  productInputSchema,
  productPatchSchema,
  type ProductInput,
  type ProductPatch,
} from "./product-schema.ts";

export interface MerchantProductDetail {
  id: string;
  merchantId: string;
  name: string;
  category: string;
  description: string;
  originalPrice: number | null;
  salePrice: number | null;
  bookingUrl: string | null;
  paymentUrl: string | null;
  status: "active" | "draft";
  validFrom: string | null;
  validTo: string | null;
  authenticTips?: string | null;
  createdAt: string | null;
  campaignsCount?: number;
}

export type ProductServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

/**
 * Lấy danh sách đầy đủ sản phẩm thuộc sở hữu của Merchant
 */
export async function getMerchantProductList(
  client: SupabaseClient<Database>,
  merchantId: string,
): Promise<ProductServiceResult<MerchantProductDetail[]>> {
  try {
    const { data: products, error } = await client
      .from("products")
      .select(
        "id, merchant_id, name, category, description, original_price, sale_price, booking_url, payment_url, status, valid_from, valid_to, created_at, campaigns (id)",
      )
      .eq("merchant_id", merchantId)
      .order("created_at", { ascending: false });

    if (error) {
      return {
        success: false,
        error: `Lỗi truy vấn danh sách sản phẩm: ${error.message}`,
        code: error.code,
      };
    }

    const items: MerchantProductDetail[] = (products || []).map((p: any) => ({
      id: p.id,
      merchantId: p.merchant_id || merchantId,
      name: p.name,
      category: p.category || "Trải nghiệm",
      description: p.description || "",
      originalPrice: p.original_price != null ? Number(p.original_price) : null,
      salePrice: p.sale_price != null ? Number(p.sale_price) : null,
      bookingUrl: p.booking_url,
      paymentUrl: p.payment_url,
      status: p.status === "active" ? "active" : "draft",
      validFrom: p.valid_from,
      validTo: p.valid_to,
      createdAt: p.created_at,
      campaignsCount: Array.isArray(p.campaigns) ? p.campaigns.length : 0,
    }));

    return { success: true, data: items };
  } catch (err: any) {
    return {
      success: false,
      error: `Lỗi không xác định khi lấy sản phẩm: ${err?.message || String(err)}`,
    };
  }
}

/**
 * Tạo sản phẩm / tour du lịch mới cho Merchant
 */
export async function createMerchantProduct(
  client: SupabaseClient<Database>,
  merchantId: string,
  input: unknown,
): Promise<ProductServiceResult<MerchantProductDetail>> {
  const parsed = productInputSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      success: false,
      error: firstIssue?.message || "Dữ liệu sản phẩm không hợp lệ.",
      code: "VALIDATION_ERROR",
    };
  }

  const {
    name,
    category,
    description,
    original_price,
    sale_price,
    booking_url,
    payment_url,
    valid_from,
    valid_to,
    status,
  } = parsed.data;

  try {
    const { data: inserted, error } = await client
      .from("products")
      .insert({
        merchant_id: merchantId,
        name,
        category,
        description,
        original_price: original_price ?? null,
        sale_price: sale_price ?? null,
        booking_url: booking_url?.trim() || null,
        payment_url: payment_url?.trim() || null,
        valid_from: valid_from || null,
        valid_to: valid_to || null,
        status: status || "active",
      })
      .select()
      .single();

    if (error || !inserted) {
      return {
        success: false,
        error: `Không thể lưu sản phẩm vào cơ sở dữ liệu: ${error?.message || "Lỗi không xác định"}`,
        code: error?.code,
      };
    }

    const detail: MerchantProductDetail = {
      id: inserted.id,
      merchantId: inserted.merchant_id || merchantId,
      name: inserted.name,
      category: inserted.category || "Trải nghiệm",
      description: inserted.description || "",
      originalPrice:
        inserted.original_price != null ? Number(inserted.original_price) : null,
      salePrice:
        inserted.sale_price != null ? Number(inserted.sale_price) : null,
      bookingUrl: inserted.booking_url,
      paymentUrl: inserted.payment_url,
      status: inserted.status === "active" ? "active" : "draft",
      validFrom: inserted.valid_from,
      validTo: inserted.valid_to,
      createdAt: inserted.created_at,
      campaignsCount: 0,
    };

    return { success: true, data: detail };
  } catch (err: any) {
    return {
      success: false,
      error: `Lỗi ngoại lệ khi tạo sản phẩm: ${err?.message || String(err)}`,
    };
  }
}

/**
 * Cập nhật thông tin hoặc trạng thái sản phẩm
 */
export async function updateMerchantProduct(
  client: SupabaseClient<Database>,
  merchantId: string,
  input: unknown,
): Promise<ProductServiceResult<MerchantProductDetail>> {
  const parsed = productPatchSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      success: false,
      error: firstIssue?.message || "Dữ liệu cập nhật sản phẩm không hợp lệ.",
      code: "VALIDATION_ERROR",
    };
  }

  const { product_id, ...updates } = parsed.data;

  try {
    // 1. Kiểm tra quyền sở hữu sản phẩm của Merchant
    const { data: existing, error: existError } = await client
      .from("products")
      .select("id, merchant_id")
      .eq("id", product_id)
      .eq("merchant_id", merchantId)
      .maybeSingle();

    if (existError || !existing) {
      return {
        success: false,
        error: "Không tìm thấy sản phẩm hoặc bạn không có quyền cập nhật sản phẩm này.",
        code: "NOT_FOUND_OR_FORBIDDEN",
      };
    }

    // 2. Chuẩn bị payload cập nhật
    const updatePayload: Record<string, any> = {};
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.name !== undefined) updatePayload.name = updates.name;
    if (updates.category !== undefined) updatePayload.category = updates.category;
    if (updates.description !== undefined) updatePayload.description = updates.description;
    if (updates.original_price !== undefined) updatePayload.original_price = updates.original_price;
    if (updates.sale_price !== undefined) updatePayload.sale_price = updates.sale_price;
    if (updates.booking_url !== undefined) updatePayload.booking_url = updates.booking_url;
    if (updates.payment_url !== undefined) updatePayload.payment_url = updates.payment_url;
    if (updates.valid_from !== undefined) updatePayload.valid_from = updates.valid_from;
    if (updates.valid_to !== undefined) updatePayload.valid_to = updates.valid_to;

    const { data: updated, error: updateError } = await (client as any)
      .from("products")
      .update(updatePayload)
      .eq("id", product_id)
      .eq("merchant_id", merchantId)
      .select()
      .single();

    if (updateError || !updated) {
      return {
        success: false,
        error: `Lỗi cập nhật sản phẩm: ${updateError?.message || "Không thể cập nhật"}`,
        code: updateError?.code,
      };
    }

    return {
      success: true,
      data: {
        id: updated.id,
        merchantId: updated.merchant_id || merchantId,
        name: updated.name,
        category: updated.category || "Trải nghiệm",
        description: updated.description || "",
        originalPrice:
          updated.original_price != null ? Number(updated.original_price) : null,
        salePrice:
          updated.sale_price != null ? Number(updated.sale_price) : null,
        bookingUrl: updated.booking_url,
        paymentUrl: updated.payment_url,
        status: updated.status === "active" ? "active" : "draft",
        validFrom: updated.valid_from,
        validTo: updated.valid_to,
        createdAt: updated.created_at,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Lỗi ngoại lệ khi cập nhật sản phẩm: ${err?.message || String(err)}`,
    };
  }
}

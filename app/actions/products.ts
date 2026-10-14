"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import { hasSupabaseConfig } from "@/src/lib/supabase/config";
import { createClient } from "@/src/lib/supabase/server";

export type MerchantProduct = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  original_price: number | null;
  sale_price: number | null;
  commission_rate: number | null;
  booking_url: string | null;
  status: string | null;
};

async function getMerchantContext() {
  if (!hasSupabaseConfig) {
    return { supabase: null, userId: null, error: "Ứng dụng chưa được cấu hình kết nối Supabase." };
  }

  const supabase = createClient(await cookies());
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { supabase: null, userId: null, error: "Vui lòng đăng nhập bằng tài khoản doanh nghiệp." };
  }

  const { data: merchant, error: merchantError } = await supabase
    .from("merchants")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (merchantError || !merchant) {
    return { supabase: null, userId: null, error: "Tài khoản này chưa được gán hồ sơ doanh nghiệp." };
  }

  return { supabase, userId: user.id, error: null };
}

export async function getMerchantProducts(): Promise<{
  data: MerchantProduct[];
  error: string | null;
}> {
  try {
    const context = await getMerchantContext();
    if (!context.supabase || !context.userId) return { data: [], error: context.error };

    const { data, error } = await context.supabase
      .from("products")
      .select("id,name,description,category,original_price,sale_price,commission_rate,booking_url,status")
      .eq("merchant_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) return { data: [], error: "Không tải được sản phẩm. Vui lòng kiểm tra quyền truy cập bảng products." };

    return { data: (data ?? []) as MerchantProduct[], error: null };
  } catch {
    return { data: [], error: "Không kết nối được Supabase. Vui lòng thử lại." };
  }
}

const productSchema = z.object({
  name: z.string().trim().min(2, "Tên sản phẩm cần ít nhất 2 ký tự.").max(160),
  description: z.string().trim().max(3000).default(""),
  category: z.string().trim().max(100).default(""),
  originalPrice: z.number().finite().min(0, "Giá gốc không được âm."),
  salePrice: z.number().finite().min(0, "Giá bán không được âm."),
  commissionRate: z.number().finite().min(0).max(100, "Hoa hồng phải từ 0 đến 100%.").default(0),
  bookingUrl: z.union([z.literal(""), z.string().url("Link đặt chỗ phải là URL hợp lệ.")]).default(""),
});

export async function createMerchantProduct(input: {
  name: string;
  description: string;
  category: string;
  originalPrice: number;
  salePrice: number;
  commissionRate: number;
  bookingUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Thông tin sản phẩm chưa hợp lệ." };
  }

  try {
    const context = await getMerchantContext();
    if (!context.supabase || !context.userId) {
      return { success: false, error: context.error ?? "Không xác định được tài khoản doanh nghiệp." };
    }

    const { error } = await context.supabase.from("products").insert({
      merchant_id: context.userId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      category: parsed.data.category || null,
      original_price: parsed.data.originalPrice,
      sale_price: parsed.data.salePrice,
      commission_rate: parsed.data.commissionRate,
      booking_url: parsed.data.bookingUrl || null,
      status: "active",
    });

    if (error) {
      return { success: false, error: "Lưu sản phẩm thất bại. Hãy kiểm tra quyền thêm dữ liệu vào bảng products." };
    }
    return { success: true };
  } catch {
    return { success: false, error: "Không kết nối được Supabase. Vui lòng thử lại." };
  }
}

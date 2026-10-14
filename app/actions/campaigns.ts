"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { hasSupabaseConfig } from "@/src/lib/supabase/config";
import { createClient } from "@/src/lib/supabase/server";

function isCalendarDate(value: string): boolean {
  const date = new Date(value + "T00:00:00.000Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const campaignSchema = z
  .object({
    name: z.string().trim().min(3, "Tên chiến dịch cần ít nhất 3 ký tự.").max(120),
    productId: z.string().uuid("Vui lòng chọn một sản phẩm hợp lệ."),
    description: z.string().trim().min(1, "Vui lòng nhập mô tả.").max(3000),
    location: z.string().trim().min(1, "Vui lòng nhập địa điểm.").max(160),
    commission: z.coerce.number().min(0).max(100),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày bắt đầu không hợp lệ."),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày kết thúc không hợp lệ."),
  })
  .refine(
    (value) =>
      isCalendarDate(value.startDate) &&
      isCalendarDate(value.endDate) &&
      value.startDate <= value.endDate,
    { path: ["endDate"], message: "Ngày kết thúc phải từ ngày bắt đầu trở đi." },
  );

export type MerchantCampaignProduct = {
  id: string;
  name: string;
};

export async function getMerchantCampaignProducts(): Promise<{
  data: MerchantCampaignProduct[];
  error: string | null;
}> {
  if (!hasSupabaseConfig) {
    return { data: [], error: "Ứng dụng chưa được cấu hình kết nối Supabase." };
  }

  try {
    const supabase = createClient(await cookies());
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: "Vui lòng đăng nhập bằng tài khoản doanh nghiệp." };

    const { data: merchant } = await supabase
      .from("merchants")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    if (!merchant) return { data: [], error: "Tài khoản này chưa được gán hồ sơ doanh nghiệp." };

    const { data, error } = await supabase
      .from("products")
      .select("id,name")
      .eq("merchant_id", user.id)
      .order("name", { ascending: true });

    if (error) return { data: [], error: "Không tải được sản phẩm của doanh nghiệp." };
    return { data: data ?? [], error: null };
  } catch {
    return { data: [], error: "Không kết nối được Supabase. Vui lòng thử lại." };
  }
}

export async function createMerchantCampaign(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  campaignId?: string;
}> {
  if (!hasSupabaseConfig) {
    return { success: false, error: "Ứng dụng chưa được cấu hình kết nối Supabase." };
  }

  const parsed = campaignSchema.safeParse({
    name: formData.get("name"),
    productId: formData.get("productId"),
    description: formData.get("description"),
    location: formData.get("location"),
    commission: formData.get("commission"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Thông tin chiến dịch chưa hợp lệ." };
  }

  try {
    const supabase = createClient(await cookies());
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." };

    const { data: merchant } = await supabase
      .from("merchants")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    if (!merchant) {
      return { success: false, error: "Chỉ tài khoản doanh nghiệp đã đăng ký mới tạo được chiến dịch." };
    }

    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("id", parsed.data.productId)
      .eq("merchant_id", user.id)
      .maybeSingle();
    if (!product) {
      return { success: false, error: "Sản phẩm không tồn tại hoặc không thuộc doanh nghiệp của bạn." };
    }

    const { data: campaign, error } = await supabase
      .from("campaigns")
      .insert({
        merchant_id: user.id,
        product_id: product.id,
        name: parsed.data.name,
        description: parsed.data.description,
        target_location: parsed.data.location,
        commission_rate: parsed.data.commission,
        start_date: parsed.data.startDate,
        end_date: parsed.data.endDate,
        status: "active",
      })
      .select("id")
      .single();

    if (error || !campaign) {
      if (error) {
        console.error("Create campaign failed", { code: error.code, message: error.message });
        if ((error.code === "PGRST204" || error.code === "42703") && /description/i.test(error.message)) {
          return {
            success: false,
            error: "Supabase chưa có cột description trong campaigns. Mở Supabase SQL Editor và chạy: ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS description text;",
          };
        }
        if (error.code === "42501" || /row-level security|policy/i.test(error.message)) {
          return {
            success: false,
            error: "Supabase từ chối quyền tạo campaign (RLS). Kiểm tra policy INSERT trên campaigns: merchant_id phải bằng auth.uid().",
          };
        }
        if (error.code === "23503") {
          return {
            success: false,
            error: "Không lưu được campaign vì merchant_id hoặc product_id không khớp bản ghi trong Supabase.",
          };
        }
        return { success: false, error: "Supabase từ chối lưu campaign (mã " + (error.code || "không xác định") + "). Xem log máy chủ để biết chi tiết." };
      }
      return { success: false, error: "Supabase không trả lại bản ghi campaign sau khi lưu. Hãy tải lại danh sách campaigns để kiểm tra trước khi gửi lại." };
    }

    revalidatePath("/merchant");
    revalidatePath("/reseller/campaigns");
    return { success: true, campaignId: campaign.id };
  } catch {
    return { success: false, error: "Không kết nối được Supabase. Vui lòng thử lại." };
  }
}




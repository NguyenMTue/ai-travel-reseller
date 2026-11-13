import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/src/lib/database.types";
import {
  contentApprovalPatchSchema,
  type ContentApprovalPatch,
  type MerchantContentItem,
  type MerchantContentsSummary,
} from "./content-schema.ts";

export type { MerchantContentsSummary } from "./content-schema.ts";

export interface ContentFilterOptions {
  campaign_id?: string;
  status?: string;
  persona?: string;
  limit?: number;
}

/**
 * Lấy danh sách nội dung AI thuộc các chiến dịch của Merchant kèm số liệu thống kê duyệt
 */
export async function getMerchantContentsList(
  client: SupabaseClient<Database>,
  merchantId: string,
  filter?: ContentFilterOptions
): Promise<{ success: boolean; data?: MerchantContentsSummary; error?: string }> {
  try {
    // 1. Lấy danh sách chiến dịch của Merchant (cột tên chiến dịch trong database là `name`)
    const { data: campaigns, error: cmpError } = await (client as any)
      .from("campaigns")
      .select("id, name, product_id, status")
      .eq("merchant_id", merchantId);

    if (cmpError) {
      return { success: false, error: "Lỗi truy vấn chiến dịch của merchant: " + cmpError.message };
    }

    if (!campaigns || campaigns.length === 0) {
      return {
        success: true,
        data: {
          total: 0,
          pending_count: 0,
          approved_count: 0,
          rejected_count: 0,
          contents: [],
        },
      };
    }

    const campaignMap = new Map<string, { title: string; product_id?: string }>();
    campaigns.forEach((c: any) => {
      campaignMap.set(c.id, {
        title: c.name || c.title || "Chiến dịch #" + String(c.id).slice(0, 8),
        product_id: c.product_id,
      });
    });

    const campaignIds = campaigns.map((c: any) => c.id);

    // 2. Truy vấn danh sách nội dung AI từ bảng contents
    let query = (client as any)
      .from("contents")
      .select("id, campaign_id, product_id, reseller_id, persona, hook, script, caption, cta, video_url, tracking_url, status, created_at")
      .in("campaign_id", campaignIds)
      .order("created_at", { ascending: false });

    if (filter?.campaign_id && campaignMap.has(filter.campaign_id)) {
      query = query.eq("campaign_id", filter.campaign_id);
    }

    if (filter?.status && filter.status !== "all") {
      if (filter.status === "pending_approval") {
        query = query.in("status", ["pending_approval", "ready", "draft", "pending", "needs_review"]);
      } else {
        query = query.eq("status", filter.status);
      }
    }

    if (filter?.persona && filter.persona !== "all") {
      query = query.eq("persona", filter.persona);
    }

    if (filter?.limit) {
      query = query.limit(filter.limit);
    } else {
      query = query.limit(100);
    }

    const { data: contentsData, error: contentsError } = await query;

    if (contentsError) {
      return { success: false, error: "Lỗi truy vấn danh sách nội dung AI: " + contentsError.message };
    }

    const rawContents = (contentsData || []) as any[];

    // 3. Tính toán thống kê theo trạng thái trên toàn bộ nội dung của merchant
    const { data: allStatuses, error: statError } = await (client as any)
      .from("contents")
      .select("status")
      .in("campaign_id", campaignIds);

    let pending_count = 0;
    let approved_count = 0;
    let rejected_count = 0;
    const total = allStatuses?.length || 0;

    if (!statError && allStatuses) {
      allStatuses.forEach((row: any) => {
        const s = (row.status || "").toLowerCase();
        if (s === "approved") {
          approved_count++;
        } else if (s === "rejected") {
          rejected_count++;
        } else {
          // pending_approval, ready, draft
          pending_count++;
        }
      });
    }

    // 4. Định dạng và gán thông tin chiến dịch vào từng bản ghi
    const items: MerchantContentItem[] = rawContents.map((c) => {
      const cmp = campaignMap.get(c.campaign_id);
      return {
        id: c.id,
        campaign_id: c.campaign_id,
        campaign_title: cmp?.title || "Chiến dịch #" + c.campaign_id.slice(0, 8),
        product_id: c.product_id || cmp?.product_id,
        reseller_id: c.reseller_id,
        persona: c.persona || "general",
        hook: c.hook,
        script: c.script,
        caption: c.caption,
        cta: c.cta,
        video_url: c.video_url,
        tracking_url: c.tracking_url,
        status: c.status || "pending_approval",
        created_at: c.created_at,
      };
    });

    return {
      success: true,
      data: {
        total,
        pending_count,
        approved_count,
        rejected_count,
        contents: items,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi xử lý danh sách nội dung" };
  }
}

/**
 * Cập nhật phê duyệt hoặc chỉnh sửa nội dung AI của Merchant
 */
export async function updateMerchantContentApproval(
  client: SupabaseClient<Database>,
  merchantId: string,
  rawPatch: unknown
): Promise<{ success: boolean; data?: any; error?: string; code?: string }> {
  try {
    const parsed = contentApprovalPatchSchema.safeParse(rawPatch);
    if (!parsed.success) {
      return {
        success: false,
        code: "VALIDATION_ERROR",
        error: "Dữ liệu cập nhật phê duyệt không hợp lệ: " + parsed.error.issues[0]?.message,
      };
    }

    const patch: ContentApprovalPatch = parsed.data;

    // 1. Kiểm tra quyền sở hữu: nội dung phải thuộc chiến dịch của chính Merchant này
    const { data: contentRecord, error: findError } = await (client as any)
      .from("contents")
      .select("id, campaign_id")
      .eq("id", patch.content_id)
      .maybeSingle();

    if (findError || !contentRecord) {
      return {
        success: false,
        code: "NOT_FOUND",
        error: "Không tìm thấy nội dung AI yêu cầu duyệt.",
      };
    }

    const { data: campaignRecord, error: cmpError } = await (client as any)
      .from("campaigns")
      .select("id, merchant_id, name")
      .eq("id", contentRecord.campaign_id)
      .maybeSingle();

    if (cmpError || !campaignRecord) {
      return {
        success: false,
        code: "CAMPAIGN_NOT_FOUND",
        error: "Chiến dịch liên kết với nội dung này không tồn tại.",
      };
    }

    if (campaignRecord.merchant_id !== merchantId) {
      return {
        success: false,
        code: "FORBIDDEN",
        error: "Bạn không có quyền kiểm duyệt nội dung của chiến dịch thuộc doanh nghiệp khác.",
      };
    }

    // 2. Chuẩn bị payload cập nhật
    const updatePayload: Record<string, any> = {
      status: patch.status,
    };

    if (patch.hook !== undefined) updatePayload.hook = patch.hook;
    if (patch.script !== undefined) updatePayload.script = patch.script;
    if (patch.caption !== undefined) updatePayload.caption = patch.caption;
    if (patch.cta !== undefined) updatePayload.cta = patch.cta;

    // 3. Thực thi cập nhật trong Supabase
    const { data: updated, error: updateError } = await (client as any)
      .from("contents")
      .update(updatePayload)
      .eq("id", patch.content_id)
      .select()
      .single();

    if (updateError) {
      return {
        success: false,
        code: "UPDATE_ERROR",
        error: "Lỗi lưu trạng thái phê duyệt nội dung: " + updateError.message,
      };
    }

    return {
      success: true,
      data: updated,
    };
  } catch (err: any) {
    return {
      success: false,
      code: "EXCEPTION",
      error: err.message || "Lỗi ngoại lệ khi phê duyệt nội dung",
    };
  }
}

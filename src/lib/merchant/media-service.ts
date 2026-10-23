import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/src/lib/database.types";
import type {
  CreateMediaReferenceInput,
  MediaQueryInput,
  MediaReferenceItem,
  MediaPlatform,
} from "./media-schema.ts";
import { MEDIA_PLATFORMS } from "./media-schema.ts";

export type MediaListResult = {
  items: MediaReferenceItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

/**
 * Ánh xạ bản ghi thô từ Database sang interface MediaReferenceItem chuẩn
 */
type MediaReferenceRow = Database["public"]["Tables"]["media_references"]["Row"];

function mapMediaRow(row: MediaReferenceRow): MediaReferenceItem {
  const platform = MEDIA_PLATFORMS.includes(row.platform as MediaPlatform)
    ? (row.platform as MediaPlatform)
    : "other";

  return {
    id: row.id,
    merchantId: row.merchant_id,
    title: row.title,
    videoUrl: row.video_url,
    thumbnailUrl: row.thumbnail_url ?? null,
    platform,
    duration: row.duration ?? null,
    styleTags: Array.isArray(row.style_tags) ? row.style_tags : [],
    analysisMetadata:
      typeof row.analysis_metadata === "object" &&
      row.analysis_metadata !== null &&
      !Array.isArray(row.analysis_metadata)
        ? row.analysis_metadata
        : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Lấy danh sách video mẫu từ bảng media_references kèm lọc và phân trang
 */
export async function listMediaReferences(
  client: SupabaseClient<Database>,
  query: MediaQueryInput,
): Promise<{ success: true; data: MediaListResult } | { success: false; error: string }> {
  try {
    const page = Math.max(1, query.page);
    const limit = Math.min(100, Math.max(1, query.limit));
    const offset = (page - 1) * limit;

    let dbQuery = client
      .from("media_references")
      .select("*", { count: "exact" });

    // Lọc theo merchantId nếu được cung cấp
    if (query.merchantId) {
      dbQuery = dbQuery.eq("merchant_id", query.merchantId);
    }

    // Lọc theo nền tảng (platform)
    if (query.platform) {
      dbQuery = dbQuery.eq("platform", query.platform);
    }

    // Lọc theo nhãn phong cách (styleTag)
    if (query.tag) {
      dbQuery = dbQuery.contains("style_tags", [query.tag]);
    }

    // Tìm kiếm theo tiêu đề (search)
    if (query.search) {
      dbQuery = dbQuery.ilike("title", `%${query.search}%`);
    }

    // Sắp xếp mới nhất trước
    dbQuery = dbQuery
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await dbQuery;

    if (error) {
      return { success: false, error: `Lỗi truy vấn cơ sở dữ liệu: ${error.message}` };
    }

    const total = count ?? 0;
    const items = (data ?? []).map(mapMediaRow);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      success: true,
      data: {
        items,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi hệ thống khi tải danh sách video",
    };
  }
}

/**
 * Thêm một video mẫu mới vào thư viện Media của Merchant
 */
export async function createMediaReference(
  client: SupabaseClient<Database>,
  merchantId: string,
  input: CreateMediaReferenceInput,
): Promise<{ success: true; data: MediaReferenceItem } | { success: false; error: string }> {
  try {
    const insertPayload: Database["public"]["Tables"]["media_references"]["Insert"] = {
      merchant_id: merchantId,
      title: input.title,
      video_url: input.videoUrl,
      thumbnail_url: input.thumbnailUrl ?? null,
      platform: input.platform,
      duration: input.duration ?? null,
      style_tags: input.styleTags,
      analysis_metadata: input.analysisMetadata ?? {},
    };

    const { data, error } = await client
      .from("media_references")
      .insert(insertPayload)
      .select()
      .single();

    if (error || !data) {
      return {
        success: false,
        error: `Không thể tạo video mẫu: ${error?.message || "Không có dữ liệu trả về"}`,
      };
    }

    return {
      success: true,
      data: mapMediaRow(data),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi hệ thống khi thêm video mẫu",
    };
  }
}

/**
 * Xóa một video mẫu khỏi thư viện (Chỉ chính chủ Merchant mới có quyền xóa)
 */
export async function deleteMediaReference(
  client: SupabaseClient<Database>,
  merchantId: string,
  mediaId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { error, count } = await client
      .from("media_references")
      .delete({ count: "exact" })
      .eq("id", mediaId)
      .eq("merchant_id", merchantId);

    if (error) {
      return { success: false, error: `Lỗi khi xóa video mẫu: ${error.message}` };
    }

    if (count === 0) {
      return {
        success: false,
        error: "Không tìm thấy video mẫu hoặc bạn không có quyền xóa video này",
      };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi hệ thống khi xóa video mẫu",
    };
  }
}

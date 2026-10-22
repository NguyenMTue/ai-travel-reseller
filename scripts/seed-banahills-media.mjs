import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  console.log("=== BẮT ĐẦU SEED TƯ LIỆU THỰC TẾ BÀ NÀ HILLS VÀO media_references ===");

  const samplePath = resolve(
    process.cwd(),
    "docs/be1/samples/media-references-banahills.sample.json"
  );
  const sampleData = JSON.parse(readFileSync(samplePath, "utf8"));

  console.log(`Đã đọc ${sampleData.length} bản ghi ảnh thật từ: ${samplePath}`);

  const rowsToUpsert = sampleData.map((item) => ({
    id: item.id,
    merchant_id: item.merchant_id || "11111111-1111-1111-1111-111111111111",
    title: item.title,
    video_url: item.video_url,
    thumbnail_url: item.thumbnail_url || item.video_url,
    platform: item.platform || "upload",
    style_tags: item.style_tags || [],
    analysis_metadata: item.analysis_metadata || {
      shot_type: item.shot_type,
      recommended_scene_role: item.recommended_scene_role,
    },
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await client
    .from("media_references")
    .upsert(rowsToUpsert, { onConflict: "id" })
    .select("id, title, style_tags, analysis_metadata");

  if (error) {
    console.error("❌ Lỗi khi nạp bản ghi media_references:", error.message);
    process.exit(1);
  }

  console.log(`✅ Nạp thành công ${data.length} tư liệu vào media_references.`);
  data.forEach((r, idx) => {
    console.log(`  [${idx + 1}] ${r.id} | ${r.analysis_metadata?.shot_type || 'N/A'} | ${r.title.slice(0, 50)}...`);
  });

  const { count } = await client
    .from("media_references")
    .select("*", { count: "exact", head: true })
    .eq("merchant_id", "11111111-1111-1111-1111-111111111111");

  console.log(`\nTổng số tư liệu của Sun World Đà Nẵng hiện tại: ${count} bản ghi.`);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});

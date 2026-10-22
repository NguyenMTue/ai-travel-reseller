import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function uploadRef() {
  const filePath = resolve("docs/be1/samples/reference/tmpjlq6nmak (1).mp4");
  const fileBuf = readFileSync(filePath);

  const { error } = await supabase.storage
    .from("campaign-videos")
    .upload("banahills-i2v-drone-reference.mp4", fileBuf, {
      contentType: "video/mp4",
      upsert: true,
    });

  if (error) {
    console.error("Upload error:", error.message);
  } else {
    const { data } = supabase.storage
      .from("campaign-videos")
      .getPublicUrl("banahills-i2v-drone-reference.mp4");
    console.log("Uploaded successfully:", data.publicUrl);
  }
}

uploadRef().catch(console.error);

import { NextResponse } from "next/server";
import { z } from "zod";
import { getResellerAccess } from "@/src/lib/reseller/server";
import { databaseUuidSchema } from "@/src/lib/reseller/database-uuid";

const requestSchema = z.object({
  contentId: databaseUuidSchema,
  campaignId: databaseUuidSchema,
  productId: databaseUuidSchema,
}).strict();

export async function POST(request: Request) {
  const access = await getResellerAccess();
  if (access.status === "unauthenticated") return NextResponse.json({ error: "Vui lòng đăng nhập lại." }, { status: 401 });
  if (access.status !== "allowed") return NextResponse.json({ error: "Tài khoản Reseller chưa được phép đăng bài." }, { status: 403 });

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const channelId = process.env.TELEGRAM_CHANNEL_ID?.trim();
  if (!token || !channelId) return NextResponse.json({ error: "Chức năng đăng Telegram chưa được cấu hình." }, { status: 503 });

  let input: z.infer<typeof requestSchema>;
  try { input = requestSchema.parse(await request.json()); }
  catch { return NextResponse.json({ error: "Yêu cầu đăng bài không hợp lệ." }, { status: 400 }); }

  const contentResult = await access.client.from("contents")
    .select("id,campaign_id,reseller_id,status,caption,cta")
    .eq("id", input.contentId).eq("campaign_id", input.campaignId).eq("status", "approved").maybeSingle();
  if (contentResult.error) return NextResponse.json({ error: "Không thể xác minh nội dung đã duyệt." }, { status: 503 });
  const content = contentResult.data;
  if (!content || (content.reseller_id !== null && content.reseller_id !== access.resellerId)) {
    return NextResponse.json({ error: "Không tìm thấy nội dung đã duyệt cho chiến dịch này." }, { status: 404 });
  }

  const campaignResult = await access.client.from("campaigns").select("id,product_id,status")
    .eq("id", input.campaignId).eq("status", "active").maybeSingle();
  if (campaignResult.error) return NextResponse.json({ error: "Không thể xác minh chiến dịch." }, { status: 503 });
  if (!campaignResult.data || campaignResult.data.product_id !== input.productId) {
    return NextResponse.json({ error: "Chiến dịch hoặc sản phẩm không hợp lệ." }, { status: 400 });
  }

  const linkResult = await access.client.from("affiliate_links").select("unique_code,short_url")
    .eq("reseller_id", access.resellerId).eq("campaign_id", input.campaignId)
    .eq("product_id", input.productId).eq("is_active", true).maybeSingle();
  if (linkResult.error) return NextResponse.json({ error: "Không thể xác minh link tiếp thị." }, { status: 503 });
  if (!linkResult.data?.unique_code) return NextResponse.json({ error: "Hãy tạo link tiếp thị trước khi đăng." }, { status: 400 });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "").trim().replace(/\/+$/, "");
  let shortUrl = linkResult.data.short_url?.trim() || "";
  if (!shortUrl || !/^https?:\/\//i.test(shortUrl)) {
    if (!appUrl) return NextResponse.json({ error: "Thiếu domain công khai để tạo link tiếp thị." }, { status: 503 });
    shortUrl = `${appUrl}/r/${linkResult.data.unique_code}`;
  }
  let parsedUrl: URL;
  try { parsedUrl = new URL(shortUrl); }
  catch { return NextResponse.json({ error: "Link tiếp thị chưa hợp lệ." }, { status: 503 }); }
  if (!["http:", "https:"].includes(parsedUrl.protocol) || parsedUrl.pathname !== `/r/${linkResult.data.unique_code}`
      || parsedUrl.username || parsedUrl.password || parsedUrl.search || parsedUrl.hash) {
    return NextResponse.json({ error: "Link tiếp thị chưa hợp lệ." }, { status: 503 });
  }

  const caption = content.caption?.trim() || "";
  const cta = content.cta?.trim() || "";
  const message = [caption, cta.replaceAll("[LINK_MUA_VE]", shortUrl)].filter(Boolean).join("\n\n");
  if (!message || message.length > 4096) {
    return NextResponse.json({ error: "Bài đăng cần có caption/CTA và tối đa 4096 ký tự." }, { status: 400 });
  }

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: channelId, text: message, link_preview_options: { is_disabled: false } }),
      signal: AbortSignal.timeout(12_000),
    });
    const result: unknown = await telegramResponse.json();
    if (!telegramResponse.ok || !result || typeof result !== "object" || !("ok" in result) || result.ok !== true) {
      console.error("Telegram post rejected", { status: telegramResponse.status });
      return NextResponse.json({ error: "Telegram chưa nhận bài đăng. Kiểm tra quyền của bot trên kênh rồi thử lại." }, { status: 502 });
    }
    return NextResponse.json({ message: "Đã đăng bài lên kênh Telegram của nền tảng." });
  } catch {
    return NextResponse.json({ error: "Chưa xác định được Telegram đã nhận bài hay chưa. Hãy kiểm tra kênh trước khi thử lại." }, { status: 502 });
  }
}

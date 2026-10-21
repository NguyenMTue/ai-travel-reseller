export type ShareOutcome = "completed" | "cancelled" | "unsupported" | "error";
export type ShareClient = { share?: (data: ShareData) => Promise<void>; canShare?: (data: ShareData) => boolean };

export function trackingShareData(url: string, title: string): ShareData {
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error("INVALID_SHARE_URL");
  // Preserve the exact validated short_url; never resolve/visit its redirect.
  return { title: title.trim().slice(0, 160) || "TravelLink AI", url };
}

export async function shareData(data: ShareData, client: ShareClient): Promise<ShareOutcome> {
  if (typeof client.share !== "function") return "unsupported";
  try {
    if (data.files && (!client.canShare || !client.canShare(data))) return "unsupported";
    await client.share(data);
    return "completed";
  } catch (error) {
    return error && typeof error === "object" && "name" in error && error.name === "AbortError" ? "cancelled" : "error";
  }
}

export function shareMessage(outcome: ShareOutcome, file = false): string {
  if (outcome === "cancelled") return "Đã hủy chia sẻ.";
  if (outcome === "completed") return "Đã kết thúc hộp thoại chia sẻ. Hãy kiểm tra ứng dụng bạn đã chọn; thao tác này không xác nhận bài đã đăng hoặc tin đã gửi.";
  if (outcome === "unsupported") return file
    ? "Thiết bị chưa hỗ trợ chia sẻ ảnh trực tiếp. Bạn có thể tải PNG bên dưới."
    : "Trình duyệt chưa hỗ trợ chia sẻ trực tiếp. Dùng Copy link phía trên để dán vào ứng dụng bạn muốn.";
  return file ? "Chưa thể mở chia sẻ ảnh. Bạn có thể tải PNG rồi chia sẻ thủ công."
    : "Chưa thể mở chia sẻ. Hãy thử lại hoặc dùng Copy link phía trên.";
}

/** Browser delivery only. A URL never substitutes a sample for a campaign result. */
export function playableVideoUrl(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value || /[\\\u0000-\u0020]/.test(value)) return null;
  try {
    const url = new URL(value, "https://local.invalid");
    if (!(value.startsWith("/") && !value.startsWith("//")) && !/^https?:\/\//i.test(value)) return null;
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    if (url.hostname === "storage.travellink.vn") return null; // Known mock renderer, no physical file.
    return value;
  } catch { return null; }
}

export function videoFilename(title: string, id: string): string {
  const slug = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${slug(title).slice(0, 72) || "video"}-${slug(id).slice(0, 36) || "download"}.mp4`;
}

export async function fetchVideoMp4(url: string, signal: AbortSignal, send: typeof fetch = fetch): Promise<Blob> {
  if (!playableVideoUrl(url)) throw new Error("URL video chưa hợp lệ hoặc chỉ là URL mô phỏng.");
  const response = await send(url, { signal, credentials: "same-origin", cache: "no-store" });
  if (!response.ok) throw new Error(`Không tải được video (HTTP ${response.status}). Link có thể đã hết hạn; hãy tải lại dữ liệu trang.`);
  if (response.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "video/mp4") {
    throw new Error("Nguồn tải chưa trả về video MP4. Vui lòng kiểm tra lại định dạng.");
  }
  const blob = await response.blob();
  // MIME alone can also describe an HTML error page. Check the ISO BMFF header.
  if (blob.size < 16 || new TextDecoder().decode(await blob.slice(4, 8).arrayBuffer()) !== "ftyp") {
    throw new Error("File tải rỗng hoặc không có cấu trúc MP4 hợp lệ.");
  }
  return blob;
}

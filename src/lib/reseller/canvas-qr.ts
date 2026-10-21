import QRCode from "qrcode";
import { trackingUrlAudience } from "./tracking-cta";

export type PosterDetails = { campaignName: string; productName?: string | null; illustrationUrl?: string | null };
export type PosterResult = { blob: Blob; warnings: string[] };
export const posterSize = { width: 1080, height: 1440 };

function image(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const asset = new Image();
    const timer = window.setTimeout(() => { asset.src = ""; reject(new Error("IMAGE_TIMEOUT")); }, 8000);
    asset.crossOrigin = "anonymous";
    asset.onload = () => { clearTimeout(timer); resolve(asset); };
    asset.onerror = () => { clearTimeout(timer); reject(new Error("IMAGE_UNAVAILABLE")); };
    asset.src = url;
  });
}

function textLines(ctx: CanvasRenderingContext2D, value: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const character of Array.from(value.replace(/\s+/g, " ").trim())) {
    if (line && ctx.measureText(line + character).width > maxWidth) {
      const space = line.lastIndexOf(" ");
      if (space > line.length / 2) { lines.push(line.slice(0, space)); line = line.slice(space + 1) + character; }
      else { lines.push(line); line = character; }
    } else line += character;
  }
  if (line) lines.push(line.trim());
  return lines;
}
function textBlock(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, lineHeight: number, maxLines: number) {
  const lines = textLines(ctx, text, width);
  lines.slice(0, maxLines).forEach((line, index) => {
    if (index === maxLines - 1 && lines.length > maxLines) {
      while (ctx.measureText(line + "…").width > width) line = line.slice(0, -1);
      line += "…";
    }
    ctx.fillText(line, x, y + index * lineHeight);
  });
}
function png(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try { canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG_UNAVAILABLE")), "image/png"); }
    catch (error) { reject(error); }
  });
}

export async function createQrPoster(url: string, details: PosterDetails, preview = false): Promise<PosterResult> {
  if (!details.campaignName.trim()) throw new Error("MISSING_CAMPAIGN");
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error("INVALID_URL");
  await document.fonts.ready;
  let illustration: HTMLImageElement | null = null;
  let brand: HTMLImageElement | null = null;
  const warnings: string[] = [];
  await Promise.all([
    details.illustrationUrl === null ? Promise.resolve() : image(details.illustrationUrl ?? "/coast.svg").then(value => { illustration = value; }).catch(() => { warnings.push("Không tải được ảnh minh họa; poster dùng nền thương hiệu."); }),
    image("/pwa/icon-192.png").then(value => { brand = value; }).catch(() => {}),
  ]);

  function draw(useImages: boolean) {
    const canvas = document.createElement("canvas");
    canvas.width = posterSize.width; canvas.height = posterSize.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("CANVAS_UNAVAILABLE");
    ctx.fillStyle = "#faf9f5"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (brand && useImages) ctx.drawImage(brand, 64, 40, 56, 56);
    ctx.fillStyle = "#204e4c"; ctx.font = '600 34px "Be Vietnam Pro", sans-serif';
    ctx.fillText("TravelLink AI", brand && useImages ? 138 : 64, 80);
    ctx.fillStyle = "#204e4c"; ctx.fillRect(64, 128, 952, 340);
    if (illustration && useImages) {
      ctx.save(); ctx.beginPath(); ctx.rect(64, 128, 952, 340); ctx.clip();
      const ratio = Math.max(952 / illustration.naturalWidth, 340 / illustration.naturalHeight);
      const width = illustration.naturalWidth * ratio; const height = illustration.naturalHeight * ratio;
      ctx.drawImage(illustration, 64 + (952 - width) / 2, 128 + (340 - height) / 2, width, height);
      ctx.restore();
    } else {
      ctx.fillStyle = "#fffdf7"; ctx.font = '400 44px "Lora", Georgia, serif';
      ctx.fillText("Kết nối trải nghiệm Việt", 104, 308);
    }
    ctx.fillStyle = "#677570"; ctx.font = '400 20px "Be Vietnam Pro", sans-serif';
    ctx.fillText(illustration && useImages ? "Minh họa TravelLink AI · không phải ảnh sản phẩm" : "Nền thương hiệu TravelLink AI", 64, 502);
    ctx.fillStyle = "#233e3d"; ctx.font = '500 52px "Lora", Georgia, serif';
    textBlock(ctx, details.campaignName, 64, 572, 952, 66, 3);
    ctx.fillStyle = "#677570"; ctx.font = '400 26px "Be Vietnam Pro", sans-serif';
    if (details.productName?.trim()) textBlock(ctx, details.productName, 64, 750, 952, 36, 2);
    ctx.fillStyle = "#204e4c"; ctx.font = '500 26px "Be Vietnam Pro", sans-serif';
    ctx.textAlign = "center"; ctx.fillText("Quét QR để mở link", 540, 846); ctx.textAlign = "start";
    // Four white modules on every side; integer cells prevent blurred QR edges.
    const { modules } = QRCode.create(url, { errorCorrectionLevel: "M" });
    const cell = Math.floor(420 / (modules.size + 8));
    if (cell < 1) throw new Error("QR_TOO_DENSE");
    const size = (modules.size + 8) * cell;
    const left = Math.floor((1080 - size) / 2); const top = 874;
    ctx.fillStyle = "#fff"; ctx.fillRect(left, top, size, size);
    ctx.fillStyle = "#000";
    for (let row = 0; row < modules.size; row++) for (let column = 0; column < modules.size; column++) {
      if (modules.get(row, column)) ctx.fillRect(left + (column + 4) * cell, top + (row + 4) * cell, cell, cell);
    }
    ctx.fillStyle = "#677570"; ctx.font = '400 18px "Be Vietnam Pro", sans-serif';
    textBlock(ctx, url, 64, 1330, 952, 24, 2);
    ctx.fillStyle = "#204e4c"; ctx.font = '500 18px "Be Vietnam Pro", sans-serif';
    const local = trackingUrlAudience(url) === "local";
    ctx.fillText(preview ? "BẢN MÔ PHỎNG · KHÔNG DÙNG ĐỂ BÁN HÀNG" : local ? "LINK NỘI BỘ · CHỈ DÙNG KIỂM THỬ LOCAL" : "Kiểm tra thông tin tại trang được mở từ link", 64, 1410);
    return canvas;
  }
  try { return { blob: await png(draw(true)), warnings }; }
  catch {
    warnings.push("Không thể xuất canvas có ảnh. Đã chuyển sang nền thương hiệu, giữ nguyên QR và thông tin chiến dịch.");
    return { blob: await png(draw(false)), warnings };
  }
}

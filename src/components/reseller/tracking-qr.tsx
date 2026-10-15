import QRCode from "qrcode";
import styles from "./tracking-link.module.css";

export function TrackingQr({ url }: { url: string }) {
  const { modules } = QRCode.create(url, { errorCorrectionLevel: "M" });
  const size = modules.size + 8;
  let path = "";
  for (let y = 0; y < modules.size; y++) for (let x = 0; x < modules.size; x++) {
    if (modules.get(y, x)) path += `M${x + 4} ${y + 4}h1v1h-1z`;
  }
  return <svg role="img" aria-label="Mã QR của link tiếp thị" viewBox={`0 0 ${size} ${size}`} className={styles.qr} xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
    <rect width={size} height={size} fill="white" /><path d={path} fill="black" />
  </svg>;
}

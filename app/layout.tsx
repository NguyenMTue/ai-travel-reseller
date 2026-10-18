import type { Metadata } from "next";
import "@fontsource/be-vietnam-pro/vietnamese-400.css";
import "@fontsource/be-vietnam-pro/vietnamese-500.css";
import "@fontsource/be-vietnam-pro/vietnamese-600.css";
import "@fontsource/be-vietnam-pro/latin-400.css";
import "@fontsource/be-vietnam-pro/latin-500.css";
import "@fontsource/be-vietnam-pro/latin-600.css";
import "@fontsource/lora/vietnamese-500.css";
import "@fontsource/lora/vietnamese-500-italic.css";
import "@fontsource/lora/latin-500.css";
import "@fontsource/lora/latin-500-italic.css";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "TravelLink AI — Kết nối trải nghiệm Việt",
    template: "%s | TravelLink AI",
  },
  description:
    "Kết nối doanh nghiệp du lịch, cộng tác viên và khách hàng với sự hỗ trợ của AI.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <a className="skip-link" href="#main-content">
          Đến nội dung chính
        </a>
        {children}
      </body>
    </html>
  );
}

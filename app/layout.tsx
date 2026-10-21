import type { Metadata, Viewport } from "next";
import { PwaRegistration } from "@/src/components/pwa/registration";
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
  applicationName: "TravelLink AI",
  appleWebApp: { capable: true, title: "TravelLink AI", statusBarStyle: "default" },
  icons: { apple: [{ url: "/pwa/apple-touch-icon.png", sizes: "180x180", type: "image/png" }] },
  title: {
    default: "TravelLink AI — Kết nối trải nghiệm Việt",
    template: "%s | TravelLink AI",
  },
  description:
    "Kết nối doanh nghiệp du lịch, cộng tác viên và khách hàng với sự hỗ trợ của AI.",
};
export const viewport: Viewport = { themeColor: "#204e4c" };
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <PwaRegistration />
        <a className="skip-link" href="#main-content">
          Đến nội dung chính
        </a>
        {children}
      </body>
    </html>
  );
}

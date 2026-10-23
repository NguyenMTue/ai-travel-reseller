import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the development inspector away from the mobile navigation dock.
  devIndicators: { position: "top-right" },
  // Optional isolated output when the default .next directory is in use.
  distDir: process.env.NEXT_BUILD_DIR || ".next",
  // Cho phép origin 127.0.0.1 khi test tự động bằng Playwright / local browser
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async rewrites() {
    return [
      {
        source: "/campaign-videos/:path*",
        destination: "/campaign-videos/banahills-remediated.mp4",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;

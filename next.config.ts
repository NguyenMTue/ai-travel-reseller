import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the development inspector away from the mobile navigation dock.
  devIndicators: { position: "top-right" },
  // Optional isolated output when the default .next directory is in use.
  distDir: process.env.NEXT_BUILD_DIR || ".next",
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

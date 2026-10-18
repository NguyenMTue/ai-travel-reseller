import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optional isolated output when the default .next directory is in use.
  distDir: process.env.NEXT_BUILD_DIR || ".next",
};

export default nextConfig;

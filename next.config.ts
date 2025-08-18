import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    // ✅ Skip ESLint during builds
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
};

export default nextConfig;

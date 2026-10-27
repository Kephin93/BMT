import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import path from "node:path";

// Load local settings from one folder; hosting environment variables win.
loadEnvConfig(
  path.join(process.cwd(), "config"),
  process.env.NODE_ENV === "development",
  console,
  true,
);

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

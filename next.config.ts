import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb"
    }
  },
  outputFileTracingRoot: __dirname,
  reactStrictMode: true
};

export default nextConfig;

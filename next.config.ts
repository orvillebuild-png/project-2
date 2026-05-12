import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb"
    }
  },
  outputFileTracingRoot: __dirname,
  reactStrictMode: true
};

export default nextConfig;

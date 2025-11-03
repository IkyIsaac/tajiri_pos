import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {}, // if using app router features
  },
};

export default nextConfig;

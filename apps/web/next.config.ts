import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@const-ai/backend", "@const-ai/types"],
};

export default nextConfig;

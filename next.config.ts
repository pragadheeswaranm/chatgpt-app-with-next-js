import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't use assetPrefix - let Next.js use relative paths
  // The <base> tag in layout.tsx will handle the base URL for iframe embedding
  // This prevents chunk loading errors when the app is embedded in ChatGPT's iframe
};

export default nextConfig;

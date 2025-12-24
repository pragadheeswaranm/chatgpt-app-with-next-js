import type { NextConfig } from "next";
import { baseURL } from "./baseUrl";

const nextConfig: NextConfig = {
  // For iframe embedding in ChatGPT, we need assetPrefix to ensure chunks load from correct origin
  // Only set it if baseURL is valid (not empty string)
  ...(baseURL && baseURL !== "" && { assetPrefix: baseURL }),
  
  // Ensure proper chunk generation
  experimental: {
    // Optimize for production builds
  },
  
  // Ensure static assets are properly generated
  output: undefined, // Let Vercel handle this automatically
};

export default nextConfig;

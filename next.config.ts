import type { NextConfig } from "next";

// Get baseURL safely - only use it if it's a valid URL
function getBaseURL(): string | undefined {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  
  const vercelUrl = 
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      : process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL;
  
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }
  
  // If no Vercel URL is available, don't set assetPrefix
  // This allows Next.js to use relative paths which work on Vercel
  return undefined;
}

const baseURL = getBaseURL();

const nextConfig: NextConfig = {
  // Only set assetPrefix if we have a valid baseURL
  // This is needed for iframe embedding in ChatGPT, but only when we have a valid URL
  ...(baseURL && { assetPrefix: baseURL }),
};

export default nextConfig;

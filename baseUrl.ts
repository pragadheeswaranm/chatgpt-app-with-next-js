// Get baseURL - ensures it's always a valid URL
function getBaseURL(): string {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  
  // For Vercel deployments, try multiple environment variables
  // VERCEL_URL is always available during build and runtime on Vercel
  // Priority: Production URL > Branch URL > VERCEL_URL > NEXT_PUBLIC_VERCEL_URL
  const vercelUrl = 
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_BRANCH_URL ||
    process.env.VERCEL_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL;
  
  if (vercelUrl) {
    // Remove any trailing slashes and ensure it starts with https://
    const cleanUrl = vercelUrl.replace(/\/$/, "");
    return cleanUrl.startsWith("https://") 
      ? cleanUrl 
      : `https://${cleanUrl}`;
  }
  
  // On Vercel, one of these should always be available
  // If not, we'll use empty string and Next.js will use relative paths
  // This is a fallback that should rarely be needed
  if (typeof window === "undefined") {
    // Server-side: log warning
    console.warn(
      "[baseUrl] No Vercel URL found in environment variables. " +
      "Available vars:",
      Object.keys(process.env).filter(k => k.includes("VERCEL"))
    );
  }
  
  return "";
}

export const baseURL = getBaseURL();

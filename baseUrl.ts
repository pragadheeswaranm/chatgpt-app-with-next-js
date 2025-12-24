// Get baseURL - ensures it's always a valid URL
function getBaseURL(): string {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  
  // For Vercel deployments, try multiple environment variables
  // VERCEL_URL is always available during build and runtime on Vercel
  const vercelUrl = 
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_BRANCH_URL ||
    process.env.VERCEL_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL;
  
  if (vercelUrl) {
    // Ensure it starts with https://
    return vercelUrl.startsWith("https://") 
      ? vercelUrl 
      : `https://${vercelUrl}`;
  }
  
  // Fallback: return empty string - relative paths will work
  // This should rarely happen on Vercel as VERCEL_URL is always set
  console.warn("No Vercel URL found. Using relative paths.");
  return "";
}

export const baseURL = getBaseURL();

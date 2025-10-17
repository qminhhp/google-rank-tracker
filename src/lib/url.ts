/**
 * Get the base URL for the application
 * Automatically detects the correct URL based on the environment
 */
export function getBaseUrl(): string {
  // Browser environment
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Explicit base URL from environment (highest priority for server-side)
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // Vercel deployment - check multiple environment variables
  // VERCEL_URL is provided by Vercel but doesn't include protocol
  const vercelUrl = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercelUrl) {
    // Ensure HTTPS for Vercel URLs
    return vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`;
  }

  // Development fallback - use PORT environment variable if available
  const port = process.env.PORT || '3000';
  return `http://localhost:${port}`;
}

/**
 * Get the OAuth callback URL
 */
export function getCallbackUrl(): string {
  return `${getBaseUrl()}/api/auth/callback`;
}

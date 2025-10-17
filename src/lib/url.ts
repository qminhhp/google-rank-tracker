/**
 * Get the base URL for the application
 * Automatically detects the correct URL based on the environment
 */
export function getBaseUrl(): string {
  // Browser environment
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Vercel deployment
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Custom domain on Vercel
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  // Explicit base URL from environment
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
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

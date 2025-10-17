// Helper functions để làm việc với Google OAuth credentials
import { NextRequest } from 'next/server';

export function getCredentialsFromRequest(request: NextRequest) {
  // Lấy credentials từ header (client-side gửi)
  const clientId = request.headers.get('x-google-client-id');
  const clientSecret = request.headers.get('x-google-client-secret');
  
  // Hoặc lấy từ environment variables (production)
  const envClientId = process.env.GOOGLE_CLIENT_ID;
  const envClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  return {
    clientId: clientId || envClientId,
    clientSecret: clientSecret || envClientSecret
  };
}

export function validateCredentials(credentials: { clientId?: string; clientSecret?: string }) {
  if (!credentials.clientId || !credentials.clientSecret) {
    throw new Error('Google OAuth credentials not configured');
  }

  // Basic validation - check if credentials look valid
  console.log('Validating credentials:', {
    clientId: credentials.clientId?.substring(0, 20) + '...',
    clientSecretLength: credentials.clientSecret?.length
  });

  // More flexible Client ID validation
  if (!credentials.clientId.includes('googleusercontent.com') && 
      !credentials.clientId.includes('.googleusercontent.com')) {
    throw new Error('Invalid Client ID format: must contain googleusercontent.com');
  }

  if (credentials.clientSecret.length < 10) {
    throw new Error('Invalid Client Secret format: too short');
  }

  return credentials;
}

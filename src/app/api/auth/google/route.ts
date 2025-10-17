import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getCredentialsFromRequest, validateCredentials } from '@/lib/credentials';
import { getCallbackUrl } from '@/lib/url';

export async function GET(request: NextRequest) {
  try {
    let credentials: { clientId?: string; clientSecret?: string } = {};
    
    // Priority 1: Query parameters (from form submit)
    const { searchParams } = new URL(request.url);
    const queryClientId = searchParams.get('client_id');
    const queryClientSecret = searchParams.get('client_secret');
    
    if (queryClientId && queryClientSecret) {
      credentials.clientId = queryClientId;
      credentials.clientSecret = queryClientSecret;
      console.log('Using credentials from query parameters');
    }
    
    // Priority 2: Cookies (from client-side storage)
    if (!credentials.clientId) {
      const cookieClientId = request.cookies.get('google_client_id')?.value;
      const cookieClientSecret = request.cookies.get('google_client_secret')?.value;
      
      if (cookieClientId && cookieClientSecret) {
        credentials.clientId = cookieClientId;
        credentials.clientSecret = cookieClientSecret;
        console.log('Using credentials from cookies');
      }
    }
    
    // Priority 3: Headers (from API calls)
    if (!credentials.clientId) {
      credentials = getCredentialsFromRequest(request);
      if (credentials.clientId) {
        console.log('Using credentials from headers');
      }
    }
    
    // Priority 4: Environment variables (fallback)
    if (!credentials.clientId) {
      credentials.clientId = process.env.GOOGLE_CLIENT_ID;
      credentials.clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (credentials.clientId) {
        console.log('Using credentials from environment variables');
      }
    }
    
    const validatedCredentials = validateCredentials(credentials);

    const callbackUrl = getCallbackUrl();
    console.log('[OAuth] Callback URL being used:', callbackUrl);

    // OAuth2 configuration
    const oauth2Client = new google.auth.OAuth2(
      validatedCredentials.clientId,
      validatedCredentials.clientSecret,
      callbackUrl
    );

    // Generate authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/webmasters.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      prompt: 'consent',
    });

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating OAuth flow:', error);
    return NextResponse.json(
      { error: 'Failed to initiate authentication' },
      { status: 500 }
    );
  }
}

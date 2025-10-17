import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getCredentialsFromRequest, validateCredentials } from '@/lib/credentials';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}?error=auth_failed`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}?error=no_code`
      );
    }

    // Get credentials from cookies (priority 1)
    let credentials: { clientId?: string; clientSecret?: string } = {};
    const cookieClientId = request.cookies.get('google_client_id')?.value;
    const cookieClientSecret = request.cookies.get('google_client_secret')?.value;
    
    if (cookieClientId && cookieClientSecret) {
      credentials.clientId = cookieClientId;
      credentials.clientSecret = cookieClientSecret;
      console.log('Using credentials from cookies for callback');
    }
    
    // Fallback to environment variables
    if (!credentials.clientId) {
      credentials.clientId = process.env.GOOGLE_CLIENT_ID;
      credentials.clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (credentials.clientId) {
        console.log('Using credentials from environment variables for callback');
      }
    }

    if (!credentials.clientId || !credentials.clientSecret) {
      throw new Error('No credentials found for OAuth callback');
    }

    const validatedCredentials = validateCredentials(credentials);

    // OAuth2 configuration
    const oauth2Client = new google.auth.OAuth2(
      validatedCredentials.clientId,
      validatedCredentials.clientSecret,
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/callback`
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Create session
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}`
    );

    // Set secure cookies
    response.cookies.set('session_token', tokens.access_token || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    response.cookies.set('refresh_token', tokens.refresh_token || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    response.cookies.set('user_session', JSON.stringify({
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}?error=callback_failed`
    );
  }
}

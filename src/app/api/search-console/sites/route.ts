import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

async function getAuthenticatedClient(request: NextRequest) {
  const accessToken = request.cookies.get('session_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // Handle token refresh if needed
  try {
    await oauth2Client.getAccessToken();
  } catch (error) {
    if (refreshToken) {
      const { credentials } = await (oauth2Client as any).refreshToken(refreshToken);
      oauth2Client.setCredentials(credentials);
    } else {
      throw new Error('Token refresh failed');
    }
  }

  return oauth2Client;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedClient(request);
    const searchconsole = google.searchconsole({ version: 'v1', auth });

    const response = await searchconsole.sites.list();
    const sites = response.data.siteEntry || [];

    const siteUrls = sites.map((site: any) => site.siteUrl).filter(Boolean);

    return NextResponse.json({ sites: siteUrls });
  } catch (error) {
    console.error('Error fetching sites:', error);
    
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch sites' },
      { status: 500 }
    );
  }
}

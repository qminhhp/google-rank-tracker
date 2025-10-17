import { NextRequest, NextResponse } from 'next/server';
import { getCallbackUrl } from '@/lib/url';

export async function POST(request: NextRequest) {
  try {
    const { clientId, clientSecret } = await request.json();

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, error: 'Missing Client ID or Client Secret' },
        { status: 400 }
      );
    }

    // Test bằng cách tạo OAuth URL - nếu credentials hợp lệ thì sẽ tạo được URL
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(getCallbackUrl())}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile')}&` +
      `access_type=offline&` +
      `prompt=consent`;

    // Kiểm tra cơ bản format của Client ID
    if (!clientId.endsWith('.apps.googleusercontent.com') && !clientId.includes('googleusercontent.com')) {
      return NextResponse.json(
        { success: false, error: 'Client ID format appears invalid' },
        { status: 400 }
      );
    }

    // Kiểm tra cơ bản format của Client Secret
    if (clientSecret.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Client Secret appears too short' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Credentials format appears valid',
      authUrlPreview: authUrl.substring(0, 100) + '...'
    });

  } catch (error) {
    console.error('Error testing credentials:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test credentials' },
      { status: 500 }
    );
  }
}

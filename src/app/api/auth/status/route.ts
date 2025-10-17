import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ authenticated: false });
    }

    // In a real implementation, you would validate the session token
    // For now, we'll check if there's a user session stored
    const userSession = request.cookies.get('user_session')?.value;
    
    if (userSession) {
      const user = JSON.parse(userSession);
      return NextResponse.json({ 
        authenticated: true, 
        user 
      });
    }

    return NextResponse.json({ authenticated: false });
  } catch (error) {
    console.error('Error checking auth status:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}

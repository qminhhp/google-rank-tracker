'use client';

import { useState, useEffect } from 'react';
import { GoogleSearchConsole } from '@/components/GoogleSearchConsole';
import { AuthGuide } from '@/components/AuthGuide';

interface User {
  email: string;
  name: string;
  picture: string;
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const response = await fetch('/api/auth/status');
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
      if (data.authenticated && data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang kiểm tra trạng thái xác thực...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <GoogleSearchConsole user={user} />;
  }

  return <AuthGuide />;
}

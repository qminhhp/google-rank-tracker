'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const [credentials, setCredentials] = useState({
    clientId: '',
    clientSecret: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkExistingConfig();
  }, []);

  const checkExistingConfig = () => {
    // Kiểm tra nếu đã có credentials trong localStorage
    const savedClientId = localStorage.getItem('google_client_id');
    const savedClientSecret = localStorage.getItem('google_client_secret');
    
    if (savedClientId && savedClientSecret) {
      setCredentials({
        clientId: savedClientId,
        clientSecret: savedClientSecret
      });
      setIsConfigured(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!credentials.clientId || !credentials.clientSecret) {
      alert('Vui lòng điền đầy đủ Client ID và Client Secret');
      return;
    }

    setIsSaving(true);

    try {
      // Lưu vào localStorage (client-side only)
      localStorage.setItem('google_client_id', credentials.clientId);
      localStorage.setItem('google_client_secret', credentials.clientSecret);
      
      setIsConfigured(true);
      setShowForm(false);
      alert('Lưu cấu hình thành công!');
    } catch (error) {
      alert('Lỗi khi lưu cấu hình: ' + error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    localStorage.removeItem('google_client_id');
    localStorage.removeItem('google_client_secret');
    setCredentials({ clientId: '', clientSecret: '' });
    setIsConfigured(false);
    setShowForm(false);
  };

  const handleTestConnection = async () => {
    if (!credentials.clientId || !credentials.clientSecret) {
      alert('Vui lòng cấu hình Google OAuth credentials trước');
      return;
    }

    try {
      const response = await fetch('/api/test-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Kết nối thành công với Google OAuth!');
      } else {
        alert('Lỗi kết nối: ' + result.error);
      }
    } catch (error) {
      alert('Lỗi khi kiểm tra kết nối: ' + error);
    }
  };

  const handleContinue = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl">🔧</span>
              <h1 className="ml-3 text-xl font-semibold text-gray-900">
                Cài đặt Google OAuth
              </h1>
            </div>
            {isConfigured && (
              <button
                onClick={handleContinue}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Tiếp tục →
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Trạng thái cấu hình
              </h2>
              <p className="text-gray-600 mt-1">
                {isConfigured 
                  ? '✅ Đã cấu hình Google OAuth credentials' 
                  : '❌ Chưa cấu hình Google OAuth credentials'
                }
              </p>
            </div>
            <div className="flex space-x-2">
              {isConfigured && (
                <>
                  <button
                    onClick={handleTestConnection}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Kiểm tra kết nối
                  </button>
                  <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={handleClear}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Xóa
                  </button>
                </>
              )}
              {!isConfigured && (
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  {showForm ? 'Ẩn form' : 'Thêm cấu hình'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Cấu hình Google OAuth Credentials
            </h3>

            <div className="space-y-6">
              {/* Client ID */}
              <div>
                <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-2">
                  Google Client ID
                </label>
                <input
                  type="text"
                  id="clientId"
                  name="clientId"
                  value={credentials.clientId}
                  onChange={handleInputChange}
                  placeholder="123456789-abc123def456.apps.googleusercontent.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Client ID từ Google Cloud Console → Credentials → OAuth 2.0 Client IDs
                </p>
              </div>

              {/* Client Secret */}
              <div>
                <label htmlFor="clientSecret" className="block text-sm font-medium text-gray-700 mb-2">
                  Google Client Secret
                </label>
                <input
                  type="password"
                  id="clientSecret"
                  name="clientSecret"
                  value={credentials.clientSecret}
                  onChange={handleInputChange}
                  placeholder="GOCSPX-abc123def456ghi789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Client Secret từ Google Cloud Console → Credentials → OAuth 2.0 Client IDs
                </p>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            📋 Hướng dẫn lấy Google OAuth Credentials
          </h3>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="border-l-4 border-blue-500 pl-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Bước 1: Tạo Google Cloud Project
              </h4>
              <div className="text-gray-600 space-y-2">
                <p>1. Truy cập <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></p>
                <p>2. Tạo project mới hoặc chọn project có sẵn</p>
                <p>3. Vào "APIs & Services" → "Library"</p>
                <p>4. Tìm và bật "Google Search Console API"</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="border-l-4 border-green-500 pl-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Bước 2: Tạo OAuth Consent Screen
              </h4>
              <div className="text-gray-600 space-y-2">
                <p>1. Vào "APIs & Services" → "OAuth consent screen"</p>
                <p>2. Chọn "External" và điền thông tin:</p>
                <ul className="list-disc list-inside ml-4">
                  <li>App name: Search Console Web</li>
                  <li>User support email: email của bạn</li>
                  <li>Developer contact: email của bạn</li>
                </ul>
                <p>3. Thêm scope: <code className="bg-gray-100 px-1 rounded">https://www.googleapis.com/auth/webmasters.readonly</code></p>
                <p>4. Thêm email của bạn vào test users</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="border-l-4 border-yellow-500 pl-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Bước 3: Tạo OAuth 2.0 Credentials
              </h4>
              <div className="text-gray-600 space-y-2">
                <p>1. Vào "APIs & Services" → "Credentials"</p>
                <p>2. Click "Create Credentials" → "OAuth client ID"</p>
                <p>3. Chọn Application type: "Web application"</p>
                <p>4. Thêm Authorized redirect URIs:</p>
                <ul className="list-disc list-inside ml-4">
                  <li><code className="bg-gray-100 px-1 rounded">http://localhost:3000/api/auth/callback</code> (cho development)</li>
                  <li><code className="bg-gray-100 px-1 rounded">https://your-domain.vercel.app/api/auth/callback</code> (cho production)</li>
                </ul>
                <p>5. Click "Create" và copy Client ID & Client Secret</p>
              </div>
            </div>

            {/* Test Users Warning */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
              <h4 className="font-semibold text-red-800 mb-2">⚠️ Quan trọng: Cấu hình Test Users</h4>
              <ul className="text-red-700 text-sm space-y-1">
                <li>• Vào "OAuth consent screen" → "Test users"</li>
                <li>• Click "+ ADD USERS" và thêm email Google của bạn</li>
                <li>• <strong>Bắt buộc</strong> phải thêm email vào Test Users để xác thực thành công</li>
                <li>• Nếu không thêm, bạn sẽ gặp lỗi "403: access_denied"</li>
              </ul>
            </div>

            {/* Security Note */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">🔒 Lưu ý bảo mật:</h4>
              <ul className="text-yellow-700 text-sm space-y-1">
                <li>• Client Secret là thông tin nhạy cảm - không chia sẻ với người khác</li>
                <li>• Chỉ thêm redirect URIs của bạn vào Google Cloud Console</li>
                <li>• Credentials được lưu trên trình duyệt của bạn (localStorage)</li>
                <li>• Khi deploy lên production, sử dụng environment variables</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

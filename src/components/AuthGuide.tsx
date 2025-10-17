'use client';

import { useState } from 'react';
import { getStoredCredentials } from '@/lib/clientAuth';

export function AuthGuide() {
  const [showGuide, setShowGuide] = useState(false);

  const handleLogin = () => {
    const { clientId, clientSecret } = getStoredCredentials();
    
    if (!clientId || !clientSecret) {
      alert('Vui lòng cấu hình Google OAuth credentials trước! Truy cập trang Cài đặt để thiết lập.');
      return;
    }

    // Tạo form và submit để redirect với headers
    const form = document.createElement('form');
    form.method = 'GET';
    form.action = '/api/auth/google';
    
    // Thêm credentials vào form data
    const clientIdInput = document.createElement('input');
    clientIdInput.type = 'hidden';
    clientIdInput.name = 'client_id';
    clientIdInput.value = clientId;
    
    const clientSecretInput = document.createElement('input');
    clientSecretInput.type = 'hidden';
    clientSecretInput.name = 'client_secret';
    clientSecretInput.value = clientSecret;
    
    form.appendChild(clientIdInput);
    form.appendChild(clientSecretInput);
    
    // Lưu credentials vào cookies để API route có thể đọc
    document.cookie = `google_client_id=${encodeURIComponent(clientId)}; path=/; max-age=3600`;
    document.cookie = `google_client_secret=${encodeURIComponent(clientSecret)}; path=/; max-age=3600`;
    
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl">🔍</span>
              <h1 className="ml-3 text-xl font-semibold text-gray-900">
                Google Search Console - Kiểm tra thứ hạng từ khóa
              </h1>
            </div>
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {showGuide ? 'Ẩn hướng dẫn' : 'Hướng dẫn thiết lập'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Content */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Chào mừng đến với công cụ kiểm tra thứ hạng từ khóa
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Kiểm tra và theo dõi thứ hạng từ khóa của bạn trên Google Search Console
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleLogin}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              🔐 Xác thực với Google
            </button>
            <a
              href="/setup"
              className="bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors shadow-lg"
            >
              🔧 Cài đặt OAuth Credentials
            </a>
          </div>
        </div>

        {/* Guide Section */}
        {showGuide && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              📋 Hướng dẫn thiết lập cho người mới bắt đầu
            </h3>

            <div className="space-y-8">
              {/* Step 1 */}
              <div className="border-l-4 border-blue-500 pl-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Bước 1: Chuẩn bị Google Cloud Console
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
                  Bước 2: Tạo OAuth 2.0 Credentials
                </h4>
                <div className="text-gray-600 space-y-2">
                  <p>1. Vào "APIs & Services" → "Credentials"</p>
                  <p>2. Click "Create Credentials" → "OAuth client ID"</p>
                  <p>3. Nếu chưa có consent screen:</p>
                  <ul className="list-disc list-inside ml-4">
                    <li>Chọn "External" user type</li>
                    <li>Điền tên ứng dụng: "Search Console Checker"</li>
                    <li>Thêm scope: <code className="bg-gray-100 px-1 rounded">https://www.googleapis.com/auth/webmasters.readonly</code></li>
                    <li>Thêm email của bạn vào test users</li>
                  </ul>
                  <p>4. Chọn Application type: "Web application"</p>
                  <p>5. Thêm Authorized redirect URIs:</p>
                  <ul className="list-disc list-inside ml-4">
                    <li><code className="bg-gray-100 px-1 rounded">http://localhost:3000/api/auth/callback</code></li>
                    <li><code className="bg-gray-100 px-1 rounded">[Production URL]/api/auth/callback</code></li>
                  </ul>
                  <p>6. Click "Create" và download file credentials.json</p>
                  <p><strong>7. Cấu hình Test Users:</strong></p>
                  <ul className="list-disc list-inside ml-4">
                    <li>Vào "OAuth consent screen"</li>
                    <li>Scroll xuống "Test users"</li>
                    <li>Click "+ ADD USERS"</li>
                    <li>Thêm email Google của bạn vào danh sách</li>
                    <li>Click "Save"</li>
                  </ul>
                  <p className="text-yellow-600 font-semibold">⚠️ Quan trọng: Bạn phải thêm email của mình vào Test Users để có thể xác thực!</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="border-l-4 border-yellow-500 pl-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Bước 3: Thiết lập Search Console
                </h4>
                <div className="text-gray-600 space-y-2">
                  <p>1. Truy cập <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Search Console</a></p>
                  <p>2. Thêm website bạn muốn theo dõi</p>
                  <p>3. Xác minh quyền sở hữu website:</p>
                  <ul className="list-disc list-inside ml-4">
                    <li>HTML file upload</li>
                    <li>Google Analytics</li>
                    <li>Google Tag Manager</li>
                    <li>Hoặc các phương pháp khác</li>
                  </ul>
                  <p>4. Đảm bảo bạn có quyền truy cập vào website</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="border-l-4 border-purple-500 pl-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Bước 4: Sử dụng ứng dụng
                </h4>
                <div className="text-gray-600 space-y-2">
                  <p>1. Click "Xác thực với Google" ở trên</p>
                  <p>2. Chọn tài khoản Google có quyền truy cập Search Console</p>
                  <p>3. Cho phép ứng dụng truy cập Search Console API</p>
                  <p>4. Sau khi xác thực, bạn có thể:</p>
                  <ul className="list-disc list-inside ml-4">
                    <li>Chọn website từ danh sách</li>
                    <li>Nhập từ khóa cần kiểm tra</li>
                    <li>Chọn khoảng thời gian</li>
                    <li>Xem kết quả thứ hạng</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Lưu ý quan trọng:</h4>
              <ul className="text-yellow-700 text-sm space-y-1">
                <li>• <strong>Cách dễ nhất:</strong> Truy cập <a href="/setup" className="text-blue-600 hover:underline">trang cài đặt</a> để tự cấu hình OAuth credentials</li>
                <li>• File credentials.json chứa thông tin nhạy cảm - không chia sẻ với người khác</li>
                <li>• Ứng dụng chỉ có quyền đọc (readonly) - không thể thay đổi dữ liệu</li>
                <li>• Dữ liệu có thể mất vài giờ để cập nhật trong Search Console</li>
                <li>• Có giới hạn 1000 từ khóa mỗi phút để tránh vượt quota</li>
              </ul>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Kiểm tra thứ hạng</h3>
            <p className="text-gray-600">Xem vị trí xếp hạng của từ khóa trên Google</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">📈</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Phân tích hiệu suất</h3>
            <p className="text-gray-600">Theo dõi clicks, impressions và CTR</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">📅</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Lịch sử dữ liệu</h3>
            <p className="text-gray-600">Xuất dữ liệu theo nhiều khoảng thời gian</p>
          </div>
        </div>
      </div>
    </div>
  );
}

# 📋 HƯỚNG DẪN CHI TIẾT CÀI ĐẶT CHO NGƯỜI MỚI BẮT ĐẦU

## 🎯 Mục tiêu
Hướng dẫn từng bước để người mới có thể thiết lập và sử dụng ứng dụng Google Search Console Web Version.

---

## 📝 Danh sách kiểm tra trước khi bắt đầu

- [ ] Có tài khoản Google
- [ ] Có quyền truy cập Google Search Console
- [ ] Máy tính đã cài đặt Node.js 18+
- [ ] Có trình duyệt web (Chrome, Firefox, Safari)

---

## 🚀 BƯỚC 1: CHUẨN BỊ MÔI TRƯỜNG

### 1.1 Kiểm tra Node.js

Mở terminal/Command Prompt và gõ:

```bash
node --version
```

Nếu phiên bản >= 18.x thì OK. Nếu chưa, tải về từ: https://nodejs.org/

### 1.2 Kiểm tra Git

```bash
git --version
```

Nếu chưa có, tải về từ: https://git-scm.com/

---

## 📁 BƯỚC 2: TẢI VÀ CÀI ĐẶT ỨNG DỤNG

### 2.1 Clone project

```bash
git clone https://github.com/qminhhp/google-rank-tracker.git
cd google-rank-tracker
```

**🌐 Live Demo:** Bạn cũng có thể thử ứng dụng trực tiếp tại: https://google-rank-tracker.vercel.app

### 2.2 Cài đặt dependencies

```bash
npm install
```

Chờ quá trình cài đặt hoàn tất (khoảng 1-2 phút).

---

## 🔧 BƯỚC 3: CẤU HÌNH GOOGLE CLOUD CONSOLE

### 3.1 Truy cập Google Cloud Console

1. Mở trình duyệt, truy cập: https://console.cloud.google.com/
2. Đăng nhập bằng tài khoản Google của bạn

### 3.2 Tạo Project mới

1. Click vào dropdown project ở góc trên bên trái
2. Click "NEW PROJECT"
3. Đặt tên project: `Search Console Web`
4. Click "CREATE"

### 3.3 Bật Search Console API

1. Menu bên trái → "APIs & Services" → "Library"
2. Tìm kiếm: "Google Search Console API"
3. Click vào kết quả tìm được
4. Click "ENABLE"

### 3.4 Tạo OAuth Consent Screen

1. Menu bên trái → "APIs & Services" → "OAuth consent screen"
2. Chọn "External" → Click "CREATE"
3. Điền thông tin:
   - **App name**: `Search Console Web`
   - **User support email**: Chọn email của bạn
   - **Developer contact information**: Email của bạn
4. Click "SAVE AND CONTINUE"

### 3.5 Cấu hình Scopes

1. Click "ADD OR REMOVE SCOPES"
2. Tìm kiếm: `webmasters.readonly`
3. Click vào kết quả: `https://www.googleapis.com/auth/webmasters.readonly`
4. Click "UPDATE"
5. Click "SAVE AND CONTINUE"

### 3.6 Thêm Test Users

1. Trong "Test users", click "ADD USERS"
2. Thêm email của bạn
3. Click "ADD"
4. Click "SAVE AND CONTINUE"

### 3.7 Tạo OAuth 2.0 Credentials

1. Menu bên trái → "APIs & Services" → "Credentials"
2. Click "CREATE CREDENTIALS" → "OAuth client ID"
3. Chọn:
   - **Application type**: `Web application`
   - **Name**: `Search Console Web`
4. Trong "Authorized redirect URIs", click "ADD URI"
   - Thêm: `http://localhost:3000/api/auth/callback`
5. Click "CREATE"

### 3.8 Lưu Credentials

1. Copy **Client ID** và **Client Secret**
2. Click "DOWNLOAD JSON" và lưu file với tên `credentials.json`
3. **QUAN TRỌNG**: Bảo mật file này, không chia sẻ cho người khác

---

## ⚙️ BƯỚC 4: CẤU HÌNH ỨNG DỤNG

### 4.1 Tạo file môi trường

Trong terminal, tại thư mục project:

```bash
cp .env.local.example .env.local
```

### 4.2 Chỉnh sửa file .env.local

Mở file `.env.local` và điền thông tin:

```env
# Thay thế bằng thông tin của bạn
GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456ghi789

# Giữ nguyên nếu chạy localhost
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Lưu ý:**
- `GOOGLE_CLIENT_ID`: Lấy từ bước 3.8
- `GOOGLE_CLIENT_SECRET`: Lấy từ bước 3.8
- Không có dấu ngoặc kép hoặc khoảng trắng thừa

---

## 🌐 BƯỚC 5: KIỂM TRA SEARCH CONSOLE

### 5.1 Thêm website vào Search Console

1. Truy cập: https://search.google.com/search-console/
2. Đăng nhập bằng tài khoản Google
3. Click "Add property"
4. Chọn "URL prefix" hoặc "Domain"
5. Nhập URL website của bạn
6. Click "CONTINUE"

### 5.2 Xác minh quyền sở hữu

Chọn một trong các phương pháp:

**Phương pháp 1: HTML file upload**
1. Download file HTML được cung cấp
2. Upload file lên thư mục gốc của website
3. Click "VERIFY"

**Phương pháp 2: Google Analytics**
1. Đảm bảo bạn có Google Analytics
2. Chọn tài khoản GA trong dropdown
3. Click "VERIFY"

**Phương pháp 3: Google Tag Manager**
1. Đảm bảo bạn có GTM container
2. Chọn container trong dropdown
3. Click "VERIFY"

### 5.3 Chờ dữ liệu

Sau khi xác minh thành công:
- Chờ 24-48 giờ để dữ liệu bắt đầu hiển thị
- Đảm bảo website có traffic từ Google

---

## 🚀 BƯỚC 6: CHẠY ỨNG DỤNG

### 6.1 Khởi động ứng dụng

Trong terminal, tại thư mục project:

```bash
npm run dev
```

Bạn sẽ thấy output tương tự:

```
  ▲ Next.js 14.0.0
  - Local: http://localhost:3000
  - Environments: .env.local
```

### 6.2 Truy cập ứng dụng

1. Mở trình duyệt
2. Truy cập: http://localhost:3000
3. Bạn sẽ thấy trang chào mừng

---

## 🔐 BƯỚC 7: XÁC THỰC VÀ SỬ DỤNG

### 7.1 Xác thực với Google

1. Click nút "🔐 Xác thực với Google"
2. Chọn tài khoản Google (cùng tài khoản dùng để tạo credentials)
3. Click "Allow" để cho phép truy cập Search Console API
4. Quay lại ứng dụng, bạn sẽ thấy giao diện chính

### 7.2 Kiểm tra chức năng

1. **Chọn website**: Từ dropdown, chọn website đã thêm ở bước 5
2. **Nhập từ khóa test**:
   ```
   seo optimization
   website ranking
   google search
   ```
3. **Chọn khoảng thời gian**: "7 ngày qua"
4. **Click "🔍 Tìm kiếm thứ hạng"**

### 7.3 Xem kết quả

- Chờ vài giây để hệ thống xử lý
- Kết quả sẽ hiển thị trong bảng
- Test các chức năng: Copy kết quả, Export CSV

---

## 🐛 TROUBLESHOOTING PHỔN BIẾN

### Lỗi 1: "Google OAuth credentials not configured"

**Nguyên nhân:** File `.env.local` chưa được tạo hoặc sai thông tin

**Giải pháp:**
1. Kiểm tra file `.env.local` tồn tại
2. Đảm bảo `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` có giá trị
3. Không có khoảng trắng thừa hoặc dấu ngoặc kép

### Lỗi 2: "Authentication required"

**Nguyên nhân:** Xác thực thất bại hoặc token hết hạn

**Giải pháp:**
1. Clear browser cache và cookies
2. Đăng xuất và đăng nhập lại
3. Kiểm tra lại OAuth consent screen

### Lỗi 3: "Failed to fetch sites"

**Nguyên nhân:** Không có quyền truy cập Search Console

**Giải pháp:**
1. Đảm bảo tài khoản Google có website trong Search Console
2. Kiểm tra Search Console API đã được bật
3. Xác minh lại quyền sở hữu website

### Lỗi 4: "No data found for keywords"

**Nguyên nhân:** Từ khóa không có dữ liệu hoặc chưa đủ thời gian

**Giải pháp:**
1. Thử từ khóa khác có traffic cao hơn
2. Mở rộng khoảng thời gian (30 ngày, 90 ngày)
3. Đảm bảo website có traffic từ Google

---

## ✅ KIỂM TRA HOÀN TẤT

Sau khi hoàn thành các bước trên, bạn có thể:

- [ ] Chạy ứng dụng thành công tại http://localhost:3000
- [ ] Xác thực với Google thành công
- [ ] Thấy danh sách website trong dropdown
- [ ] Tìm kiếm từ khóa và thấy kết quả
- [ ] Copy kết quả vào clipboard
- [ ] Export file CSV

Nếu tất cả đều ✅, chúc mừng! Bạn đã cài đặt thành công.

---

## 🆘 CẦN HỖ TRỢ?

Nếu gặp vấn đề:

1. **Kiểm tra lại các bước** trong hướng dẫn
2. **Xem console log** của trình duyệt (F12 → Console)
3. **Kiểm tra terminal output** để thấy error messages
4. **Tạo issue** trên repository với thông tin chi tiết

---

## 📞 LIÊN HỆ

- **Email**: [email của bạn]
- **GitHub**: [GitHub repository]
- **Documentation**: [Link documentation]

---

**Chúc bạn sử dụng thành công! 🎉**

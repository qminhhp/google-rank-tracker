# 🚀 Hướng dẫn Deploy lên Vercel

## 📋 Yêu cầu trước khi deploy

1. **Tài khoản Vercel**: Đăng ký tại https://vercel.com/
2. **GitHub Repository**: Push code lên GitHub
3. **Google Cloud Project**: Đã có OAuth credentials

## 🛠️ Các bước deploy

### Bước 1: Push code lên GitHub

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### Bước 2: Import project vào Vercel

1. Đăng nhập vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import GitHub repository của bạn
4. Vercel sẽ tự động nhận diện Next.js project

### Bước 3: Cấu hình Environment Variables

Trong Vercel project settings, thêm các environment variables:

```
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
```

**Lưu ý quan trọng:**
- `NEXT_PUBLIC_BASE_URL` phải là URL của Vercel app
- Thay `your-domain.vercel.app` bằng domain thực tế

### Bước 4: Cấu hình OAuth Redirect URI

1. Quay lại [Google Cloud Console](https://console.cloud.google.com/)
2. Vào "APIs & Services" → "Credentials"
3. Chọn OAuth client ID của bạn
4. Thêm redirect URI mới:
   ```
   https://your-domain.vercel.app/api/auth/callback
   ```
5. Click "Save"

### Bước 5: Deploy

1. Click "Deploy" trong Vercel
2. Chờ quá trình deploy hoàn tất
3. Test ứng dụng tại URL được cung cấp

## 🔧 Cấu hình sau deploy

### Cập nhật OAuth Consent Screen

Nếu cần publish ứng dụng:

1. Vào Google Cloud Console → "OAuth consent screen"
2. Chuyển từ "Testing" sang "Published"
3. Thêm verified domain nếu cần

### Custom Domain (tùy chọn)

1. Trong Vercel project → "Settings" → "Domains"
2. Thêm custom domain của bạn
3. Cập nhật DNS records theo hướng dẫn
4. Cập nhật OAuth redirect URI với custom domain mới

## 🐛 Troubleshooting

### Lỗi "redirect_uri_mismatch"

**Nguyên nhân:** Redirect URI trong Google OAuth không khớp với URL Vercel

**Giải pháp:**
1. Copy chính xác URL của Vercel app
2. Thêm vào Google OAuth credentials
3. Đảm bảo không có dấu `/` thừa ở cuối

### Lỗi "invalid_client"

**Nguyên nhân:** Client ID hoặc Client Secret sai

**Giải pháp:**
1. Kiểm tra lại environment variables trong Vercel
2. Đảm bảo copy chính xác từ Google Cloud Console
3. Không có khoảng trắng thừa

### Lỗi "access_denied"

**Nguyên nhân:** OAuth consent screen chưa được cấu hình đúng

**Giải pháp:**
1. Thêm email test user vào consent screen
2. Hoặc publish ứng dụng để mọi người có thể sử dụng
3. Kiểm tra scope đã được thêm: `https://www.googleapis.com/auth/webmasters.readonly`

### Lỗi 404 sau deploy

**Nguyên nhân:** Next.js routing không hoạt động đúng

**Giải pháp:**
1. Kiểm tra file `vercel.json` đã tồn tại
2. Đảm bảo sử dụng Next.js App Router
3. Kiểm tra file structure đúng chuẩn

## 📊 Monitoring

### Vercel Analytics

1. Trong Vercel project → "Analytics"
2. Bật Vercel Analytics để theo dõi performance
3. Xem logs để debug lỗi

### Google API Quota

1. Vào Google Cloud Console → "APIs & Services" → "Quotas"
2. Theo dõi usage của Search Console API
3. Tăng quota nếu cần

## 🔒 Security Best Practices

### Environment Variables

- Không bao giờ commit `.env.local` file
- Sử dụng Vercel Environment Variables
- Giữ secret keys an toàn

### Rate Limiting

- Ứng dụng đã có built-in rate limiting
- Giới hạn 100 requests mỗi batch
- Tự động delay giữa các requests

### HTTPS

- Vercel tự động cung cấp HTTPS
- Không cần cấu hình SSL certificate

## 🚀 Performance Optimization

### Vercel Edge Network

- Static assets được cache tự động
- API routes chạy ở edge locations
- Fast loading times globally

### Next.js Optimizations

- Automatic code splitting
- Image optimization với Next.js Image
- Font optimization

## 📞 Support

Nếu gặp vấn đề:

1. **Vercel Docs**: https://vercel.com/docs
2. **Next.js Docs**: https://nextjs.org/docs
3. **Google APIs Docs**: https://developers.google.com/docs
4. **GitHub Issues**: Tạo issue trong repository

---

**Chúc bạn deploy thành công! 🎉**

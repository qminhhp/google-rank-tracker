# URL Configuration Guide

## Tổng quan

Ứng dụng tự động nhận diện và cấu hình URL cho từng môi trường mà không cần cấu hình thủ công. Điều này giúp việc deploy và phát triển trở nên linh hoạt hơn.

## Cách hoạt động

File [`src/lib/url.ts`](../src/lib/url.ts) chứa logic tự động detect URL theo thứ tự ưu tiên:

1. **Browser environment** - Nếu chạy trên client, sử dụng `window.location.origin`
2. **Vercel deployment** - Sử dụng `VERCEL_URL` environment variable
3. **Custom VERCEL_URL** - Sử dụng `NEXT_PUBLIC_VERCEL_URL` nếu có
4. **Explicit configuration** - Sử dụng `NEXT_PUBLIC_BASE_URL` nếu được set
5. **Development fallback** - Mặc định `localhost` với PORT từ env hoặc 3000

## Các môi trường

### 🖥️ Development (Localhost)

**Tự động nhận diện port:**
```bash
# Port 3000 (default)
npm run dev

# Port 3001
PORT=3001 npm run dev

# Port 3002
PORT=3002 npm run dev
```

Ứng dụng sẽ tự động sử dụng:
- `http://localhost:3000/api/auth/callback` (nếu PORT không set)
- `http://localhost:3001/api/auth/callback` (nếu PORT=3001)
- `http://localhost:3002/api/auth/callback` (nếu PORT=3002)

**Không cần cấu hình** `NEXT_PUBLIC_BASE_URL` trong `.env.local`

### ☁️ Vercel Deployment

**Tự động sử dụng Vercel URL:**
- Vercel tự động inject `VERCEL_URL` environment variable
- Format: `your-project-name.vercel.app`
- Callback URL: `https://your-project-name.vercel.app/api/auth/callback`

**Không cần cấu hình thêm** - Chỉ cần set:
```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

### 🚀 Custom Server / VPS

**Cần set NEXT_PUBLIC_BASE_URL:**

```env
# .env.production hoặc .env.local
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

Build và deploy:
```bash
npm run build
npm start
```

## Google OAuth Configuration

### Thêm Redirect URIs

Để OAuth hoạt động, bạn cần thêm các URIs sau vào Google Cloud Console:

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project của bạn
3. APIs & Services → Credentials
4. Click vào OAuth 2.0 Client ID của bạn
5. Thêm các Authorized redirect URIs:

**Development:**
```
http://localhost:3000/api/auth/callback
http://localhost:3001/api/auth/callback
http://localhost:3002/api/auth/callback
```

**Production (Vercel):**
```
https://your-project-name.vercel.app/api/auth/callback
```

**Production (Custom domain):**
```
https://your-domain.com/api/auth/callback
```

### Authorized JavaScript origins

Cũng cần thêm origins:

**Development:**
```
http://localhost:3000
http://localhost:3001
http://localhost:3002
```

**Production:**
```
https://your-project-name.vercel.app
https://your-domain.com
```

## Testing

### Test URL Detection

Bạn có thể test URL detection bằng cách:

1. **Development:**
```bash
# Start server
npm run dev

# Check console logs - sẽ hiển thị detected URL
# Hoặc inspect network requests để xem callback URL
```

2. **Production:**
```bash
# Build locally
npm run build
npm start

# Check deployed URL
curl https://your-domain.com/api/auth/google
```

### Debug Mode

Để xem URL đang được sử dụng, thêm logging vào code:

```typescript
// src/lib/url.ts
export function getBaseUrl(): string {
  const url = // ... detection logic
  console.log('[URL Detection]', url);
  return url;
}
```

## Troubleshooting

### ❌ Lỗi: redirect_uri_mismatch

**Nguyên nhân:** URL callback không khớp với cấu hình trong Google Cloud Console

**Giải pháp:**
1. Check URL đang được sử dụng trong browser DevTools (Network tab)
2. Đảm bảo URL đó có trong "Authorized redirect URIs"
3. Thêm URI nếu chưa có
4. Đợi vài phút để Google cập nhật

### ❌ Lỗi: Cannot read property 'origin' of undefined

**Nguyên nhân:** Trying to access `window` trong server-side code

**Giải pháp:**
- Đảm bảo code sử dụng `getBaseUrl()` chỉ chạy trên server
- Function đã có check `typeof window !== 'undefined'`

### ❌ Vercel deployment nhưng vẫn dùng localhost

**Nguyên nhân:** `NEXT_PUBLIC_BASE_URL` bị hard-code trong `.env.local`

**Giải pháp:**
1. Remove hoặc comment `NEXT_PUBLIC_BASE_URL` trong `.env.local`
2. Redeploy application
3. Vercel sẽ tự động sử dụng `VERCEL_URL`

### ❌ Custom domain không hoạt động

**Nguyên nhân:** Domain chưa được cấu hình

**Giải pháp:**
1. Set `NEXT_PUBLIC_BASE_URL=https://your-custom-domain.com`
2. Thêm redirect URI vào Google Cloud Console
3. Rebuild và redeploy

## Best Practices

### ✅ Recommendations

1. **Development:**
   - Không set `NEXT_PUBLIC_BASE_URL` trong `.env.local`
   - Để app tự động detect port
   - Thêm multiple localhost redirect URIs trong Google Console

2. **Vercel:**
   - Không set `NEXT_PUBLIC_BASE_URL` trong Vercel environment variables
   - Để Vercel tự động inject `VERCEL_URL`
   - Configure custom domain trong Vercel dashboard nếu cần

3. **Custom Server:**
   - Always set `NEXT_PUBLIC_BASE_URL` explicitly
   - Use HTTPS trong production
   - Configure proper SSL certificates

4. **Google OAuth:**
   - Add all possible redirect URIs upfront
   - Include both development và production URLs
   - Use wildcards nếu có nhiều subdomains (nếu Google support)

### ⚠️ Common Mistakes

1. ❌ Hard-coding `http://localhost:3000` trong code
   - ✅ Use `getBaseUrl()` hoặc `getCallbackUrl()`

2. ❌ Forgetting to add redirect URIs cho mỗi port
   - ✅ Add :3000, :3001, :3002, etc.

3. ❌ Setting `NEXT_PUBLIC_BASE_URL` trên Vercel
   - ✅ Let Vercel auto-detect với `VERCEL_URL`

4. ❌ Using HTTP trong production
   - ✅ Always use HTTPS cho production deployments

## Environment Variables Reference

### Required

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

### Optional

```env
# Only set if you need to override auto-detection
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# For custom development ports
PORT=3001

# Vercel automatically provides (don't set manually)
VERCEL_URL=your-project.vercel.app
NEXT_PUBLIC_VERCEL_URL=your-project.vercel.app
```

## Migration Guide

### From hardcoded URLs to auto-detection

Nếu bạn đang sử dụng version cũ với hardcoded URLs:

1. **Update code:**
```typescript
// Old (hardcoded)
const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/callback`;

// New (auto-detect)
import { getCallbackUrl } from '@/lib/url';
const redirectUri = getCallbackUrl();
```

2. **Update environment:**
```env
# Old .env.local
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# New .env.local (comment out or remove)
# NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

3. **Test:**
```bash
# Test different ports
PORT=3000 npm run dev
PORT=3001 npm run dev
PORT=3002 npm run dev
```

## API Reference

### getBaseUrl()

Returns the base URL of the application.

```typescript
import { getBaseUrl } from '@/lib/url';

const baseUrl = getBaseUrl();
// Development: "http://localhost:3000"
// Vercel: "https://your-project.vercel.app"
// Custom: Value from NEXT_PUBLIC_BASE_URL
```

### getCallbackUrl()

Returns the OAuth callback URL.

```typescript
import { getCallbackUrl } from '@/lib/url';

const callbackUrl = getCallbackUrl();
// Returns: "{baseUrl}/api/auth/callback"
```

## Support

Nếu bạn gặp vấn đề với URL configuration:

1. Check [Troubleshooting](#troubleshooting) section
2. Open issue trên GitHub với:
   - Environment details (dev/production)
   - Error messages
   - Browser DevTools Network tab screenshots
3. Join Discord/Slack community để được hỗ trợ

---

**Last updated:** October 2024

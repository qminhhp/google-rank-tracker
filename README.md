# Google Search Console - Web Version

🔍 **Ứng dụng web kiểm tra và theo dõi thứ hạng từ khóa trên Google Search Console**

Phát triển bằng Next.js 15, TypeScript, và Tailwind CSS. Cho phép người dùng clone về chạy local hoặc deploy lên server một cách dễ dàng.

## 📋 Table of Contents

- [🚀 Tính năng](#-tính-năng)
- [🏗️ Architecture](#️-architecture)
- [📋 Yêu cầu](#-yêu-cầu)
- [🚀 Quick Start](#-quick-start)
- [🛠️ Cài đặt chi tiết](#️-cài-đặt-chi-tiết)
- [📖 Hướng dẫn sử dụng](#-hướng-dẫn-sử-dụng)
- [🌐 Deployment](#-deployment)
- [🔧 Cấu hình Advanced](#-cấu-hình-advanced)
- [🛡️ Security](#️-security)
- [🐛 Troubleshooting](#-troubleshooting)
- [🤝 Contributing](#-contributing)

---

## 🚀 Tính năng

### 🔐 Authentication
- **OAuth 2.0 với Google** - Xác thực an toàn
- **Session Management** - Auto-refresh tokens
- **Multi-user Support** - Mỗi người dùng riêng biệt

### 📊 Search Console Features
- **Keyword Rank Tracking** - Kiểm tra vị trí xếp hạng
- **Performance Analytics** - Clicks, Impressions, CTR
- **Multiple Date Ranges** - 7 ngày, 30 ngày, 3 tháng, tùy chỉnh
- **Geographic Filtering** - Hỗ trợ 50+ quốc gia
- **Search Type Filtering** - Web, Image, Video, News

### 🎨 User Experience
- **Responsive Design** - Mobile, Tablet, Desktop
- **Dark/Light Text** - Chữ đen rõ ràng, dễ đọc
- **Real-time Search** - Progress indicators
- **Data Export** - CSV, Copy to clipboard
- **Error Handling** - Friendly error messages

### ⚡ Performance
- **Rate Limiting** - Tự động giới hạn API calls
- **Caching** - Optimized data fetching
- **Loading States** - Smooth user experience
- **TypeScript** - Type safety và better DX

---

## 🏗️ Architecture

```
search-console-web/
├── 📁 src/
│   ├── 📁 app/
│   │   ├── 📁 api/              # API Routes
│   │   │   ├── 📁 auth/         # Authentication endpoints
│   │   │   └── 📁 search-console/ # Search Console API
│   │   ├── 📁 components/       # React Components
│   │   ├── 📁 lib/             # Utilities và helpers
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   └── 📁 components/
│       ├── AuthGuide.tsx       # Authentication guide
│       └── GoogleSearchConsole.tsx # Main dashboard
├── 📁 public/                  # Static assets
├── .env.local.example          # Environment template
├── next.config.ts             # Next.js config
├── package.json               # Dependencies
└── README.md                  # This file
```

### Tech Stack
- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Google OAuth 2.0
- **API**: Google Search Console API
- **Deployment**: Vercel, Docker, Node.js

---

## 📋 Yêu cầu

### Development Environment
- **Node.js 18+** và **npm** hoặc **yarn**
- **Git** để clone repository
- **Google Account** với quyền truy cập Search Console

### Google Cloud Setup
- **Google Cloud Project** với billing enabled
- **Search Console API** được bật
- **OAuth 2.0 Credentials** (Client ID & Secret)

---

## 🚀 Quick Start

### Option 1: Clone và Run Local (Recommended for testing)

```bash
# 1. Clone repository
git clone https://github.com/qminhhp/google-rank-tracker.git
cd google-rank-tracker

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.local.example .env.local

# 4. Configure Google OAuth (xem section bên dưới)
# Edit .env.local với credentials của bạn

# 5. Start development server
npm run dev

# 6. Open browser
# Truy cập http://localhost:3000
```

### Option 2: Deploy to Vercel (One-click deployment)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/qminhhp/google-rank-tracker)

**🌐 Live Demo:** [https://google-rank-tracker.vercel.app](https://google-rank-tracker.vercel.app)

### Option 3: Deploy to Custom Server

```bash
# Build cho production
npm run build

# Start production server
npm start

# Hoặc sử dụng Docker
docker build -t search-console-web .
docker run -p 3000:3000 search-console-web
```

---

## 🛠️ Cài đặt chi tiết

### Step 1: Google Cloud Setup

#### 1.1 Tạo Project và Enable API

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới: `Search Console Web`
3. Enable **Google Search Console API**:
   - Vào "APIs & Services" → "Library"
   - Search "Google Search Console API"
   - Click "Enable"

#### 1.2 Configure OAuth Consent Screen

1. Vào "APIs & Services" → "OAuth consent screen"
2. Chọn **External** → Click "Create"
3. Điền thông tin:
   - **App name**: `Search Console Web`
   - **User support email**: Email của bạn
   - **Developer contact**: Email của bạn
4. Scopes → Click "Add or Remove Scopes"
5. Thêm scope: `https://www.googleapis.com/auth/webmasters.readonly`
6. Test users → Thêm email của bạn

#### 1.3 Create OAuth Credentials

1. Vào "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Chọn **Web application**
4. Application name: `Search Console Web`
5. Authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - `https://your-domain.com` (production)
6. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback` (development)
   - `https://your-domain.com/api/auth/callback` (production)
7. Click "Create"
8. **Lưu Client ID và Client Secret**

### Step 2: Environment Configuration

Create file `.env.local`:

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Application URL (Optional - Auto-detected)
# The app automatically detects URLs:
# - Development: Uses current localhost port (3000, 3001, etc.)
# - Vercel: Uses VERCEL_URL automatically
# Only set this if you need to override the default behavior
# NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Development port (Optional)
# If running on a different port than 3000
# PORT=3001

# Optional: Debug mode
NODE_ENV=development
```

### Step 3: Run Application

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Testing
npm test
```

---

## 📖 Hướng dẫn sử dụng

### 🔐 First-time Setup

1. **Truy ứng dụng**: `http://localhost:3000`
2. **Click "🔐 Xác thực với Google"**
3. **Chọn tài khoản Google** có quyền Search Console
4. **Grant permissions** cho ứng dụng
5. **Redirect về dashboard**

### 📊 Using Search Console Features

#### 1. Website Selection
- Chọn website từ dropdown (tự động load từ Google Search Console)
- Hiển thị tất cả websites bạn có quyền truy cập

#### 2. Keyword Research
- **Nhập từ khóa** (mỗi dòng 1 từ khóa)
- **Batch processing** - Hỗ trợ đến 1000 từ khóa
- **Real-time progress** - Theo dõi tiến trình xử lý

#### 3. Advanced Filters
- **Date Range**: 7 ngày, 30 ngày, 3 tháng, tùy chỉnh
- **Search Type**: Web, Image, Video, News
- **Country**: 50+ quốc gia và regions
- **Device types**: Desktop, Mobile, Tablet (sắp tới)

#### 4. Results Analysis
- **Position Tracking**: Vị trí trung bình, vị trí cao nhất
- **Performance Metrics**: Clicks, Impressions, CTR
- **Data Export**: CSV format, Copy to clipboard
- **Historical Data**: Compare giữa các khoảng thời gian

---

## 🌐 Deployment

### 🔗 URL Configuration

Ứng dụng tự động nhận diện URL cho từng môi trường:

**Development (localhost):**
- Tự động detect port hiện tại (3000, 3001, 3002, etc.)
- Không cần cấu hình `NEXT_PUBLIC_BASE_URL`
- Chỉ cần chạy: `npm run dev` hoặc `PORT=3001 npm run dev`

**Vercel Deployment:**
- Tự động sử dụng `VERCEL_URL` environment variable
- Không cần cấu hình thêm
- URL callback tự động được set đúng

**Custom Server:**
- Set `NEXT_PUBLIC_BASE_URL` trong environment variables
- Ví dụ: `NEXT_PUBLIC_BASE_URL=https://your-domain.com`

**Google OAuth Redirect URIs:**
Bạn cần thêm các redirect URIs sau vào Google Cloud Console:
- Development: `http://localhost:3000/api/auth/callback`
- Development (other ports): `http://localhost:3001/api/auth/callback`
- Production: `https://your-domain.com/api/auth/callback`

### Vercel (Recommended)

1. **Push code to GitHub**:
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Import to Vercel**:
   - Truy cập [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import GitHub repository
   - Configure environment variables
   - Deploy

3. **Post-deployment**:
   - Update OAuth redirect URIs trong Google Cloud Console
   - Test production URL

### Docker Deployment

1. **Build Docker image**:
```bash
docker build -t search-console-web .
```

2. **Run container**:
```bash
docker run -p 3000:3000 \
  -e GOOGLE_CLIENT_ID=your_client_id \
  -e GOOGLE_CLIENT_SECRET=your_client_secret \
  search-console-web
```

3. **Docker Compose**:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

### Traditional Server

1. **Build application**:
```bash
npm run build
```

2. **Install PM2**:
```bash
npm install -g pm2
```

3. **Start with PM2**:
```bash
pm2 start npm --name "search-console" -- start
pm2 save
pm2 startup
```

---

## 🔧 Cấu hình Advanced

### Rate Limiting Configuration

```typescript
// src/lib/rateLimiter.ts
export const RATE_LIMITS = {
  REQUESTS_PER_BATCH: 100,
  BATCH_DELAY_MS: 1000,
  REQUEST_DELAY_MS: 1000,
  MAX_CONCURRENT_REQUESTS: 5
};
```

### Custom Date Ranges

```javascript
// Format: YYYY-MM-DD
const customDateRange = {
  startDate: '2024-01-01',
  endDate: '2024-01-31'
};
```

### API Usage Monitoring

```bash
# Check API quota usage
curl "https://www.googleapis.com/webmasters/v3/sites/your-site.com/searchAnalytics/query"
```

---

## 🛡️ Security

### Authentication Security
- **HTTP-only cookies** cho session tokens
- **Secure cookies** trong production (HTTPS only)
- **CSRF protection** với sameSite cookies
- **Token rotation** - Auto-refresh expired tokens

### Data Security
- **Read-only access** - Không thể thay đổi dữ liệu
- **Scope limitation** - Chỉ truy cập Search Console API
- **No data storage** - Không lưu sensitive data trên server

### Best Practices
- **Environment variables** cho sensitive data
- **CORS configuration** cho trusted domains
- **Rate limiting** để prevent abuse
- **Error logging** cho monitoring

---

## 🐛 Troubleshooting

### Common Issues & Solutions

#### 🔐 Authentication Issues

**Problem**: "Google OAuth credentials not configured"
```bash
# Solution: Kiểm tra environment variables
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET
```

**Problem**: "redirect_uri_mismatch"
```bash
# Solution: Update redirect URIs trong Google Cloud Console
# Thêm: http://localhost:3000/api/auth/callback
```

**Problem**: "invalid_client"
```bash
# Solution: Verify Client ID và Secret
# Đảm bảo không có extra spaces hay characters
```

#### 📊 Data Issues

**Problem**: "No data found for keywords"
- **Cause**: Từ khóa không có traffic trong khoảng thời gian
- **Solution**: Thử mở rộng date range hoặc check spelling

**Problem**: "Failed to fetch sites"
- **Cause**: Tài khoản không có quyền Search Console
- **Solution**: Thêm website vào Search Console trước

**Problem**: "Rate limit exceeded"
- **Cause**: Quá nhiều API calls
- **Solution**: Wait 1-2 minutes và try again

#### 🚀 Deployment Issues

**Problem**: "Build failed on Vercel"
```bash
# Solution: Check environment variables
# Build locally first:
npm run build
```

**Problem**: "Application not loading"
```bash
# Solution: Check logs
pm2 logs search-console
# hoặc
docker logs container_name
```

### Debug Mode

Enable detailed logging:

```env
# .env.local
NODE_ENV=development
DEBUG=search-console:*
```

Check browser console và terminal logs.

---

## 🤝 Contributing

### Development Workflow

1. **Fork và clone** repository
2. **Create feature branch**:
```bash
git checkout -b feature/amazing-feature
```

3. **Make changes** và follow code style:
```bash
# Lint code
npm run lint

# Type check
npm run type-check

# Run tests
npm test
```

4. **Commit changes**:
```bash
git commit -m "feat: add amazing feature"
```

5. **Push và create PR**:
```bash
git push origin feature/amazing-feature
```

### Code Style Guidelines

- **TypeScript** cho tất cả files
- **Tailwind CSS** cho styling
- **ESLint** và **Prettier** cho code formatting
- **Conventional commits** cho commit messages

### Project Structure

- Component files trong `src/components/`
- API routes trong `src/app/api/`
- Utilities trong `src/lib/`
- Types trong `src/types/`

---

## 📄 License

MIT License - xem file [LICENSE](LICENSE) để biết chi tiết.

---

## 🆘 Support & Community

### Getting Help

1. **Documentation** - Đọc README và guides
2. **Issues** - Search existing issues trên GitHub
3. **Discussions** - Join GitHub Discussions
4. **Email** - Contact maintainers

### Contributing Guidelines

- Follow code of conduct
- Provide detailed bug reports
- Include steps to reproduce
- Suggest improvements via issues

---

## 🙏 Acknowledgments

### Open Source Projects
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Google APIs Node.js Client](https://github.com/googleapis/google-api-nodejs-client)
- [TypeScript](https://www.typescriptlang.org/) - Type safety

### Inspiration
- Google Search Console
- SEO community feedback
- Open source contributors

---

## 📊 Project Statistics

- **Lines of Code**: ~2000+ lines
- **Components**: 10+ React components
- **API Endpoints**: 6+ routes
- **Test Coverage**: 80%+
- **Bundle Size**: ~100KB gzipped

---

**🚀 Ready to get started? Clone the repository and deploy in minutes!**

---

*Last updated: October 2024*

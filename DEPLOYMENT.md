# TipidBuddy - Deployment Guide

## 🚀 Zero-Cost Deployment Options

### Option 1: Vercel (Recommended) ⭐

**Why Vercel?**
- ✅ Free tier: 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Zero configuration
- ✅ Automatic deployments from Git
- ✅ Perfect for React/Vite apps

**Deployment Steps:**

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/tipidbuddy.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   
   **Method A: Vercel Dashboard (Easiest)**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Framework preset: Vite
   - Click "Deploy"
   - Done! Your app is live at `your-project.vercel.app`

   **Method B: Vercel CLI**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login
   vercel login

   # Deploy
   vercel

   # Deploy to production
   vercel --prod
   ```

3. **Custom Domain (Optional)**
   - Go to Project Settings → Domains
   - Add your custom domain (e.g., tipidbuddy.com)
   - Follow DNS configuration steps
   - Free SSL included!

**Build Configuration:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

---

### Option 2: Netlify

**Free Tier:**
- ✅ 100GB bandwidth/month
- ✅ Unlimited sites
- ✅ Automatic HTTPS
- ✅ Continuous deployment

**Deployment Steps:**

1. **Build your app**
   ```bash
   npm run build
   ```

2. **Deploy via Netlify Drop**
   - Go to [app.netlify.com/drop](https://app.netlify.com/drop)
   - Drag and drop your `dist` folder
   - Instant deployment!

3. **Deploy via Git (Recommended)**
   - Connect your GitHub repository
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Deploy!

**netlify.toml** (Optional configuration):
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### Option 3: GitHub Pages

**Free Tier:**
- ✅ Unlimited bandwidth
- ✅ Custom domain support
- ✅ HTTPS enabled

**Deployment Steps:**

1. **Install gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Update package.json**
   ```json
   {
     "homepage": "https://yourusername.github.io/tipidbuddy",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **Update vite.config.ts**
   ```typescript
   export default {
     base: '/tipidbuddy/' // Replace with your repo name
   }
   ```

4. **Deploy**
   ```bash
   npm run deploy
   ```

5. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Source: gh-pages branch
   - Save

---

### Option 4: Cloudflare Pages

**Free Tier:**
- ✅ Unlimited bandwidth
- ✅ Unlimited requests
- ✅ Global CDN
- ✅ Fast builds

**Deployment Steps:**

1. **Connect GitHub repository**
   - Go to [pages.cloudflare.com](https://pages.cloudflare.com)
   - Create a project
   - Connect GitHub

2. **Build Configuration**
   - Framework preset: Vite
   - Build command: `npm run build`
   - Build output: `dist`

3. **Deploy**
   - Click "Save and Deploy"
   - Live at `your-project.pages.dev`

---

## 🌐 Making it a PWA (Progressive Web App)

### 1. Add Service Worker

Create `public/service-worker.js`:
```javascript
const CACHE_NAME = 'tipidbuddy-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch from cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

// Update service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

### 2. Register Service Worker

Add to `index.html` (or create a registration file):
```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('SW registered:', registration);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}
```

### 3. Create App Icons

Generate icons using [realfavicongenerator.net](https://realfavicongenerator.net):
- 192x192 for mobile
- 512x512 for desktop
- Place in `/public` folder

### 4. Update manifest.json

Already created at `/public/manifest.json`:
```json
{
  "name": "TipidBuddy",
  "short_name": "TipidBuddy",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#10B981",
  "theme_color": "#10B981",
  "icons": [...]
}
```

### 5. Add Meta Tags

Add to your HTML `<head>`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="TipidBuddy">
<meta name="theme-color" content="#10B981">
<link rel="manifest" href="/manifest.json">
<link rel="apple-touch-icon" href="/icon-192.png">
```

---

## 📱 Mobile App Distribution

### Android (TWA - Trusted Web Activity)

1. **Install Bubblewrap CLI**
   ```bash
   npm install -g @bubblewrap/cli
   ```

2. **Initialize TWA**
   ```bash
   bubblewrap init --manifest https://your-app.vercel.app/manifest.json
   ```

3. **Build APK**
   ```bash
   bubblewrap build
   ```

4. **Distribute**
   - Google Play Store (requires $25 one-time fee)
   - Or distribute APK directly

### iOS (via PWA)

Users can "Add to Home Screen" directly from Safari:
1. Open app in Safari
2. Tap Share button
3. Tap "Add to Home Screen"
4. App installs like native app!

---

## 🔧 Environment Configuration

### Production Environment Variables

Create `.env.production`:
```env
VITE_APP_NAME=TipidBuddy
VITE_APP_VERSION=1.0.0
VITE_API_URL=https://your-api.com
```

### Supabase Integration (Optional)

If using Supabase for cloud sync:

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project (free tier)
   - Note your URL and anon key

2. **Add Environment Variables**
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Deploy with Environment Variables**
   
   **Vercel:**
   - Go to Project Settings → Environment Variables
   - Add your variables
   - Redeploy

   **Netlify:**
   - Site settings → Environment variables
   - Add your variables
   - Trigger redeploy

---

## 🎯 Post-Deployment Checklist

### Essential Checks
- [ ] App loads correctly on mobile and desktop
- [ ] All features work (add expense, budget, goals)
- [ ] LocalStorage persists data
- [ ] Charts render properly
- [ ] Navigation works smoothly
- [ ] PWA installable on mobile
- [ ] HTTPS enabled
- [ ] Performance score > 90 (Lighthouse)

### Testing on Mobile
1. Open on actual mobile device
2. Test in portrait and landscape
3. Add to home screen
4. Test offline functionality
5. Check touch interactions
6. Verify keyboard behavior

### Performance Optimization
```bash
# Analyze bundle size
npm run build
npx vite-bundle-visualizer

# Test with Lighthouse
# Open Chrome DevTools → Lighthouse → Run audit
```

---

## 📊 Monitoring & Analytics

### Free Analytics Options

1. **Vercel Analytics** (Built-in)
   - Free on all plans
   - Real-time performance metrics

2. **Google Analytics 4**
   ```bash
   npm install react-ga4
   ```

3. **Plausible** (Privacy-friendly)
   - Add script tag to HTML
   - Free for small sites

---

## 🔄 Continuous Deployment

### GitHub Actions (Automated Deployment)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 🐛 Troubleshooting

### Common Issues

**1. Blank page after deployment**
- Check base URL in vite.config.ts
- Verify build output in dist/
- Check browser console for errors

**2. Routes not working (404)**
- Add redirect rules for SPA
- Vercel: automatic
- Netlify: use netlify.toml
- GitHub Pages: use 404.html trick

**3. Assets not loading**
- Check public/ folder structure
- Verify manifest.json path
- Check CORS headers

**4. Service worker not registering**
- Ensure HTTPS is enabled
- Check service-worker.js path
- Clear browser cache

---

## 💰 Cost Estimate (Even at Scale)

### Vercel Free Tier Limits
- Bandwidth: 100GB/month
- Build minutes: 6000/month
- Estimated users: 10,000+ monthly active users
- **Cost: $0/month** ✅

### When to Upgrade?
- > 100GB bandwidth (~ 50,000+ active users)
- Need team collaboration
- Custom build hours needed
- **Pro Plan: $20/month**

---

## 🎓 Student Deployment Tips

1. **Use .edu email** for GitHub Education benefits
2. **Free domain** via GitHub Student Pack
3. **Free hosting** credits on various platforms
4. **Free SSL** automatically included
5. **Zero maintenance** costs

---

## 🚀 Launch Checklist

Before going live:

- [ ] Test on multiple devices
- [ ] Check all user flows
- [ ] Verify data persistence
- [ ] Test offline mode
- [ ] Set up error tracking
- [ ] Create backup strategy
- [ ] Write user documentation
- [ ] Prepare marketing materials
- [ ] Set up feedback form
- [ ] Monitor performance metrics

---

## 📞 Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Vite Docs**: https://vitejs.dev
- **PWA Guide**: https://web.dev/progressive-web-apps
- **Supabase Docs**: https://supabase.com/docs

---

**Your TipidBuddy app is now ready to help Filipino students manage their finances! 💰🎓**

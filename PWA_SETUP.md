# PWA Setup and Mobile Deployment Guide

## ✅ Completed Setup

### 1. Service Worker
- ✅ Created `public/service-worker.js` with offline caching
- ✅ Registered in `index.html`

### 2. PWA Manifest
- ✅ Already exists at `public/manifest.json`
- ✅ Configured with app name, colors, and icons

### 3. HTML Meta Tags
- ✅ Added mobile-optimized viewport settings
- ✅ Added Apple mobile web app tags
- ✅ Added theme color and description
- ✅ Linked manifest and icons

### 4. App Icons
- ✅ Generated 192x192 icon
- ✅ Generated 512x512 icon
- ✅ Generated Apple touch icon (180x180)

## 📱 Installing on Mobile Devices

### iOS (Safari)
1. Open the deployed app in Safari
2. Tap the Share button (box with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" in the top right
5. The app icon appears on your home screen!

### Android (Chrome)
1. Open the deployed app in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home screen" or "Install app"
4. Tap "Install" or "Add"
5. The app icon appears on your home screen!

## 🚀 Deployment Steps

### Deploy to Vercel

1. **Install Vercel CLI** (if not already installed)
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
cd c:\Users\danil\Documents\Tipidbuddyexpensetrackerapp-main
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name? **tipidbuddy** (or your choice)
- Directory? **./** (press Enter)
- Override settings? **N**

4. **Deploy to Production**
```bash
vercel --prod
```

Your app will be live at: `https://tipidbuddy.vercel.app` (or your custom URL)

### Alternative: Deploy via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your GitHub repository (push code to GitHub first)
3. Configure:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Click "Deploy"

## 🔧 Post-Deployment

### Test PWA Installation
1. Visit your deployed URL on mobile
2. Test "Add to Home Screen"
3. Verify offline functionality (turn off internet, app should still load)

### Test Savings Groups
1. Create a new account (uses Supabase auth)
2. Navigate to Savings Groups tab
3. Create a group
4. Join from another device/browser

## 📊 Monitoring

### Vercel Analytics
- Automatically enabled
- View at: https://vercel.com/dashboard

### Check PWA Score
1. Open deployed app in Chrome
2. Open DevTools (F12)
3. Go to Lighthouse tab
4. Run audit
5. Check PWA score (should be 100)

## 🎯 Next Steps

After deployment:
1. ✅ Share the URL with friends to test
2. ✅ Test on multiple devices (iOS, Android)
3. ✅ Verify savings groups work end-to-end
4. ✅ Monitor for any errors in Vercel logs

## 🐛 Troubleshooting

### Service Worker Not Registering
- Check browser console for errors
- Ensure HTTPS is enabled (Vercel provides this automatically)
- Clear browser cache and try again

### "Add to Home Screen" Not Showing
- Ensure manifest.json is accessible
- Check that all required icons exist
- Verify HTTPS is enabled

### App Not Working Offline
- Check service worker is registered (DevTools → Application → Service Workers)
- Verify cache is populated (DevTools → Application → Cache Storage)

### Savings Groups Not Working
- Ensure Supabase backend is deployed (see SUPABASE_DEPLOYMENT.md)
- Check browser console for API errors
- Verify you're using a Supabase-authenticated account (not localStorage)

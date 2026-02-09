# Quick Start Guide - Deploy TipidBuddy

This guide will get your TipidBuddy app deployed with savings groups working and PWA mobile support.

## 📋 Prerequisites

- Node.js installed
- Supabase account (free): https://supabase.com
- Vercel account (free): https://vercel.com
- Your Supabase project ID: `cchayicghnuxlkiipgxv`

## 🚀 Step-by-Step Deployment

### Step 1: Deploy Backend (Supabase)

**Note for Windows**: Use `npx supabase` instead of installing globally.

```bash
# Login (opens browser for authentication)
npx supabase login

# Link your project
cd c:\Users\danil\Documents\Tipidbuddyexpensetrackerapp-main
npx supabase link --project-ref cchayicghnuxlkiipgxv
```

**Create Database Table:**
1. Go to https://supabase.com/dashboard/project/cchayicghnuxlkiipgxv/editor
2. Click "SQL Editor"
3. Run this SQL:

```sql
CREATE TABLE IF NOT EXISTS kv_store_505a2c2e (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kv_store_key ON kv_store_505a2c2e(key);

ALTER TABLE kv_store_505a2c2e ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage all data" ON kv_store_505a2c2e
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

**Deploy Edge Function:**
```bash
npx supabase functions deploy server --no-verify-jwt
```

**Test Backend:**
```bash
curl https://cchayicghnuxlkiipgxv.supabase.co/functions/v1/make-server-505a2c2e/health
```
Expected: `{"status":"ok"}`

### Step 2: Generate App Icons

See `ICON_GENERATION.md` for detailed instructions. Quick option:

1. Go to https://realfavicongenerator.net/
2. Upload a 512x512 image (or create one)
3. Download generated icons
4. Copy to `public/` folder:
   - `icon-192.png`
   - `icon-512.png`
   - `apple-touch-icon.png`

### Step 3: Deploy Frontend (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

Your app will be live at: `https://your-project.vercel.app`

### Step 4: Test Everything

**Test Savings Groups:**
1. Open deployed app
2. Create new account (uses Supabase auth)
3. Go to "Savings Groups" tab
4. Create a group
5. Copy invite code
6. Open in another browser/device
7. Join the group
8. Submit daily savings from both accounts

**Test PWA:**
1. Open app on mobile device
2. Look for "Add to Home Screen" prompt
3. Install the app
4. Open from home screen
5. Test offline (turn off internet, app should still load)

## ✅ Success Checklist

- [ ] Backend health endpoint returns `{"status":"ok"}`
- [ ] Can create new account (Supabase auth)
- [ ] Savings Groups tab shows "Create Group" and "Join Group" buttons
- [ ] Can create and join groups
- [ ] Can submit daily savings
- [ ] Leaderboard updates correctly
- [ ] App installs on mobile via "Add to Home Screen"
- [ ] App works offline (cached pages load)

## 🐛 Troubleshooting

**"Unauthorized" error in Savings Groups:**
- Make sure you created a NEW account (not localStorage account)
- Check that Supabase backend is deployed
- Verify in browser console for API errors

**Service Worker not registering:**
- Ensure app is served over HTTPS (Vercel provides this)
- Check browser console for errors
- Clear cache and reload

**Icons not showing:**
- Verify icons exist in `public/` folder
- Check file names match exactly
- Restart dev server

## 📚 Detailed Guides

- **Backend Deployment**: See `SUPABASE_DEPLOYMENT.md`
- **PWA Setup**: See `PWA_SETUP.md`
- **Icon Generation**: See `ICON_GENERATION.md`

## 🎉 You're Done!

Your TipidBuddy app is now:
- ✅ Deployed to the web
- ✅ Savings groups feature working
- ✅ Installable as mobile app (PWA)
- ✅ Works offline

Share the URL with friends and start tracking expenses together!

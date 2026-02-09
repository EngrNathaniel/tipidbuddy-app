# Supabase Backend Deployment Guide

## Prerequisites

- Node.js installed
- Supabase account (free tier: https://supabase.com)
- Your Supabase project is already set up with ID: `cchayicghnuxlkiipgxv`

## Step 1: Install Supabase CLI (Windows)

**⚠️ Note**: `npm install -g supabase` doesn't work on Windows. Use one of these methods instead:

### Option A: Use npx (Easiest - No Installation Required) ⭐

You can use `npx supabase` instead of installing globally. Just replace `supabase` with `npx supabase` in all commands.

Example:
```bash
npx supabase login
npx supabase link --project-ref cchayicghnuxlkiipgxv
```

### Option B: Install via Scoop (Recommended for Multiple Uses)

1. **Install Scoop** (if not already installed):
   - Open PowerShell and run:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
   ```

2. **Install Supabase CLI**:
   ```bash
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   ```

### Option C: Manual Download

1. Download from: https://github.com/supabase/cli/releases
2. Extract the executable
3. Add to your PATH or use full path to executable

## Step 2: Login to Supabase

```bash
npx supabase login
# OR if you installed via Scoop:
# supabase login
```

This will open a browser window for authentication.

## Step 3: Link Your Project

```bash
cd c:\Users\danil\Documents\Tipidbuddyexpensetrackerapp-main
npx supabase link --project-ref cchayicghnuxlkiipgxv
# OR if you installed via Scoop:
# supabase link --project-ref cchayicghnuxlkiipgxv
```

You'll be prompted to enter your database password.

## Step 4: Create Database Table

The backend uses a KV store table. Create it in your Supabase dashboard:

1. Go to https://supabase.com/dashboard/project/cchayicghnuxlkiipgxv/editor
2. Click "SQL Editor"
3. Run this SQL:

```sql
-- Create KV store table
CREATE TABLE IF NOT EXISTS kv_store_505a2c2e (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_kv_store_key ON kv_store_505a2c2e(key);

-- Enable Row Level Security (optional for now)
ALTER TABLE kv_store_505a2c2e ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access
CREATE POLICY "Service role can manage all data" ON kv_store_505a2c2e
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

## Step 5: Deploy Edge Function

```bash
# Deploy the server function
npx supabase functions deploy server --no-verify-jwt
# OR if you installed via Scoop:
# supabase functions deploy server --no-verify-jwt
```

The `--no-verify-jwt` flag is important because the function handles JWT verification internally.

## Step 6: Set Environment Variables (if needed)

The function should automatically have access to:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

These are automatically injected by Supabase.

## Step 7: Test the Deployment

```bash
# Test health endpoint
curl https://cchayicghnuxlkiipgxv.supabase.co/functions/v1/make-server-505a2c2e/health
```

Expected response:
```json
{"status":"ok"}
```

## Step 8: Test Authentication

1. Open your app running on `npm run dev`
2. Create a new account (this will use Supabase auth)
3. Check the browser console for any errors
4. Navigate to "Savings Groups" tab
5. Try creating a group

## Troubleshooting

### Error: "Function not found"
- Make sure you deployed with the correct function name: `server`
- Check deployment logs: `supabase functions list`

### Error: "Unauthorized"
- Verify your Supabase project is linked correctly
- Check that the anon key in `utils/supabase/info.tsx` matches your project

### Error: "Table does not exist"
- Make sure you ran the SQL to create `kv_store_505a2c2e` table
- Check in Supabase dashboard under "Table Editor"

### Error: "CORS issues"
- The function already has CORS configured for `origin: "*"`
- If issues persist, check Supabase function logs

## Viewing Logs

```bash
# View function logs in real-time
supabase functions logs server --tail
```

Or view in dashboard:
https://supabase.com/dashboard/project/cchayicghnuxlkiipgxv/functions/server/logs

## Next Steps

After successful deployment:
1. ✅ Backend is live
2. ✅ Groups feature should work
3. → Continue to PWA setup (see PWA_SETUP.md)
4. → Deploy frontend to Vercel

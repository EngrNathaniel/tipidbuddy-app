import { createClient } from 'npm:@supabase/supabase-js';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function verifyUser(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid authorization header' };
  }

  const token = authHeader.split(' ')[1];

  // Retry logic for unstable network connections
  let user = null;
  let error = null;

  for (let i = 0; i < 3; i++) {
    try {
      const result = await supabaseAdmin.auth.getUser(token);
      user = result.data.user;
      error = result.error;
      if (user) break;
    } catch (e: any) {
      console.log(`Auth retry ${i + 1} failed: ${e.message}`);
      error = e;
      if (i === 2) break;
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
    }
  }

  if (error || !user) {
    console.log('Auth check failed:', error?.message);
    return { user: null, error: error?.message || 'User not found in Supabase Auth' };
  }

  return { user, error: null };
}

// Debug script to check Supabase session
// Run this in browser console to see session details

(async () => {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');

    const projectId = "cchayicghnuxlkiipgxv";
    const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjaGF5aWNnaG51eGxraWlwZ3h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjQ4MjIsImV4cCI6MjA4NjEwMDgyMn0.9a2Hrd87hzl8lz1wXeouZYg6ub3V3hCylxNm4Rwc2tQ";

    const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

    const { data: { session }, error } = await supabase.auth.getSession();

    console.log('=== SUPABASE SESSION DEBUG ===');
    console.log('Session:', session);
    console.log('Error:', error);

    if (session) {
        console.log('User ID:', session.user.id);
        console.log('Email:', session.user.email);
        console.log('Access Token (first 50 chars):', session.access_token.substring(0, 50) + '...');
        console.log('Token expires at:', new Date(session.expires_at * 1000));
    } else {
        console.log('❌ NO ACTIVE SESSION - User needs to sign in again!');
    }
})();

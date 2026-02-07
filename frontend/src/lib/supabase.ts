import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false, // Memory only - we handle refresh via HttpOnly cookie
        autoRefreshToken: false, // We handle refresh manually
        detectSessionInUrl: true // Required for OAuth redirects
    }
});

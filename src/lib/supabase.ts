import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.');
}

const createSupabaseClient = () => createClient(
  supabaseUrl, 
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Using default localStorage allows Supabase to correctly manage multi-tab locks
      // without deadlocking or crashing.
    }
  }
);

// ALWAYS cache the client globally to prevent multiple instances from fighting over the navigator lock in production (chunking issues).
export const supabase = (window as any).__SUPABASE_CLIENT__ || createSupabaseClient();
(window as any).__SUPABASE_CLIENT__ = supabase;


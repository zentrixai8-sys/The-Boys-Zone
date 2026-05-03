import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.');
}

const getTabId = () => {
  let tabId = sessionStorage.getItem('tbz_tab_id');
  if (!tabId) {
    tabId = Math.random().toString(36).substring(2, 10);
    sessionStorage.setItem('tbz_tab_id', tabId);
  }
  return tabId;
};

const createSupabaseClient = () => createClient(
  supabaseUrl, 
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: `tbz-auth-${getTabId()}`,
      storage: window.sessionStorage,
    }
  }
);

// ALWAYS cache the client globally to prevent multiple instances from fighting over the navigator lock in production (chunking issues).
export const supabase = (window as any).__SUPABASE_CLIENT__ || createSupabaseClient();
(window as any).__SUPABASE_CLIENT__ = supabase;


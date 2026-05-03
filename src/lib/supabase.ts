import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.');
}

const getTabId = () => {
  if (typeof window === 'undefined') return 'server';
  
  // window.name is unique per tab and survives refresh.
  // It is generally NOT copied when opening a new tab from a link.
  if (!window.name || !window.name.startsWith('tbz_tab_')) {
    window.name = `tbz_tab_${Math.random().toString(36).substring(7)}`;
  }
  return window.name;
};

const customSessionStorage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') window.sessionStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(key);
  }
};

const createSupabaseClient = () => createClient(
  supabaseUrl, 
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: `tbz-auth-v1-${getTabId()}`,
      storage: customSessionStorage
    }
  }
);

// ALWAYS cache the client globally to prevent multiple instances from fighting over the navigator lock in production (chunking issues).
export const supabase = (window as any).__SUPABASE_CLIENT__ || createSupabaseClient();
(window as any).__SUPABASE_CLIENT__ = supabase;


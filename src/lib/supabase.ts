import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.');
}

// Use sessionStorage (NOT localStorage) so each browser tab has a fully
// isolated auth session. sessionStorage is already per-tab by the browser,
// so NO custom storageKey is needed — a unique key per tab would create a
// unique Navigator Lock name that deadlocks when multiple SWR requests fire
// concurrently on the same tab.
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.sessionStorage,
      // Bypass Navigator LockManager — sessionStorage is already per-tab,
      // so cross-tab lock contention is impossible. The default navigator.locks
      // deadlocks when SWR fires multiple concurrent requests on the same tab.
      lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
        return await fn();
      },
    }
  }
);

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('âš ï¸ Supabase credentials missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env.local')
}

// Create client with explicit global headers to ensure `apikey` is always sent from the browser.
// This helps when proxies or fetch wrappers remove headers unexpectedly.
const clientOptions = {
  global: {
    headers: {
      apikey: supabaseAnonKey ?? ''
    }
  }
}

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, clientOptions)

// Lightweight diagnostic log (no secrets printed)
try {
  console.log('Supabase client initialized â€” URL present:', Boolean(supabaseUrl), 'anonKey present:', Boolean(supabaseAnonKey))
} catch (e) {
  // ignore logging errors
}

import { createClient } from '@supabase/supabase-js'

// URL e KEY do Supabase (hardcoded para o build da Vercel)
const supabaseUrl = 'https://ghwcmdfyfncfpcsguaqz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdod2NtZGZ5Zm5jZnBjc2d1YXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjc4MDYsImV4cCI6MjA5NDgwMzgwNn0.tsxfz_-lClevfByZHeJxiFeOn2CpgFgKek7YOInMqBo'

// Verifica se as variáveis estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase credentials missing!')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
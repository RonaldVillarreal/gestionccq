import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Si no hay credenciales, la app funciona con datos locales (localStorage).
// Apenas completes el archivo .env, todo apunta a Supabase automáticamente.
export const hasSupabase = Boolean(url && key && !url.includes('tu-proyecto'))

export const supabase = hasSupabase ? createClient(url, key) : null

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hpijpwfvfviagckihfvv.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'no-key-provided-at-build-time'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

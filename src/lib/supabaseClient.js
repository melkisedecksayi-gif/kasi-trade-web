import { createClient } from '@supabase/supabase-js'

// 🔑 DukaPOS - Supabase Configuration
const supabaseUrl = 'https://wajlksmnomxeeohakqsr.supabase.co'
const supabaseAnonKey = 'sb_publishable_ycFY4baMarFOF1NF_dGSdA_lcquz000'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
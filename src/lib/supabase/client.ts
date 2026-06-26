import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "تنبيه: مفاتيح Supabase غير معرفة. يرجى تهيئتها في ملف .env.local"
  )
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "")

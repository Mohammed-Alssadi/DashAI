import { supabase } from "@/lib/supabase/client"

export const authService = {
  // إنشاء حساب جديد لتاجر
  registerMerchant: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    return data.user
  },

  // تسجيل دخول تاجر
  loginMerchant: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data.user
  },

  // تسجيل خروج التاجر
  logoutMerchant: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // جلب بيانات المستخدم الحالي إن وجدت
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) return null
    return user
  }
}

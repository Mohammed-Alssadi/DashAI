import axios from "axios"
import { supabase } from "../supabase/client"

// رابط الدوال البرمجية للدوال السحابية (Edge Functions)
const baseFunctionUrl =
  import.meta.env.VITE_FUNCTIONS_BASE_URL ||
  (import.meta.env.VITE_SUPABASE_URL ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1` : "")

export const axiosClient = axios.create({
  baseURL: baseFunctionUrl,
})

// إرفاق رمز التوثيق (JWT) تلقائياً عند وجود جلسة تسجيل دخول نشطة
axiosClient.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        config.headers.Authorization = `Bearer ${session.access_token}`
      }
    } catch (error) {
      console.warn("لا يمكن قراءة الجلسة الحالية لـ Supabase:", error)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

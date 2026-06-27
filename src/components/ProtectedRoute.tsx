import { Navigate, Outlet } from "react-router-dom"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { PageLoader } from "@/components/PageLoader"

export function ProtectedRoute() {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // أولاً: نتحقق من وجود الجلسة محلياً لتسريع العملية
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          setAuthenticated(false)
          setLoading(false)
          return
        }

        // ثانياً: الحل الاحترافي - نتحقق من السيرفر أن المستخدم لا يزال موجوداً
        // هذا يحل مشكلة بقاء المستخدم مسجل الدخول في الواجهة بعد حذفه من قاعدة البيانات
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          // إذا تم حذف المستخدم أو التوكن غير صالح، نقوم بتسجيل الخروج محلياً
          await supabase.auth.signOut()
          setAuthenticated(false)
        } else {
          setAuthenticated(true)
        }
      } catch (err) {
        console.error("Auth check error:", err)
        setAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // الاستماع لتغييرات الجلسة وتحديث الواجهة
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setAuthenticated(false)
      } else if (event === "SIGNED_IN" && session) {
        setAuthenticated(true)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (loading) return <PageLoader />
  return authenticated ? <Outlet /> : <Navigate to="/login" replace />
}

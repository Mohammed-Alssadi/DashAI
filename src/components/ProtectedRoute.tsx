import { Navigate, Outlet } from "react-router-dom"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { PageLoader } from "@/components/PageLoader"

export function ProtectedRoute() {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthenticated(!!session)
      setLoading(false)
    })

    // الاستماع لتغييرات الجلسة وتحديث الواجهة
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthenticated(!!session)
      if (event === "SIGNED_OUT") {
        setAuthenticated(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (loading) return <PageLoader />
  return authenticated ? <Outlet /> : <Navigate to="/login" replace />
}

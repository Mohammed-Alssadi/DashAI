import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { authService } from "../services/authService"

export function useAuth() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      await authService.loginMerchant(email, password)
      navigate("/dashboard") // التوجيه للوحة المتاجر فور نجاح الدخول
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء تسجيل الدخول")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      await authService.registerMerchant(email, password)
      navigate("/login") // التوجيه لصفحة الدخول بعد نجاح إنشاء الحساب
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء إنشاء الحساب")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    setError(null)
    try {
      await authService.logoutMerchant()
      navigate("/")
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء تسجيل الخروج")
    } finally {
      setLoading(false)
    }
  }

  return { handleLogin, handleRegister, handleLogout, loading, error }
}

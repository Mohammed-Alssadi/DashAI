import { Button } from "@/components/ui/button"
import { Store, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"

export function SallaConnectButton() {
  const isDemoMode = !import.meta.env.VITE_SALLA_CLIENT_ID || import.meta.env.VITE_SALLA_CLIENT_ID === "PASTE_YOUR_SALLA_CLIENT_ID_HERE"

  const handleClick = async () => {
    if (isDemoMode) {
      toast.error("يرجى إنشاء تطبيق في شركاء سلة وضبط مفتاح Client ID في ملف .env للربط الحقيقي.")
      return
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error || !session) {
        toast.error("يرجى تسجيل الدخول أولاً للتمكن من ربط متجرك.")
        return
      }

      toast.loading("جاري توجيهك إلى بوابة سلة للتفويض والربط الآمن...")

      const clientId = import.meta.env.VITE_SALLA_CLIENT_ID
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: `${supabaseUrl}/functions/v1/salla-callback`,
        response_type: "code",
        scope: "offline_access",
        state: session.user.id, // تمرير معرف المستخدم كمعلمة للحالة
      })

      window.location.href = `https://accounts.salla.sa/oauth2/auth?${params.toString()}`
    } catch (err) {
      console.error(err)
      toast.error("حدث خطأ غير متوقع أثناء الاتصال بالمنصة.")
    }
  }

  return (
    <Button
      onClick={handleClick}
      className="w-full h-12 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-between px-4 transition-colors duration-200 cursor-pointer border-0 font-sans"
    >
      <div className="flex items-center gap-2.5">
        <Store className="size-4.5 shrink-0" />
        <div className="flex flex-col items-start leading-none">
          <span className="font-bold text-sm">ربط متجر سلة</span>
          {isDemoMode && (
            <span className="text-white/70 text-[10px] mt-1">
              وضع المعاينة (تجريبي)
            </span>
          )}
        </div>
      </div>
      <ArrowLeft className="size-4 text-white/80" />
    </Button>
  )
}

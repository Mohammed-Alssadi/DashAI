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
      size="lg"
      onClick={handleClick}
      className="w-full h-16 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center justify-between px-6 transition-all duration-300 shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 hover:-translate-y-0.5 group cursor-pointer border-0"
    >
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-xl bg-white/10 flex items-center justify-center">
          <Store className="size-5 text-white" />
        </div>
        <div className="flex flex-col items-start">
          <span className="font-bold text-base">مزامنة متجر سلة</span>
          {isDemoMode && (
            <span className="text-white/60 text-[10px] font-medium">
              وضع المعاينة — أضف Client ID لسلة للربط الحقيقي
            </span>
          )}
        </div>
      </div>
      <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-1.5 text-white/80" />
    </Button>
  )
}

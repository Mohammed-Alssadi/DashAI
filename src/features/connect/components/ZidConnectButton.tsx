import { Button } from "@/components/ui/button"
import { ShoppingBag, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"

export function ZidConnectButton() {
  const isDemoMode = !import.meta.env.VITE_ZID_CLIENT_ID || import.meta.env.VITE_ZID_CLIENT_ID === "PASTE_YOUR_ZID_CLIENT_ID_HERE"

  const handleClick = async () => {
    if (isDemoMode) {
      toast.error("يرجى إنشاء تطبيق في شركاء زد وضبط مفتاح Client ID في ملف .env للربط الحقيقي.")
      return
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error || !session) {
        toast.error("يرجى تسجيل الدخول أولاً للتمكن من ربط متجرك.")
        return
      }

      const clientId = import.meta.env.VITE_ZID_CLIENT_ID
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: `${supabaseUrl}/functions/v1/zid-callback`,
        response_type: "code",
        state: session.user.id, // تمرير معرف المستخدم كمعلمة للحالة
      })

      window.location.href = `https://oauth.zid.sa/oauth/authorize?${params.toString()}`
    } catch (err) {
      console.error(err)
      toast.error("حدث خطأ غير متوقع أثناء الاتصال بالمنصة.")
    }
  }

  return (
    <Button
      size="lg"
      onClick={handleClick}
      className="w-full h-16 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white flex items-center justify-between px-6 transition-all duration-300 shadow-md shadow-violet-600/10 hover:shadow-violet-600/20 hover:-translate-y-0.5 group cursor-pointer border-0"
    >
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-xl bg-white/10 flex items-center justify-center">
          <ShoppingBag className="size-5 text-white" />
        </div>
        <div className="flex flex-col items-start">
          <span className="font-bold text-base">مزامنة متجر زد</span>
          {isDemoMode && (
            <span className="text-white/60 text-[10px] font-medium">
              وضع المعاينة — أضف مفاتيح زد للربط الحقيقي
            </span>
          )}
        </div>
      </div>
      <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-1.5 text-white/80" />
    </Button>
  )
}

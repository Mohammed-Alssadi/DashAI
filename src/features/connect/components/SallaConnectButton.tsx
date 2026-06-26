import { Button } from "@/components/ui/button"
import { Store, ArrowLeft } from "lucide-react"

interface SallaConnectButtonProps {
  onClick?: () => void
}

// بناء رابط OAuth الحقيقي لمنصة سلة
// ملاحظة: redirect_uri يشير دائماً لـ Supabase Edge Function (عام ودائماً HTTPS)
// وليس للفرونت إند — لذا لا حاجة لـ ngrok أو baseUrl
function buildSallaOAuthUrl(): string {
  const clientId = import.meta.env.VITE_SALLA_CLIENT_ID
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

  // إذا المفتاح غير موجود → وضع المعاينة التجريبية
  if (!clientId || clientId === "PASTE_YOUR_SALLA_CLIENT_ID_HERE") {
    return "/dashboard?demo=salla"
  }

  const params = new URLSearchParams({
    client_id: clientId,
    // redirect_uri يشير لـ Supabase Edge Function — عام وجاهز دائماً
    redirect_uri: `${supabaseUrl}/functions/v1/salla-callback`,
    response_type: "code",
    scope: "offline_access",
  })

  return `https://accounts.salla.sa/oauth2/auth?${params.toString()}`
}

export function SallaConnectButton({ onClick }: SallaConnectButtonProps) {
  const oauthUrl = buildSallaOAuthUrl()
  const isDemoMode = oauthUrl.startsWith("/dashboard")

  const handleClick = () => {
    if (isDemoMode) {
      onClick?.()
    } else {
      window.location.href = oauthUrl
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

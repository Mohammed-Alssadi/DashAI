import { ConnectHeader } from "../components/ConnectHeader"
import { SallaConnectButton } from "../components/SallaConnectButton"
import { ZidConnectButton } from "../components/ZidConnectButton"
import { OAuthNotice } from "../components/OAuthNotice"
import { ConnectFooter } from "../components/ConnectFooter"
import { Link, useSearchParams } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { useEffect } from "react"
import { toast } from "sonner"

export function ConnectPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const error = searchParams.get("error")
    if (error) {
      if (error === "salla_denied") {
        toast.error("تم إلغاء عملية الربط مع سلة من قبل المستخدم.")
      } else if (error === "zid_denied") {
        toast.error("تم إلغاء عملية الربط مع زد من قبل المستخدم.")
      } else {
        toast.error("فشل الاتصال بالمنصة. يرجى المحاولة مرة أخرى.")
      }

      // تنظيف معلمات البحث لتجنب تكرار الرسالة عند التحديث
      const newParams = new URLSearchParams(searchParams)
      newParams.delete("error")
      setSearchParams(newParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  return (
    <div className="relative min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden font-sans">
      
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 pointer-events-none" />
      <div className="absolute top-[20%] left-[20%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full bg-indigo-200/15 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full bg-violet-200/15 blur-[100px] pointer-events-none" />

      {/* Floating Return Button (RTL back arrow pointing right) */}
      <Link 
        to="/" 
        className="absolute top-6 right-6 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors bg-white/75 hover:bg-white border border-border/80 px-4 py-2 rounded-2xl shadow-sm z-20"
      >
        <span>العودة للرئيسية</span>
        <ArrowRight className="size-4" />
      </Link>

      {/* Centered Main Login Container (Borderless & Floating Style) */}
      <div className="relative z-10 w-full max-w-md mx-auto space-y-8 py-6">
        
        {/* Welcome & Branding Header */}
        <ConnectHeader />

        {/* Integration Buttons */}
        <div className="space-y-4">
          <SallaConnectButton />
          <ZidConnectButton />
        </div>

        {/* Security Info Notice */}
        <OAuthNotice />

        {/* Terms of Service & Privacy Footer */}
        <ConnectFooter />

      </div>
    </div>
  )
}

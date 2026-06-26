
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

export function ConnectHeader() {
  const [userName, setUserName] = useState("")

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name = user.user_metadata?.full_name || user.email?.split("@")[0] || ""
        setUserName(name)
      }
    })
  }, [])

  return (
    <div className="flex flex-col items-center text-center space-y-2">
      {/* Main Headers with personalized greeting */}
      <p className="text-2xl md:text-4xl font-black tracking-tight text-foreground pb-5">
        أهلاً بك {userName ? `يا ${userName}` : ""} في DashAI 👋
      </p>
      
      <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-sm">
        قم بتوصيل متجرك القائم حالياً لبدء المزامنة الفورية للمنتجات والطلبات وتفعيل ميزات الذكاء الاصطناعي المتقدمة.
      </p>
    </div>
  )
}

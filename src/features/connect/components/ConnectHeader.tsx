import { Layers, Sparkles } from "lucide-react"

export function ConnectHeader() {
  return (
    <div className="flex flex-col items-center text-center space-y-2">
      {/* Brand Icon */}
      {/* <div className="size-12 rounded-2xl bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/10">
        <Layers className="size-6 text-primary-foreground" />
      </div> */}
      
      {/* Platform Title Badge */}
      {/* <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent border border-border text-accent-foreground text-xs font-semibold">
        <Sparkles className="size-3 text-primary" />
        <span>ربط لوحة التحكم الموحدة</span>
      </div> */}

      {/* Main Headers */}
      <p className="text-2xl md:text-4xl font-black tracking-tight text-foreground pb-5">
        أهلاً بك في DashAI 👋
      </p>
      
      <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-sm">
        قم بتوصيل متجرك القائم حالياً لبدء المزامنة الفورية للمنتجات والطلبات وتفعيل ميزات الذكاء الاصطناعي المتقدمة.
      </p>
    </div>
  )
}

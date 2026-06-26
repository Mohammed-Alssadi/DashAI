import { Layers } from "lucide-react"

export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/85 backdrop-blur-md transition-all duration-300">
      <div className="relative flex items-center justify-center">
        {/* Outer spinning ring with premium theme colors */}
        <div className="size-20 rounded-full border-[3px] border-border border-t-primary animate-spin" />
        
        {/* Inner pulsing logo icon */}
        <div className="absolute size-10 rounded-xl bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 animate-pulse">
          <Layers className="size-5 text-primary-foreground" />
        </div>
      </div>
      
      {/* Loading Text in Arabic */}
      <p className="mt-6 text-sm font-semibold tracking-wide text-muted-foreground animate-pulse">
        جاري تهيئة لوحة التحكم الذكية...
      </p>
    </div>
  )
}

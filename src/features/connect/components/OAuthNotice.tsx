import { ShieldCheck } from "lucide-react"

export function OAuthNotice() {
  return (
    <div className="flex gap-3 p-4 rounded-2xl bg-accent border border-border text-accent-foreground text-xs leading-relaxed text-right">
      <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
      <p className="text-muted-foreground font-medium">
        تزامن مشفر وآمن بالكامل عبر بروتوكول <span className="text-foreground font-bold">OAuth 2.0</span> المعتمد رسمياً لدى المنصات. لا نطلب ولا نحفظ كلمات المرور الخاصة بك إطلاقاً.
      </p>
    </div>
  )
}

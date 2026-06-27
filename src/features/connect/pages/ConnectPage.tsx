import { SallaConnectButton } from "../components/SallaConnectButton"
import { ZidConnectButton } from "../components/ZidConnectButton"
import { useSearchParams } from "react-router-dom"
import { useEffect } from "react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ShieldCheck, CheckCircle2, Lock } from "lucide-react"

export function ConnectPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const error = searchParams.get("error")
    const success = searchParams.get("success") === "true" || searchParams.get("status") === "success"

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

    if (success) {
      toast.success("تم ربط متجرك بنجاح ومزامنة البيانات حية!")
      
      // تنظيف معلمات البحث لتجنب تكرار الرسالة عند التحديث
      const newParams = new URLSearchParams(searchParams)
      newParams.delete("success")
      newParams.delete("status")
      setSearchParams(newParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in font-sans">
      
      {/* 🚀 عنوان الصفحة ورأسها الفخم بملء الشاشة */}
      <div className="space-y-1.5 text-right">
        <h2 className="text-xl font-bold tracking-tight text-foreground m-0">ربط قنوات البيع والمتاجر</h2>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
          اربط متجرك الإلكتروني على سلة أو زد لمزامنة المنتجات والطلبات وتفعيل تحليلات الذكاء الاصطناعي.
        </p>
      </div>

      {/* 💳 كروت ربط المتاجر (سلة وزد) - متسعة بملء الشاشة */}
      <div className="grid gap-6 md:grid-cols-2 w-full">
        
        {/* كرت سلة */}
        <Card className="border border-border/60 shadow-none bg-card flex flex-col justify-between rounded-lg">
          <CardHeader className="pb-4 p-6">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-500/5 rounded-full border border-emerald-500/10">سلة Salla</span>
            </div>
            <CardTitle className="text-base font-bold text-foreground">منصة سلة المتكاملة</CardTitle>
            <CardDescription className="text-xs text-muted-foreground leading-relaxed">
              تفويض الاتصال السحابي واستيراد المنتجات والطلبات لمتجر سلة.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-6 pt-0">
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-foreground block">البيانات التي سيتم مزامنتها:</span>
              <ul className="space-y-2 text-xs text-muted-foreground p-0 m-0 list-none text-right">
                <li className="flex items-center gap-2 justify-start">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <span>بيانات المتجر العامة والشعار</span>
                </li>
                <li className="flex items-center gap-2 justify-start">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <span>المنتجات والتصنيفات والأسعار حية</span>
                </li>
                <li className="flex items-center gap-2 justify-start">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <span>الطلبات وحالة الفواتير وسجل البيع</span>
                </li>
              </ul>
            </div>
            <div className="pt-3">
              <SallaConnectButton />
            </div>
          </CardContent>
        </Card>

        {/* كرت زد */}
        <Card className="border border-border/60 shadow-none bg-card flex flex-col justify-between rounded-lg">
          <CardHeader className="pb-4 p-6">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 text-[10px] font-bold text-purple-600 bg-purple-500/5 rounded-full border border-purple-500/10">زد Zid</span>
            </div>
            <CardTitle className="text-base font-bold text-foreground">منصة زد للتجزئة</CardTitle>
            <CardDescription className="text-xs text-muted-foreground leading-relaxed">
              اتصال مخصص لاستيراد وتهيئة الطلبات وتحديث الفواتير الحية في زد.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-6 pt-0">
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-foreground block">البيانات التي سيتم مزامنتها:</span>
              <ul className="space-y-2 text-xs text-muted-foreground p-0 m-0 list-none text-right">
                <li className="flex items-center gap-2 justify-start">
                  <CheckCircle2 className="size-4 text-purple-500 shrink-0" />
                  <span>اسم متجر زد، الإعدادات العامة والعملة</span>
                </li>
                <li className="flex items-center gap-2 justify-start">
                  <CheckCircle2 className="size-4 text-purple-500 shrink-0" />
                  <span>كتالوج المنتجات، الصور، والكميات المتوفرة</span>
                </li>
                <li className="flex items-center gap-2 justify-start">
                  <CheckCircle2 className="size-4 text-purple-500 shrink-0" />
                  <span>الطلبات، حالة الشحن وتفاصيل فواتير البيع</span>
                </li>
              </ul>
            </div>
            <div className="pt-3">
              <ZidConnectButton />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* 🛡️ كرت إرشادات الأمان والخصوصية (OAuth Security Info) */}
      <Card className="border border-border/40 bg-muted/10 shadow-none rounded-lg">
        <CardContent className="flex items-start gap-4 p-5">
          <ShieldCheck className="size-6 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1 text-right">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <span>ربط آمن بالكامل</span>
              <Lock className="size-3.5 text-muted-foreground" />
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              تتم عملية التفويض والربط بشكل مشفر وتلقائي عبر منصات البيع الرسمية (سلة/زد) عبر بروتوكول OAuth 2.0 المعتمد.
              نحن لا نطلع على كلمة مرورك ولا نقوم بتخزينها، ولن نقوم بمشاركة بياناتك أو الوصول إليها إلا لأغراض تشغيل لوحة التحكم والمزامنة. يمكنك إلغاء صلاحيات الربط في أي وقت تريده بضغطة زر واحدة من إعدادات حسابك في سلة أو زد.
            </p>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}

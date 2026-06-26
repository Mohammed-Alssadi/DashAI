import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { toast } from "sonner"
import { useStoreStore } from "../store/storeInfoStore"
import { supabase } from "@/lib/supabase/client"
import { dashboardService, type StoreDetails } from "../services/dashboardService"
import { useAuth } from "@/features/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Store,
  RefreshCw,
  ArrowRight,
  Layers,
  AlertCircle,
  ExternalLink,
  Plus,
  LogOut,
  ChevronLeft,
  Wrench,
  CheckCircle2,
  XCircle,
  Info
} from "lucide-react"

export function TestDashboard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const storeId = searchParams.get("store_id") ?? undefined
  const demoPlatform = searchParams.get("demo") ?? searchParams.get("platform") ?? undefined

  const { storeInfo, loading, error, fetchStoreInfo, clearStoreInfo } = useStoreStore()
  const { handleLogout } = useAuth()

  // حالات المستخدم والمتاجر
  const [user, setUser] = useState<any>(null)
  const [storesList, setStoresList] = useState<(StoreDetails & { id: string })[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  // جلب الجلسة الحالية
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  // جلب البيانات للحالة المناسبة
  useEffect(() => {
    if (!storeId) {
      clearStoreInfo()
      
      const fetchStores = async () => {
        setListLoading(true)
        setListError(null)
        try {
          const { data: linkedStores, error: dbError } = await supabase
            .from("linked_stores")
            .select("id, platform, platform_store_id")
          
          if (dbError) throw dbError

          if (linkedStores && linkedStores.length > 0) {
            const detailedStores = await Promise.all(
              linkedStores.map(async (store) => {
                try {
                  const details = await dashboardService.getStoreDetails(store.id, store.platform)
                  return { ...details, id: store.id }
                } catch (err) {
                  console.error(`فشل جلب تفاصيل المتجر ${store.id}:`, err)
                  return {
                    id: store.id,
                    storeName: `متجر غير متاح (معرف: ${store.platform_store_id})`,
                    logoUrl: "",
                    description: "فشل الاتصال بالمنصة. قد تحتاج إلى إعادة ربط المتجر لتحديث صلاحية التوكن.",
                    platform: store.platform as "salla" | "zid",
                    syncStatus: "failed" as const
                  }
                }
              })
            )
            setStoresList(detailedStores)
          } else {
            setStoresList([])
          }
        } catch (err: any) {
          console.error("خطأ أثناء جلب قائمة المتاجر:", err)
          setListError(err.message || "حدث خطأ أثناء تحميل قائمة المتاجر")
        } finally {
          setListLoading(false)
        }
      }
      fetchStores()
    } else {
      fetchStoreInfo(storeId, demoPlatform)
    }
  }, [storeId, demoPlatform, fetchStoreInfo, clearStoreInfo])

  // التوجيه للرئيسية في حال حدوث خطأ أثناء محاولة إدارة متجر فردي
  useEffect(() => {
    if (error && storeId) {
      toast.error(`فشل الاتصال بالمتجر: ${error}`)
      navigate("/dashboard", { replace: true })
    }
  }, [error, storeId, navigate])

  const handleSync = async () => {
    if (storeId) {
      await fetchStoreInfo(storeId, demoPlatform)
      toast.success("تم تحديث ومزامنة بيانات المتجر بنجاح!")
    }
  }

  const getStoreUrl = (description: string) => {
    const match = description.match(/https?:\/\/[^\s]+/)
    return match ? match[0] : null
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || ""

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground overflow-hidden font-sans selection:bg-accent selection:text-accent-foreground">
      {/* الخلفية الكلاسيكية للمنصة */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:32px_32px] opacity-10 pointer-events-none" />

      {/* الترويسة العلوية للملاحة */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between border-b border-border/80 backdrop-blur-md bg-background/50">
        <div className="flex items-center gap-3">
          <Link to={storeId ? "/dashboard" : "/"} className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center shadow-md shadow-primary/20">
              <Layers className="size-5 text-primary-foreground" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-foreground">
              DashAI
            </span>
          </Link>
          <Badge variant="outline" className="hidden sm:inline-flex border-border/80 text-muted-foreground text-xs rounded-lg px-2 py-0.5 font-medium">
            لوحة التحكم
          </Badge>
        </div>
        
        <div className="flex items-center gap-3">
          {/* عرض الافتار الخاص بالمستخدم في الأعلى */}
          {user && (
            <div className="flex items-center gap-2 border border-border/80 pl-3 pr-1.5 py-1 rounded-xl bg-background/60 shadow-sm">
              <Avatar className="size-7 rounded-lg border border-border">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-[10px] rounded-lg uppercase">
                  {user.email?.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-semibold text-foreground/80 hidden sm:inline">
                {userName}
              </span>
            </div>
          )}

          {storeId ? (
            <Button variant="outline" asChild className="rounded-xl border-border hover:bg-accent/40 font-bold text-xs py-2 px-3 h-9 cursor-pointer">
              <Link to="/dashboard" className="flex items-center gap-1">
                <ArrowRight className="size-3.5" />
                <span>رجوع للمتاجر</span>
              </Link>
            </Button>
          ) : (!listLoading && storesList.length > 0) ? (
            <Button variant="outline" asChild className="rounded-xl border-border hover:bg-accent/40 font-bold text-xs py-2 px-3 h-9 cursor-pointer">
              <Link to="/connect" className="flex items-center gap-1">
                <Plus className="size-3.5" />
                <span>ربط متجر جديد</span>
              </Link>
            </Button>
          ) : null}

          <Button 
            variant="ghost" 
            onClick={async () => {
              await handleLogout()
              toast.success("تم تسجيل الخروج بنجاح")
            }} 
            className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 font-bold text-xs h-9 cursor-pointer gap-1 px-3"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">خروج</span>
          </Button>
        </div>
      </header>

      {/* منطقة العمل الرئيسية */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-10 flex flex-col gap-8">
        
        {/* حالة التصفح 1: إدارة متجر محدد (يوجد store_id) - شاشة قيد الإنشاء كلاسيكية بسيطة */}
        {storeId ? (
          <section className="w-full">
            {loading ? (
              <div className="w-full max-w-xl mx-auto p-8 rounded-2xl border border-border bg-card/60 backdrop-blur-sm space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : storeInfo ? (
              <div className="w-full max-w-xl mx-auto py-12 px-8 rounded-2xl border border-border/80 bg-card shadow-sm text-center space-y-6">
                {/* اسم المتجر */}
                <h1 className="text-3xl font-black tracking-tight text-foreground m-0">
                  {storeInfo.storeName}
                </h1>

                {/* إشعار قيد الإنشاء */}
                <div className="py-12 flex flex-col items-center justify-center gap-4 border border-dashed border-border rounded-xl bg-muted/20">
                  <div className="size-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                    <Wrench className="size-8 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-foreground">لوحة التحكم قيد الإنشاء والربط</h3>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                      نقوم حالياً بتهيئة ميزات الذكاء الاصطناعي والتحليلات الخاصة بمتجر {storeInfo.storeName}. سننتهي قريباً!
                    </p>
                  </div>
                </div>

                {/* أزرار الإجراءات */}
                <div className="flex items-center justify-center gap-3">
                  <Button variant="outline" asChild className="rounded-xl px-5 py-5 text-xs font-bold cursor-pointer">
                    <Link to="/dashboard">العودة لقائمة المتاجر</Link>
                  </Button>
                  <Button onClick={handleSync} className="rounded-xl px-5 py-5 text-xs font-bold cursor-pointer gap-1">
                    <RefreshCw className="size-3.5" />
                    <span>مزامنة البيانات الحية</span>
                  </Button>
                </div>
              </div>
            ) : null}
          </section>
        ) : (
          /* حالة التصفح 2: عرض جدول المتاجر المرتبطة بتصميم كلاسيكي احترافي */
          <section className="w-full space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground m-0">
                  أهلاً بك {userName ? `يا ${userName}` : ""} 👋
                </h1>
                <p className="text-muted-foreground text-xs mt-1.5 font-medium leading-relaxed">
                  إليك جميع المتاجر المرتبطة بحسابك حالياً. يمكنك تصفح وإدارة كل متجر بشكل فردي.
                </p>
              </div>
            </div>

            {/* حالة التحميل */}
            {listLoading ? (
              <div className="border border-border/80 bg-card rounded-2xl p-6 space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center justify-between py-4 border-b border-border/40 last:border-0">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-10 rounded-lg shrink-0" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-24 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : listError ? (
              <div className="p-8 rounded-2xl bg-destructive/5 border border-destructive/20 text-destructive text-center flex flex-col items-center gap-2">
                <AlertCircle className="size-8" />
                <h3 className="font-bold text-sm">فشل تحميل قائمة المتاجر</h3>
                <p className="text-xs max-w-md leading-relaxed">{listError}</p>
                <Button 
                  onClick={() => navigate(0)} 
                  variant="outline" 
                  className="mt-2 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10 font-bold px-4 h-8 text-xs"
                >
                  إعادة المحاولة
                </Button>
              </div>
            ) : storesList.length > 0 ? (
              /* جدول المتاجر الكلاسيكي المنسق باحترافية */
              <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-right text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 font-bold text-muted-foreground select-none text-[10px] tracking-widest uppercase">
                        <th className="px-6 py-4.5 font-extrabold">معلومات المتجر</th>
                        <th className="px-6 py-4.5 font-extrabold">المنصة</th>
                        <th className="px-6 py-4.5 font-extrabold">حالة الاتصال</th>
                        <th className="px-6 py-4.5 font-extrabold text-center">خيارات التحكم</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {storesList.map((store) => {
                        const storeUrl = getStoreUrl(store.description)
                        
                        return (
                          <tr key={store.id} className="hover:bg-muted/10 transition-colors">
                            
                            {/* شعار واسم المتجر */}
                            <td className="px-6 py-4.5">
                              <div className="flex items-center gap-3">
                                <div className="size-9 rounded-lg border border-border bg-background flex items-center justify-center overflow-hidden shrink-0">
                                  {store.logoUrl ? (
                                    <img src={store.logoUrl} alt={store.storeName} className="size-full object-cover" />
                                  ) : (
                                    <Store className="size-4.5 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-bold text-foreground text-sm">
                                    {store.storeName}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-mono leading-none">
                                    معرف المتجر: {store.id.substring(0, 8)}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* شارة المنصة */}
                            <td className="px-6 py-4.5">
                              {store.platform === "salla" ? (
                                <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 rounded-md font-semibold text-[10px] px-2 py-0.5">
                                  منصة سلة
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-purple-500/5 text-purple-600 border-purple-500/20 rounded-md font-semibold text-[10px] px-2 py-0.5">
                                  منصة زد
                                </Badge>
                              )}
                            </td>

                            {/* شارة حالة المزامنة */}
                            <td className="px-6 py-4.5">
                              {store.syncStatus === "synced" ? (
                                <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                                  <span className="size-1.5 rounded-full bg-emerald-550 animate-pulse" />
                                  <span>مزامن بنجاح</span>
                                </span>
                              ) : store.syncStatus === "failed" ? (
                                <span className="inline-flex items-center gap-1.5 text-destructive font-bold text-xs">
                                  <span className="size-1.5 rounded-full bg-destructive" />
                                  <span>فشل الاتصال</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-amber-550 font-bold text-xs">
                                  <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  <span>انتظار المزامنة</span>
                                </span>
                              )}
                            </td>

                            {/* خيارات التحكم */}
                            <td className="px-6 py-4.5 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {/* زر زيارة المتجر */}
                                {storeUrl ? (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    asChild
                                    className="rounded-lg border-border hover:bg-accent/40 font-bold text-xs p-2 h-8 cursor-pointer"
                                    title="زيارة المتجر"
                                  >
                                    <a href={storeUrl} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="size-3.5" />
                                    </a>
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    disabled
                                    className="rounded-lg border-border opacity-30 font-bold text-xs p-2 h-8"
                                    title="الرابط غير متوفر"
                                  >
                                    <ExternalLink className="size-3.5" />
                                  </Button>
                                )}

                                {/* زر إدارة المتجر */}
                                <Button 
                                  size="sm" 
                                  asChild
                                  className="rounded-lg font-bold text-xs px-3.5 h-8 flex items-center gap-1 cursor-pointer shadow-sm"
                                >
                                  <Link to={`/dashboard?store_id=${store.id}&platform=${store.platform}`}>
                                    <span>إدارة المتجر</span>
                                    <ChevronLeft className="size-3.5" />
                                  </Link>
                                </Button>
                              </div>
                            </td>

                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* شاشة حالة عدم وجود أي متاجر مرتبطة (Empty State) */
              <div className="text-center p-16 border border-dashed border-border rounded-2xl bg-card max-w-md mx-auto flex flex-col items-center justify-center gap-5">
                <div className="size-16 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                  <Store className="size-8 text-primary" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-foreground">لم تقم بربط أي متجر بعد!</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed max-w-xs mx-auto">
                    اربط متجرك الأول على سلة أو زد لمزامنة الطلبات وتفعيل تحليلات الذكاء الاصطناعي فوراً.
                  </p>
                </div>

                <Button asChild size="sm" className="rounded-xl px-5 py-4 font-bold text-xs cursor-pointer border-0">
                  <Link to="/connect">اربط متجرك الأول الآن</Link>
                </Button>
              </div>
            )}
          </section>
        )}
        
      </main>
    </div>
  )
}

import { useStoreInfo } from "../hooks/useStoreInfo"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  Store,
  RefreshCw,
  Package,
  ShoppingCart,
  TrendingUp,
  ArrowRight,
  Layers,
  Sparkles,
  ArrowUpRight,
  AlertCircle
} from "lucide-react"
import { Link } from "react-router-dom"

export function TestDashboard() {
  const navigate = useNavigate()
  const { storeInfo, loading, error, refetch, storeId } = useStoreInfo()

  useEffect(() => {
    if (!loading) {
      if (!storeId) {
        toast.error("عذراً، يجب عليك مزامنة متجر سلة أو زد أولاً للوصول للوحة التحكم.")
        navigate("/connect", { replace: true })
      } else if (error) {
        toast.error(`فشل الاتصال بالمتجر: ${error}`)
        navigate("/connect", { replace: true })
      }
    }
  }, [loading, storeId, error, navigate])

  const handleSync = async () => {
    // محاكاة إعادة المزامنة وجلب البيانات الحية
    await refetch()
  }

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground overflow-hidden font-sans selection:bg-accent selection:text-accent-foreground">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:32px_32px] opacity-15 pointer-events-none" />
      
      {/* Soft Ambient Light Blobs */}
      <div className="absolute top-[-15%] left-[20%] w-[400px] md:w-[700px] h-[400px] md:h-[700px] rounded-full bg-primary/5 blur-[100px] md:blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[5%] right-[10%] w-[350px] md:w-[600px] h-[350px] md:h-[600px] rounded-full bg-accent/25 blur-[100px] md:blur-[150px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-border/60 backdrop-blur-md bg-background/40">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-xl bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center shadow-md shadow-primary/20">
            <Layers className="size-5 text-primary-foreground" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            DashAI
          </span>
          <Badge variant="outline" className="hidden sm:inline-flex border-border/80 text-muted-foreground text-xs rounded-lg px-2 py-0.5">
            لوحة تحكم التجربة
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild className="rounded-xl border-border hover:bg-accent/40 font-bold text-sm cursor-pointer">
            <Link to="/connect" className="flex items-center gap-1.5">
              <ArrowRight className="size-4" />
              <span>رجوع للاتصال</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-10 flex flex-col gap-8">
        
        {/* Error Alert if any */}
        {error && (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold flex items-center gap-3">
            <AlertCircle className="size-5 shrink-0" />
            <p className="grow leading-relaxed">{error}</p>
            <Button variant="outline" onClick={refetch} className="rounded-xl border-destructive/20 hover:bg-destructive/20 text-destructive font-bold text-xs shrink-0 cursor-pointer">
              إعادة المحاولة
            </Button>
          </div>
        )}

        {/* Dashboard Profile & Brand Section */}
        <section className="w-full">
          {loading ? (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 rounded-3xl border border-border/60 bg-card/60 backdrop-blur-sm">
              <div className="flex items-center gap-4 w-full">
                <Skeleton className="size-16 rounded-2xl shrink-0" />
                <div className="space-y-2.5 grow">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-full max-w-lg" />
                </div>
              </div>
              <Skeleton className="h-10 w-32 shrink-0 rounded-xl" />
            </div>
          ) : storeInfo ? (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 rounded-3xl border border-border/60 bg-card/60 backdrop-blur-sm shadow-sm relative overflow-hidden group">
              {/* Decorative Brand Accent Line */}
              <div className={`absolute top-0 right-0 left-0 h-1.5 ${
                storeInfo.platform === "salla" 
                  ? "bg-gradient-to-l from-emerald-500 to-teal-400" 
                  : "bg-gradient-to-l from-purple-600 to-indigo-500"
              }`} />
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                {/* Store Logo / Avatar */}
                <div className={`size-16 rounded-2xl flex items-center justify-center text-primary-foreground shadow-inner shrink-0 ${
                  storeInfo.platform === "salla"
                    ? "bg-gradient-to-tr from-emerald-500 to-teal-400"
                    : "bg-gradient-to-tr from-purple-600 to-indigo-500"
                }`}>
                  {storeInfo.logoUrl ? (
                    <img 
                      src={storeInfo.logoUrl} 
                      alt={storeInfo.storeName} 
                      className="size-full object-cover rounded-2xl"
                    />
                  ) : (
                    <Store className="size-8" />
                  )}
                </div>

                {/* Store Meta details */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-2xl font-black text-foreground">
                      {storeInfo.storeName}
                    </h2>
                    
                    {/* Platform identifier */}
                    {storeInfo.platform === "salla" ? (
                      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200/80 rounded-lg font-bold text-xs py-0.5 px-2.5">
                        منصة سلة
                      </Badge>
                    ) : (
                      <Badge className="bg-purple-50 text-purple-700 hover:bg-purple-50 border border-purple-200/80 rounded-lg font-bold text-xs py-0.5 px-2.5">
                        منصة زد
                      </Badge>
                    )}

                    {/* Sync Status Badge */}
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-500/5 text-emerald-600 font-semibold text-xs py-0.5 px-2.5 rounded-lg flex items-center gap-1.5 animate-pulse">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      <span>متصل ومزامن</span>
                    </Badge>
                  </div>
                  
                  <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed font-medium">
                    {storeInfo.description}
                  </p>
                </div>
              </div>

              {/* Instant Sync Action button */}
              <Button 
                onClick={handleSync} 
                className="w-full md:w-auto shrink-0 py-6 px-6 rounded-2xl bg-foreground hover:bg-foreground/90 text-background font-bold transition-all duration-300 shadow-lg cursor-pointer flex items-center justify-center gap-2 group/btn"
              >
                <RefreshCw className="size-4 animate-spin-slow group-hover/btn:rotate-180 transition-transform duration-500" />
                <span>مزامنة البيانات الحية</span>
              </Button>
            </div>
          ) : (
            <div className="text-center p-12 border border-dashed rounded-3xl bg-card/40">
              <Store className="size-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-bold text-foreground">لا توجد بيانات متجر متصلة</h3>
              <p className="text-muted-foreground text-sm mt-1">الرجاء الانتقال لصفحة الربط وتوصيل المتجر.</p>
              <Button asChild className="mt-4 rounded-xl cursor-pointer">
                <Link to="/connect">اربط متجرك الآن</Link>
              </Button>
            </div>
          )}
        </section>

        {/* Analytics & Performance Cards Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Products Count */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm rounded-2xl overflow-hidden relative">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardDescription className="text-xs font-bold text-muted-foreground">عدد المنتجات النشطة</CardDescription>
                <CardTitle className="text-3xl font-black text-foreground">148</CardTitle>
              </div>
              <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Package className="size-5" />
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                <ArrowUpRight className="size-3.5" />
                <span>+12% هذا الشهر</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Total Orders */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm rounded-2xl overflow-hidden relative">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardDescription className="text-xs font-bold text-muted-foreground">الطلبات المكتملة</CardDescription>
                <CardTitle className="text-3xl font-black text-foreground">843</CardTitle>
              </div>
              <div className="size-11 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-650">
                <ShoppingCart className="size-5" />
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                <ArrowUpRight className="size-3.5" />
                <span>+8% هذا الأسبوع</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Live Sales Trend */}
          <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm rounded-2xl overflow-hidden relative">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardDescription className="text-xs font-bold text-muted-foreground">إجمالي المبيعات المزامنة</CardDescription>
                <CardTitle className="text-3xl font-black text-foreground">12,450 ر.س</CardTitle>
              </div>
              <div className="size-11 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-600">
                <TrendingUp className="size-5" />
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                <ArrowUpRight className="size-3.5" />
                <span>+15% منذ الربط</span>
              </div>
            </CardContent>
          </Card>

        </section>

        {/* Demo Products Preview Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                <span>المنتجات المزامنة حياً</span>
                <Sparkles className="size-4 text-primary animate-pulse" />
              </h3>
              <p className="text-muted-foreground text-xs font-medium">قائمة تفاعلية بالمنتجات التي تم قراءتها من متجرك بالخلفية</p>
            </div>
            <Badge variant="outline" className="border-border/80 font-bold py-1 px-3 text-muted-foreground">
              مجموعات البيانات: 3 منتجات تجريبية
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Product Item 1 */}
            <Card className="border-border/50 bg-card/50 hover:bg-card hover:border-primary/20 hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden group">
              <div className="aspect-video w-full bg-accent/40 flex items-center justify-center relative overflow-hidden">
                <Store className="size-8 text-muted-foreground opacity-40 group-hover:scale-110 transition-transform duration-300" />
                <Badge className="absolute top-3 right-3 bg-foreground/5 backdrop-blur-md border border-border text-foreground hover:bg-foreground/5 rounded-lg text-xs font-bold">
                  سعر مألوف
                </Badge>
              </div>
              <CardHeader className="p-4 space-y-1">
                <CardTitle className="text-base font-bold text-foreground">قميص قطني كلاسيكي عالي الجودة</CardTitle>
                <CardDescription className="text-xs text-muted-foreground font-medium line-clamp-1">وصف المنتج القصير المستورد من المتجر</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 flex items-center justify-between">
                <span className="font-extrabold text-sm text-primary">120 ر.س</span>
                <span className="text-xs font-semibold text-muted-foreground">الكمية: 42 وحدة</span>
              </CardContent>
            </Card>

            {/* Product Item 2 */}
            <Card className="border-border/50 bg-card/50 hover:bg-card hover:border-primary/20 hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden group">
              <div className="aspect-video w-full bg-accent/40 flex items-center justify-center relative overflow-hidden">
                <Store className="size-8 text-muted-foreground opacity-40 group-hover:scale-110 transition-transform duration-300" />
                <Badge className="absolute top-3 right-3 bg-foreground/5 backdrop-blur-md border border-border text-foreground hover:bg-foreground/5 rounded-lg text-xs font-bold">
                  الأكثر مبيعاً
                </Badge>
              </div>
              <CardHeader className="p-4 space-y-1">
                <CardTitle className="text-base font-bold text-foreground">حذاء رياضي مريح للجري والمشي</CardTitle>
                <CardDescription className="text-xs text-muted-foreground font-medium line-clamp-1">توسيد فائق ووزن خفيف لتوفير راحة مثالية طوال اليوم</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 flex items-center justify-between">
                <span className="font-extrabold text-sm text-primary">280 ر.س</span>
                <span className="text-xs font-semibold text-muted-foreground">الكمية: 15 وحدة</span>
              </CardContent>
            </Card>

            {/* Product Item 3 */}
            <Card className="border-border/50 bg-card/50 hover:bg-card hover:border-primary/20 hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden group">
              <div className="aspect-video w-full bg-accent/40 flex items-center justify-center relative overflow-hidden">
                <Store className="size-8 text-muted-foreground opacity-40 group-hover:scale-110 transition-transform duration-300" />
                <Badge className="absolute top-3 right-3 bg-foreground/5 backdrop-blur-md border border-border text-foreground hover:bg-foreground/5 rounded-lg text-xs font-bold">
                  جديد بالمتجر
                </Badge>
              </div>
              <CardHeader className="p-4 space-y-1">
                <CardTitle className="text-base font-bold text-foreground">ساعة ذكية مضادة للماء بمستشعرات رياضية</CardTitle>
                <CardDescription className="text-xs text-muted-foreground font-medium line-clamp-1">تتبع نبضات القلب والأنشطة اليومية بدقة فائقة وشاشة OLED</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 flex items-center justify-between">
                <span className="font-extrabold text-sm text-primary">350 ر.س</span>
                <span className="text-xs font-semibold text-muted-foreground">الكمية: 8 وحدات</span>
              </CardContent>
            </Card>

          </div>
        </section>

      </main>
    </div>
  )
}

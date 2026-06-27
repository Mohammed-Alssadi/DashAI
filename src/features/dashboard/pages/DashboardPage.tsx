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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import {
  Activity,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Package2,
  Search,
  Users,
  Store,
  RefreshCw,
  ArrowRight,
  AlertCircle,
  ExternalLink,
  Plus,
  LogOut,
  ChevronLeft,
  Wrench,
  ChevronsUpDown,
  Home,
  Link2
} from "lucide-react"

export function DashboardPage() {
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
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background font-sans" dir="rtl">
        
        {/* 1. القائمة الجانبية Collapsible (RTL Desktop Sidebar using Shadcn pattern) */}
        <Sidebar side="right" variant="sidebar" collapsible="icon">
          
          {/* رأس القائمة الجانبية (الشعار) */}
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-1.5 border-b border-border/40 pb-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-b-0 group-data-[collapsible=icon]:pb-0">
              <Package2 className="h-6 w-6 text-primary shrink-0" />
              <span className="font-extrabold text-lg tracking-tight text-foreground group-data-[collapsible=icon]:hidden">
                DashAI System
              </span>
            </div>
          </SidebarHeader>

          {/* محتوى القائمة الجانبية */}
          <SidebarContent>
            
            {/* روابط التنقل الرئيسية */}
            <SidebarGroup>
              <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">التنقل</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={!storeId}>
                      <Link to="/dashboard" className="flex items-center gap-3 w-full">
                        <Home className="h-4 w-4 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">لوحة التحكم</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={false}>
                      <Link to="/connect" className="flex items-center gap-3 w-full">
                        <Link2 className="h-4 w-4 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">ربط المتاجر</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* متاحرك المرتبطة للتبديل السريع */}
            <SidebarGroup>
              <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">متاجرك المرتبطة</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {listLoading ? (
                    <div className="p-2 space-y-2 group-data-[collapsible=icon]:hidden">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ) : storesList.length > 0 ? (
                    storesList.map((store) => (
                      <SidebarMenuItem key={store.id}>
                        <SidebarMenuButton asChild isActive={storeId === store.id}>
                          <Link to={`/dashboard?store_id=${store.id}&platform=${store.platform}`} className="flex items-center gap-3 w-full">
                            {store.logoUrl ? (
                              <img src={store.logoUrl} className="size-4 rounded-full object-cover shrink-0" alt="" />
                            ) : (
                              <Store className="size-4 shrink-0" />
                            )}
                            <span className="group-data-[collapsible=icon]:hidden truncate">{store.storeName}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))
                  ) : (
                    <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
                      <span className="text-xs text-muted-foreground px-2">لا يوجد متاجر مرتبطة</span>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

          </SidebarContent>

          {/* تذييل القائمة الجانبية (الملف الشخصي المنبثق) */}
          <SidebarFooter>
            {user && (
              <SidebarMenu>
                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton
                        size="lg"
                        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground w-full"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden w-full text-right justify-between">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <Avatar className="size-8 rounded-lg border border-border">
                              <AvatarImage src={user.user_metadata?.avatar_url} />
                              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs rounded-lg uppercase">
                                {user.email?.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start leading-none overflow-hidden text-right group-data-[collapsible=icon]:hidden">
                              <span className="text-xs font-bold text-foreground truncate max-w-[120px]">
                                {userName}
                              </span>
                              <span className="text-[9px] text-muted-foreground truncate max-w-[120px] font-mono mt-0.5">
                                {user.email}
                              </span>
                            </div>
                          </div>
                          <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0 group-data-[collapsible=icon]:hidden" />
                        </div>
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 font-sans">
                      <DropdownMenuLabel className="text-right">حسابي</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="justify-end cursor-pointer text-right">إعدادات الحساب</DropdownMenuItem>
                      <DropdownMenuItem className="justify-end cursor-pointer text-right">الدعم الفني</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={async () => {
                          await handleLogout()
                          toast.success("تم تسجيل الخروج بنجاح")
                        }} 
                        className="justify-end cursor-pointer text-destructive focus:text-destructive text-right"
                      >
                        <LogOut className="h-4 w-4 ml-2" />
                        <span>تسجيل الخروج</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              </SidebarMenu>
            )}
          </SidebarFooter>

        </Sidebar>

        {/* 2. منطقة المحتوى والترويسة */}
        <div className="flex-1 flex flex-col min-h-screen">
          
          {/* الترويسة العلوية للبحث والتنقل والتحكم الجانبي */}
          <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-40">
            
            {/* زر فتح/إغلاق القائمة الجانبية (Sidebar Trigger) */}
            <SidebarTrigger className="h-9 w-9 border border-border" />

            {/* حقل البحث والأدوات */}
            <div className="flex w-full items-center gap-4 md:mr-auto md:gap-2 lg:gap-4">
              <div className="mr-auto flex-1 sm:flex-initial">
                <div className="relative">
                  <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="البحث عن منتجات..."
                    className="pr-8 sm:w-[300px] md:w-[200px] lg:w-[300px] text-right"
                  />
                </div>
              </div>

              {/* أزرار التنقل السريع */}
              {!storeId && !listLoading && storesList.length > 0 && (
                <Button variant="outline" asChild className="rounded-xl border-border hover:bg-accent/40 font-bold text-xs py-2 px-3 h-9 cursor-pointer">
                  <Link to="/connect" className="flex items-center gap-1">
                    <Plus className="size-3.5" />
                    <span>ربط متجر جديد</span>
                  </Link>
                </Button>
              )}

              {storeId && (
                <Button variant="outline" asChild className="rounded-xl border-border hover:bg-accent/40 font-bold text-xs py-2 px-3 h-9 cursor-pointer">
                  <Link to="/dashboard" className="flex items-center gap-1">
                    <ArrowRight className="size-3.5" />
                    <span>رجوع للمتاجر</span>
                  </Link>
                </Button>
              )}
            </div>
          </header>

          {/* 3. الإحصائيات والشبكة السفلية */}
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            
            {/* الإحصائيات الأربعة العلوية */}
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">14,235.00 ر.س</div>
                  <p className="text-xs text-muted-foreground">+12.5% عن الشهر الماضي</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">الطلبات النشطة</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+120</div>
                  <p className="text-xs text-muted-foreground">+4% عن الأسبوع الماضي</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">المتاجر النشطة</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {listLoading ? <Skeleton className="h-8 w-12 inline-block" /> : storesList.length}
                  </div>
                  <p className="text-xs text-muted-foreground">متاجر مرتبطة بحسابك</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">استقرار الربط</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-500">مستقر</div>
                  <p className="text-xs text-muted-foreground">مزامن بنجاح مع سلة وزد</p>
                </CardContent>
              </Card>
            </div>

            {/* الهيكل السفلي للجدول والأنشطة */}
            {storeId ? (
              /* شاشة إدارة متجر محدد: قيد الإنشاء كلاسيكية */
              <div className="w-full max-w-xl mx-auto py-12 px-8 rounded-xl border border-border bg-card text-center space-y-6">
                <h1 className="text-2xl font-black text-foreground m-0">
                  {loading ? <Skeleton className="h-8 w-32 mx-auto" /> : storeInfo?.storeName}
                </h1>
                <div className="py-12 flex flex-col items-center justify-center gap-4 border border-dashed border-border rounded-lg bg-muted/10">
                  <div className="size-16 rounded-full bg-amber-500/5 border border-amber-500/10 flex items-center justify-center text-amber-500">
                    <Wrench className="size-7 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-foreground">لوحة التحكم قيد الإنشاء والربط</h3>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                      نقوم حالياً بتهيئة ميزات الذكاء الاصطناعي والتحليلات الخاصة بمتجر {storeInfo?.storeName}. سننتهي قريباً!
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <Button variant="outline" asChild className="rounded-xl px-4 h-9 text-xs font-bold cursor-pointer">
                    <Link to="/dashboard">العودة لقائمة المتاجر</Link>
                  </Button>
                  <Button onClick={handleSync} className="rounded-xl px-4 h-9 text-xs font-bold cursor-pointer gap-1">
                    <RefreshCw className="size-3.5" />
                    <span>مزامنة البيانات الحية</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                
                {/* قائمة المتاجر */}
                <Card className="xl:col-span-2">
                  <CardHeader className="flex flex-row items-center">
                    <div className="grid gap-1">
                      <CardTitle>المتاجر المرتبطة</CardTitle>
                      <CardDescription>جميع المتاجر التي قمت بربطها بمشروعك عبر سلة أو زد.</CardDescription>
                    </div>
                    {storesList.length > 0 && (
                      <Button asChild size="sm" className="mr-auto gap-1">
                        <Link to="/connect">
                          ربط جديد
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {listLoading ? (
                      <div className="space-y-4 py-4">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ) : listError ? (
                      <div className="p-6 text-center text-destructive bg-destructive/5 rounded-lg border border-destructive/10">
                        <AlertCircle className="size-8 mx-auto mb-2" />
                        <p className="text-xs font-semibold">{listError}</p>
                      </div>
                    ) : storesList.length > 0 ? (
                      <Table className="text-right">
                        <TableHeader>
                          <TableRow>
                            <TableHead>المتجر</TableHead>
                            <TableHead>المنصة</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead className="text-left">التحكم</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {storesList.map((store) => {
                            const storeUrl = getStoreUrl(store.description)
                            return (
                              <TableRow key={store.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="size-9 rounded-lg border border-border bg-background flex items-center justify-center overflow-hidden shrink-0">
                                      {store.logoUrl ? (
                                        <img src={store.logoUrl} alt={store.storeName} className="size-full object-cover" />
                                      ) : (
                                        <Store className="size-4.5 text-muted-foreground" />
                                      )}
                                    </div>
                                    <div className="font-semibold text-foreground">{store.storeName}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {store.platform === "salla" ? (
                                    <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20">
                                      سلة
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-purple-500/5 text-purple-600 border-purple-500/20">
                                      زد
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="align-middle">
                                  {store.syncStatus === "synced" ? (
                                    <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                                      <span className="size-1.5 rounded-full bg-emerald-500" />
                                      <span>مزامن</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 text-destructive font-bold text-xs">
                                      <span className="size-1.5 rounded-full bg-destructive" />
                                      <span>فشل</span>
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-left">
                                  <div className="flex items-center justify-end gap-2">
                                    {storeUrl && (
                                      <Button variant="outline" size="sm" asChild className="rounded-lg h-8 px-2 cursor-pointer">
                                        <a href={storeUrl} target="_blank" rel="noopener noreferrer">
                                          <ExternalLink className="size-3.5" />
                                        </a>
                                      </Button>
                                    )}
                                    <Button size="sm" asChild className="rounded-lg h-8 px-3 cursor-pointer">
                                      <Link to={`/dashboard?store_id=${store.id}&platform=${store.platform}`}>
                                        <span>إدارة</span>
                                        <ChevronLeft className="size-3.5" />
                                      </Link>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-16 flex flex-col items-center justify-center gap-5 border border-dashed border-border rounded-xl">
                        <Store className="size-10 text-muted-foreground" />
                        <div className="space-y-1">
                          <h3 className="font-bold text-sm text-foreground">لم يتم ربط أي متجر</h3>
                          <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                            قم بربط متجرك على سلة أو زد لمزامنة المنتجات والطلبات وتفعيل ميزات الذكاء الاصطناعي.
                          </p>
                        </div>
                        <Button asChild size="sm" className="rounded-lg h-9 px-4 cursor-pointer border-0">
                          <Link to="/connect">ربط متجرك الأول</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* الأنشطة والعمليات */}
                <Card>
                  <CardHeader>
                    <CardTitle>الأنشطة وعمليات المزامنة</CardTitle>
                    <CardDescription>آخر العمليات التي تمت في خوادم المزامنة مؤخراً.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-emerald-500/10 text-emerald-600 font-bold text-xs uppercase">SL</AvatarFallback>
                      </Avatar>
                      <div className="grid gap-1">
                        <p className="text-xs font-semibold leading-none text-foreground">مزامنة المنتجات</p>
                        <p className="text-[10px] text-muted-foreground">متجر سلة - نجحت المزامنة</p>
                      </div>
                      <div className="ml-auto font-mono text-[10px] text-muted-foreground">منذ 2 دقيقة</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-purple-500/10 text-purple-600 font-bold text-xs uppercase">ZD</AvatarFallback>
                      </Avatar>
                      <div className="grid gap-1">
                        <p className="text-xs font-semibold leading-none text-foreground">تحديث توكن الوصول</p>
                        <p className="text-[10px] text-muted-foreground">متجر زد - تم التحديث بنجاح</p>
                      </div>
                      <div className="ml-auto font-mono text-[10px] text-muted-foreground">منذ ساعة</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-muted text-muted-foreground font-bold text-xs uppercase">SY</AvatarFallback>
                      </Avatar>
                      <div className="grid gap-1">
                        <p className="text-xs font-semibold leading-none text-foreground">تجديد قاعدة البيانات</p>
                        <p className="text-[10px] text-muted-foreground">تطبيق سياسات الأمان RLS</p>
                      </div>
                      <div className="ml-auto font-mono text-[10px] text-muted-foreground">منذ 3 ساعات</div>
                    </div>
                  </CardContent>
                </Card>

              </div>
            )}

          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

import { useEffect } from "react"
import { Link, useNavigate, useSearchParams, Outlet } from "react-router-dom"
import { toast } from "sonner"
import { useAuth } from "@/features/auth"
import { useDashboardStore } from "../store/storeInfoStore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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
  Package2,
  Search,
  Store,
  LogOut,
  Home,
  Link2,
  Plus,
  ArrowRight,
  MoreVertical,
  CircleUser,
  CreditCard,
  Bell
} from "lucide-react"

export function DashboardLayout() {
  const navigate = useNavigate()
  const { handleLogout } = useAuth()
  const [searchParams] = useSearchParams()
  const storeId = searchParams.get("store_id") ?? undefined

  // استخدام مخزن الحالات الموحد (Zustand) لإدارة البيانات والمستخدم
  const {
    user,
    fetchUser,
    storesList,
    listLoading,
    listError,
    fetchStoresList
  } = useDashboardStore()

  // جلب معلومات الجلسة وقائمة المتاجر مرة واحدة عند تحميل المخطط
  useEffect(() => {
    fetchUser()
    fetchStoresList()
  }, [fetchUser, fetchStoresList])

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || ""

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background font-sans" dir="rtl">
        
        {/* 1. القائمة الجانبية Collapsible (RTL Desktop Sidebar) */}
        <Sidebar side="right" variant="sidebar" collapsible="icon">
          
          {/* رأس القائمة الجانبية (الشعار التفاعلي والفاخر) */}
          <SidebarHeader className="border-b-0 pb-1">
            <div className="flex items-center gap-3 px-1 py-2 group-data-[collapsible=icon]:justify-center">
              
              {/* أيقونة اللوجو الرسمية - تكبيرها للتوضيح وتقليصها تلقائياً عند الطي */}
              <div className="relative flex items-center justify-center size-11 group-data-[collapsible=icon]:size-8 rounded-xl bg-background border border-border/80 shadow-sm shrink-0 transition-all duration-300 hover:scale-105 group-data-[collapsible=icon]:mx-auto overflow-hidden">
                <img src="/logo.png" alt="DashAI" className="size-full object-cover" />
                <span className="absolute top-0.5 left-0.5 size-1.5 bg-emerald-500 rounded-full border border-card animate-ping" />
                <span className="absolute top-0.5 left-0.5 size-1.5 bg-emerald-500 rounded-full border border-card" />
              </div>

              {/* الاسم الأساسي والوسم التوضيحي الأنيق */}
              <div className="flex flex-col items-start leading-none group-data-[collapsible=icon]:hidden">
                <span className="font-extrabold text-xl  tracking-tight text-foreground">
                  DashAI
                </span>
                <span className="text-[11px] text-primary font-semibold mt-1.5 bg-primary/5 px-3 py-1 rounded-md border border-primary/10">
                  لوحة تحكم ذكية
                </span>
              </div>

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
                    <SidebarMenuButton asChild isActive={!storeId && window.location.pathname === "/dashboard"}>
                      <Link to="/dashboard" className="flex items-center gap-3 w-full">
                        <Home className="h-4 w-4 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">لوحة التحكم</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={window.location.pathname === "/connect"}>
                      <Link to="/connect" className="flex items-center gap-3 w-full">
                        <Link2 className="h-4 w-4 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">ربط المتاجر</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* متاجرك المرتبطة للتبديل السريع */}
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

          {/* تذييل القائمة الجانبية (الملف الشخصي المنبثق متطابق مع الشاد إيكون) */}
          <SidebarFooter>
            {user && (
              <SidebarMenu>
                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton
                        size="lg"
                        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground w-full hover:bg-muted/60 transition-colors rounded-lg px-2"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden w-full justify-between">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <Avatar className="size-8 rounded-lg border border-border">
                              <AvatarImage src={user.user_metadata?.avatar_url} />
                              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs rounded-lg uppercase">
                                {user.email?.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start leading-none overflow-hidden text-right group-data-[collapsible=icon]:hidden">
                              <span className="text-xs font-bold text-foreground truncate max-w-[110px]">
                                {userName}
                              </span>
                              <span className="text-[10px] text-muted-foreground truncate max-w-[110px] mt-1">
                                {user.email}
                              </span>
                            </div>
                          </div>
                          <MoreVertical className="h-4 w-4 text-muted-foreground shrink-0 group-data-[collapsible=icon]:hidden" />
                        </div>
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    
                    <DropdownMenuContent 
                      align="end" 
                      side="top" 
                      className="w-56 font-sans p-1.5 border border-border/60 shadow-md rounded-xl bg-popover"
                    >
                      {/* رأس القائمة المنسدلة (مطابق لملف التعريف واللوجو بالصور) */}
                      <div className="flex items-center gap-2.5 p-2 pb-2.5 border-b border-border/40 mb-1">
                        <Avatar className="size-8 rounded-lg border border-border shrink-0">
                          <AvatarImage src={user.user_metadata?.avatar_url} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs rounded-lg uppercase">
                            {user.email?.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start leading-tight text-right overflow-hidden">
                          <span className="text-xs font-bold text-foreground truncate max-w-[140px]">
                            {userName}
                          </span>
                          <span className="text-[9px] text-muted-foreground truncate max-w-[140px] mt-0.5">
                            {user.email}
                          </span>
                        </div>
                      </div>
                      
                      {/* خيارات الحساب مع الأيقونات والأسماء بالعربي */}
                      <DropdownMenuItem className="flex items-center justify-start gap-2 cursor-pointer text-right py-2 px-2 text-xs font-medium rounded-md hover:bg-muted/50">
                        <CircleUser className="size-3.5 text-muted-foreground shrink-0" />
                        <span>إعدادات الحساب</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center justify-start gap-2 cursor-pointer text-right py-2 px-2 text-xs font-medium rounded-md hover:bg-muted/50">
                        <CreditCard className="size-3.5 text-muted-foreground shrink-0" />
                        <span>الاشتراكات والمدفوعات</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center justify-start gap-2 cursor-pointer text-right py-2 px-2 text-xs font-medium rounded-md hover:bg-muted/50">
                        <Bell className="size-3.5 text-muted-foreground shrink-0" />
                        <span>الإشعارات والتنبيهات</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator className="my-1 border-border/40" />
                      
                      <DropdownMenuItem 
                        onClick={async () => {
                          await handleLogout()
                          toast.success("تم تسجيل الخروج بنجاح")
                        }} 
                        className="flex items-center justify-start gap-2 cursor-pointer text-right py-2 px-2 text-xs font-semibold text-destructive hover:bg-destructive/5 hover:text-destructive rounded-md"
                      >
                        <LogOut className="size-3.5 shrink-0" />
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
        <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
          
          {/* الترويسة العلوية للبحث والتنقل والتحكم الجانبي */}
          <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-40">
            
            {/* زر فتح/إغلاق القائمة الجانبية (Sidebar Trigger) */}
            <SidebarTrigger className="h-9 w-9 border border-border shrink-0" />

            {/* حقل البحث والأدوات */}
            <div className="flex w-full items-center gap-4 md:mr-auto md:gap-2 lg:gap-4">
              <div className="mr-auto flex-1 sm:flex-initial">
                <div className="relative">
                
                </div>
              </div>

              {/* أزرار التنقل السريع */}
              {window.location.pathname === "/dashboard" && !storeId && !listLoading && storesList.length > 0 && (
                <Button variant="outline" asChild className="rounded-xl border-border hover:bg-accent/40 font-bold text-xs py-2 px-3 h-9 cursor-pointer">
                  <Link to="/connect" className="flex items-center gap-1">
                    <Plus className="size-3.5" />
                    <span>ربط متجر جديد</span>
                  </Link>
                </Button>
              )}

              {window.location.pathname === "/dashboard" && storeId && (
                <Button variant="outline" asChild className="rounded-xl border-border hover:bg-accent/40 font-bold text-xs py-2 px-3 h-9 cursor-pointer">
                  <Link to="/dashboard" className="flex items-center gap-1">
                    <ArrowRight className="size-3.5" />
                    <span>رجوع للمتاجر</span>
                  </Link>
                </Button>
              )}

              {window.location.pathname === "/connect" && (
                <Button variant="outline" asChild className="rounded-xl border-border hover:bg-accent/40 font-bold text-xs py-2 px-3 h-9 cursor-pointer">
                  <Link to="/dashboard" className="flex items-center gap-1">
                    <ArrowRight className="size-3.5" />
                    <span>رجوع للوحة التحكم</span>
                  </Link>
                </Button>
              )}
            </div>
          </header>

          {/* محتوى الصفحة الفرعية */}
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <Outlet context={{ user, storesList, listLoading, listError, refreshStoresList: fetchStoresList }} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

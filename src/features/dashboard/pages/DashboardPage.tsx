import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { toast } from "sonner"
import { useDashboardStore } from "../store/storeInfoStore"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowUpRight,
  Store,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  Wrench,
  Link2Off,
  X
} from "lucide-react"


export function DashboardPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const storeId = searchParams.get("store_id") ?? undefined
  const demoPlatform = searchParams.get("demo") ?? searchParams.get("platform") ?? undefined

  // حالات مودال التأكيد الاحترافي لقطع الارتباط
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [storeToDisconnect, setStoreToDisconnect] = useState<{ id: string; name: string } | null>(null)

  // استهلاك كافة الحالات من مخزن الحالات الموحد (Zustand)
  const {
    storesList,
    listLoading,
    listError,
    fetchStoresList,
    storeInfo,
    loading,
    error,
    fetchStoreInfo,
    clearStoreInfo,
    disconnectStore
  } = useDashboardStore()

  // جلب البيانات للحالة المناسبة
  useEffect(() => {
    if (!storeId) {
      clearStoreInfo()
      fetchStoresList()
    } else {
      fetchStoreInfo(storeId, demoPlatform)
    }
  }, [storeId, demoPlatform, fetchStoreInfo, clearStoreInfo, fetchStoresList])

  // التوجيه للرئيسية في حال حدوث خطأ أثناء محاولة إدارة متجر فردي
  useEffect(() => {
    if (error && storeId) {
      toast.error(`فشل الاتصال بالمتجر: ${error}`)
      navigate("/dashboard", { replace: true })
    }
  }, [error, storeId, navigate])

  // معالجة توست نجاح الربط عند التوجيه للوحة التحكم وجلب المتاجر الجديدة فوراً
  useEffect(() => {
    const success = searchParams.get("success") === "true" || searchParams.get("status") === "success" || searchParams.get("connected") === "true"
    if (success) {
      toast.success("تم ربط متجرك بنجاح ومزامنة البيانات حية!")
      
      // تنظيف معلمات البحث لتجنب تكرار الرسالة عند التحديث
      const newParams = new URLSearchParams(searchParams)
      newParams.delete("success")
      newParams.delete("status")
      newParams.delete("connected")
      setSearchParams(newParams, { replace: true })
      
      // إجبار المخزن الموحد على جلب القائمة الجديدة فوراً
      fetchStoresList(true)
    }
  }, [searchParams, setSearchParams, fetchStoresList])

  const handleSync = async () => {
    if (storeId) {
      await fetchStoreInfo(storeId, demoPlatform, true)
      toast.success("تم تحديث ومزامنة بيانات المتجر بنجاح!")
    }
  }

  const handleDisconnect = (id: string, name: string) => {
    setStoreToDisconnect({ id, name })
    setIsConfirmOpen(true)
  }

  const handleConfirmDisconnect = async () => {
    if (!storeToDisconnect) return
    setIsConfirmOpen(false)

    const toastId = toast.loading("جاري إلغاء ربط المتجر...")
    try {
      await disconnectStore(storeToDisconnect.id)
      toast.dismiss(toastId)
      toast.success("تم قطع ارتباط المتجر بنجاح!")
    } catch (err) {
      toast.dismiss(toastId)
      toast.error("فشل إلغاء ربط المتجر، يرجى المحاولة مرة أخرى.")
    } finally {
      setStoreToDisconnect(null)
    }
  }

  const getStoreUrl = (description: string) => {
    const match = description.match(/https?:\/\/[^\s]+/)
    return match ? match[0] : null
  }

  return (
    <div className="flex flex-col gap-4 md:gap-8 w-full animate-fade-in">
      
   

      {/* الهيكل السفلي للجدول والأنشطة */}
      {storeId ? (
        /* شاشة إدارة متجر محدد: قيد الإنشاء كلاسيكية */
        <div className="w-full max-w-xl mx-auto py-12 px-8 rounded-xl border border-border bg-card text-center space-y-6 shadow-sm">
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
        <div className="w-full space-y-6">
          
          {/* رأس الصفحة مع عنوان وزر ربط جديد */}
          <div className="flex flex-row items-center justify-between">
            <div className="grid gap-1 text-right">
              <h2 className="text-lg font-bold tracking-tight text-foreground m-0">المتاجر المرتبطة</h2>
              <p className="text-xs text-muted-foreground">جميع المتاجر التي قمت بربطها بمشروعك عبر سلة أو زد.</p>
            </div>
            {storesList.length > 0 && (
              <Button asChild size="sm" className="mr-auto gap-1 border-0">
                <Link to="/connect">
                  <span>ربط متجر جديد</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>

          {/* جدول المتاجر الاستجابي ملان الشاشة */}
          {listLoading ? (
            <div className="space-y-4 py-4 w-full">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : listError ? (
            <div className="p-6 text-center text-destructive bg-destructive/5 rounded-lg border border-destructive/10 w-full">
              <AlertCircle className="size-8 mx-auto mb-2" />
              <p className="text-xs font-semibold">{listError}</p>
            </div>
          ) : storesList.length > 0 ? (
            <div className="w-full border border-border/60 rounded-xl bg-card overflow-hidden shadow-xs">
              <Table className="text-right w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-3.5 px-4 font-bold text-foreground">المتجر</TableHead>
                    <TableHead className="py-3.5 px-4 font-bold text-foreground">المنصة</TableHead>
                    <TableHead className="py-3.5 px-4 font-bold text-foreground">الحالة</TableHead>
                    <TableHead className="py-3.5 px-4 font-bold text-foreground text-left">التحكم</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {storesList.map((store) => {
                    const storeUrl = getStoreUrl(store.description)
                    return (
                      <TableRow key={store.id} className="hover:bg-muted/30">
                        <TableCell className="py-4 px-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-lg border border-border bg-background flex items-center justify-center overflow-hidden shrink-0">
                              {store.logoUrl ? (
                                <img src={store.logoUrl} alt={store.storeName} className="size-full object-cover" />
                              ) : (
                                <Store className="size-4.5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="font-semibold text-foreground text-sm">{store.storeName}</div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-4 align-middle">
                          {store.platform === "salla" ? (
                            <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/10">
                              سلة
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-purple-500/5 text-purple-600 border-purple-500/10">
                              زد
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-4 px-4 align-middle">
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
                        <TableCell className="py-4 px-4 align-middle text-left">
                          <div className="flex items-center justify-end gap-2">
                            {storeUrl && (
                              <Button variant="outline" size="sm" asChild className="rounded-lg h-8 px-2.5 cursor-pointer" title="زيارة المتجر">
                                <a href={storeUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="size-3.5" />
                                </a>
                              </Button>
                            )}
                            <Button size="sm" asChild className="rounded-lg h-8 px-3 cursor-pointer" title="إدارة المتجر">
                              <Link to={`/dashboard?store_id=${store.id}&platform=${store.platform}`}>
                                <span>إدارة</span>
                                <ChevronLeft className="size-3.5" />
                              </Link>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDisconnect(store.id, store.storeName)}
                              className="rounded-lg h-8 px-2.5 cursor-pointer text-destructive border-destructive/20 hover:bg-destructive/5 hover:text-destructive transition-colors"
                              title="قطع الارتباط"
                            >
                              <Link2Off className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-16 flex flex-col items-center justify-center gap-5 border border-dashed border-border/80 rounded-xl bg-card w-full">
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
        </div>
      )}

      {/* ⚠️ مودال تأكيد قطع الارتباط الاحترافي المتناسق مع التصميم */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="font-sans border border-border/60 rounded-xl max-w-sm p-5 bg-card text-right" showCloseButton={false}>
          {/* زر إغلاق مخصص في أعلى اليسار لمنع التداخل مع العنوان العربي في اليمين */}
          <DialogClose asChild>
            <Button 
              variant="ghost" 
              className="absolute top-3 left-3 size-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted/50 border-0"
              title="إغلاق"
            >
              <X className="size-4.5" />
            </Button>
          </DialogClose>

          <DialogHeader className="text-right">
            <DialogTitle className="text-lg font-bold text-foreground">تأكيد قطع الارتباط</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2 leading-relaxed">
              هل أنت متأكد من رغبتك في قطع ارتباط متجر <span className="font-bold text-foreground">"{storeToDisconnect?.name}"</span>؟
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-right">
            <div className="p-3 bg-destructive/5 border border-destructive/10 text-destructive text-xs rounded-lg leading-relaxed flex items-start gap-2">
              <AlertCircle className="size-4.5 shrink-0 mt-0.5" />
              <span>
                تحذير: سيؤدي قطع الارتباط إلى إيقاف مزامنة المنتجات والطلبات فوراً وإلغاء جميع صلاحيات المزامنة السحابية.
              </span>
            </div>
          </div>
          <DialogFooter className="flex flex-row-reverse sm:flex-row gap-2 -mx-5 -mb-5 border-t bg-muted/50 p-4 justify-end mt-4 rounded-b-xl border-border/40">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmOpen(false)}
              className="rounded-lg text-sm h-11 cursor-pointer flex-1"
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDisconnect}
              className="rounded-lg text-sm h-11 cursor-pointer flex-1 bg-destructive hover:bg-destructive/90 text-white border-0"
            >
              تأكيد قطع الارتباط
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

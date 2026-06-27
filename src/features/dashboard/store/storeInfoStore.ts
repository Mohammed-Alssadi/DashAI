import { create } from "zustand"
import { supabase } from "@/lib/supabase/client"
import { dashboardService, type StoreDetails } from "../services/dashboardService"

interface DashboardState {
  // 1. حالة المستخدم
  user: any
  userLoading: boolean
  fetchUser: () => Promise<void>

  // 2. حالة قائمة المتاجر المرتبطة (مع التخزين المؤقت)
  storesList: (StoreDetails & { id: string })[]
  listLoading: boolean
  listError: string | null
  fetchStoresList: (force?: boolean) => Promise<void>

  // 3. حالة المتجر المحدد الحالية (مع التخزين المؤقت)
  activeStoreId: string | null
  storeInfo: StoreDetails | null
  loading: boolean
  error: string | null
  fetchStoreInfo: (storeId?: string, demoPlatform?: string, force?: boolean) => Promise<void>
  clearStoreInfo: () => void
  disconnectStore: (storeId: string) => Promise<void>
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // حالة المستخدم الأولية
  user: null,
  userLoading: false,
  fetchUser: async () => {
    // عدم إعادة جلب بيانات المستخدم إذا كانت موجودة مسبقاً لمنع الرندر غير المفيد
    if (get().user) return
    
    set({ userLoading: true })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      set({ user })
    } catch (err) {
      console.error("خطأ أثناء جلب المستخدم:", err)
    } finally {
      set({ userLoading: false })
    }
  },

  // حالة قائمة المتاجر الأولية
  storesList: [],
  listLoading: false,
  listError: null,
  fetchStoresList: async (force = false) => {
    // 💡 ميزة التخزين المؤقت (Caching):
    // إذا كانت القائمة محملة مسبقاً ولم نطلب تحديثاً إجبارياً، نستخدم الكاش فوراً لمنع وميض الشاشة
    if (get().storesList.length > 0 && !force) {
      return
    }

    set({ listLoading: true, listError: null })
    try {
      const linkedStores = await dashboardService.getLinkedStores()

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
        set({ storesList: detailedStores })
      } else {
        set({ storesList: [] })
      }
    } catch (err: any) {
      console.error("خطأ أثناء جلب قائمة المتاجر:", err)
      set({ listError: err.message || "حدث خطأ أثناء تحميل قائمة المتاجر" })
    } finally {
      set({ listLoading: false })
    }
  },

  // حالة المتجر المختار الأولية
  activeStoreId: null,
  storeInfo: null,
  loading: false,
  error: null,
  fetchStoreInfo: async (storeId, demoPlatform, force = false) => {
    // 💡 ميزة التخزين المؤقت (Caching):
    // إذا كان المتجر المطلوب هو نفسه المفتوح حالياً وتفاصيله محملة مسبقاً، نستخدم الكاش مباشرة
    if (get().storeInfo && get().activeStoreId === storeId && !force) {
      return
    }

    set({ loading: true, error: null, activeStoreId: storeId || null })
    try {
      const data = await dashboardService.getStoreDetails(storeId, demoPlatform)
      set({ storeInfo: data })
    } catch (err: any) {
      set({ 
        error: err.message || "حدث خطأ أثناء جلب بيانات المتجر", 
        storeInfo: null,
        activeStoreId: null
      })
    } finally {
      set({ loading: false })
    }
  },
  clearStoreInfo: () => set({ storeInfo: null, activeStoreId: null, loading: false, error: null }),
  disconnectStore: async (storeId: string) => {
    set({ listLoading: true, listError: null })
    try {
      await dashboardService.disconnectStore(storeId)
      // تحديث قائمة المتاجر محلياً فوراً لحذف المتجر المقطع ارتباطه
      set((state) => ({
        storesList: state.storesList.filter((s) => s.id !== storeId)
      }))
    } catch (err: any) {
      console.error("خطأ أثناء إلغاء ربط المتجر:", err)
      set({ listError: err.message || "حدث خطأ أثناء إلغاء ربط المتجر" })
      throw err
    } finally {
      set({ listLoading: false })
    }
  }
}))

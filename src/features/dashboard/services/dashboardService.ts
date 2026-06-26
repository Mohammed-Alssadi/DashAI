import { axiosClient } from "@/lib/api/axiosClient"

export interface StoreDetails {
  storeName: string
  logoUrl: string
  description: string
  platform: "salla" | "zid"
  syncStatus: "synced" | "pending" | "failed"
  managerEmail?: string
}

// بيانات تجريبية للمعاينة عند عدم وجود Edge Function أو مفاتيح
const DEMO_DATA: Record<string, StoreDetails> = {
  salla: {
    storeName: "متجر سلة التجريبي",
    logoUrl: "",
    description: "هذه بيانات تجريبية — بعد إضافة مفاتيح سلة ستظهر بيانات متجرك الحقيقية هنا.",
    platform: "salla",
    syncStatus: "synced",
    managerEmail: "demo@salla.store",
  },
  zid: {
    storeName: "متجر زد التجريبي",
    logoUrl: "",
    description: "هذه بيانات تجريبية — بعد إضافة مفاتيح زد ستظهر بيانات متجرك الحقيقية هنا.",
    platform: "zid",
    syncStatus: "synced",
    managerEmail: "demo@zid.store",
  },
}

export const dashboardService = {
  // جلب تفاصيل المتجر حياً من الـ Edge Function
  getStoreDetails: async (storeId?: string, demoPlatform?: string): Promise<StoreDetails> => {
    // وضع المعاينة: إذا لم يكن هناك storeId حقيقي
    if (!storeId || storeId === "demo") {
      const platform = demoPlatform === "zid" ? "zid" : "salla"
      console.info(`📦 وضع المعاينة (${platform}) — لا يوجد store_id حقيقي بعد`)
      return DEMO_DATA[platform]
    }

    try {
      const response = await axiosClient.get<StoreDetails>("/get-store-info", {
        params: { store_id: storeId },
      })
      return response.data
    } catch (error: any) {
      console.error("❌ فشل جلب بيانات المتجر من الـ Edge Function:", error)
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || "فشل الاتصال بالخادم وجلب بيانات المتجر."
      throw new Error(errorMessage)
    }
  },
}

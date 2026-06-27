import { axiosClient } from "@/lib/api/axiosClient"
import { supabase } from "@/lib/supabase/client"

export interface StoreDetails {
  storeName: string
  logoUrl: string
  description: string
  platform: "salla" | "zid"
  syncStatus: "synced" | "pending" | "failed"
  managerEmail?: string
}

export const dashboardService = {
  // جلب المتاجر المرتبطة من قاعدة البيانات
  getLinkedStores: async () => {
    const { data, error } = await supabase
      .from("linked_stores")
      .select("id, platform, platform_store_id")
    if (error) throw error
    return data
  },

  // جلب تفاصيل المتجر حياً عبر الـ API
  getStoreDetails: async (storeId?: string, demoPlatform?: string): Promise<StoreDetails> => {
    const response = await axiosClient.get<StoreDetails>("/get-store-info", {
      params: { store_id: storeId, platform: demoPlatform },
    })
    return response.data
  },

  // قطع ارتباط المتجر وإزالته من قاعدة البيانات
  disconnectStore: async (storeId: string): Promise<void> => {
    const { error } = await supabase
      .from("linked_stores")
      .delete()
      .eq("id", storeId)
    if (error) throw error
  },
}

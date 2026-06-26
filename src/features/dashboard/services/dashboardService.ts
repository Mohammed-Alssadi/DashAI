import { axiosClient } from "@/lib/api/axiosClient"

export interface StoreDetails {
  storeName: string
  logoUrl: string
  description: string
  platform: "salla" | "zid"
  syncStatus: "synced" | "pending" | "failed"
  managerEmail?: string
}

export const dashboardService = {
  // جلب تفاصيل المتجر حياً عبر الـ API
  getStoreDetails: async (storeId?: string, demoPlatform?: string): Promise<StoreDetails> => {
    const response = await axiosClient.get<StoreDetails>("/get-store-info", {
      params: { store_id: storeId, platform: demoPlatform },
    })
    return response.data
  },
}

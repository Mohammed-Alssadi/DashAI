import { create } from "zustand"
import { dashboardService, type StoreDetails } from "../services/dashboardService"

interface StoreState {
  storeInfo: StoreDetails | null
  loading: boolean
  error: string | null
  fetchStoreInfo: (storeId?: string, demoPlatform?: string) => Promise<void>
  clearStoreInfo: () => void
}

export const useStoreStore = create<StoreState>((set) => ({
  storeInfo: null,
  loading: false,
  error: null,

  fetchStoreInfo: async (storeId, demoPlatform) => {
    set({ loading: true, error: null })
    try {
      const data = await dashboardService.getStoreDetails(storeId, demoPlatform)
      set({ storeInfo: data, loading: false })
    } catch (err: any) {
      set({ 
        error: err.message || "حدث خطأ أثناء جلب بيانات المتجر", 
        loading: false,
        storeInfo: null
      })
    }
  },

  clearStoreInfo: () => set({ storeInfo: null, loading: false, error: null })
}))

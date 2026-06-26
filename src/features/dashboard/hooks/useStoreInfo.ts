import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { dashboardService, type StoreDetails } from "../services/dashboardService"

export function useStoreInfo() {
  const [searchParams] = useSearchParams()
  const [storeInfo, setStoreInfo] = useState<StoreDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // قراءة store_id والـ platform من URL params (يأتيان من الـ Callback بعد الربط الحقيقي)
  const storeId = searchParams.get("store_id") ?? undefined
  const demoPlatform = searchParams.get("demo") ?? searchParams.get("platform") ?? undefined

  const fetchStoreInfo = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await dashboardService.getStoreDetails(storeId, demoPlatform)
      setStoreInfo(data)
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء جلب بيانات المتجر")
    } finally {
      setLoading(false)
    }
  }, [storeId, demoPlatform])

  useEffect(() => {
    fetchStoreInfo()
  }, [fetchStoreInfo])

  return { storeInfo, loading, error, refetch: fetchStoreInfo, storeId, demoPlatform }
}

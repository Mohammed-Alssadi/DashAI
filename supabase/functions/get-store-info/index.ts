import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

// ═══════════════════════════════════════════════════════════════
// دالة سحابية: get-store-info
// الهدف: جلب هوية المتجر حياً من سلة أو زد بدون تخزينها
// الاستدعاء: GET /functions/v1/get-store-info?store_id=UUID
// ═══════════════════════════════════════════════════════════════

serve(async (req: Request) => {
  // معالجة طلبات preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const storeId = url.searchParams.get("store_id")

    if (!storeId) {
      return new Response(
        JSON.stringify({ error: "store_id مطلوب في المعاملات" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // إنشاء عميل Supabase بمفتاح Service Role للوصول لجداول التوكنات
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // ══════════════════════════════════════
    // الخطوة 1: جلب التوكن والمنصة من قاعدة البيانات
    // ══════════════════════════════════════
    const { data: storeData, error: storeError } = await supabase
      .from("linked_stores")
      .select("id, platform, platform_store_id")
      .eq("id", storeId)
      .single()

    if (storeError || !storeData) {
      return new Response(
        JSON.stringify({ error: "المتجر غير موجود في قاعدة البيانات" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const { data: tokenData, error: tokenError } = await supabase
      .from("store_tokens")
      .select("access_token, refresh_token, manager_token, expires_at")
      .eq("store_id", storeId)
      .single()

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: "لا توجد توكنات للمتجر المحدد" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // ══════════════════════════════════════
    // الخطوة 2: تحقق من انتهاء صلاحية التوكن وقم بتجديده إذا لزم
    // ══════════════════════════════════════
    let { access_token, refresh_token, manager_token } = tokenData
    const expiresAt = new Date(tokenData.expires_at)
    const now = new Date()
    const isExpired = expiresAt <= new Date(now.getTime() + 5 * 60 * 1000) // تجديد قبل 5 دقائق

    if (isExpired && refresh_token && storeData.platform === "salla") {
      // تجديد التوكن من سلة
      try {
        const refreshResponse = await fetch("https://accounts.salla.sa/oauth2/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: Deno.env.get("SALLA_CLIENT_ID") ?? "",
            client_secret: Deno.env.get("SALLA_CLIENT_SECRET") ?? "",
            grant_type: "refresh_token",
            refresh_token,
          }),
        })

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          access_token = refreshData.access_token
          refresh_token = refreshData.refresh_token ?? refresh_token

          // حفظ التوكن الجديد في قاعدة البيانات
          await supabase
            .from("store_tokens")
            .update({
              access_token,
              refresh_token,
              expires_at: new Date(Date.now() + (refreshData.expires_in ?? 3600) * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("store_id", storeId)
        }
      } catch (refreshErr) {
        console.warn("فشل تجديد التوكن من سلة:", refreshErr)
      }
    }

    // ══════════════════════════════════════
    // الخطوة 3: جلب هوية المتجر حياً من المنصة
    // ══════════════════════════════════════
    let storeInfo: Record<string, string> = {}

    if (storeData.platform === "salla") {
      // جلب من API سلة
      const sallaRes = await fetch("https://accounts.salla.sa/oauth2/user/info", {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      })

      if (sallaRes.ok) {
        const sallaData = await sallaRes.json()
        const d = sallaData?.data ?? sallaData
        storeInfo = {
          storeName: d?.merchant?.name ?? d?.name ?? d?.store?.name ?? "متجر سلة",
          logoUrl: d?.merchant?.avatar ?? d?.avatar ?? d?.store?.logo ?? "",
          description: d?.merchant?.description ?? d?.bio ?? d?.store?.description ?? "متجر على منصة سلة",
          platform: "salla",
          syncStatus: "synced",
          managerEmail: d?.email ?? "",
        }
      } else {
        throw new Error("فشل جلب بيانات المتجر من سلة")
      }
    } else if (storeData.platform === "zid") {
      // جلب من API زد
      const zidRes = await fetch("https://api.zid.sa/v1/managers/me", {
        headers: {
          Authorization: access_token,
          "X-Manager-Token": manager_token ?? "",
          "X-App-Id": Deno.env.get("ZID_CLIENT_ID") ?? "",
          "Content-Type": "application/json",
        },
      })

      if (zidRes.ok) {
        const zidData = await zidRes.json()
        const store = zidData?.store ?? zidData?.manager?.store ?? {}
        storeInfo = {
          storeName: store?.name?.ar ?? store?.name ?? "متجر زد",
          logoUrl: store?.logo ?? store?.avatar ?? "",
          description: store?.description?.ar ?? store?.description ?? "متجر على منصة زد",
          platform: "zid",
          syncStatus: "synced",
          managerEmail: zidData?.email ?? "",
        }
      } else {
        throw new Error("فشل جلب بيانات المتجر من زد")
      }
    }

    // ══════════════════════════════════════
    // الخطوة 4: إرجاع البيانات للفرونت إند (دون تخزينها)
    // ══════════════════════════════════════
    return new Response(JSON.stringify(storeInfo), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err: any) {
    console.error("خطأ في get-store-info:", err)
    return new Response(
      JSON.stringify({ error: err.message ?? "خطأ داخلي في الخادم" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})

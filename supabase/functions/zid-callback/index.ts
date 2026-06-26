import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

// ═══════════════════════════════════════════════════════════════
// دالة سحابية: zid-callback
// الهدف: استقبال رمز التفويض من زد وتبادله بالتوكنات وحفظها
// الرابط: https://[PROJECT_ID].supabase.co/functions/v1/zid-callback
// ═══════════════════════════════════════════════════════════════

serve(async (req: Request) => {
  // معالجة طلبات preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const code = url.searchParams.get("code")
    const error = url.searchParams.get("error")

    // معالجة حالة رفض المستخدم لمنح الصلاحيات
    if (error || !code) {
      console.error("خطأ في الـ OAuth من زد:", error)
      return Response.redirect(
        `${Deno.env.get("FRONTEND_URL") || "http://localhost:5173"}/connect?error=zid_denied`,
        302
      )
    }

    // ══════════════════════════════════════
    // الخطوة 1: تبادل رمز التفويض بالتوكنات
    // ══════════════════════════════════════
    const tokenResponse = await fetch("https://oauth.zid.sa/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: Deno.env.get("ZID_CLIENT_ID") ?? "",
        client_secret: Deno.env.get("ZID_CLIENT_SECRET") ?? "",
        grant_type: "authorization_code",
        code: code,
        redirect_uri: Deno.env.get("ZID_REDIRECT_URI") ?? "",
      }),
    })

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text()
      console.error("فشل تبادل التوكن مع زد:", tokenError)
      throw new Error("فشل الحصول على التوكن من زد")
    }

    const tokenData = await tokenResponse.json()
    // زد يرجع: authorization (هو access_token) وتوكن المدير (manager token)
    const access_token = tokenData?.authorization ?? tokenData?.access_token
    const manager_token = tokenData?.manager?.token ?? tokenData?.manager_token ?? null
    const expires_in = tokenData?.expires_in ?? 3600

    if (!access_token) {
      throw new Error("لم يُرجع خادم زد access_token")
    }

    // ══════════════════════════════════════
    // الخطوة 2: جلب معلومات المتجر من زد
    // ══════════════════════════════════════
    const storeInfoResponse = await fetch("https://api.zid.sa/v1/managers/me", {
      headers: {
        Authorization: access_token,
        "X-Manager-Token": manager_token ?? "",
        "X-App-Id": Deno.env.get("ZID_CLIENT_ID") ?? "",
        "Content-Type": "application/json",
      },
    })

    if (!storeInfoResponse.ok) {
      throw new Error("فشل جلب معلومات المتجر من زد")
    }

    const storeInfoData = await storeInfoResponse.json()
    const platformStoreId = String(
      storeInfoData?.store?.id ??
      storeInfoData?.manager?.store_id ??
      "unknown"
    )

    // ══════════════════════════════════════
    // الخطوة 3: حفظ البيانات في Supabase
    // ══════════════════════════════════════
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // إدراج أو تحديث سجل المتجر (Upsert)
    const { data: storeRecord, error: storeError } = await supabase
      .from("linked_stores")
      .upsert(
        {
          platform: "zid",
          platform_store_id: platformStoreId,
        },
        { onConflict: "platform,platform_store_id" }
      )
      .select("id")
      .single()

    if (storeError) {
      console.error("خطأ في حفظ سجل المتجر:", storeError)
      throw new Error("فشل حفظ المتجر في قاعدة البيانات")
    }

    // حساب تاريخ انتهاء الصلاحية
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

    // حفظ أو تحديث التوكنات
    const { error: tokenError } = await supabase
      .from("store_tokens")
      .upsert(
        {
          store_id: storeRecord.id,
          access_token,
          refresh_token: tokenData?.refresh_token ?? "",
          manager_token,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "store_id" }
      )

    if (tokenError) {
      console.error("خطأ في حفظ التوكنات:", tokenError)
      throw new Error("فشل حفظ التوكنات في قاعدة البيانات")
    }

    // ══════════════════════════════════════
    // الخطوة 4: إعادة توجيه المتجر للوحة التحكم
    // ══════════════════════════════════════
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:5173"
    return Response.redirect(
      `${frontendUrl}/dashboard?store_id=${storeRecord.id}&platform=zid`,
      302
    )
  } catch (err) {
    console.error("خطأ عام في zid-callback:", err)
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:5173"
    return Response.redirect(`${frontendUrl}/connect?error=zid_failed`, 302)
  }
})

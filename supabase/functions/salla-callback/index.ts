import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

// ═══════════════════════════════════════════════════════════════
// دالة سحابية: salla-callback
// الهدف: استقبال رمز التفويض من سلة وتبادله بالتوكنات وحفظها
// الرابط: https://[PROJECT_ID].supabase.co/functions/v1/salla-callback
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
      console.error("خطأ في الـ OAuth من سلة:", error)
      return Response.redirect(
        `${Deno.env.get("FRONTEND_URL") || "http://localhost:5173"}/connect?error=salla_denied`,
        302
      )
    }

    // ══════════════════════════════════════
    // الخطوة 1: تبادل رمز التفويض بالتوكنات
    // ══════════════════════════════════════
    const tokenResponse = await fetch("https://accounts.salla.sa/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: Deno.env.get("SALLA_CLIENT_ID") ?? "",
        client_secret: Deno.env.get("SALLA_CLIENT_SECRET") ?? "",
        grant_type: "authorization_code",
        code: code,
        redirect_uri: Deno.env.get("SALLA_REDIRECT_URI") ?? "",
      }),
    })

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text()
      console.error("فشل تبادل التوكن مع سلة:", tokenError)
      throw new Error("فشل الحصول على التوكن من سلة")
    }

    const tokenData = await tokenResponse.json()
    const { access_token, refresh_token, expires_in } = tokenData

    // ══════════════════════════════════════
    // الخطوة 2: جلب معرّف المتجر من سلة
    // ══════════════════════════════════════
    const storeInfoResponse = await fetch("https://accounts.salla.sa/oauth2/user/info", {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
    })

    if (!storeInfoResponse.ok) {
      throw new Error("فشل جلب معلومات المتجر من سلة")
    }

    const storeInfoData = await storeInfoResponse.json()
    const platformStoreId = String(
      storeInfoData?.data?.merchant?.id ?? 
      storeInfoData?.data?.id ?? 
      storeInfoData?.id ?? 
      "unknown"
    )

    // ══════════════════════════════════════
    // الخطوة 3: حفظ البيانات في Supabase
    // ══════════════════════════════════════
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "" // نستخدم مفتاح Service Role لتجاوز RLS
    )

    // إدراج أو تحديث سجل المتجر (Upsert)
    const { data: storeRecord, error: storeError } = await supabase
      .from("linked_stores")
      .upsert(
        {
          platform: "salla",
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

    // حساب تاريخ انتهاء صلاحية التوكن
    const expiresAt = new Date(
      Date.now() + (expires_in ?? 3600) * 1000
    ).toISOString()

    // حفظ أو تحديث التوكنات
    const { error: tokenError } = await supabase
      .from("store_tokens")
      .upsert(
        {
          store_id: storeRecord.id,
          access_token,
          refresh_token: refresh_token ?? "",
          manager_token: null, // سلة لا تستخدم manager_token
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
      `${frontendUrl}/dashboard?store_id=${storeRecord.id}&platform=salla`,
      302
    )
  } catch (err) {
    console.error("خطأ عام في salla-callback:", err)
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:5173"
    return Response.redirect(`${frontendUrl}/connect?error=salla_failed`, 302)
  }
})

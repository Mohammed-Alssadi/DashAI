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
    console.log("المفاتيح الموجودة في استجابة التوكن:", Object.keys(tokenData))
    if (tokenData.manager) {
      console.log("مفاتيح كائن manager:", Object.keys(tokenData.manager))
    }

    // في منصة زد:
    // 1. tokenData.authorization هو توكن التحقق العام (Authorization)
    // 2. tokenData.access_token هو توكن المدير الخاص بالمتجر (X-Manager-Token)
    const access_token = tokenData?.authorization || tokenData?.access_token
    const manager_token = tokenData?.access_token || tokenData?.manager?.token || tokenData?.manager_token || null
    const expires_in = tokenData?.expires_in ?? 3600

    if (!access_token) {
      throw new Error("لم يُرجع خادم زد access_token/authorization")
    }

    // ══════════════════════════════════════
    // الخطوة 2: جلب معلومات المتجر من زد
    // ══════════════════════════════════════
    console.log("جلب معلومات المتجر من زد عبر /v1/managers/account/store...")
    
    // طباعة الرؤوس بشكل آمن للتشخيص
    console.log("رأس Authorization المرسل:", access_token ? `${access_token.substring(0, 15)}...` : "فارغ")
    console.log("رأس X-Manager-Token المرسل:", manager_token ? `${manager_token.substring(0, 15)}...` : "فارغ")
    console.log("رأس X-App-Id المرسل:", Deno.env.get("ZID_CLIENT_ID") ? `${Deno.env.get("ZID_CLIENT_ID")}` : "فارغ")

    const storeInfoResponse = await fetch("https://api.zid.sa/v1/managers/account/store", {
      headers: {
        Authorization: access_token.startsWith("Bearer ") ? access_token : `Bearer ${access_token}`,
        "X-Manager-Token": manager_token ?? "",
        "X-App-Id": Deno.env.get("ZID_CLIENT_ID") ?? "",
        "Content-Type": "application/json",
      },
    })

    if (!storeInfoResponse.ok) {
      const errorText = await storeInfoResponse.text()
      console.error("فشل جلب معلومات المتجر من زد. الحالة:", storeInfoResponse.status, "الاستجابة:", errorText)
      throw new Error("فشل جلب معلومات المتجر من زد")
    }

    const storeInfoResponseText = await storeInfoResponse.text()
    console.log("الاستجابة الخام من زد:", storeInfoResponseText.substring(0, 200))

    let storeInfoData
    try {
      storeInfoData = JSON.parse(storeInfoResponseText)
    } catch (e) {
      const diag = `مفاتيح التوكن: ${JSON.stringify(Object.keys(tokenData))}, Auth: ${access_token ? access_token.substring(0, 15) : "فارغ"}, ManagerToken: ${manager_token ? manager_token.substring(0, 15) : "فارغ"}`
      console.error("فشل تحليل استجابة معلومات المتجر كـ JSON. الاستجابة البدئية كانت:", storeInfoResponseText.substring(0, 1000))
      throw new Error(`استجابة غير صالحة من زد (ليست JSON) - تشخيص: ${diag}`)
    }

    console.log("معلومات المتجر المُسترجعة:", JSON.stringify(storeInfoData))

    const store = storeInfoData?.data ?? storeInfoData?.store ?? {}
    const platformStoreId = String(
      store?.id ??
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

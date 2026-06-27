import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

// ═══════════════════════════════════════════════════════════════
// دالة سحابية: zid-callback
// الهدف: استقبال رمز التفويض من زد وتبادله بالتوكنات وحفظها
// الرابط: https://[PROJECT_ID].supabase.co/functions/v1/zid-callback
//
// تدفق OAuth 2.0 لزد (حسب التوثيق الرسمي):
// ──────────────────────────────────────────────
// 1. المستخدم يُوجَّه إلى oauth.zid.sa/oauth/authorize
// 2. بعد الموافقة، زد يُعيد التوجيه لهنا مع ?code=xxx&state=yyy
// 3. نبادل الـ code بالتوكنات عبر POST oauth.zid.sa/oauth/token
// 4. الاستجابة تحتوي:
//    - authorization → يُستخدم كـ Authorization header
//    - access_token  → يُستخدم كـ X-Manager-Token header
//    - refresh_token → لتجديد التوكنات لاحقاً
// 5. نجلب بيانات المتجر ونحفظ كل شيء في Supabase
// ═══════════════════════════════════════════════════════════════

serve(async (req: Request) => {
  // معالجة طلبات preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  let frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:5173"

  try {
    const url = new URL(req.url)
    const code = url.searchParams.get("code")
    const error = url.searchParams.get("error")
    const stateParam = url.searchParams.get("state")

    // معالجة حالة رفض المستخدم لمنح الصلاحيات أو غياب المعرف
    if (error || !code || !stateParam) {
      console.error("خطأ في الـ OAuth من زد أو معاملات مفقودة:", error)
      return Response.redirect(`${frontendUrl}/connect?error=zid_denied`, 302)
    }

    let userId = ""
    if (stateParam.includes(":")) {
      const [id, isLocal] = stateParam.split(":")
      userId = id
      if (isLocal === "1") {
        frontendUrl = "http://localhost:5173"
      }
    } else {
      userId = stateParam
    }

    if (!userId) {
      console.error("معرف المستخدم غير متوفر في الحالة")
      return Response.redirect(`${frontendUrl}/connect?error=zid_failed`, 302)
    }

    // ══════════════════════════════════════════════════════
    // الخطوة 1: تبادل رمز التفويض بالتوكنات
    // POST https://oauth.zid.sa/oauth/token
    // ══════════════════════════════════════════════════════
    console.log("═══ بدء تبادل رمز التفويض مع زد ═══")

    const tokenResponse = await fetch("https://oauth.zid.sa/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: Deno.env.get("ZID_CLIENT_ID") ?? "",
        client_secret: Deno.env.get("ZID_CLIENT_SECRET") ?? "",
        redirect_uri: Deno.env.get("ZID_REDIRECT_URI") ?? "",
        code: code,
      }),
    })

    if (!tokenResponse.ok) {
      const tokenErrorText = await tokenResponse.text()
      console.error("فشل تبادل التوكن مع زد:", tokenResponse.status, tokenErrorText)
      throw new Error(`فشل الحصول على التوكن من زد (${tokenResponse.status})`)
    }

    const tokenData = await tokenResponse.json()
    console.log("مفاتيح استجابة التوكن:", Object.keys(tokenData))

    // ══════════════════════════════════════════════════════
    // استخراج التوكنات حسب التوثيق الرسمي لزد:
    // https://docs.zid.sa/authorization
    //
    // ┌─────────────────────┬──────────────────────────────┐
    // │ حقل الاستجابة       │ الهيدر المطلوب عند استدعاء API │
    // ├─────────────────────┼──────────────────────────────┤
    // │ authorization       │ Authorization                │
    // │ access_token        │ X-Manager-Token              │
    // └─────────────────────┴──────────────────────────────┘
    // ══════════════════════════════════════════════════════
    const authorizationToken = tokenData?.authorization ?? null   // → Authorization header
    const managerToken = tokenData?.access_token ?? null          // → X-Manager-Token header
    const refreshToken = tokenData?.refresh_token ?? null
    const expiresIn = tokenData?.expires_in ?? 3600

    // تشخيص آمن (أول 20 حرف فقط)
    console.log("authorization (→ Authorization header):", authorizationToken ? `${authorizationToken.substring(0, 20)}...` : "غير موجود")
    console.log("access_token (→ X-Manager-Token header):", managerToken ? `${managerToken.substring(0, 20)}...` : "غير موجود")
    console.log("refresh_token:", refreshToken ? "موجود ✓" : "غير موجود ✗")
    console.log("expires_in:", expiresIn)

    if (!authorizationToken && !managerToken) {
      console.error("استجابة التوكن الكاملة (بدون قيم حساسة):", JSON.stringify({
        keys: Object.keys(tokenData),
        has_authorization: !!tokenData?.authorization,
        has_access_token: !!tokenData?.access_token,
        has_refresh_token: !!tokenData?.refresh_token,
        token_type: tokenData?.token_type,
        expires_in: tokenData?.expires_in,
      }))
      throw new Error("لم يُرجع خادم زد أي توكن (لا authorization ولا access_token)")
    }

    // ══════════════════════════════════════════════════════
    // الخطوة 2: جلب معلومات المتجر من زد
    // GET https://api.zid.sa/v1/managers/account/store
    //
    // الهيدرات المطلوبة حسب التوثيق:
    //   Authorization: {authorization token}
    //   X-Manager-Token: {access_token}
    // ══════════════════════════════════════════════════════
    console.log("═══ جلب معلومات المتجر من زد ═══")

    // بناء الهيدرات حسب التوثيق الرسمي
    const apiHeaders: Record<string, string> = {
      "Accept": "application/json",
    }

    // authorization field → Authorization header
    if (authorizationToken) {
      // حقل authorization عادةً يأتي مع "Bearer " أو "OAuth " مسبقاً
      apiHeaders["Authorization"] = authorizationToken.startsWith("Bearer ")
        ? authorizationToken
        : `Bearer ${authorizationToken}`
    }

    // access_token field → X-Manager-Token header
    if (managerToken) {
      apiHeaders["X-Manager-Token"] = managerToken
    }

    console.log("الهيدرات المرسلة:", {
      Authorization: apiHeaders["Authorization"] ? `${apiHeaders["Authorization"].substring(0, 25)}...` : "غير موجود",
      "X-Manager-Token": apiHeaders["X-Manager-Token"] ? `${apiHeaders["X-Manager-Token"].substring(0, 25)}...` : "غير موجود",
    })

    const storeInfoResponse = await fetch("https://api.zid.sa/v1/managers/account/store", {
      headers: apiHeaders,
    })

    if (!storeInfoResponse.ok) {
      const errorText = await storeInfoResponse.text()
      console.error("فشل جلب معلومات المتجر من زد:", storeInfoResponse.status, errorText)
      // لا نرمي خطأ هنا - نستمر بتخزين التوكنات حتى لو فشل جلب المتجر
      console.warn("سنستمر بحفظ التوكنات مع معرّف متجر مؤقت...")
    }

    let platformStoreId = "unknown"

    if (storeInfoResponse.ok) {
      const storeInfoText = await storeInfoResponse.text()
      console.log("استجابة معلومات المتجر (أول 300 حرف):", storeInfoText.substring(0, 300))

      try {
        const storeInfoData = JSON.parse(storeInfoText)
        const store = storeInfoData?.data ?? storeInfoData?.store ?? storeInfoData ?? {}
        platformStoreId = String(
          store?.id ??
          storeInfoData?.manager?.store_id ??
          storeInfoData?.data?.id ??
          "unknown"
        )
        console.log("معرّف المتجر المستخرج:", platformStoreId)
      } catch (parseErr) {
        console.error("فشل تحليل استجابة المتجر كـ JSON:", parseErr)
      }
    }

    // ══════════════════════════════════════════════════════
    // الخطوة 3: حفظ البيانات في Supabase
    // - linked_stores: ربط المتجر بالمستخدم
    // - store_tokens: حفظ التوكنات
    // يدعم ربط أكثر من متجر لنفس المستخدم
    // ══════════════════════════════════════════════════════
    console.log("═══ حفظ البيانات في Supabase ═══")

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // إدراج أو تحديث سجل المتجر (Upsert)
    // عند إعادة ربط نفس المتجر، نُحدّث user_id والتاريخ
    const { data: storeRecord, error: storeError } = await supabase
      .from("linked_stores")
      .upsert(
        {
          user_id: userId,
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

    console.log("معرّف سجل المتجر في Supabase:", storeRecord.id)

    // حساب تاريخ انتهاء الصلاحية
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    // حفظ التوكنات بالترتيب الصحيح:
    // access_token في DB = authorization token (للـ Authorization header)
    // manager_token في DB = access_token من زد (للـ X-Manager-Token header)
    const { error: tokenSaveError } = await supabase
      .from("store_tokens")
      .upsert(
        {
          store_id: storeRecord.id,
          access_token: authorizationToken ?? managerToken ?? "",  // Authorization header token
          refresh_token: refreshToken ?? "",
          manager_token: managerToken ?? "",                       // X-Manager-Token header token
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "store_id" }
      )

    if (tokenSaveError) {
      console.error("خطأ في حفظ التوكنات:", tokenSaveError)
      throw new Error("فشل حفظ التوكنات في قاعدة البيانات")
    }

    console.log("═══ تم حفظ التوكنات بنجاح ═══")

    // ══════════════════════════════════════════════════════
    // الخطوة 4: إعادة توجيه المستخدم للوحة التحكم
    // ══════════════════════════════════════════════════════
    return Response.redirect(
      `${frontendUrl}/dashboard?store_id=${storeRecord.id}&platform=zid`,
      302
    )
  } catch (err) {
    console.error("خطأ عام في zid-callback:", err)
    return Response.redirect(`${frontendUrl}/connect?error=zid_failed`, 302)
  }
})

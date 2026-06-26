# دليل هيكلية الربط والمصادقة والمزامنة الذكية مع المتاجر (سلة وزد) باستخدام Supabase

يوضح هذا الدليل مكان وطريقة عمل كل جزء في تطبيق DashAI (أين تقع المصادقة، كيف تتم التحققات، أين تُحفظ التوكنات، وكيف يتم جلب البيانات بشكل حي ومباشر دون تخزين معلومات المتاجر في قاعدة البيانات).

---

## أولاً: خريطة العمليات الفنية والاتصال (Security & Auth Architecture)

عند تفعيل نظام الحسابات والمصادقة بشكل معزول واحترافي، تسير العمليات كالتالي لضمان حماية بيانات كل مشترك:

```
1. التاجر يدخل للموقع  ◄  2. يسجل الدخول (Auth Feature)  ◄  3. إرفاق JWT آلياً عبر Axios  ◄  4. جلب البيانات حياً من المنصة (Live Fetching)
```

---

## ثانياً: تصميم قاعدة البيانات النهائي والمعتمد (Supabase SQL Schema)

ترتبط المتاجر والرموز برابط مباشر بقاعدة بيانات مستخدمي سوبابيس `auth.users(id)` مع حماية البيانات بواسطة سياسات RLS:

```sql
-- 1. جدول ربط المتاجر
CREATE TABLE linked_stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- مستخدم Supabase Auth
    platform VARCHAR(50) NOT NULL, -- 'salla' or 'zid'
    platform_store_id VARCHAR(100) NOT NULL, -- معرف المتجر في سلة/زد
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(platform, platform_store_id)
);

-- تفعيل سياسة الحماية RLS لضمان الخصوصية والأمان
ALTER TABLE linked_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "التاجر يدير متاجره الخاصة فقط" ON linked_stores
    FOR ALL USING (auth.uid() = user_id);


-- 2. جدول رموز وتراخيص الوصول (Tokens)
CREATE TABLE store_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES linked_stores(id) ON DELETE CASCADE NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE store_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "الوصول لتراخيص المتجر الخاص بالمستخدم الحالي فقط" ON store_tokens
    FOR ALL USING (
        store_id IN (SELECT id FROM linked_stores WHERE user_id = auth.uid())
    );
```

---

## ثالثاً: هيكلية ميزة الحسابات والمصادقة المستقلة (`src/features/auth/`)

لمنع كتابة أي منطق اتصال أو فحص داخل مكونات تسجيل الدخول، نقوم بتنظيم ميزة الحسابات كالتالي:

```text
src/features/auth/
├── components/            # مكونات الواجهة (LoginForm, RegisterForm)
├── services/              # التخاطب المباشر والوحيد مع Supabase Auth
│   └── authService.ts
├── hooks/                 # خطاف إدارة العمليات والتحقق والتوجيه
│   └── useAuth.ts
├── pages/                 # صفحات عرض نظيفة (LoginPage, RegisterPage) (UI Only)
└── index.ts               # ملف التصدير العام للميزة
```

### 1. طبقة خدمة المصادقة المعزولة (`src/features/auth/services/authService.ts`)
يتعامل هذا الملف حصرياً مع مكتبة Supabase Auth لجلب وتأكيد الحسابات:

```typescript
import { supabase } from "@/lib/supabase/client"

export const authService = {
  // إنشاء حساب جديد لتاجر
  registerMerchant: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    return data.user
  },

  // تسجيل دخول تاجر
  loginMerchant: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data.user
  },

  // تسجيل خروج
  logoutMerchant: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }
}
```

### 2. طبقة الخطاف التفاعلي للمصادقة (`src/features/auth/hooks/useAuth.ts`)
يتولى هذا الخطاف إدارة حالات الطلب والتوجيه بعد نجاح العمليات إلى واجهة المزامنة:

```typescript
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { authService } from "../services/authService"

export function useAuth() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      await authService.loginMerchant(email, password)
      navigate("/connect") // التوجيه لصفحة الربط فور نجاح الدخول
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء تسجيل الدخول")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      await authService.registerMerchant(email, password)
      navigate("/login") // التوجيه لصفحة الدخول بعد نجاح إنشاء الحساب
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء إنشاء الحساب")
    } finally {
      setLoading(false)
    }
  }

  return { handleLogin, handleRegister, loading, error }
}
```

### 3. صفحة تسجيل الدخول الخالية من المنطق (`LoginPage.tsx`)
تصبح الصفحة نظيفة و UI فقط، تستورد وتستدعي خطاف المصادقة للتوجيه والتحقق:

```tsx
import { useState } from "react"
import { useAuth } from "../hooks/useAuth"

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { handleLogin, loading, error } = useAuth() // استدعاء الخطاف

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleLogin(email, password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white border p-8 rounded-3xl shadow-md space-y-6">
        <h1 className="text-2xl font-black text-slate-900 text-center">تسجيل الدخول إلى DashAI</h1>
        
        {error && <p className="text-red-500 text-xs font-semibold text-center">{error}</p>}
        
        <input 
          type="email" 
          placeholder="البريد الإلكتروني" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border rounded-xl"
          required 
        />
        
        <input 
          type="password" 
          placeholder="كلمة المرور" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border rounded-xl"
          required 
        />

        <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-750 cursor-pointer">
          {loading ? "جاري الدخول..." : "تسجيل الدخول"}
        </button>
      </form>
    </div>
  )
}
```

---

## رابعاً: تحديث جلب البيانات الحية الموثقة (Interceptors)

عند تفعيل الحسابات، يجب توثيق كل طلب HTTP يُرسل لخدماتنا بالخلفية. يتم هذا تلقائياً بملف [axiosClient.ts](file:///c:/Users/ZBook/Desktop/project-dashbord/src/lib/api/axiosClient.ts) بواسطة الـ Interceptor:

```typescript
import axios from "axios"
import { supabase } from "@/lib/supabase/client"

export const axiosClient = axios.create({
  baseURL: "https://[YOUR_PROJECT_ID].supabase.co/functions/v1",
})

// إرفاق JWT تلقائياً للتحقق من هوية التاجر وجلسة الدخول
axiosClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})
```

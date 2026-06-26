import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { Lock, Mail, Loader2, KeyRound } from "lucide-react"

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>
  loading: boolean
  error: string | null
}

export function LoginForm({ onSubmit, loading, error }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    onSubmit(email, password)
  }

  return (
    <Card className="w-full max-w-md border-border/60 bg-card/70 backdrop-blur-md shadow-xl rounded-3xl overflow-hidden font-sans relative">
      {/* Glow Effect Decorative background */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      <CardHeader className="text-center pt-8 pb-4 relative z-10">
        <div className="mx-auto size-12 rounded-2xl bg-gradient-to-tr from-primary to-indigo-650 flex items-center justify-center shadow-md shadow-primary/20 mb-4">
          <KeyRound className="size-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl font-black text-foreground">
          تسجيل الدخول إلى DashAI
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm font-medium mt-1">
          أدخل بريدك الإلكتروني وكلمة المرور للوصول إلى متجرك
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 px-6 md:px-8 relative z-10">
          {error && (
            <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold text-center leading-relaxed">
              {error}
            </div>
          )}

          {/* Email input field */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground/80 block">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="pr-10 pl-4 py-6 rounded-2xl border-border/80 focus-visible:ring-primary/20 bg-background/50 text-right"
                dir="ltr"
              />
            </div>
          </div>

          {/* Password input field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground/80 block">كلمة المرور</label>
            </div>
            <div className="relative">
              <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="pr-10 pl-4 py-6 rounded-2xl border-border/80 focus-visible:ring-primary/20 bg-background/50 text-right"
                dir="ltr"
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 px-6 md:px-8 pb-8 pt-4 relative z-10">
          <Button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-6 rounded-2xl font-bold shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all duration-300 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                <span>جاري تسجيل الدخول...</span>
              </>
            ) : (
              "تسجيل الدخول"
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground font-medium">
            ليس لديك حساب بعد؟{" "}
            <Link
              to="/register"
              className="text-primary hover:underline font-bold transition-all"
            >
              أنشئ حسابك الآن
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

import { LoginForm } from "../components/LoginForm"
import { useAuth } from "../hooks/useAuth"
import { Layers } from "lucide-react"
import { Link } from "react-router-dom"

export function LoginPage() {
  const { handleLogin, loading, error } = useAuth()

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground flex flex-col items-center justify-center overflow-hidden font-sans p-4 selection:bg-accent selection:text-accent-foreground">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 pointer-events-none" />
      
      {/* Soft Pastel Ambient Light Blobs */}
      <div className="absolute top-[-10%] right-[10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full bg-primary/10 blur-[80px] md:blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[5%] w-[250px] md:w-[450px] h-[250px] md:h-[450px] rounded-full bg-accent/30 blur-[80px] md:blur-[120px] pointer-events-none" />

      {/* Header-like Logo at top */}
      <div className="relative z-10 mb-8 flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-9 rounded-xl bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center shadow-md shadow-primary/20">
            <Layers className="size-5 text-primary-foreground" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            DashAI
          </span>
        </Link>
      </div>

      {/* Login Card Form */}
      <div className="relative z-10 w-full flex justify-center">
        <LoginForm onSubmit={handleLogin} loading={loading} error={error} />
      </div>
    </div>
  )
}

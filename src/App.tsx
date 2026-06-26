import { lazy, Suspense } from "react"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { PageLoader } from "@/components/PageLoader"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Toaster } from "sonner"

// Load Pages lazily on request
const WelcomePage = lazy(() =>
  import("@/features/welcome").then((module) => ({ default: module.WelcomePage }))
)
const ConnectPage = lazy(() =>
  import("@/features/connect").then((module) => ({ default: module.ConnectPage }))
)
const TestDashboard = lazy(() =>
  import("@/features/dashboard").then((module) => ({ default: module.TestDashboard }))
)
const LoginPage = lazy(() =>
  import("@/features/auth").then((module) => ({ default: module.LoginPage }))
)
const RegisterPage = lazy(() =>
  import("@/features/auth").then((module) => ({ default: module.RegisterPage }))
)

// Define application routes
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={<PageLoader />}>
        <WelcomePage />
      </Suspense>
    ),
  },
  {
    path: "/login",
    element: (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: "/register",
    element: (
      <Suspense fallback={<PageLoader />}>
        <RegisterPage />
      </Suspense>
    ),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/connect",
        element: (
          <Suspense fallback={<PageLoader />}>
            <ConnectPage />
          </Suspense>
        ),
      },
      {
        path: "/dashboard",
        element: (
          <Suspense fallback={<PageLoader />}>
            <TestDashboard />
          </Suspense>
        ),
      },
    ],
  },
])

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <Toaster position="top-center" richColors />
      <RouterProvider router={router} />
    </div>
  )
}

export default App



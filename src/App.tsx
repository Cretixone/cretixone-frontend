import { Suspense, lazy, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router-dom'
import { Toaster } from 'sonner'
import Topbar from '@/components/layout/Topbar'
import ToolRail from '@/components/layout/ToolRail'
import ToolPanel from '@/components/layout/ToolPanel'
import RightInspector from '@/components/layout/RightInspector'
import StatusBar from '@/components/layout/StatusBar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthDialog } from '@/components/auth/AuthDialog'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useEditorStore } from '@/store/editorStore'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth.api'
import { useFetchFramesQuery } from '@/store/api/apiSlice'
import { fetchAccessToken } from '@/store/api/axiosInstance'

const CanvasStage = lazy(() => import('@/components/editor/CanvasStage'))
const DashboardLayout = lazy(() => import('@/pages/dashboard/DashboardLayout'))
const ProfilePage = lazy(() => import('@/pages/dashboard/ProfilePage'))
const OrdersPage = lazy(() => import('@/pages/dashboard/OrdersPage'))
const LandingPage = lazy(() => import('@/pages/LandingPage'))
const TermsPage = lazy(() => import('@/pages/TermsPage'))
const AboutPage = lazy(() => import('@/pages/AboutPage'))
const ProductsPage = lazy(() => import('@/pages/ProductsPage'))
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'))
const TeamPage = lazy(() => import('@/pages/TeamPage'))
const TestimonialsPage = lazy(() => import('@/pages/TestimonialsPage'))
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'))
const CartPage = lazy(() => import('@/pages/CartPage'))

function LoadingCanvas() {
  return (
    <div
      className="canvas-surface flex flex-1 items-center justify-center"
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2"
          style={{
            borderColor: 'var(--ed-border-strong)',
            borderTopColor: 'var(--ed-accent)',
          }}
        />
        <p className="text-xs" style={{ color: 'var(--ed-fg-muted)' }}>Loading canvas…</p>
      </div>
    </div>
  )
}

function FullPageLoader() {
  return (
    <div className="flex h-screen items-center justify-center" style={{ background: '#f4f3ef' }}>
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2"
          style={{ borderColor: '#d4cebd', borderTopColor: '#C08C40' }}
        />
        <p className="text-xs" style={{ color: '#5d6a8a' }}>Initializing…</p>
      </div>
    </div>
  )
}

// Reset scroll to the top on every navigation (pathname or query change) so
// each page — and footer category links into /products — starts from the top.
function ScrollToTop() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname, search])
  return null
}

export default function App() {
  // Auth bootstrap: if we have a persisted token, refresh the user profile once
  // on load (the axios interceptor silently refreshes / clears on failure).
  const accessToken = useAuthStore((s) => s.accessToken)
  const setUser = useAuthStore((s) => s.setUser)
  useEffect(() => {
    if (!accessToken) return
    authApi.getMe().then(setUser).catch(() => { /* handled by interceptor */ })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Suspense fallback={<FullPageLoader />}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/testimonials" element={<TestimonialsPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/product" element={<ProductDetailPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/editor" element={<EditorApp />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard/profile" replace />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="orders" element={<OrdersPage />} />
        </Route>
        <Route path="/landing" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global auth dialog + toasts (mounted once, available app-wide). */}
      <AuthDialog />
      <Toaster position="top-center" richColors closeButton />
    </Suspense>
  )
}

function EditorApp() {
  const [ready, setReady] = useState(false)
  const editorTheme = useEditorStore((s) => s.editorTheme)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    fetchAccessToken().then(() => setReady(true))
  }, [])

  // Resolve a ?frame=<id> deep-link (or hard refresh of /editor?frame=…)
  // into the selected frame once the frames list is available. When the
  // user arrives by clicking a product card the store is already set, so
  // this is a no-op; on a cold load it re-selects the matching frame.
  const { data: frames } = useFetchFramesQuery()
  useEffect(() => {
    const frameId = searchParams.get('frame')
    if (!frameId || !frames) return
    const current = useEditorStore.getState().selectedFrame
    if (current && String(current.id) === frameId) return
    const match = frames.find((f) => String(f.id) === frameId)
    if (match) {
      useEditorStore.getState().setSelectedFrame(match)
      if (match.categorySlug)
        useEditorStore.getState().setActiveFrameCategorySlug(match.categorySlug)
    }
  }, [searchParams, frames])

  // Scope the editor's body bg + theme class so landing/about/terms
  // aren't affected, AND so Radix portals (tooltips, dropdowns) — which
  // mount into document.body, outside the `.editor-shell` div — still
  // inherit the editor theme's CSS variables.
  useEffect(() => {
    const prevBg = document.body.style.background
    const prevColor = document.body.style.color
    document.body.style.background = editorTheme === 'light' ? '#f4f3ef' : '#0c0f1a'
    document.body.style.color = editorTheme === 'light' ? '#002365' : '#e7ecf7'
    document.body.classList.add('editor-shell')
    document.body.classList.add(editorTheme === 'light' ? 'editor-light' : 'editor-dark')
    document.body.classList.remove(editorTheme === 'light' ? 'editor-dark' : 'editor-light')
    return () => {
      document.body.style.background = prevBg
      document.body.style.color = prevColor
      document.body.classList.remove('editor-shell', 'editor-light', 'editor-dark')
    }
  }, [editorTheme])

  if (!ready) return <FullPageLoader />

  return (
    <TooltipProvider delayDuration={250}>
      <div
        className={`editor-shell ${editorTheme === 'light' ? 'editor-light' : 'editor-dark'} flex h-screen flex-col overflow-hidden`}
      >
        <Topbar />

        <div className="flex flex-1 overflow-hidden">
          <ToolRail />
          <ToolPanel />

          <main className="flex flex-1 overflow-hidden">
            <div className="canvas-surface relative flex flex-1 overflow-hidden">
              <Suspense fallback={<LoadingCanvas />}>
                <CanvasStage />
              </Suspense>
            </div>
          </main>

          <RightInspector />
        </div>

        <StatusBar />
      </div>
    </TooltipProvider>
  )
}

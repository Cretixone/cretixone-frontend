import { Suspense, lazy, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Topbar from '@/components/layout/Topbar'
import ToolRail from '@/components/layout/ToolRail'
import ToolPanel from '@/components/layout/ToolPanel'
import RightInspector from '@/components/layout/RightInspector'
import StatusBar from '@/components/layout/StatusBar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useEditorStore } from '@/store/editorStore'
import { fetchAccessToken } from '@/store/api/axiosInstance'

const CanvasStage = lazy(() => import('@/components/editor/CanvasStage'))
const LandingPage = lazy(() => import('@/pages/LandingPage'))
const TermsPage = lazy(() => import('@/pages/TermsPage'))
const AboutPage = lazy(() => import('@/pages/AboutPage'))
const ProductsPage = lazy(() => import('@/pages/ProductsPage'))

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

export default function App() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/editor" element={<EditorApp />} />
        <Route path="/landing" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

function EditorApp() {
  const [ready, setReady] = useState(false)
  const editorTheme = useEditorStore((s) => s.editorTheme)

  useEffect(() => {
    fetchAccessToken().then(() => setReady(true))
  }, [])

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

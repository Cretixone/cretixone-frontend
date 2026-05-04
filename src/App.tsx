import { Suspense, lazy, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Topbar from '@/components/layout/Topbar'
import Sidebar from '@/components/layout/Sidebar'
import { fetchAccessToken } from '@/store/api/axiosInstance'

const CanvasStage = lazy(() => import('@/components/editor/CanvasStage'))
const FrameDemoCanvas = lazy(() => import('@/components/editor/FrameDemoCanvas'))
const LandingPage = lazy(() => import('@/pages/LandingPage'))

const isDemoMode =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('demo') === '1'

function LoadingCanvas() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#1a1a2e]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading canvas...</p>
      </div>
    </div>
  )
}

function FullPageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#0f0f1a]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Initializing...</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/editor" element={<EditorApp />} />
        <Route path="/landing" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

function EditorApp() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    fetchAccessToken().then(() => setReady(true))
  }, [])

  if (!ready) return <FullPageLoader />

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0f0f1a]">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[280px] flex-shrink-0 overflow-hidden flex flex-col">
          <Sidebar />
        </div>

        <div className="flex-1 overflow-hidden relative">
          <Suspense fallback={<LoadingCanvas />}>
            {isDemoMode ? <FrameDemoCanvas /> : <CanvasStage />}
          </Suspense>
        </div>
      </div>
    </div>
  )
}

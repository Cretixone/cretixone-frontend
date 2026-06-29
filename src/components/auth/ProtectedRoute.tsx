import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useAuthUiStore } from '@/store/authUiStore'

/**
 * Guards authenticated routes. When logged out, it pops the auth dialog
 * (remembering where the user was headed) and sends them home — once they log
 * in, AuthDialog navigates to the remembered path.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const openAuth = useAuthUiStore((s) => s.openAuth)
  const location = useLocation()

  useEffect(() => {
    if (!isAuthenticated) openAuth('login', location.pathname)
  }, [isAuthenticated, openAuth, location.pathname])

  if (!isAuthenticated) return <Navigate to="/" replace />
  return <>{children}</>
}

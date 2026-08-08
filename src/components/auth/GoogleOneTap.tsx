import { useGoogleOneTapLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'

import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/store/authStore'
import { isGoogleAuthEnabled } from '@/lib/google'

/**
 * Google One Tap — the small "Continue as …" card Google shows in the top-right
 * corner. Renders nothing itself; it just registers the prompt.
 *
 * Mounted once, site-wide, and only while signed out. Google suppresses the
 * prompt on its own after a user dismisses it a few times, so there's no need
 * to hand-roll throttling here.
 */
export function GoogleOneTap() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  // Hooks can't be called conditionally, so the hook itself is gated by
  // `disabled` rather than by an early return.
  useGoogleOneTapLogin({
    disabled: !isGoogleAuthEnabled() || isAuthenticated,
    // Don't dismiss the moment the user clicks anywhere on the page — a stray
    // click shouldn't count as a rejection against Google's cooldown.
    cancel_on_tap_outside: false,
    // FedCM is mandatory in current Chrome; without it the prompt is silently
    // dropped.
    use_fedcm_for_prompt: true,
    onSuccess: async (cred) => {
      if (!cred.credential) return
      try {
        const s = await authApi.google(cred.credential)
        setAuth({ accessToken: s.accessToken, refreshToken: s.refreshToken, user: s.user })
        // Same destination as the in-dialog Google button, so signing in with
        // Google always ends up in the same place however it was started.
        navigate('/dashboard')
      } catch {
        // Interceptor toasts the failure. One Tap is opportunistic — if it
        // doesn't work the user still has the button in the auth dialog.
      }
    },
    onError: () => {
      /* Silent by design: an unprompted popup failing shouldn't raise an error
         toast on a page the user didn't ask to authenticate on. */
    },
  })

  return null
}

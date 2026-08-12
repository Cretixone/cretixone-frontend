import { useGoogleOneTapLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'

import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/store/authStore'
import { isGoogleAuthEnabled } from '@/lib/google'

/**
 * Google One Tap — the small "Continue as …" card Google shows in the top-right
 * corner. Renders nothing itself; it just registers the prompt.
 *
 * Mounted once, site-wide, and only while signed out.
 *
 * IMPORTANT: whether this prompt appears is Google's and the browser's decision,
 * not ours. Once a visitor dismisses it, Chrome puts the site into a FedCM
 * cooldown and later get() calls reject with NetworkError until that expires or
 * the user re-allows third-party sign-in for the site. There is no flag we can
 * set to force it back. Treat One Tap as a bonus and rely on the "Continue with
 * Google" button in the auth dialog as the path that always works.
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
    // Dev-only: says exactly why the prompt didn't appear, which is otherwise
    // guesswork. Reasons worth knowing:
    //   suppressed_by_user  -> dismissed before; in Chrome's FedCM cooldown
    //   unregistered_origin -> this origin isn't in Authorized JavaScript origins
    //   invalid_client      -> client ID doesn't match the backend's
    //   browser_not_supported / secure_http_required -> environment problem
    promptMomentNotification: (n) => {
      if (import.meta.env.PROD) return
      if (n.isNotDisplayed?.()) {
        console.info('[One Tap] not displayed:', n.getNotDisplayedReason?.())
      } else if (n.isSkippedMoment?.()) {
        console.info('[One Tap] skipped:', n.getSkippedReason?.())
      }
    },
  })

  return null
}

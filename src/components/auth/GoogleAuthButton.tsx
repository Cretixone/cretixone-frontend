import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { authApi, type AuthSession } from '@/api/auth.api'
import { isGoogleAuthEnabled } from '@/lib/google'

/**
 * "Continue with Google" — Google's own rendered button, which is required by
 * their branding guidelines and gives us the ID token directly.
 *
 * Sign-in and sign-up are the same exchange: the backend decides whether to
 * match, link, or create the account, so this component is dropped into both
 * the login and register tabs unchanged.
 */
export function GoogleAuthButton({
  onSession,
  variant = 'signin',
}: {
  onSession: (s: AuthSession) => void
  /** Only changes the button's wording — the server behaviour is identical. */
  variant?: 'signin' | 'signup'
}) {
  const { t } = useTranslation('auth')
  const [busy, setBusy] = useState(false)

  // No client ID configured → don't render a button that can't work.
  if (!isGoogleAuthEnabled()) return null

  return (
    <div className="space-y-3">
      {/* Divider */}
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-black/10" />
        <span className="text-[11px] uppercase tracking-wide text-foreground/40">
          {t('google.or')}
        </span>
        <span className="h-px flex-1 bg-black/10" />
      </div>

      {/* Google renders inside an iframe, so it can't be styled by us. Centering
          it and letting it size to the container is the most we can do. */}
      <div className={busy ? 'pointer-events-none opacity-60' : undefined}>
        <div className="flex justify-center [&>div]:w-full [&_iframe]:!mx-auto">
          <GoogleLogin
            // No `locale` prop: it belongs on GoogleOAuthProvider, and setting
            // it there would remount the GSI script on every language toggle.
            // Left unset, Google localises the button from the user's own
            // account/browser language — the right behaviour for its branding.
            text={variant === 'signup' ? 'signup_with' : 'continue_with'}
            theme="outline"
            size="large"
            shape="rectangular"
            width="100%"
            logo_alignment="center"
            onSuccess={async (cred) => {
              if (!cred.credential) {
                toast.error(t('google.failed'))
                return
              }
              setBusy(true)
              try {
                onSession(await authApi.google(cred.credential))
              } catch {
                // Axios interceptor already toasted the server's message.
              } finally {
                setBusy(false)
              }
            }}
            onError={() => toast.error(t('google.failed'))}
          />
        </div>
      </div>
    </div>
  )
}

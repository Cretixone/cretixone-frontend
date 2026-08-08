import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { useCookieConsentStore } from '@/store/cookieConsentStore'

/**
 * Cookie notice with a genuine Accept / Reject pair.
 *
 * Both buttons carry the same visual weight, and rejecting is a single click
 * with no follow-up prompt, which is what "freely given consent" requires.
 *
 * Nothing on the site is gated on accepting: the only browser storage this app
 * relies on is the sign-in token and the cart, both of which are strictly
 * necessary and therefore outside the scope of a consent request. The banner
 * exists to disclose that and to record the answer.
 */
export function CookieConsent() {
  const { t } = useTranslation('common')
  const choice = useCookieConsentStore((s) => s.choice)
  const accept = useCookieConsentStore((s) => s.accept)
  const reject = useCookieConsentStore((s) => s.reject)

  return (
    <AnimatePresence>
      {choice === null && (
        <motion.div
          role="region"
          aria-label={t('cookies.aria')}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          // z-[130] clears the PillNav (z-[60]) and the dropdown/select layer
          // (z-[120]) so the notice is never buried. Below the toaster.
          className="fixed inset-x-0 bottom-0 z-[130] px-4 pb-4 sm:px-6 sm:pb-6"
        >
          <div className="mx-auto flex max-w-[1100px] flex-col gap-4 rounded-2xl bg-white p-5 shadow-[0px_0px_21.1px_rgba(0,0,0,0.16)] ring-1 ring-black/5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
            <p className="flex-1 text-[13px] leading-relaxed text-foreground/75">
              {t('cookies.message')}{' '}
              <Link to="/privacy" className="font-medium text-brand-navy underline hover:no-underline">
                {t('cookies.readPolicy')}
              </Link>
            </p>

            {/* Equal weight on both actions: rejecting must be as easy as accepting. */}
            <div className="flex shrink-0 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={reject}
                className="w-full border-brand-navy/30 bg-transparent text-brand-navy hover:bg-brand-navy/5 sm:w-auto sm:min-w-[110px]"
              >
                {t('cookies.reject')}
              </Button>
              <Button
                type="button"
                variant="navy"
                onClick={accept}
                className="w-full sm:w-auto sm:min-w-[110px]"
              >
                {t('cookies.accept')}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

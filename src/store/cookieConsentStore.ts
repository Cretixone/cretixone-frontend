import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CookieChoice = 'accepted' | 'rejected'

interface CookieConsentState {
  /** null until the visitor has answered the banner. */
  choice: CookieChoice | null
  decidedAt: string | null
  accept: () => void
  reject: () => void
  /** Reopens the banner (e.g. a "cookie settings" link). */
  reset: () => void
}

/**
 * Remembers the visitor's cookie answer so the banner is shown once.
 *
 * The choice is kept in localStorage rather than a cookie, on purpose: storing
 * a cookie to record a cookie rejection is the thing people object to. It is
 * also read synchronously on load, so the banner never flashes for someone who
 * has already answered.
 */
export const useCookieConsentStore = create<CookieConsentState>()(
  persist(
    (set) => ({
      choice: null,
      decidedAt: null,
      accept: () => set({ choice: 'accepted', decidedAt: new Date().toISOString() }),
      reject: () => set({ choice: 'rejected', decidedAt: new Date().toISOString() }),
      reset: () => set({ choice: null, decidedAt: null }),
    }),
    { name: 'cretixone-cookie-consent' },
  ),
)

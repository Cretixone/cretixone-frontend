import { create } from 'zustand'
import i18n from '@/i18n'

type Dir = 'ltr' | 'rtl'

interface LangState {
  /** Active language code, e.g. 'en' | 'ar'. */
  lang: string
  /** True when the active language is right-to-left (Arabic). */
  isRtl: boolean
  /** 'rtl' | 'ltr' — handy for `dir=` props / conditional styles. */
  dir: Dir
  /** Change the app language (persists + flips <html dir> via i18n). */
  setLang: (lng: string) => void
}

const dirOf = (lng: string): Dir => (i18n.dir(lng) === 'rtl' ? 'rtl' : 'ltr')

/**
 * Global language/direction state. `isRtl` mirrors the active i18n language, so
 * any component (or non-React code via `useLangStore.getState().isRtl`) can
 * branch on it. Kept in sync automatically with the i18n language switcher.
 */
export const useLangStore = create<LangState>(() => ({
  lang: i18n.language,
  isRtl: dirOf(i18n.language) === 'rtl',
  dir: dirOf(i18n.language),
  setLang: (lng) => i18n.changeLanguage(lng),
}))

// Sync the store whenever the language changes (switcher, direct changeLanguage…).
i18n.on('languageChanged', (lng) => {
  const dir = dirOf(lng)
  useLangStore.setState({ lang: lng, isRtl: dir === 'rtl', dir })
})

/** Convenience selector hook: `const isRtl = useIsRtl()`. */
export const useIsRtl = () => useLangStore((s) => s.isRtl)

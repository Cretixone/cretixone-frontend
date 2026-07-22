import { useTranslation } from 'react-i18next'

/**
 * Current layout direction ('ltr' | 'rtl') for the active language.
 * Subscribes to i18n so consumers re-render on language change — handy for
 * Swiper, which reads `dir` at init and needs a remount (via `key`) to flip.
 */
export function useDirection(): 'ltr' | 'rtl' {
  const { i18n } = useTranslation()
  return i18n.dir() === 'rtl' ? 'rtl' : 'ltr'
}

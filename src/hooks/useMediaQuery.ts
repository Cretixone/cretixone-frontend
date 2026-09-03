import { useEffect, useState } from 'react'

/**
 * Reactive `window.matchMedia` subscription. SSR-safe (there's no SSR in this
 * app, but the `typeof window` guard keeps it safe under any tooling that
 * imports modules outside a browser, e.g. a test runner).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mq = window.matchMedia(query)
    const sync = () => setMatches(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [query])

  return matches
}

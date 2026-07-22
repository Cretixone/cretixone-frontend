import i18n, { type Resource } from 'i18next'
import { initReactI18next } from 'react-i18next'

// ─── Locale resources ────────────────────────────────────────────────────────
// Every JSON file under locales/<lng>/<namespace>.json is auto-registered by its
// filename as an i18next namespace. Add a new namespace by dropping matching
// en/ar files in — no change needed here. English is the source/default; Arabic
// is the translation. (Dynamic/DB text is intentionally NOT translated yet.)
const enModules = import.meta.glob('./locales/en/*.json', { eager: true })
const arModules = import.meta.glob('./locales/ar/*.json', { eager: true })

type JsonModule = { default: Record<string, unknown> }

function toResources(modules: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const path in modules) {
    const ns = path.split('/').pop()!.replace('.json', '')
    out[ns] = (modules[path] as JsonModule).default ?? modules[path]
  }
  return out
}

const enResources = toResources(enModules)
const arResources = toResources(arModules)
const namespaces = Object.keys(enResources)

export const SUPPORTED_LANGS = ['en', 'ar'] as const
export type Lang = (typeof SUPPORTED_LANGS)[number]

const STORAGE_KEY = 'cretixone-lang'
const stored = (typeof localStorage !== 'undefined'
  ? localStorage.getItem(STORAGE_KEY)
  : null) as Lang | null
const initialLang: Lang =
  stored && SUPPORTED_LANGS.includes(stored) ? stored : 'en'

// Arabic reads right-to-left; keep <html dir/lang> in sync so layout mirrors.
export function applyDirection(lng: string) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = lng
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr'
}

const resources: Resource = { en: enResources, ar: arResources } as Resource

i18n.use(initReactI18next).init({
  resources,
  lng: initialLang,
  fallbackLng: 'en',
  ns: namespaces.length ? namespaces : ['common'],
  defaultNS: 'common',
  interpolation: { escapeValue: false }, // React already escapes
  // Resources are bundled inline (synchronous), so nothing loads async —
  // disabling Suspense avoids any need for a <Suspense> boundary on switch.
  react: { useSuspense: false },
})

applyDirection(initialLang)
i18n.on('languageChanged', (lng) => {
  applyDirection(lng)
  try {
    localStorage.setItem(STORAGE_KEY, lng)
  } catch {
    /* storage may be unavailable (private mode) */
  }
})

export default i18n

import { getCountries } from 'react-phone-number-input'
import en from 'react-phone-number-input/locale/en.json'

const NAMES = en as Record<string, string>

// Full ISO country list with English display names, sourced from the phone
// library already in use elsewhere (no new dependency, no invented data).
export const COUNTRIES = getCountries()
  .map((code) => ({ code, name: NAMES[code] }))
  .filter((c) => !!c.name)
  .sort((a, b) => a.name.localeCompare(b.name))

/** ISO country code (e.g. "OM") → English display name (e.g. "Oman"). */
export function getCountryName(code: string | null | undefined): string {
  if (!code) return ''
  return NAMES[code] ?? code
}

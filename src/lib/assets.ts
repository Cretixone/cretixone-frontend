/**
 * Resolves a backend upload path ("/uploads/…") to a URL the browser can load.
 *
 * Empty in dev, so relative paths flow through the Vite proxy; in production it
 * points at the API host so the static frontend can load images cross-origin.
 *
 * Extracted from the RTK Query slice so the custom-prints module (which uses
 * plain axios, not RTK Query) resolves assets exactly the same way.
 */
const UPLOADS_HOST: string =
  (import.meta.env.VITE_UPLOADS_HOST as string | undefined) ||
  (import.meta.env.PROD ? 'https://api.cretixone.com' : '')

export const resolveAsset = (url: string | null | undefined): string => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (!UPLOADS_HOST) return url
  return url.startsWith('/') ? `${UPLOADS_HOST}${url}` : `${UPLOADS_HOST}/${url}`
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CRETIX_API_BASE?: string
  readonly VITE_UPLOADS_HOST?: string
  readonly VITE_FRAMEIT_API_BASE?: string
  /**
   * Google OAuth **client ID** — public by design, safe to ship in the bundle.
   * Must match GOOGLE_CLIENT_ID on the backend or ID tokens fail the `aud`
   * check. Never put the client *secret* here; the ID-token flow doesn't use it.
   */
  readonly VITE_GOOGLE_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

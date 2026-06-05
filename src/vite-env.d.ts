/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CRETIX_API_BASE?: string
  readonly VITE_UPLOADS_HOST?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

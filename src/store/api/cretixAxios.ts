import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'

// Production points directly at the Cretixone API; dev uses the vite
// proxy at /cretix-api → http://localhost:8000/api/v1. An explicit
// VITE_CRETIX_API_BASE env var still wins so we can stage against a
// different host without rebuilding.
const baseURL =
  (import.meta.env.VITE_CRETIX_API_BASE as string | undefined) ||
  (import.meta.env.PROD ? 'https://api.cretixone.com/api/v1' : '/cretix-api')

// Per-request opt-out of the global toast (e.g. auth forms that render their
// own inline errors and don't want a duplicate toast).
export interface AppRequestConfig extends InternalAxiosRequestConfig {
  silent?: boolean
}

interface ApiErrorBody {
  success: false
  code?: string
  message?: string
}
interface ApiOkBody<T> {
  success: true
  data?: T
  message?: string
}

// Dedicated client for our own backend (Cretixone). Kept separate from the
// frameit axiosInstance so the two never share an Authorization header.
const cretixAxios = axios.create({
  baseURL,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request: attach the user access token when present ──────────────────────
cretixAxios.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers = config.headers ?? {}
    ;(config.headers as Record<string, string>).Authorization = `Bearer ${token}`
  }
  return config
})

// ── Silent refresh (de-duped across concurrent 401s) ────────────────────────
let refreshPromise: Promise<string | null> | null = null
const tryRefresh = async (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise
  const { refreshToken, clear, setAccessToken, setRefreshToken } = useAuthStore.getState()
  if (!refreshToken) return null

  refreshPromise = (async () => {
    try {
      const res = await axios.post<ApiOkBody<{ accessToken: string; refreshToken: string }>>(
        `${baseURL}/users/refresh`,
        { refreshToken },
      )
      const next = res.data.data
      if (!next) throw new Error('No data')
      setAccessToken(next.accessToken)
      setRefreshToken(next.refreshToken)
      return next.accessToken
    } catch {
      clear()
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

// ── Response: global error toast on mutations (never on GET) + 401 refresh ──
cretixAxios.interceptors.response.use(
  (response) => {
    const cfg = response.config as AppRequestConfig
    const method = (cfg.method ?? 'get').toLowerCase()
    const body = response.data as ApiOkBody<unknown> | undefined
    // Success toast only for mutations that carry a human-readable message.
    if (!cfg.silent && method !== 'get' && body?.success && body.message) {
      toast.success(body.message)
    }
    return response
  },
  async (error: AxiosError<ApiErrorBody>) => {
    const cfg = (error.config ?? {}) as AppRequestConfig & { _retry?: boolean }
    const method = (cfg.method ?? 'get').toLowerCase()
    const status = error.response?.status
    const data = error.response?.data

    // 401 → one silent refresh, then retry the original request.
    const isRefreshCall = cfg.url?.includes('/users/refresh')
    if (status === 401 && !cfg._retry && !isRefreshCall) {
      cfg._retry = true
      const newToken = await tryRefresh()
      if (newToken) {
        cfg.headers = cfg.headers ?? {}
        ;(cfg.headers as Record<string, string>).Authorization = `Bearer ${newToken}`
        return cretixAxios.request(cfg)
      }
    }

    // Global error toast: mutations only, never GET, never when silent.
    const shouldToast = !cfg.silent && method !== 'get'
    if (shouldToast) {
      const message =
        data?.message ??
        (error.code === 'ECONNABORTED'
          ? 'Request timed out'
          : error.message || 'Something went wrong')
      toast.error(message)
    }

    return Promise.reject(error)
  },
)

export default cretixAxios

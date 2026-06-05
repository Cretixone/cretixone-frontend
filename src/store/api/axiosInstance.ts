import axios from 'axios'

// Frameit (legacy) API — used for Interiors / Scenery / Mat / Effects.
// Dev hits the vite proxy at /api → https://frameitapp.net/outside/web.
// In prod the static frontend can't proxy, so we point the requests
// straight at frameit. A VITE_FRAMEIT_API_BASE env var overrides both
// so we can stage against a different mirror without rebuilding.
const FRAMEIT_API_BASE: string =
  (import.meta.env.VITE_FRAMEIT_API_BASE as string | undefined) ||
  (import.meta.env.PROD ? 'https://frameitapp.net/outside/web' : '/api')

const axiosInstance = axios.create({
  baseURL: FRAMEIT_API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

const TOKEN_KEY = 'access_token'

export async function fetchAccessToken(): Promise<boolean> {
  try {
    const response = await axios.post(`${FRAMEIT_API_BASE}/getAccessTokenNew`, { version: 'v1.2.0' })
    const token = response.data?.data
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
      return true
    }
    return false
  } catch (error) {
    console.error('Failed to fetch access token:', error)
    return false
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

// Attach Authorization token to every request
axiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = token
  }
  return config
})

export default axiosInstance

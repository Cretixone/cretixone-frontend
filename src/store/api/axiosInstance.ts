import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

const TOKEN_KEY = 'access_token'

export async function fetchAccessToken(): Promise<boolean> {
  try {
    const response = await axios.post('/api/getAccessTokenNew', { version: 'v1.2.0' })
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

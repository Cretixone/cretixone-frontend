import axios from 'axios'

// Production points directly at the Cretixone API; dev uses the vite
// proxy at /cretix-api → http://localhost:8000/api/v1. An explicit
// VITE_CRETIX_API_BASE env var still wins so we can stage against a
// different host without rebuilding.
const baseURL =
  (import.meta.env.VITE_CRETIX_API_BASE as string | undefined) ||
  (import.meta.env.PROD ? 'https://api.cretixone.com/api/v1' : '/cretix-api')

// Dedicated client for our own backend (Cretixone). Kept separate from the
// frameit axiosInstance so the two never share an Authorization header — the
// frameit client expects an access token we fetch via getAccessTokenNew.
const cretixAxios = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default cretixAxios

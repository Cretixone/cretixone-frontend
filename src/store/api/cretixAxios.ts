import axios from 'axios'

// Dedicated client for our own backend (Cretixone). Kept separate from the
// frameit axiosInstance so the two never share an Authorization header — the
// frameit client expects an access token we fetch via getAccessTokenNew.
const cretixAxios = axios.create({
  baseURL: '/cretix-api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default cretixAxios

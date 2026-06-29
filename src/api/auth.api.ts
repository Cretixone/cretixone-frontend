import cretixAxios from '@/store/api/cretixAxios'
import type { AuthUser } from '@/store/authStore'

interface Ok<T> {
  success: true
  data: T
  message?: string
}

export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
  address: string
  zipcode: string
}

export interface AuthSession {
  user: AuthUser
  accessToken: string
  refreshToken: string
}

export const authApi = {
  async register(payload: RegisterPayload) {
    const res = await cretixAxios.post<Ok<{ requiresVerification: boolean; email: string }>>(
      '/users/register',
      payload,
    )
    return res.data.data
  },

  async verifyEmail(email: string, otp: string) {
    const res = await cretixAxios.post<Ok<AuthSession>>('/users/verify-email', { email, otp })
    return res.data.data
  },

  async resendOtp(email: string) {
    await cretixAxios.post('/users/resend-otp', { email })
  },

  async login(email: string, password: string) {
    const res = await cretixAxios.post<Ok<AuthSession>>('/users/login', { email, password })
    return res.data.data
  },

  async forgotPassword(email: string) {
    await cretixAxios.post('/users/forgot-password', { email })
  },

  async verifyResetOtp(email: string, otp: string) {
    await cretixAxios.post('/users/verify-otp', { email, otp })
  },

  async resetPassword(email: string, otp: string, password: string) {
    await cretixAxios.post('/users/reset-password', { email, otp, password })
  },

  async getMe() {
    const res = await cretixAxios.get<Ok<AuthUser>>('/users/me', {
      // GETs never toast; keep silent explicit for the bootstrap call.
      ...({ silent: true } as object),
    })
    return res.data.data
  },

  async updateProfile(payload: Partial<RegisterPayload>) {
    const res = await cretixAxios.patch<Ok<AuthUser>>('/users/me', payload)
    return res.data.data
  },

  async logout() {
    try {
      await cretixAxios.post('/users/logout', undefined, { ...({ silent: true } as object) })
    } catch {
      /* token already gone — ignore */
    }
  },
}

// Narrow helper to read the backend error code off an axios error.
export const errorCode = (err: unknown): string | undefined => {
  const e = err as { response?: { data?: { code?: string } } }
  return e?.response?.data?.code
}

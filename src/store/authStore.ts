import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { secureStorage } from '@/lib/secure-storage'

export interface AuthUser {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  address: string | null
  zipcode: string | null
  emailVerified: boolean
  createdAt?: string
  updatedAt?: string
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  setAuth: (p: { accessToken: string; refreshToken: string; user: AuthUser }) => void
  setUser: (user: AuthUser) => void
  setAccessToken: (token: string) => void
  setRefreshToken: (token: string) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      setAuth: ({ accessToken, refreshToken, user }) =>
        set({ accessToken, refreshToken, user, isAuthenticated: true }),
      setUser: (user) => set({ user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      clear: () =>
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false }),
    }),
    {
      // Encrypted at rest via secureStorage.
      name: 'cretixone-user-auth',
      storage: createJSONStorage(() => secureStorage),
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        user: s.user,
        isAuthenticated: s.isAuthenticated,
      }),
    },
  ),
)

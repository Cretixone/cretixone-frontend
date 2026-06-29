import { create } from 'zustand'

export type AuthView = 'login' | 'register' | 'forgot'

interface AuthUiState {
  open: boolean
  view: AuthView
  // Where to go after a successful login (e.g. '/cart' when gated at checkout).
  redirectTo: string | null
  openAuth: (view?: AuthView, redirectTo?: string | null) => void
  setView: (view: AuthView) => void
  close: () => void
}

export const useAuthUiStore = create<AuthUiState>((set) => ({
  open: false,
  view: 'login',
  redirectTo: null,
  openAuth: (view = 'login', redirectTo = null) => set({ open: true, view, redirectTo }),
  setView: (view) => set({ view }),
  close: () => set({ open: false, redirectTo: null }),
}))

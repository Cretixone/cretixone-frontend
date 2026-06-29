import CryptoJS from 'crypto-js'
import type { StateStorage } from 'zustand/middleware'

/**
 * Encrypted localStorage adapter for Zustand `persist`.
 *
 * The encryption key ships in the bundle, so this is defence-in-depth against
 * casual devtools inspection / localStorage scraping — not a defence against an
 * attacker with code execution in the page (XSS). Every persisted store that
 * holds tokens or user data routes through this adapter so nothing is written
 * to disk in plaintext.
 */
const APP_KEY =
  (import.meta.env.VITE_STORAGE_SECRET as string | undefined) ??
  'cretixone-user-storage-key-change-me-in-production'

const saltKey = '__cretix_salt__'
const getOrCreateSalt = (): string => {
  const existing = window.localStorage.getItem(saltKey)
  if (existing) return existing
  const salt = CryptoJS.lib.WordArray.random(16).toString()
  window.localStorage.setItem(saltKey, salt)
  return salt
}

const getDerivedKey = (): string => {
  const salt = getOrCreateSalt()
  return CryptoJS.PBKDF2(APP_KEY, salt, { keySize: 256 / 32, iterations: 1000 }).toString()
}

export const encryptValue = (plain: string): string =>
  CryptoJS.AES.encrypt(plain, getDerivedKey()).toString()

export const decryptValue = (cipher: string): string | null => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, getDerivedKey())
    const out = bytes.toString(CryptoJS.enc.Utf8)
    return out.length > 0 ? out : null
  } catch {
    return null
  }
}

/**
 * Storage adapter that encrypts values before writing and decrypts on read.
 * Tampered / unreadable ciphertext is dropped so the store rehydrates from
 * defaults rather than crashing the app.
 */
export const secureStorage: StateStorage = {
  getItem: (name) => {
    const raw = window.localStorage.getItem(name)
    if (!raw) return null
    const plain = decryptValue(raw)
    if (plain === null) {
      window.localStorage.removeItem(name)
      return null
    }
    return plain
  },
  setItem: (name, value) => {
    window.localStorage.setItem(name, encryptValue(value))
  },
  removeItem: (name) => {
    window.localStorage.removeItem(name)
  },
}

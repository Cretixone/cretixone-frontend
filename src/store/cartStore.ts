import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { secureStorage } from '@/lib/secure-storage'

// A single cart line. Each "Checkout" from the editor adds a new line
// (sizes/options can differ), so identical frames stay as separate lines —
// matching the cart design.
export interface CartItem {
  id: string // unique line id
  frameId: number
  name: string
  subtitle: string
  thumbnail: string
  widthCm: number
  heightCm: number
  pricePerItem: number // OMR — already includes the mat price
  qty: number
  // Mat selection (admin-managed). pricePerItem already folds matPrice in;
  // these are kept for display + line dedup. Optional so older persisted
  // carts (pre-mat) still rehydrate cleanly.
  matSizeId?: string | null
  matSizeName?: string | null
  matPrice?: number
  matColorId?: string | null
  matColorName?: string | null
  // MDF backing (admin-managed). pricePerItem already folds mdfPrice in.
  mdfId?: string | null
  mdfName?: string | null
  mdfPrice?: number
}

// Flat standard shipping (OMR). Placeholder until a shipping engine exists.
export const SHIPPING_OMR = 5

type CartItemContent = Omit<CartItem, 'id' | 'qty'>

interface CartState {
  items: CartItem[]
  // Adds the item; if an identical line (same frame + size) already exists,
  // its quantity is incremented instead of creating a duplicate line.
  addItem: (item: CartItemContent) => void
  // Replaces an existing line's content (used by the cart's Edit flow) while
  // keeping its id + quantity — so editing never creates a new line.
  updateItem: (id: string, content: CartItemContent) => void
  removeItem: (id: string) => void
  setQty: (id: string, qty: number) => void
  clear: () => void
}

const sameLine = (a: CartItemContent, b: CartItem) =>
  a.frameId === b.frameId &&
  Math.abs(a.widthCm - b.widthCm) < 0.05 &&
  Math.abs(a.heightCm - b.heightCm) < 0.05 &&
  (a.matSizeId ?? null) === (b.matSizeId ?? null) &&
  (a.matColorId ?? null) === (b.matColorId ?? null) &&
  (a.mdfId ?? null) === (b.mdfId ?? null)

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.round(Math.random() * 1e6)}`

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((s) => {
          const idx = s.items.findIndex((i) => sameLine(item, i))
          if (idx >= 0) {
            const items = s.items.slice()
            items[idx] = { ...items[idx], qty: items[idx].qty + 1 }
            return { items }
          }
          return { items: [...s.items, { ...item, id: uid(), qty: 1 }] }
        }),
      updateItem: (id, content) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...content, id: i.id, qty: i.qty } : i,
          ),
        })),
      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      setQty: (id, qty) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, qty: Math.max(1, qty) } : i,
          ),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'cretixone-cart',
      // Encrypted at rest like all persisted app data.
      storage: createJSONStorage(() => secureStorage),
    },
  ),
)

// Derived totals (kept out of the store so any caller can compute cheaply).
export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.pricePerItem * i.qty, 0)
}
export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.qty, 0)
}

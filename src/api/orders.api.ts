import cretixAxios from '@/store/api/cretixAxios'

interface Ok<T> {
  success: true
  data: T
  message?: string
}

export interface PageMeta {
  page: number
  limit: number
  total: number
  pageCount: number
}

interface Paged<T> {
  success: true
  data: T[]
  meta?: PageMeta
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderItem {
  frameId: number
  /** Which catalogue this line came from. Absent on pre-prints orders. */
  kind?: 'frame' | 'print'
  name: string
  subtitle?: string | null
  thumbnail?: string | null
  /** Customer-supplied artwork for this line. */
  artworkUrl?: string | null
  widthCm: number
  heightCm: number
  pricePerItem: number
  qty: number
  matSizeName?: string | null
  matColorName?: string | null
  mdfName?: string | null
  paperTypeName?: string | null
  laminationName?: string | null
  glassTypeName?: string | null
  // Print-only options.
  canvasMaterialName?: string | null
  canvasEdgeName?: string | null
}

export interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  customerName: string
  customerEmail: string
  customerPhone: string | null
  companyName: string | null
  location: string
  address: string
  country: string
  houseNumber: string
  city: string
  zipcode: string | null
  orderNotes: string | null
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
  currency: string
  createdAt: string
  updatedAt: string
}

export interface CreateOrderPayload {
  items: OrderItem[]
  customerName: string
  customerEmail: string
  customerPhone?: string
  companyName?: string
  location: string
  address: string
  country: string
  houseNumber: string
  city: string
  orderNotes?: string
  shipping: number
  currency?: string
}

export const ordersApi = {
  async create(payload: CreateOrderPayload) {
    const res = await cretixAxios.post<Ok<Order>>('/orders', payload)
    return res.data.data
  },

  async mine(params: { page: number; limit: number }) {
    const res = await cretixAxios.get<Paged<Order>>(
      `/orders/mine?page=${params.page}&limit=${params.limit}`,
      { ...({ silent: true } as object) },
    )
    return { items: res.data.data, meta: res.data.meta }
  },

  async getById(id: string) {
    const res = await cretixAxios.get<Ok<Order>>(`/orders/${id}`, { ...({ silent: true } as object) })
    return res.data.data
  },
}

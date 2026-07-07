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
  name: string
  subtitle?: string | null
  thumbnail?: string | null
  widthCm: number
  heightCm: number
  pricePerItem: number
  qty: number
  matSizeName?: string | null
  matColorName?: string | null
  mdfName?: string | null
}

export interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  customerName: string
  customerEmail: string
  customerPhone: string | null
  address: string
  zipcode: string
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
  address: string
  zipcode: string
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
}

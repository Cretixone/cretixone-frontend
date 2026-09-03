import cretixAxios from '@/store/api/cretixAxios'

interface Ok<T> {
  success: true
  data: T
}

interface Paged<T> {
  success: true
  data: T[]
  meta?: { page: number; limit: number; total: number; pageCount: number }
}

export interface Gift {
  id: string
  /** Numeric id used in storefront URLs (/gifts/<hashedId>). */
  hashedId: number
  name: string
  nameAr: string | null
  description: string | null
  descriptionAr: string | null
  /** Ordered — the first image is the tile and the detail page's main image. */
  gallery: string[]
  /** One fixed price. A gift has no size, so nothing scales. */
  price: number
  /** Display-only "was" price; struck through when higher than `price`. */
  oldPrice: number
  isNew: boolean
}

export const giftsApi = {
  async list(params: { page?: number; limit?: number }) {
    const res = await cretixAxios.get<Paged<Gift>>('/gifts/public', { params })
    return { items: res.data.data, meta: res.data.meta }
  },

  async byId(hashedId: number | string): Promise<Gift> {
    const res = await cretixAxios.get<Ok<Gift>>(`/gifts/public/${hashedId}`)
    return res.data.data
  },
}

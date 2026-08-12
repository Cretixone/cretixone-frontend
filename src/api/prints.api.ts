import cretixAxios from '@/store/api/cretixAxios'
import { productPrice } from '@/lib/pricing'

interface Ok<T> {
  success: true
  data: T
}

interface Paged<T> {
  success: true
  data: T[]
  meta?: { page: number; limit: number; total: number; pageCount: number }
}

/** Shared shape for every print option (canvas material, edge, lamination). */
export interface PrintOption {
  id: string
  name: string
  imageUrl: string | null
  pricePerCm: number
  isActive: boolean
  sortOrder: number
}

/** Image Size reuses the frame-size catalogue. */
export interface PrintSize {
  id: string
  name: string
  widthCm: number
  lengthCm: number
  isActive: boolean
  sortOrder: number
}

export interface PrintCategory {
  id: string
  name: string
  nameAr: string | null
  slug: string
  imageUrl: string | null
  description: string | null
  descriptionAr: string | null
  sortOrder: number
}

export interface CustomPrint {
  id: string
  /** Numeric id used in storefront URLs (/custom-prints/product/<hashedId>). */
  hashedId: number
  name: string
  nameAr: string | null
  categoryId: string | null
  isNew: boolean
  /** Prints carry gallery images only; the first is the listing thumbnail. */
  gallery: string[]
  pricePerCm: number
  oldPricePerCm: number
  wasteValue: number
  sizeFrom: number
  sizeTo: number
  description: string | null
  descriptionAr: string | null
  specifications: Record<string, string>
  // Resolved option records — present only on the single-print fetch.
  frameSizes?: PrintSize[]
  laminations?: PrintOption[]
  canvasMaterials?: PrintOption[]
  canvasEdges?: PrintOption[]
}

export const printsApi = {
  async categories(): Promise<PrintCategory[]> {
    const res = await cretixAxios.get<Ok<PrintCategory[]>>('/print-categories/public')
    return res.data.data
  },

  async categoryBySlug(slug: string): Promise<PrintCategory> {
    const res = await cretixAxios.get<Ok<PrintCategory>>(`/print-categories/public/${slug}`)
    return res.data.data
  },

  async list(params: { category?: string; q?: string; page?: number; limit?: number }) {
    const res = await cretixAxios.get<Paged<CustomPrint>>('/custom-prints/public', { params })
    return { items: res.data.data, meta: res.data.meta }
  },

  async byId(hashedId: number | string): Promise<CustomPrint> {
    const res = await cretixAxios.get<Ok<CustomPrint>>(`/custom-prints/public/${hashedId}`)
    return res.data.data
  },
}

/**
 * Price for a print. Thin wrapper over the shared productPrice() helper so
 * frames and prints literally run the same formula.
 */
export function printPrice(
  print: Pick<CustomPrint, 'pricePerCm' | 'wasteValue'>,
  widthCm: number,
  heightCm: number,
  optionsPricePerCm: number,
): number {
  return productPrice(print.pricePerCm, print.wasteValue, widthCm, heightCm, optionsPricePerCm)
}

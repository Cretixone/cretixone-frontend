import cretixAxios from '@/store/api/cretixAxios'
import { customPrintPrice } from '@/lib/pricing'

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
  /** Numeric id used where a print-like id is required (reviews, cart). */
  hashedId: number
  name: string
  nameAr: string | null
  slug: string
  description: string | null
  descriptionAr: string | null
  sortOrder: number

  // A category IS the sellable product: it carries the print fields itself.
  gallery: string[]
  pricePerCm: number
  oldPricePerCm: number
  wasteValue: number
  sizeFrom: number
  sizeTo: number
  specifications: Record<string, string>
  isNew: boolean
  /** True -> the tile opens the inquiry page instead of the product page. */
  isEnquiryOnly: boolean

  // Resolved option records — present only on the single-category fetch.
  frameSizes?: PrintSize[]
  laminations?: PrintOption[]
  canvasMaterials?: PrintOption[]
  canvasEdges?: PrintOption[]
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
 * Price for a print or a print category — the two share one formula. Thin
 * wrapper over customPrintPrice(), which excludes the waste allowance: on the
 * prints module waste is an admin costing reference, not a charge. (Frames
 * still charge it, via productPrice().)
 */
export function printPrice(
  print: Pick<CustomPrint, 'pricePerCm'>,
  widthCm: number,
  heightCm: number,
  optionsPricePerCm: number,
): number {
  return customPrintPrice(print.pricePerCm, widthCm, heightCm, optionsPricePerCm)
}

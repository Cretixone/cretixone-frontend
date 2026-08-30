import cretixAxios from '@/store/api/cretixAxios'

interface Ok<T> {
  success: true
  data: T
  message?: string
}

export interface CreateInquiryPayload {
  // The storefront only has the hashed frame id, so we send the name snapshot;
  // the backend stores frameId as null when not provided.
  frameName: string
  widthCm: number
  heightCm: number
  unitPrice?: number
  currency?: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  message?: string
  /** Product-specific answers the fixed fields do not model. */
  details?: Record<string, string>
  /** Customer artwork, emailed to the platform inbox as an attachment. */
  image?: File | null
}

export const inquiriesApi = {
  async create(payload: CreateInquiryPayload) {
    const { image, details, ...rest } = payload
    // Only switch to multipart when there is a file — a plain JSON body keeps
    // the common case simple and is what the endpoint has always accepted.
    if (!image) {
      const res = await cretixAxios.post<Ok<{ id: string }>>('/inquiries', { ...rest, details })
      return res.data.data
    }
    const fd = new FormData()
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined && v !== null) fd.append(k, String(v))
    }
    if (details && Object.keys(details).length) fd.append('details', JSON.stringify(details))
    fd.append('image', image)
    const res = await cretixAxios.post<Ok<{ id: string }>>('/inquiries', fd)
    return res.data.data
  },
}

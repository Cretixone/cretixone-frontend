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
}

export const inquiriesApi = {
  async create(payload: CreateInquiryPayload) {
    const res = await cretixAxios.post<Ok<{ id: string }>>('/inquiries', payload)
    return res.data.data
  },
}

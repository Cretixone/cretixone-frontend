import cretixAxios from '@/store/api/cretixAxios'

interface Ok<T> {
  success: true
  data: T
  message?: string
}

export interface Review {
  id: string
  rating: number
  title: string
  body: string
  likes: number
  likedBy: string[]
  userName: string
  createdAt: string
}

export interface CreateReviewPayload {
  frameId: number
  rating: number
  title: string
  body: string
}

export const reviewsApi = {
  /** Public list of reviews for a frame (by its hashed public id). */
  async list(frameId: number) {
    const res = await cretixAxios.get<Ok<Review[]>>(
      `/reviews/public?frameId=${frameId}`,
      { ...({ silent: true } as object) },
    )
    return res.data.data
  },

  /** Create a review (auth required — caller gates on login). */
  async create(payload: CreateReviewPayload) {
    const res = await cretixAxios.post<Ok<Review>>('/reviews', payload)
    return res.data.data
  },

  /** Toggle the current user's like on a review (auth required). */
  async like(id: string) {
    const res = await cretixAxios.post<Ok<{ likes: number; liked: boolean }>>(
      `/reviews/${id}/like`,
      {},
    )
    return res.data.data
  },

  /** Report a review with a reason (auth required). */
  async report(id: string, reason: string) {
    await cretixAxios.post<Ok<null>>(`/reviews/${id}/report`, { reason })
  },
}

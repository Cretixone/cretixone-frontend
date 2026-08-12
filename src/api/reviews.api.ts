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

/** A review targets exactly one product: a frame or a custom print. */
export type ReviewTarget = { frameId: number; printId?: never } | { printId: number; frameId?: never }

export type CreateReviewPayload = ReviewTarget & {
  rating: number
  title: string
  body: string
}

/** Builds the ?frameId= / ?printId= query for whichever target was given. */
const targetQuery = (target: ReviewTarget): string =>
  'printId' in target && target.printId !== undefined
    ? `printId=${target.printId}`
    : `frameId=${target.frameId}`

export const reviewsApi = {
  /** Public list of reviews for one product (by its hashed public id). */
  async list(target: ReviewTarget) {
    const res = await cretixAxios.get<Ok<Review[]>>(
      `/reviews/public?${targetQuery(target)}`,
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

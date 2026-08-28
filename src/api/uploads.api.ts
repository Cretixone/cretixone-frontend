import cretixAxios from '@/store/api/cretixAxios'

interface Ok<T> {
  success: true
  data: T
}

/** Client-side guard; the API enforces the same 3 MB limit. */
export const ARTWORK_MAX_BYTES = 3 * 1024 * 1024
export const ARTWORK_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

/**
 * Uploads customer artwork and returns its public URL. Called as soon as the
 * shopper picks a file on a product page, so the URL can be stored on the cart
 * line and travel into the order snapshot.
 */
export async function uploadArtwork(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('image', file)
  // silent: the caller renders its own message, so the interceptor's global
  // error toast would just duplicate it.
  const res = await cretixAxios.post<Ok<{ url: string }>>('/uploads/artwork', fd, {
    ...({ silent: true } as object),
  })
  return res.data.data.url
}

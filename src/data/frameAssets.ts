// ── Frame asset loader ─────────────────────────────────────────────────────
//
// Loads a full-frame PNG (landscape or portrait variant) and measures
// the inner mat opening — the rectangular fully-transparent region
// inside the moulding — from its alpha channel. The opening is what the
// editor uses to position the artwork window and mat strips.
//
// Results are cached by URL so each PNG is decoded and measured exactly
// once per session.

import type { ApiFrame } from '@/types/api'

export interface FrameAsset {
  img: HTMLImageElement
  /** Source bbox (in source pixels) of the fully-transparent inner opening. */
  opening: { x: number; y: number; w: number; h: number }
  width: number
  height: number
}

const loadCache = new Map<string, FrameAsset>()
const pendingLoads = new Map<string, Promise<FrameAsset>>()

/**
 * Pick which full-frame asset URL to load for a given frame + orientation
 * choice.
 *   - 'landscape' / 'auto' → landscape PNG
 *   - 'portrait'           → portrait PNG
 *   - 'square'             → dedicated square PNG when the admin
 *     uploaded one; otherwise the landscape PNG (the editor then fits
 *     a 1:1 picture rect inside its opening so the user still gets a
 *     square picture even though the moulding isn't 1:1).
 */
export function pickFrameAssetUrl(
  frame: Pick<ApiFrame, 'landscapeUrl' | 'portraitUrl' | 'squareUrl'>,
  orientation: 'landscape' | 'portrait' | 'square' | 'auto',
): string {
  if (orientation === 'portrait') return frame.portraitUrl
  if (orientation === 'square') return frame.squareUrl || frame.landscapeUrl
  return frame.landscapeUrl
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load ${src}`))
    img.src = src
  })
}

/**
 * Find the inner mat opening using a flood-fill from the centre of the
 * image. Only transparent pixels connected to the centre count — so any
 * transparent padding OUTSIDE the moulding (in the PNG canvas) is
 * ignored, and stray opaque pixels INSIDE the opening don't shrink it
 * (we just don't traverse them, but the rest of the connected region
 * still contributes to the bbox).
 *
 * Approach:
 *   1. Read the alpha channel for the whole image (one getImageData call).
 *   2. Seed at the centre pixel — if it's not transparent, walk a few
 *      sample positions until we find one that is.
 *   3. DFS flood fill (stack-based) marking visited transparent pixels.
 *   4. Track the bbox during the fill.
 *
 * Performance: for a 4 K × 3 K source, the fill visits up to ~12 M
 * pixels at most a few times each. With a stack-based DFS and a flat
 * Uint8Array visited mask this completes in a few hundred ms, runs once
 * per asset URL, and is cached for the rest of the session.
 */
function measureOpening(img: HTMLImageElement): FrameAsset['opening'] {
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (!w || !h) {
    return { x: 0, y: 0, w: w || 1, h: h || 1 }
  }

  const fallback = () => ({
    x: Math.round(w * 0.2),
    y: Math.round(h * 0.2),
    w: Math.round(w * 0.6),
    h: Math.round(h * 0.6),
  })

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return fallback()
  ctx.drawImage(img, 0, 0)
  let pixels: Uint8ClampedArray
  try {
    pixels = ctx.getImageData(0, 0, w, h).data
  } catch {
    return fallback()
  }

  const THRESHOLD = 128
  const isTransparent = (idx: number) => pixels[idx * 4 + 3] < THRESHOLD

  // Find a seed pixel reachable from inside the moulding. Centre first;
  // if that's opaque (centre row hits a vertical mat bar or similar),
  // step in 16 nudged positions across the central cross to find one
  // that's transparent.
  const midX = Math.floor(w / 2)
  const midY = Math.floor(h / 2)
  let seed = -1
  if (isTransparent(midY * w + midX)) {
    seed = midY * w + midX
  } else {
    const probeOffsets = [
      [0, 0], [1, 0], [-1, 0], [0, 1], [0, -1],
      [3, 0], [-3, 0], [0, 3], [0, -3],
      [5, 0], [-5, 0], [0, 5], [0, -5],
      [10, 0], [-10, 0], [0, 10], [0, -10],
    ] as const
    const stepX = Math.max(1, Math.floor(w / 40))
    const stepY = Math.max(1, Math.floor(h / 40))
    for (const [dx, dy] of probeOffsets) {
      const px = midX + dx * stepX
      const py = midY + dy * stepY
      if (px < 0 || py < 0 || px >= w || py >= h) continue
      const idx = py * w + px
      if (isTransparent(idx)) {
        seed = idx
        break
      }
    }
  }
  if (seed === -1) return fallback()

  // DFS flood fill from the seed. visited[] doubles as the bbox source —
  // we only record pixels we actually expand from.
  const visited = new Uint8Array(w * h)
  const stack: number[] = []
  stack.push(seed)
  visited[seed] = 1

  let minX = w
  let maxX = -1
  let minY = h
  let maxY = -1

  while (stack.length > 0) {
    const idx = stack.pop()!
    const x = idx % w
    const y = (idx - x) / w
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y

    // 4-connected neighbours.
    if (x > 0) {
      const ni = idx - 1
      if (!visited[ni] && isTransparent(ni)) {
        visited[ni] = 1
        stack.push(ni)
      }
    }
    if (x < w - 1) {
      const ni = idx + 1
      if (!visited[ni] && isTransparent(ni)) {
        visited[ni] = 1
        stack.push(ni)
      }
    }
    if (y > 0) {
      const ni = idx - w
      if (!visited[ni] && isTransparent(ni)) {
        visited[ni] = 1
        stack.push(ni)
      }
    }
    if (y < h - 1) {
      const ni = idx + w
      if (!visited[ni] && isTransparent(ni)) {
        visited[ni] = 1
        stack.push(ni)
      }
    }
  }

  if (maxX < 0) return fallback()
  const ow = maxX - minX + 1
  const oh = maxY - minY + 1
  if (ow < 4 || oh < 4) return fallback()
  return { x: minX, y: minY, w: ow, h: oh }
}

export function loadFrameAsset(url: string): Promise<FrameAsset> {
  const cached = loadCache.get(url)
  if (cached) return Promise.resolve(cached)
  const pending = pendingLoads.get(url)
  if (pending) return pending

  const promise: Promise<FrameAsset> = (async () => {
    const img = await loadImage(url)
    const opening = measureOpening(img)
    const result: FrameAsset = {
      img,
      opening,
      width: img.naturalWidth,
      height: img.naturalHeight,
    }
    loadCache.set(url, result)
    pendingLoads.delete(url)
    return result
  })()
  pendingLoads.set(url, promise)
  return promise
}

export function getCachedFrameAsset(url: string): FrameAsset | null {
  return loadCache.get(url) ?? null
}

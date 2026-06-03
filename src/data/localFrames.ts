import type { ApiFrame } from '@/types/api'

// ─── Piece paths shape ───────────────────────────────────────────────────────

// Generic shape that the registry uses for each frame's 8 piece URLs.
// API frames (registered at runtime by `apiSlice.mapCretixFrame`) and
// any future bundled frames both use this same shape.
export interface LocalFramePiecePaths {
  leftUp: string
  up: string
  rightUp: string
  left: string
  right: string
  leftDown: string
  down: string
  rightDown: string
}

// No bundled local frames — all frames are now served by the backend
// (`/cretix-api/frames/public`) and registered into the local-frame
// renderer at runtime by `apiSlice.mapCretixFrame`.
export const LOCAL_FRAMES: ApiFrame[] = []

// ─── Piece loading & geometry ─────────────────────────────────────────────────

export interface FramePieceImages {
  leftUp: HTMLImageElement
  up: HTMLImageElement
  rightUp: HTMLImageElement
  left: HTMLImageElement
  right: HTMLImageElement
  leftDown: HTMLImageElement
  down: HTMLImageElement
  rightDown: HTMLImageElement
}

// Moulding region within a source image, expressed in source pixels.
// Pixels OUTSIDE this box are treated as outer-side shadow padding —
// they get drawn extending past the visible frame edge.
export interface PieceBox {
  x: number
  y: number
  w: number
  h: number
}

export interface LocalFrameGeometry {
  // Moulding thickness for the TOP and BOTTOM sides (horizontal sticks +
  // the horizontal arm of each corner), in source pixels. Often equal to
  // verticalThicknessSrc, but for frames whose vertical sides export at
  // a different scale they can differ.
  horizontalThicknessSrc: number
  // Moulding thickness for the LEFT and RIGHT sides (vertical sticks +
  // the vertical arm of each corner), in source pixels.
  verticalThicknessSrc: number
  // Average corner-image bbox dimensions in source pixels. Used to
  // compute how far the corner extends inward in canvas pixels.
  cornerBboxW: number
  cornerBboxH: number
  pieces: {
    leftUp: PieceBox
    up: PieceBox
    rightUp: PieceBox
    left: PieceBox
    right: PieceBox
    leftDown: PieceBox
    down: PieceBox
    rightDown: PieceBox
  }
  // Corner-interior design style, auto-detected from alpha samples
  // inside each corner's L-bend triangle area:
  //   - 'clean-L'  → interior is genuinely transparent (frame-1 style);
  //                  the photo opening shows through the L's bend.
  //   - 'filled-L' → interior is opaque decorative moulding (frame-2
  //                  style); any stray transparent pixels (artifacts)
  //                  should be backfilled at composite time so the mat
  //                  backing doesn't bleed through as "dots".
  cornerStyle: 'clean-L' | 'filled-L'
  // CSS color string sampled from an opaque spot inside the L's arm.
  // Used as the destination-over fill for 'filled-L' frames so any
  // transparent holes inside a corner's bbox blend into the surrounding
  // moulding instead of revealing the white mat backing.
  cornerFillColor: string
}

export interface LoadedLocalFrame {
  images: FramePieceImages
  geometry: LocalFrameGeometry
}

// Registry maps each frame's id → its 8 piece file paths. Geometry is
// NOT stored here — it's auto-measured from the alpha channels of the
// piece images at load time and cached on the LoadedLocalFrame.
//
// The registry is populated entirely at runtime by
// `apiSlice.mapCretixFrame` calling `registerLocalFrame(id, paths)` for
// each backend frame returned from `/cretix-api/frames/public`. Every
// entry then goes through the same alpha-measured 8-piece renderer.
const REGISTRY: Record<number, { paths: LocalFramePiecePaths }> = {}

/**
 * Add (or replace) a frame in the registry at runtime. After registering,
 * call `loadLocalFrame(id)` to eagerly measure geometry and cache the
 * piece images so they're ready by the time the user picks the frame.
 */
export function registerLocalFrame(
  id: number,
  paths: LocalFramePiecePaths,
): void {
  REGISTRY[id] = { paths }
}

export function getLocalFrameGeometry(
  frameId: number,
): LocalFrameGeometry | null {
  return loadCache.get(frameId)?.geometry ?? null
}

/**
 * Returns the frame's "natural" moulding-thickness ratio — i.e. what
 * fraction of the assembled frame's outer dimension the moulding occupies
 * when the source pieces are tiled at native pixel size:
 *
 *   ratio = horizontalThicknessSrc /
 *           (leftCornerBboxW + topStickBboxW + rightCornerBboxW)
 *
 * Used to set a per-frame default for the `frameWidth` slider so the
 * editor's render matches what Photoshop produces when the same pieces are
 * placed at 1:1 scale. The user can still drag the slider to override.
 *
 * Returns null if the geometry isn't loaded yet.
 */
export function getNaturalFrameWidthPct(frameId: number): number | null {
  const geom = loadCache.get(frameId)?.geometry
  if (!geom) return null
  const naturalAssemblyW =
    geom.pieces.leftUp.w + geom.pieces.up.w + geom.pieces.rightUp.w
  if (naturalAssemblyW <= 0) return null
  return (geom.horizontalThicknessSrc / naturalAssemblyW) * 100
}

const loadCache = new Map<number, LoadedLocalFrame>()
const pendingLoads = new Map<number, Promise<LoadedLocalFrame>>()

export function isLocalFrame(frame: ApiFrame | null | undefined): boolean {
  return !!frame && frame.id in REGISTRY
}

export function getCachedLocalFrame(frameId: number): LoadedLocalFrame | null {
  return loadCache.get(frameId) ?? null
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    // Backend may return absolute URLs (http://localhost:8000/uploads/...).
    // Without crossOrigin the image loads but the canvas it's drawn to
    // becomes tainted, and `getImageData` throws — silently breaking the
    // auto-measure path. Setting it for any non-relative URL is harmless
    // when the response carries appropriate CORS headers (which our own
    // backend should), and is a no-op for same-origin URLs.
    if (/^https?:\/\//i.test(src)) {
      img.crossOrigin = 'anonymous'
    }
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load ${src}`))
    img.src = src
  })
}

// Reads the image's pixel data via a one-shot offscreen canvas. Returns
// null if the image can't be decoded (CORS, etc.).
function getAlphaData(img: HTMLImageElement): {
  data: Uint8ClampedArray
  w: number
  h: number
} | null {
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (!w || !h) return null
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(img, 0, 0)
  try {
    return { data: ctx.getImageData(0, 0, w, h).data, w, h }
  } catch {
    return null
  }
}

// Finds the rectangular bounding box of pixels with alpha above the
// threshold — i.e. where the moulding actually sits inside the source
// image (everything outside is transparent shadow padding).
function measureOpaqueBBox(
  img: HTMLImageElement,
  alphaThreshold = 30,
): PieceBox {
  const pixels = getAlphaData(img)
  if (!pixels) {
    return { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight }
  }
  const { data, w, h } = pixels
  let minX = w
  let maxX = -1
  let minY = h
  let maxY = -1
  for (let y = 0; y < h; y++) {
    const rowOffset = y * w * 4
    for (let x = 0; x < w; x++) {
      if (data[rowOffset + x * 4 + 3] > alphaThreshold) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return { x: 0, y: 0, w, h }
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

// For a corner piece, samples a column (or row) inside the "arm" portion
// of the L — well away from the L's bend — and walks toward the opposite
// edge to find the arm's thickness in source pixels. The corner has two
// arms (horizontal + vertical) that may have different thicknesses in
// asymmetric exports, so we measure each axis independently.
type CornerSlot = 'leftUp' | 'rightUp' | 'leftDown' | 'rightDown'
type Axis = 'horizontal' | 'vertical'
function measureCornerArmThickness(
  img: HTMLImageElement,
  bbox: PieceBox,
  slot: CornerSlot,
  axis: Axis,
  alphaThreshold = 30,
): number {
  const pixels = getAlphaData(img)
  if (!pixels) return axis === 'horizontal' ? bbox.h : bbox.w
  const { data, w } = pixels

  const bendOnLeftSide = slot === 'leftUp' || slot === 'leftDown'
  const isTopCorner = slot === 'leftUp' || slot === 'rightUp'

  if (axis === 'horizontal') {
    // Sample a column far from the L's bend so it's purely inside the
    // horizontal arm. Then scan toward the opposite edge to find where
    // the arm ends (= its thickness).
    const sampleX = bendOnLeftSide
      ? Math.floor(bbox.x + bbox.w * 0.85)
      : Math.floor(bbox.x + bbox.w * 0.15)
    if (isTopCorner) {
      for (let y = bbox.y + bbox.h - 1; y >= bbox.y; y--) {
        if (data[(y * w + sampleX) * 4 + 3] > alphaThreshold) {
          return y - bbox.y + 1
        }
      }
    } else {
      for (let y = bbox.y; y < bbox.y + bbox.h; y++) {
        if (data[(y * w + sampleX) * 4 + 3] > alphaThreshold) {
          return bbox.y + bbox.h - y
        }
      }
    }
    return bbox.h
  } else {
    // Vertical arm — sample a row far from the L's bend (which is on
    // the side of the horizontal arm) so we're purely inside the
    // vertical arm. Then scan toward the bbox's interior.
    const sampleY = isTopCorner
      ? Math.floor(bbox.y + bbox.h * 0.85)
      : Math.floor(bbox.y + bbox.h * 0.15)
    if (bendOnLeftSide) {
      // Vertical arm on LEFT side of bbox; scan rightward from the
      // right edge — first opaque is the arm's inner edge.
      for (let x = bbox.x + bbox.w - 1; x >= bbox.x; x--) {
        if (data[(sampleY * w + x) * 4 + 3] > alphaThreshold) {
          return x - bbox.x + 1
        }
      }
    } else {
      // Vertical arm on RIGHT side; scan leftward from the left edge.
      for (let x = bbox.x; x < bbox.x + bbox.w; x++) {
        if (data[(sampleY * w + x) * 4 + 3] > alphaThreshold) {
          return bbox.x + bbox.w - x
        }
      }
    }
    return bbox.w
  }
}

// Median is more robust than mean against the occasional outlier piece
// (e.g. an export quirk that adds 1–2px to one piece). The frame's true
// moulding thickness is whatever the majority of measurements agree on.
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const m = sorted.length >> 1
  return sorted.length % 2
    ? sorted[m]
    : (sorted[m - 1] + sorted[m]) / 2
}

// Samples a grid of points inside the L's interior triangle area (the
// region BEYOND both arms of the L) and returns the fraction that are
// opaque. Used to classify the corner's design:
//   - low ratio  → clean-L (interior is genuinely transparent — photo
//                  opening shows through; frame-1 style)
//   - high ratio → filled-L (interior is decorative moulding with the
//                  occasional transparent hole; frame-2 style)
function measureLInteriorOpacityRatio(
  img: HTMLImageElement,
  bbox: PieceBox,
  slot: CornerSlot,
  armHorizontal: number,
  armVertical: number,
  alphaThreshold = 30,
): number {
  const pixels = getAlphaData(img)
  if (!pixels) return 0
  const { data, w } = pixels

  // Compute the L-interior rectangle in source coords. For each corner,
  // the interior is on the side opposite the L's outer corner.
  const bendOnLeftSide = slot === 'leftUp' || slot === 'leftDown'
  const isTopCorner = slot === 'leftUp' || slot === 'rightUp'
  const intX = bendOnLeftSide ? bbox.x + armVertical : bbox.x
  const intY = isTopCorner ? bbox.y + armHorizontal : bbox.y
  const intW = bbox.w - armVertical
  const intH = bbox.h - armHorizontal
  if (intW <= 1 || intH <= 1) return 0

  // 8×8 sample grid covering the interior rectangle, biased toward the
  // outer (visible) corners of the interior — that's where artifact
  // pixels tend to sit, and it's where the user will most readily
  // notice an unintended hole.
  const N = 8
  let opaque = 0
  let total = 0
  for (let iy = 0; iy < N; iy++) {
    const sy = Math.floor(intY + ((iy + 0.5) / N) * intH)
    for (let ix = 0; ix < N; ix++) {
      const sx = Math.floor(intX + ((ix + 0.5) / N) * intW)
      if (data[(sy * w + sx) * 4 + 3] > alphaThreshold) opaque++
      total++
    }
  }
  return total > 0 ? opaque / total : 0
}

// Averages opaque-pixel color across a piece image. Used to derive a
// single moulding color for the whole frame — sticks are the easiest
// source since their entire bbox is solid moulding, and we fall through
// pieces in order until one sample yields enough opaque samples.
function sampleAvgOpaqueColor(img: HTMLImageElement): string | null {
  const pixels = getAlphaData(img)
  if (!pixels) return null
  const { data, w, h } = pixels
  // 16×16 grid covering the whole image — biased away from the very
  // edges where anti-aliasing can fade pixels below the alpha cutoff.
  const N = 16
  const inset = 0.06 // skip outer 6% on each side
  let rSum = 0, gSum = 0, bSum = 0, count = 0
  for (let iy = 0; iy < N; iy++) {
    const sy = Math.floor((inset + ((iy + 0.5) / N) * (1 - 2 * inset)) * h)
    for (let ix = 0; ix < N; ix++) {
      const sx = Math.floor((inset + ((ix + 0.5) / N) * (1 - 2 * inset)) * w)
      const i = (sy * w + sx) * 4
      if (data[i + 3] > 200) {
        rSum += data[i]
        gSum += data[i + 1]
        bSum += data[i + 2]
        count++
      }
    }
  }
  if (count < 8) return null
  const r = Math.round(rSum / count)
  const g = Math.round(gSum / count)
  const b = Math.round(bSum / count)
  return `rgb(${r}, ${g}, ${b})`
}

// Picks a single moulding color for the whole frame. Sticks first
// (their bbox is just the moulding rectangle, so sampling is robust),
// then corners. Falls back to a mid-gray so the result is never
// invisible against the white mat backing.
function sampleFrameMouldingColor(images: FramePieceImages): string {
  const order: HTMLImageElement[] = [
    images.up,
    images.down,
    images.left,
    images.right,
    images.leftUp,
    images.rightUp,
    images.leftDown,
    images.rightDown,
  ]
  for (const img of order) {
    const c = sampleAvgOpaqueColor(img)
    if (c) return c
  }
  // Visible mid-gray fallback — never `#ffffff`, which would be a no-op
  // against the white mat backing.
  return '#888888'
}

function deriveGeometry(images: FramePieceImages): LocalFrameGeometry {
  const leftUpBox = measureOpaqueBBox(images.leftUp)
  const upBox = measureOpaqueBBox(images.up)
  const rightUpBox = measureOpaqueBBox(images.rightUp)
  const leftBox = measureOpaqueBBox(images.left)
  const rightBox = measureOpaqueBBox(images.right)
  const leftDownBox = measureOpaqueBBox(images.leftDown)
  const downBox = measureOpaqueBBox(images.down)
  const rightDownBox = measureOpaqueBBox(images.rightDown)

  // Per-corner arm thicknesses — used for both the global thickness
  // medians AND for slot-aware interior sampling below.
  const leftUpArmH    = measureCornerArmThickness(images.leftUp,    leftUpBox,    'leftUp',    'horizontal')
  const rightUpArmH   = measureCornerArmThickness(images.rightUp,   rightUpBox,   'rightUp',   'horizontal')
  const leftDownArmH  = measureCornerArmThickness(images.leftDown,  leftDownBox,  'leftDown',  'horizontal')
  const rightDownArmH = measureCornerArmThickness(images.rightDown, rightDownBox, 'rightDown', 'horizontal')
  const leftUpArmV    = measureCornerArmThickness(images.leftUp,    leftUpBox,    'leftUp',    'vertical')
  const rightUpArmV   = measureCornerArmThickness(images.rightUp,   rightUpBox,   'rightUp',   'vertical')
  const leftDownArmV  = measureCornerArmThickness(images.leftDown,  leftDownBox,  'leftDown',  'vertical')
  const rightDownArmV = measureCornerArmThickness(images.rightDown, rightDownBox, 'rightDown', 'vertical')

  // Horizontal moulding thickness — sources of truth: top/bottom
  // corner-horizontal-arm thicknesses + top/bottom stick bbox heights.
  const horizontalSamples = [
    leftUpArmH, rightUpArmH, leftDownArmH, rightDownArmH,
    upBox.h,
    downBox.h,
  ]
  // Vertical moulding thickness — sources of truth: corner-vertical-arm
  // thicknesses + left/right stick bbox widths.
  const verticalSamples = [
    leftUpArmV, rightUpArmV, leftDownArmV, rightDownArmV,
    leftBox.w,
    rightBox.w,
  ]
  const horizontalThicknessSrc = Math.round(median(horizontalSamples))
  const verticalThicknessSrc   = Math.round(median(verticalSamples))

  // Average corner bbox dimensions — used to size each corner's canvas
  // footprint per axis.
  const cornerBboxW = Math.round(
    (leftUpBox.w + rightUpBox.w + leftDownBox.w + rightDownBox.w) / 4,
  )
  const cornerBboxH = Math.round(
    (leftUpBox.h + rightUpBox.h + leftDownBox.h + rightDownBox.h) / 4,
  )

  // Classify corner style: are the L-interiors transparent (clean) or
  // mostly opaque (filled-with-decorative-moulding)?
  const interiorRatios = [
    measureLInteriorOpacityRatio(images.leftUp,    leftUpBox,    'leftUp',    leftUpArmH,    leftUpArmV),
    measureLInteriorOpacityRatio(images.rightUp,   rightUpBox,   'rightUp',   rightUpArmH,   rightUpArmV),
    measureLInteriorOpacityRatio(images.leftDown,  leftDownBox,  'leftDown',  leftDownArmH,  leftDownArmV),
    measureLInteriorOpacityRatio(images.rightDown, rightDownBox, 'rightDown', rightDownArmH, rightDownArmV),
  ]
  const avgInteriorRatio = interiorRatios.reduce((a, b) => a + b, 0) / 4
  // Threshold: 0.4 catches frames whose L-interior is dominantly opaque
  // (decorative moulding) while leaving the clean-L design (interior is
  // almost entirely transparent → ratio ≈ 0) safely untouched. The
  // middle ground (40–60% opaque) is rare in practice; treating it as
  // filled-L is the safer choice because the destination-over fill is a
  // no-op on already-opaque regions.
  const cornerStyle: 'clean-L' | 'filled-L' =
    avgInteriorRatio > 0.4 ? 'filled-L' : 'clean-L'

  // eslint-disable-next-line no-console
  console.log(
    `[deriveGeometry] cornerStyle=${cornerStyle} (avg L-interior opacity ` +
      `${(avgInteriorRatio * 100).toFixed(1)}%) per-corner=[${interiorRatios
        .map(r => (r * 100).toFixed(0) + '%')
        .join(', ')}]`,
  )

  // One moulding color for the whole frame. Sampled from sticks first
  // (whose bbox is just the moulding strip — most reliable), falling
  // through to corners. Computed unconditionally so it's available
  // whether or not the corner-style classifier triggers the fill.
  const cornerFillColor = sampleFrameMouldingColor(images)

  return {
    horizontalThicknessSrc,
    verticalThicknessSrc,
    cornerBboxW,
    cornerBboxH,
    cornerStyle,
    cornerFillColor,
    pieces: {
      leftUp: leftUpBox,
      up: upBox,
      rightUp: rightUpBox,
      left: leftBox,
      right: rightBox,
      leftDown: leftDownBox,
      down: downBox,
      rightDown: rightDownBox,
    },
  }
}

export function loadLocalFrame(frameId: number): Promise<LoadedLocalFrame> | null {
  const cached = loadCache.get(frameId)
  if (cached) return Promise.resolve(cached)
  const pending = pendingLoads.get(frameId)
  if (pending) return pending
  const entry = REGISTRY[frameId]
  if (!entry) return null
  const { paths } = entry

  const promise: Promise<LoadedLocalFrame> = (async () => {
    const [leftUp, up, rightUp, left, right, leftDown, down, rightDown] = await Promise.all([
      loadImage(paths.leftUp),
      loadImage(paths.up),
      loadImage(paths.rightUp),
      loadImage(paths.left),
      loadImage(paths.right),
      loadImage(paths.leftDown),
      loadImage(paths.down),
      loadImage(paths.rightDown),
    ])
    const images: FramePieceImages = {
      leftUp, up, rightUp, left, right, leftDown, down, rightDown,
    }
    const geometry = deriveGeometry(images)
    const result: LoadedLocalFrame = { images, geometry }
    loadCache.set(frameId, result)
    pendingLoads.delete(frameId)
    // eslint-disable-next-line no-console
    console.log(
      `[LocalFrame ${frameId}] auto-measured`,
      JSON.stringify(
        {
          horizontalThicknessSrc: geometry.horizontalThicknessSrc,
          verticalThicknessSrc: geometry.verticalThicknessSrc,
          cornerBboxW: geometry.cornerBboxW,
          cornerBboxH: geometry.cornerBboxH,
          cornerStyle: geometry.cornerStyle,
          cornerFillColor: geometry.cornerFillColor,
          pieces: geometry.pieces,
        },
        null,
        2,
      ),
    )
    return result
  })()
  pendingLoads.set(frameId, promise)
  return promise
}

// No static preload — `apiSlice.mapCretixFrame` calls `loadLocalFrame`
// itself for every API frame as soon as the list is fetched, so pieces
// are typically measured before the user opens the frames sidebar.

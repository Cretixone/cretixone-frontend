import type { ApiFrame } from '@/types/api'

// ─── Asset paths ──────────────────────────────────────────────────────────────

// Generic shape so multiple frames can share the registry type.
interface LocalFramePiecePaths {
  leftUp: string
  up: string
  rightUp: string
  left: string
  right: string
  leftDown: string
  down: string
  rightDown: string
}

const FRAME_1_DIR = '/frames/frame-1'

const LOCAL_FRAME_1_PIECES: LocalFramePiecePaths = {
  leftUp:    `${FRAME_1_DIR}/Left-Top.png`,
  up:        `${FRAME_1_DIR}/Top-Stick.png`,
  rightUp:   `${FRAME_1_DIR}/Right-Top.png`,
  left:      `${FRAME_1_DIR}/left-Stick.png`,
  right:     `${FRAME_1_DIR}/Right-Stick.png`,
  leftDown:  `${FRAME_1_DIR}/Bottom-Left.png`,
  down:      `${FRAME_1_DIR}/Bottom-Stick.png`,
  rightDown: `${FRAME_1_DIR}/Bottom-Right.png`,
}

const FRAME_2_DIR = '/frames/frame-2'

const LOCAL_FRAME_2_PIECES: LocalFramePiecePaths = {
  leftUp:    `${FRAME_2_DIR}/top-left.png`,
  up:        `${FRAME_2_DIR}/top-stick.png`,
  rightUp:   `${FRAME_2_DIR}/top-right.png`,
  left:      `${FRAME_2_DIR}/left-stick.png`,
  right:     `${FRAME_2_DIR}/right-stick.png`,
  leftDown:  `${FRAME_2_DIR}/bottom-left.png`,
  down:      `${FRAME_2_DIR}/bottom-stick.png`,
  rightDown: `${FRAME_2_DIR}/bottom-right.png`,
}

// ─── ApiFrame stub ────────────────────────────────────────────────────────────
// urlPrefix='/' so CanvasStage's `prefix + url` resolves to absolute paths
// like "/frames/frame-1/Left-Top.png" for the (fallback) 8-sprite path.

export const LOCAL_FRAME_1: ApiFrame = {
  urlPrefix: '/',
  id: -1001,
  type: 0,
  isVip: false,
  isSuper: false,
  leftUpWidth: 0, leftUpHeight: 0, leftUpImg: LOCAL_FRAME_1_PIECES.leftUp.slice(1),
  upShadowHeight: 0, upHeight: 0, upImg: LOCAL_FRAME_1_PIECES.up.slice(1),
  rightUpWidth: 0, rightUpHeight: 0, rightUpImg: LOCAL_FRAME_1_PIECES.rightUp.slice(1),
  rightWidth: 0, rightShadowWidth: 0, rightNeiShadowWidth: 0,
  rightImg: LOCAL_FRAME_1_PIECES.right.slice(1),
  rightDownWidth: 0, rightDownHeight: 0,
  rightDownImg: LOCAL_FRAME_1_PIECES.rightDown.slice(1),
  downHeight: 0, downShadowHeight: 0, downNeiShadowHeight: 0,
  downImg: LOCAL_FRAME_1_PIECES.down.slice(1),
  leftDownWidth: 0, leftDownHeight: 0,
  leftDownImg: LOCAL_FRAME_1_PIECES.leftDown.slice(1),
  leftWidth: 0, leftShadowWidth: 0,
  leftImg: LOCAL_FRAME_1_PIECES.left.slice(1),
  roundBorder: null,
  imgUrl: LOCAL_FRAME_1_PIECES.leftUp, // simple corner thumbnail
  isScroll: 0,
  round: null,
  rightId: 0,
  supportFormat: 0,
  supportShadow: true,
  supportInnerShadow: false,
  leftUpRoundParam: 0, rightUpRoundParam: 0,
  rightDownRoundParam: 0, leftDownRoundParam: 0,
  colorLevel: 0, colorListOrder: 0,
  isNew: true,
  isOtherFrame: false,
  otherFrameInfoDTO: null,
  frameWidth: 0,
  horizontalAxis: 0,
  supportSideView: false,
  sideViewMethod: 0,
  topSideImg: null, middleSideImg: null, bottomSideImg: null,
  frontFrameId: 0, sideFrameId: 0,
  frameShadowPreset: 0, frameShadowOpacity: 0,
  supportPaper: true,
  frameShadowImgInfoList: null,
  supportPutShadow: false,
  accessoryInfoList: [],
}

export const LOCAL_FRAME_2: ApiFrame = {
  urlPrefix: '/',
  id: -1002,
  type: 0,
  isVip: false,
  isSuper: false,
  leftUpWidth: 0, leftUpHeight: 0, leftUpImg: LOCAL_FRAME_2_PIECES.leftUp.slice(1),
  upShadowHeight: 0, upHeight: 0, upImg: LOCAL_FRAME_2_PIECES.up.slice(1),
  rightUpWidth: 0, rightUpHeight: 0, rightUpImg: LOCAL_FRAME_2_PIECES.rightUp.slice(1),
  rightWidth: 0, rightShadowWidth: 0, rightNeiShadowWidth: 0,
  rightImg: LOCAL_FRAME_2_PIECES.right.slice(1),
  rightDownWidth: 0, rightDownHeight: 0,
  rightDownImg: LOCAL_FRAME_2_PIECES.rightDown.slice(1),
  downHeight: 0, downShadowHeight: 0, downNeiShadowHeight: 0,
  downImg: LOCAL_FRAME_2_PIECES.down.slice(1),
  leftDownWidth: 0, leftDownHeight: 0,
  leftDownImg: LOCAL_FRAME_2_PIECES.leftDown.slice(1),
  leftWidth: 0, leftShadowWidth: 0,
  leftImg: LOCAL_FRAME_2_PIECES.left.slice(1),
  roundBorder: null,
  imgUrl: LOCAL_FRAME_2_PIECES.leftUp,
  isScroll: 0,
  round: null,
  rightId: 0,
  supportFormat: 0,
  supportShadow: true,
  supportInnerShadow: false,
  leftUpRoundParam: 0, rightUpRoundParam: 0,
  rightDownRoundParam: 0, leftDownRoundParam: 0,
  colorLevel: 0, colorListOrder: 0,
  isNew: true,
  isOtherFrame: false,
  otherFrameInfoDTO: null,
  frameWidth: 0,
  horizontalAxis: 0,
  supportSideView: false,
  sideViewMethod: 0,
  topSideImg: null, middleSideImg: null, bottomSideImg: null,
  frontFrameId: 0, sideFrameId: 0,
  frameShadowPreset: 0, frameShadowOpacity: 0,
  supportPaper: true,
  frameShadowImgInfoList: null,
  supportPutShadow: false,
  accessoryInfoList: [],
}

export const LOCAL_FRAMES: ApiFrame[] = [LOCAL_FRAME_1, LOCAL_FRAME_2]

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
}

export interface LoadedLocalFrame {
  images: FramePieceImages
  geometry: LocalFrameGeometry
}

// Registry maps each frame's id → its 8 piece file paths. Geometry is
// NOT stored here — it's auto-measured from the alpha channels of the
// piece images at load time and cached on the LoadedLocalFrame.
//
// Two ways to populate the registry:
//
//   1. Bundled local frames — declared statically below. Drop the 8 piece
//      PNGs into /public/frames/frame-N/ and add an entry here.
//
//   2. Backend (admin-uploaded) frames — call `registerLocalFrame(id, paths)`
//      with the hashed numeric id and the eight `/uploads/frames/...` URLs.
//      `apiSlice.mapCretixFrame` does this when transforming the DTO so the
//      rendered output reuses the same alpha-measured 8-piece path as the
//      bundled frames.
const REGISTRY: Record<number, { paths: LocalFramePiecePaths }> = {
  [LOCAL_FRAME_1.id]: { paths: LOCAL_FRAME_1_PIECES },
  [LOCAL_FRAME_2.id]: { paths: LOCAL_FRAME_2_PIECES },
}

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

function deriveGeometry(images: FramePieceImages): LocalFrameGeometry {
  const leftUpBox = measureOpaqueBBox(images.leftUp)
  const upBox = measureOpaqueBBox(images.up)
  const rightUpBox = measureOpaqueBBox(images.rightUp)
  const leftBox = measureOpaqueBBox(images.left)
  const rightBox = measureOpaqueBBox(images.right)
  const leftDownBox = measureOpaqueBBox(images.leftDown)
  const downBox = measureOpaqueBBox(images.down)
  const rightDownBox = measureOpaqueBBox(images.rightDown)

  // Horizontal moulding thickness — sources of truth: top/bottom
  // corner-horizontal-arm thicknesses + top/bottom stick bbox heights.
  const horizontalSamples = [
    measureCornerArmThickness(images.leftUp,    leftUpBox,    'leftUp',    'horizontal'),
    measureCornerArmThickness(images.rightUp,   rightUpBox,   'rightUp',   'horizontal'),
    measureCornerArmThickness(images.leftDown,  leftDownBox,  'leftDown',  'horizontal'),
    measureCornerArmThickness(images.rightDown, rightDownBox, 'rightDown', 'horizontal'),
    upBox.h,
    downBox.h,
  ]
  // Vertical moulding thickness — sources of truth: corner-vertical-arm
  // thicknesses + left/right stick bbox widths.
  const verticalSamples = [
    measureCornerArmThickness(images.leftUp,    leftUpBox,    'leftUp',    'vertical'),
    measureCornerArmThickness(images.rightUp,   rightUpBox,   'rightUp',   'vertical'),
    measureCornerArmThickness(images.leftDown,  leftDownBox,  'leftDown',  'vertical'),
    measureCornerArmThickness(images.rightDown, rightDownBox, 'rightDown', 'vertical'),
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

  return {
    horizontalThicknessSrc,
    verticalThicknessSrc,
    cornerBboxW,
    cornerBboxH,
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

// Eagerly preload so pieces are ready by the time the user clicks the frame.
if (typeof window !== 'undefined') {
  for (const f of LOCAL_FRAMES) void loadLocalFrame(f.id)
}

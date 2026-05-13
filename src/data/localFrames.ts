import type { ApiFrame } from '@/types/api'

// ─── Asset paths ──────────────────────────────────────────────────────────────

const FRAME_1_DIR = '/frames/frame-1'

const LOCAL_FRAME_1_PIECES = {
  leftUp:    `${FRAME_1_DIR}/Left-Top.png`,
  up:        `${FRAME_1_DIR}/Top-Stick.png`,
  rightUp:   `${FRAME_1_DIR}/Right-Top.png`,
  left:      `${FRAME_1_DIR}/left-Stick.png`,
  right:     `${FRAME_1_DIR}/Right-Stick.png`,
  leftDown:  `${FRAME_1_DIR}/Bottom-Left.png`,
  down:      `${FRAME_1_DIR}/Bottom-Stick.png`,
  rightDown: `${FRAME_1_DIR}/Bottom-Right.png`,
} as const

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

export const LOCAL_FRAMES: ApiFrame[] = [LOCAL_FRAME_1]

// ─── Piece loading & ratio measurement ────────────────────────────────────────

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

export interface LoadedLocalFrame {
  images: FramePieceImages
  cornerInsetRatio: number
}

const REGISTRY: Record<number, typeof LOCAL_FRAME_1_PIECES> = {
  [LOCAL_FRAME_1.id]: LOCAL_FRAME_1_PIECES,
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

// Scans the top-left corner image's right-arm column from the bottom up,
// returning the fraction of image height where the moulding's inner edge
// sits. The L's outer portion is opaque; the inner area is transparent.
function measureCornerInsetRatio(img: HTMLImageElement): number {
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (!w || !h) return 1
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) return 1
  ctx.drawImage(img, 0, 0)
  let data: Uint8ClampedArray
  try {
    data = ctx.getImageData(0, 0, w, h).data
  } catch {
    return 1
  }
  const x = Math.floor(w * 0.8)
  for (let y = h - 1; y >= 0; y--) {
    const alpha = data[(y * w + x) * 4 + 3]
    if (alpha > 200) return (y + 1) / h
  }
  return 1
}

export function loadLocalFrame(frameId: number): Promise<LoadedLocalFrame> | null {
  const cached = loadCache.get(frameId)
  if (cached) return Promise.resolve(cached)
  const pending = pendingLoads.get(frameId)
  if (pending) return pending
  const paths = REGISTRY[frameId]
  if (!paths) return null

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
    const cornerInsetRatio = measureCornerInsetRatio(leftUp)
    const result: LoadedLocalFrame = {
      images: { leftUp, up, rightUp, left, right, leftDown, down, rightDown },
      cornerInsetRatio,
    }
    loadCache.set(frameId, result)
    pendingLoads.delete(frameId)
    // eslint-disable-next-line no-console
    console.log(
      `[LocalFrame ${frameId}] loaded; cornerInsetRatio=${cornerInsetRatio.toFixed(4)}`,
    )
    return result
  })()
  pendingLoads.set(frameId, promise)
  return promise
}

// Eagerly preload so pieces are ready by the time the user clicks the frame.
if (typeof window !== 'undefined') {
  void loadLocalFrame(LOCAL_FRAME_1.id)
}

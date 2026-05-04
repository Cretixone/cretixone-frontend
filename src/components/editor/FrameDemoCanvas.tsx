import { useEffect, useRef, useCallback } from 'react'
import * as PIXI from 'pixi.js'

const CORNER_URL = '/demo-corner.png'
const STICK_URL = '/demo-stick.png'

// Visible moulding thickness as a fraction of the outer frame size.
const MOULDING_RATIO = 0.15

// When true, the strip used for sticks is sliced from the corner image's
// pure top-arm region (past the mitre joint). Source pixels match the
// corner exactly. Set to false to use the standalone /demo-stick.png file.
const DERIVE_STICK_FROM_CORNER = false

type Rot = 0 | 90 | 180 | 270

function loadHTMLImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load ${src}`))
    img.src = src
  })
}

// Bakes the source image rotated by exactly 0/90/180/270° onto a new canvas.
// Uses setTransform with integer-only matrices — no cos/sin floating-point
// drift. Subsequent drawImage calls of these canvases need no further
// rotation, eliminating per-corner sub-pixel sampling differences.
function preRotate(
  img: HTMLImageElement | HTMLCanvasElement,
  rotation: Rot,
): HTMLCanvasElement {
  const w = img instanceof HTMLImageElement ? img.naturalWidth : img.width
  const h = img instanceof HTMLImageElement ? img.naturalHeight : img.height
  const swap = rotation === 90 || rotation === 270

  const canvas = document.createElement('canvas')
  canvas.width = swap ? h : w
  canvas.height = swap ? w : h

  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  switch (rotation) {
    case 0:
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      break
    case 90: // CW: local x → +canvas y, local y → -canvas x. Origin at (h, 0).
      ctx.setTransform(0, 1, -1, 0, h, 0)
      break
    case 180:
      ctx.setTransform(-1, 0, 0, -1, w, h)
      break
    case 270: // CCW (= 90 CW × 3)
      ctx.setTransform(0, -1, 1, 0, 0, w)
      break
  }
  ctx.drawImage(img, 0, 0)
  return canvas
}

// Scans up the inner-cutout column of the corner image and returns the
// fraction of image height where the moulding's inner edge sits. Robust to
// AA softness on the outer top edge by scanning bottom-up.
function measureCornerFrameRatio(img: HTMLImageElement): number {
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (!w || !h) return 0.5

  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) return 0.5
  ctx.drawImage(img, 0, 0)

  let data: Uint8ClampedArray
  try {
    data = ctx.getImageData(0, 0, w, h).data
  } catch {
    return 0.5
  }

  const x = Math.floor(w * 0.8)
  for (let y = h - 1; y >= 0; y--) {
    const alpha = data[(y * w + x) * 4 + 3]
    if (alpha > 200) return (y + 1) / h
  }
  return 0.5
}

interface RotSet {
  0: HTMLCanvasElement
  90: HTMLCanvasElement
  180: HTMLCanvasElement
  270: HTMLCanvasElement
}

// Builds the entire frame on a single offscreen canvas. Uses pre-rotated
// source canvases and zero canvas-level rotation, so each piece is sampled
// through the same straight bilinear path — no rotation drift between
// corners or between sticks.
function buildFrameCanvas(
  cornerRot: RotSet,
  stickRot: RotSet,
  outerSize: number,
  cornerFrameRatio: number,
  dpr: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  const px = Math.max(1, Math.ceil(outerSize * dpr))
  canvas.width = px
  canvas.height = px

  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.scale(dpr, dpr)

  const T = outerSize * MOULDING_RATIO
  const cornerSize = T / cornerFrameRatio
  const sideH = outerSize - 2 * cornerSize

  // 1. Photo backing — fills the inner opening (inside the moulding edge)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(T, T, outerSize - 2 * T, outerSize - 2 * T)

  // 2. Sticks. Each side uses its pre-rotated stick canvas, drawn flat.
  //    Top: stick natural orientation, drawn (sideH × T) starting at (cornerSize, 0)
  ctx.drawImage(stickRot[0], cornerSize, 0, sideH, T)
  //    Right: 90° pre-rotated, drawn (T × sideH) at (outerSize - T, cornerSize)
  ctx.drawImage(stickRot[90], outerSize - T, cornerSize, T, sideH)
  //    Bottom: 180° pre-rotated, drawn (sideH × T) at (cornerSize, outerSize - T)
  ctx.drawImage(stickRot[180], cornerSize, outerSize - T, sideH, T)
  //    Left: 270° pre-rotated, drawn (T × sideH) at (0, cornerSize)
  ctx.drawImage(stickRot[270], 0, cornerSize, T, sideH)

  // 3. Corners. Same approach — pre-rotated, drawn flat at cornerSize²
  ctx.drawImage(cornerRot[0], 0, 0, cornerSize, cornerSize)
  ctx.drawImage(
    cornerRot[90],
    outerSize - cornerSize, 0,
    cornerSize, cornerSize,
  )
  ctx.drawImage(
    cornerRot[180],
    outerSize - cornerSize, outerSize - cornerSize,
    cornerSize, cornerSize,
  )
  ctx.drawImage(
    cornerRot[270],
    0, outerSize - cornerSize,
    cornerSize, cornerSize,
  )

  return canvas
}

interface Layers {
  bgG: PIXI.Graphics
  frameSprite: PIXI.Sprite | null
}

interface FrameSources {
  cornerRot: RotSet
  stickRot: RotSet
  ratio: number
  cornerNatural: { w: number; h: number }
  stickNatural: { w: number; h: number }
}

export default function FrameDemoCanvas() {
  const mountRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const layersRef = useRef<Layers | null>(null)
  const sourcesRef = useRef<FrameSources | null>(null)
  const lastBuiltSizeRef = useRef<number>(0)

  const render = useCallback(() => {
    const app = appRef.current
    const L = layersRef.current
    const sources = sourcesRef.current
    if (!app || !L) return

    const W = app.screen.width
    const H = app.screen.height
    if (W < 10 || H < 10) return

    L.bgG.clear()
    L.bgG.rect(0, 0, W, H).fill({ color: 0x1a1a2e })

    if (!sources) return

    const outerSize = Math.max(Math.min(W * 0.55, H * 0.65), 280)
    const frameX = (W - outerSize) / 2
    const frameY = (H - outerSize) / 2

    // Rebuild when there's no sprite (fresh app after HMR) OR when the
    // outerSize has shifted enough to matter. Without the !L.frameSprite
    // check, Vite Fast Refresh would leave the new stage empty because the
    // outerSize hasn't changed since the last build.
    const needsRebuild =
      !L.frameSprite || Math.abs(outerSize - lastBuiltSizeRef.current) > 0.5

    if (needsRebuild) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const built = buildFrameCanvas(
        sources.cornerRot,
        sources.stickRot,
        outerSize,
        sources.ratio,
        dpr,
      )
      const tex = PIXI.Texture.from(built)
      tex.source.scaleMode = 'linear'
      if (L.frameSprite) {
        L.frameSprite.texture?.destroy(true)
        L.frameSprite.destroy()
      }
      const sp = new PIXI.Sprite(tex)
      sp.width = outerSize
      sp.height = outerSize
      app.stage.addChild(sp)
      L.frameSprite = sp
      lastBuiltSizeRef.current = outerSize
    }

    if (L.frameSprite) {
      L.frameSprite.x = frameX
      L.frameSprite.y = frameY
    }
  }, [])

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    let cancelled = false
    const app = new PIXI.Application()

    const boot = async () => {
      // Reset the rebuild cache so a fresh PIXI app (e.g. after HMR) gets
      // a freshly built and attached frame sprite.
      lastBuiltSizeRef.current = 0

      await app.init({
        resizeTo: container,
        backgroundColor: 0x1a1a2e,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
      })
      if (cancelled) {
        app.destroy(true, { children: true, texture: true })
        return
      }

      appRef.current = app
      container.appendChild(app.canvas)
      ;(app.canvas as HTMLCanvasElement).style.cssText =
        'display:block;width:100%;height:100%'

      const bgG = new PIXI.Graphics()
      app.stage.addChild(bgG)
      layersRef.current = { bgG, frameSprite: null }

      // If sources are already prepared (e.g. HMR survived the refs), skip
      // the load+pre-rotate work and just render.
      if (sourcesRef.current) {
        render()
        return
      }

      const [cornerImg, stickImgRaw] = await Promise.all([
        loadHTMLImage(CORNER_URL).catch(() => null),
        loadHTMLImage(STICK_URL).catch(() => null),
      ])
      if (cancelled) return
      if (!cornerImg) {
        console.error(
          '[FrameDemo] corner image failed to load. Save it at public/demo-corner.png',
        )
        return
      }

      const ratio = measureCornerFrameRatio(cornerImg)

      // Choose the stick source. Default (DERIVE_STICK_FROM_CORNER=true)
      // slices the corner's pure top-arm region for guaranteed pixel match.
      let stickSource: HTMLImageElement | HTMLCanvasElement | null = stickImgRaw
      if (DERIVE_STICK_FROM_CORNER && ratio > 0.05 && ratio < 0.95) {
        const sw = cornerImg.naturalWidth
        const sh = cornerImg.naturalHeight
        const stripX = Math.ceil(ratio * sw + 4)
        const stripW = sw - stripX
        const stripH = Math.ceil(ratio * sh)
        if (stripW > 16 && stripH > 16) {
          const c = document.createElement('canvas')
          c.width = stripW
          c.height = stripH
          const cctx = c.getContext('2d')
          if (cctx) {
            cctx.drawImage(cornerImg, stripX, 0, stripW, stripH, 0, 0, stripW, stripH)
            stickSource = c
          }
        }
      }
      if (!stickSource) {
        console.error(
          '[FrameDemo] stick image failed to load. Save it at public/demo-stick.png',
        )
        return
      }

      const cornerRot: RotSet = {
        0: preRotate(cornerImg, 0),
        90: preRotate(cornerImg, 90),
        180: preRotate(cornerImg, 180),
        270: preRotate(cornerImg, 270),
      }
      const stickRot: RotSet = {
        0: preRotate(stickSource, 0),
        90: preRotate(stickSource, 90),
        180: preRotate(stickSource, 180),
        270: preRotate(stickSource, 270),
      }

      sourcesRef.current = {
        cornerRot,
        stickRot,
        ratio,
        cornerNatural: { w: cornerImg.naturalWidth, h: cornerImg.naturalHeight },
        stickNatural: {
          w: stickSource instanceof HTMLImageElement ? stickSource.naturalWidth : stickSource.width,
          h: stickSource instanceof HTMLImageElement ? stickSource.naturalHeight : stickSource.height,
        },
      }
      // eslint-disable-next-line no-console
      console.log(
        `[FrameDemo] corner=${sourcesRef.current.cornerNatural.w}x${sourcesRef.current.cornerNatural.h}, ` +
          `stick=${sourcesRef.current.stickNatural.w}x${sourcesRef.current.stickNatural.h}, ` +
          `ratio=${ratio.toFixed(4)}, ` +
          `derivedStick=${DERIVE_STICK_FROM_CORNER && stickSource !== stickImgRaw}`,
      )
      render()
    }

    boot()

    return () => {
      cancelled = true
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true })
      }
      appRef.current = null
      layersRef.current = null
      // Keep sourcesRef so HMR re-uses the pre-rotated canvases.
      // Reset the size cache so the next boot rebuilds the frame sprite.
      lastBuiltSizeRef.current = 0
    }
  }, [render])

  useEffect(() => {
    const onResize = () => requestAnimationFrame(render)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [render])

  return (
    <div ref={mountRef} className="relative w-full h-full">
      <div className="absolute inset-x-0 bottom-5 flex justify-center pointer-events-none">
        <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 text-xs text-gray-400">
          Frame Demo · single-canvas composite (pre-rotated)
        </div>
      </div>
    </div>
  )
}

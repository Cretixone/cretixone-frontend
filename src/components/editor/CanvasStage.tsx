import { useEffect, useLayoutEffect, useRef, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as PIXI from 'pixi.js'
import {
  useEditorStore,
  OSS_PREFIX,
  getAspectRatioValue,
  A4_LONG_CM,
  A4_SHORT_CM,
} from '@/store/editorStore'
import type { ApiFrame, ApiScene, ApiEffectItem } from '@/types/api'
import { useCanvasSize } from '@/hooks/useCanvasSize'
import { useImageUpload } from '@/hooks/useImageUpload'
import {
  loadFrameAsset,
  getCachedFrameAsset,
  pickFrameAssetUrl,
} from '@/data/frameAssets'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToNum(hex: string): number {
  const clean = hex.startsWith('#') ? hex.slice(1) : hex
  return parseInt(clean, 16) || 0x888888
}

function resolveUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return OSS_PREFIX + path
}

// ─── Texture cache ────────────────────────────────────────────────────────────

const texCache = new Map<string, PIXI.Texture>()
// In-flight loads: when several renders fire in quick succession (e.g.
// resize storms or state-driven re-renders), all of them check texCache
// before the first PIXI.Assets.load resolves. Without this pending map,
// every render kicks off a fresh HTTP request for the same URL,
// hammering the server with dozens of duplicate fetches.
const texPending = new Map<string, Promise<PIXI.Texture | null>>()

async function loadTexture(url: string): Promise<PIXI.Texture | null> {
  if (!url) return null
  const cached = texCache.get(url)
  if (cached) return cached
  const pending = texPending.get(url)
  if (pending) return pending
  const p = (async () => {
    try {
      const tex = (await PIXI.Assets.load(url)) as PIXI.Texture
      texCache.set(url, tex)
      return tex
    } catch {
      console.warn('[FrameDesigner] Could not load texture:', url)
      return null
    } finally {
      texPending.delete(url)
    }
  })()
  texPending.set(url, p)
  return p
}

function loadArtworkTexture(url: string): Promise<PIXI.Texture> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (url.startsWith('http')) img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const tex = PIXI.Texture.from(img as any)
        resolve(tex)
      } catch (e) { reject(e) }
    }
    img.onerror = () => reject(new Error(`Image failed to load: ${url.slice(0, 80)}`))
    img.src = url
  })
}

// ─── Draw helpers ─────────────────────────────────────────────────────────────

/**
 * Image-upload icon — a rounded square outline containing a small sun
 * (circle) and a mountain peak (V-stroke). Drawn centred on (cx, cy) at
 * the requested overall size. Scales cleanly because it's pure vector.
 */
function drawUploadIcon(g: PIXI.Graphics, cx: number, cy: number, size: number) {
  g.clear()
  const half = size / 2
  const stroke = Math.max(1.5, size / 16)
  const color = 0x6b7488
  const alpha = 0.7
  const radius = size * 0.16

  // Outer rounded square
  g.roundRect(cx - half, cy - half, size, size, radius)
    .stroke({ width: stroke, color, alpha })

  // Sun (upper-right circle)
  g.circle(cx + size * 0.18, cy - size * 0.18, size * 0.07)
    .stroke({ width: stroke, color, alpha })

  // Mountain peak (downstroke + upstroke, V from lower-left to lower-right)
  const baseY = cy + size * 0.22
  const peakX = cx - size * 0.05
  const peakY = cy - size * 0.05
  g.moveTo(cx - size * 0.32, baseY)
    .lineTo(peakX, peakY)
    .lineTo(cx + size * 0.05, cy + size * 0.08)
    .lineTo(cx + size * 0.2, cy - size * 0.05)
    .lineTo(cx + size * 0.32, baseY)
    .stroke({ width: stroke, color, alpha })
}

function drawShadow(
  g: PIXI.Graphics,
  cx: number, cy: number,
  fw: number, fh: number,
  blur: number, opacity: number
) {
  g.clear()
  const steps = Math.max(3, Math.ceil(blur / 6))
  for (let i = steps; i >= 1; i--) {
    const e = (i / steps) * blur * 1.6
    g.rect(
      cx - fw / 2 - e / 2 + blur * 0.2,
      cy - fh / 2 - e / 4 + blur * 0.3,
      fw + e, fh + e
    )
    g.fill({ color: 0x000000, alpha: (opacity / steps) * 0.55 })
  }
}

function drawSolidMatStrips(
  g: PIXI.Graphics,
  matX: number, matY: number, matW: number, matH: number,
  border: number, colorHex: string
) {
  if (border <= 0) return
  const c = hexToNum(colorHex)
  g.rect(matX, matY, matW, border).fill({ color: c })
  g.rect(matX, matY + matH - border, matW, border).fill({ color: c })
  g.rect(matX, matY + border, border, matH - border * 2).fill({ color: c })
  g.rect(matX + matW - border, matY + border, border, matH - border * 2).fill({ color: c })
  // Bevel shadow
  g.rect(matX + border, matY + border, matW - border * 2, 3).fill({ color: 0x000000, alpha: 0.12 })
  g.rect(matX + border, matY + border, 3, matH - border * 2).fill({ color: 0x000000, alpha: 0.12 })
}

// ─── Layer state ──────────────────────────────────────────────────────────────

interface Layers {
  // Background (not zoomable)
  bgContainer: PIXI.Container
  bgSprite: PIXI.Sprite | null
  bgGraphics: PIXI.Graphics
  // Faint brand watermark shown behind the design in plain (no-scene) mode.
  watermark: PIXI.Sprite

  // Design group (zoomable) — contains frame, mat, artwork, shadow
  designGroup: PIXI.Container
  shadowG: PIXI.Graphics
  frameCont: PIXI.Container
  matSolidG: PIXI.Graphics
  matTexCont: PIXI.Container
  artworkCont: PIXI.Container
  artMask: PIXI.Graphics
  uploadOverlay: PIXI.Container
  overlayBg: PIXI.Graphics
  overlayIcon: PIXI.Graphics
  overlayLabel: PIXI.Text

  // Front layer (foreground objects from interior, on top of design)
  frontContainer: PIXI.Container
  frontSprite: PIXI.Sprite | null
  loadedFrontUrl: string

  // Effect overlay (not zoomable)
  effectContainer: PIXI.Container
  effectSprite: PIXI.Sprite | null

  // Tracking
  loadedFrameId: number
  loadedBgUrl: string
  loadedEffectId: number
  loadedArtUrl: string | null
  artSprite: PIXI.Sprite | null
}

function mountSprite(
  L: Layers,
  tex: PIXI.Texture,
  renderFn: () => void,
  openFilePicker: () => void,
) {
  if (L.artSprite) {
    L.artworkCont.removeChild(L.artSprite)
    L.artSprite.destroy()
  }
  const sp = new PIXI.Sprite(tex)
  // Horizontal centre, vertical top — the picture is anchored to the
  // TOP edge of the opening so when the user switches frame ratios the
  // image always starts flush with the top of the new opening, never
  // showing empty space above the picture.
  sp.anchor.set(0.5, 0)
  sp.eventMode = 'static'
  sp.cursor = 'grab'
  // Double-click on the picture → re-open the file picker so the user
  // can swap the picture without first having to clear it.
  let lastTap = 0
  sp.on('pointertap', () => {
    const now = performance.now()
    if (now - lastTap < 350) {
      lastTap = 0
      openFilePicker()
    } else {
      lastTap = now
    }
  })
  L.artSprite = sp
  L.artworkCont.addChildAt(sp, 0)
  renderFn()
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CanvasStageProps {
  // When provided, this frame is always used instead of the store's
  // selectedFrame. Used by the local-frame demo route (/editor?demo=1).
  frameOverride?: ApiFrame | null
}

export default function CanvasStage({
  frameOverride = null,
}: CanvasStageProps = {}) {
  const { t } = useTranslation('editor')
  // The PIXI layer tree is built once (mount effect) and render() is a stable
  // useCallback, so both capture `t` via a ref that always points at the latest
  // translator — this lets the canvas text follow a live language switch.
  const tRef = useRef(t)
  tRef.current = t
  const mountRef = useRef<HTMLDivElement>(null)
  const containerRef = useCanvasSize()
  const appRef = useRef<PIXI.Application | null>(null)
  const layersRef = useRef<Layers | null>(null)
  const frameOverrideRef = useRef<ApiFrame | null>(frameOverride)
  const { openFilePicker, handleDrop, handleDragOver } = useImageUpload()
  // The mat-opening rectangle in canvas (stage) coords, updated each
  // render. The wheel handler reads this to decide whether the cursor
  // is over the picture (→ picture zoom) or over the frame moulding /
  // canvas background (→ canvas zoom).
  const openingScreenRectRef = useRef({ x: 0, y: 0, w: 0, h: 0 })
  // Maximum allowed |frameOffsetX| / |frameOffsetY|. Updated each render
  // from the current outer-frame size and design zoom — the pan handler
  // reads it to clamp the offset so the frame can't be dragged fully
  // off the canvas.
  const panBoundsRef = useRef({ maxX: 0, maxY: 0 })
  // Maximum canvas zoom — recomputed each render so the frame can zoom in
  // only until its limiting dimension fills the canvas, never beyond. The
  // wheel handler reads this so zoom-in can't grow the frame past the canvas.
  const maxZoomRef = useRef(1)
  // Allowed picture drag range (designGroup-local units), recomputed each
  // render from the picture's overflow past the opening. The drag handler
  // clamps to this so the picture always covers the opening — you can only
  // drag within the cropped overflow, and a dimension that fits exactly has
  // no slack to drag. { marginX: ±X, minY..maxY }.
  const artworkBoundsRef = useRef({ marginX: 0, minY: 0, maxY: 0 })

  // HTML loader overlay shown while the selected frame's chosen-orientation
  // PNG (texture + measured opening) is still loading. Covers the initial
  // select coming from the products page, frame swaps, and ratio switches.
  // `loadingRef` mirrors the state so render() (a stable useCallback that
  // runs on every store change / resize) can skip redundant setState calls.
  const [canvasLoading, setCanvasLoading] = useState(false)
  const loadingRef = useRef(false)

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    let cancelled = false
    const app = new PIXI.Application()

    const boot = async () => {
      // Initial background matches the editor's current theme (set on the
      // root `.editor-shell` element via CSS variables). We re-read it
      // each theme toggle below.
      const initialBg = useEditorStore.getState().editorTheme === 'dark' ? 0x0e1220 : 0xeceae3
      await app.init({
        resizeTo: container,
        backgroundColor: initialBg,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        // Required so extract.canvas / toDataURL capture the current
        // frame instead of an empty (black) post-swap buffer.
        preserveDrawingBuffer: true,
      })

      if (cancelled) {
        app.destroy(true, { children: true, texture: true })
        return
      }

      appRef.current = app
      container.appendChild(app.canvas)
      // Canvas always fills its container so there's never an empty
      // band when the right inspector collapses. To avoid the browser
      // stretching an OLD drawing buffer into the NEW CSS box during
      // resize, we synchronously resize PIXI's buffer in a
      // useLayoutEffect below (which runs after the DOM commit but
      // BEFORE the next browser paint).
      ;(app.canvas as HTMLCanvasElement).style.cssText =
        'display:block;width:100%;height:100%'

      // ── Build layer tree ────────────────────────────────────────────────

      // 1. Background container (not zoomable)
      const bgContainer = new PIXI.Container()
      const bgGraphics = new PIXI.Graphics()
      bgContainer.addChild(bgGraphics)

      // Faint centred brand watermark behind the design (plain mode only —
      // hidden once an interior/scenery scene fills the background). Loaded
      // async; positioned + scaled each render(), so it starts invisible.
      const watermark = new PIXI.Sprite()
      watermark.eventMode = 'none'
      watermark.anchor.set(0.5)
      watermark.alpha = 0.16
      watermark.visible = false
      bgContainer.addChild(watermark)
      void PIXI.Assets.load('/images/logo.png')
        .then((tex: PIXI.Texture) => {
          if (cancelled) return
          watermark.texture = tex
          render()
        })
        .catch(() => {
          /* watermark is decorative — ignore load failures */
        })

      // 2. Design group (zoomable + pannable)
      const designGroup = new PIXI.Container()
      const shadowG = new PIXI.Graphics()
      const frameCont = new PIXI.Container()
      // The frame sprite is drawn on top of the artwork; its bounding
      // box is the whole outerW × outerH rectangle so without this it
      // would intercept all pointer events in the inner opening and
      // break artwork drag.
      frameCont.eventMode = 'none'
      const matSolidG = new PIXI.Graphics()
      const matTexCont = new PIXI.Container()
      const artworkCont = new PIXI.Container()
      const artMask = new PIXI.Graphics()
      const uploadOverlay = new PIXI.Container()
      const overlayBg = new PIXI.Graphics()
      // Centred image-upload icon (image frame with a mountain peak and
      // a small sun). Re-drawn each render so it scales with the
      // picture rect.
      const overlayIcon = new PIXI.Graphics()

      // Single-line caption under the icon. Style is finalised in render
      // (fontSize scales with the opening).
      const overlayLabel = new PIXI.Text({
        text: tRef.current('canvas.uploadImage'),
        style: new PIXI.TextStyle({
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 13,
          fontWeight: '500',
          fill: '#6b7488',
          align: 'center',
        }),
      })
      overlayLabel.anchor.set(0.5, 0)

      uploadOverlay.addChild(overlayBg, overlayIcon, overlayLabel)
      uploadOverlay.eventMode = 'static'
      uploadOverlay.cursor = 'pointer'
      uploadOverlay.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
        // Open the file picker and STOP the event from bubbling — otherwise
        // the stage's pan handler would also fire and the user would start
        // dragging the frame the moment they clicked the upload button.
        e.stopPropagation()
        openFilePicker()
      })

      artworkCont.addChild(artMask)
      artworkCont.mask = artMask
      artworkCont.eventMode = 'static'

      // Design group z-order: shadow → white/mat → frame → artwork (top) → overlay
      // Artwork sits ON TOP of the frame so the uploaded photo shows fully in
      // front of the frame/stretcher (it stays masked to the opening, so the
      // outer moulding is still visible around it).
      designGroup.addChild(shadowG, matSolidG, matTexCont, frameCont, artworkCont, uploadOverlay)

      // 3. Front container (foreground objects from interior scenes)
      // Render-only — must not intercept pointer events, otherwise the
      // interior foreground sprite (vase, table, lamp, etc.) sits above
      // the design group's upload overlay and swallows the click that
      // should open the file picker.
      const frontContainer = new PIXI.Container()
      frontContainer.eventMode = 'none'

      // 4. Effect container (not zoomable)
      // Render-only too — effect overlays cover the whole canvas and
      // would otherwise block clicks on the picture / upload overlay.
      const effectContainer = new PIXI.Container()
      effectContainer.eventMode = 'none'

      // Stage z-order: bg → design → front → effect
      app.stage.addChild(bgContainer, designGroup, frontContainer, effectContainer)
      app.stage.eventMode = 'static'

      layersRef.current = {
        bgContainer, bgSprite: null, bgGraphics, watermark,
        designGroup, shadowG, frameCont,
        matSolidG, matTexCont,
        artworkCont, artMask,
        uploadOverlay, overlayBg, overlayIcon, overlayLabel,
        frontContainer, frontSprite: null, loadedFrontUrl: '',
        effectContainer, effectSprite: null,
        loadedFrameId: -1,
        loadedBgUrl: '',
        loadedEffectId: -1,
        loadedArtUrl: null,
        artSprite: null,
      }

      // ── Drag handlers ─────────────────────────────────────────────────
      // Two kinds of drag:
      //   1. Artwork drag — when the pointer is over the loaded picture,
      //      drag moves the picture inside the mat opening.
      //   2. Frame pan — when the pointer is on empty canvas, drag pans
      //      the whole frame so the user can reposition it on the stage.
      // We let both pointerdowns fire (artworkCont's listener runs before
      // the stage's) and use the `dragging` flag to short-circuit pan
      // when artwork drag has already started.
      let dragging = false
      let panning = false
      let startX = 0, startY = 0, origX = 0, origY = 0
      let panStartX = 0, panStartY = 0
      let panOrigX = 0, panOrigY = 0

      artworkCont.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
        if (!layersRef.current?.artSprite) return
        dragging = true
        startX = e.globalX; startY = e.globalY
        origX = useEditorStore.getState().artworkX
        origY = useEditorStore.getState().artworkY
      })
      app.stage.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
        if (dragging) return
        panning = true
        panStartX = e.globalX; panStartY = e.globalY
        const s2 = useEditorStore.getState()
        panOrigX = s2.frameOffsetX
        panOrigY = s2.frameOffsetY
      })
      app.stage.on('pointermove', (e: PIXI.FederatedPointerEvent) => {
        if (dragging) {
          // Clamp to the picture's overflow so it can't be dragged off the
          // opening (no empty space); a dimension with no overflow won't move.
          const b = artworkBoundsRef.current
          const nx = origX + e.globalX - startX
          const ny = origY + e.globalY - startY
          useEditorStore.getState().setArtworkPosition(
            Math.max(-b.marginX, Math.min(b.marginX, nx)),
            Math.max(b.minY, Math.min(b.maxY, ny)),
          )
        } else if (panning) {
          const bounds = panBoundsRef.current
          const rawX = panOrigX + e.globalX - panStartX
          const rawY = panOrigY + e.globalY - panStartY
          const clampedX = Math.max(-bounds.maxX, Math.min(bounds.maxX, rawX))
          const clampedY = Math.max(-bounds.maxY, Math.min(bounds.maxY, rawY))
          useEditorStore.getState().setFrameOffset(clampedX, clampedY)
        }
      })
      const stopDrag = () => { dragging = false; panning = false }
      app.stage.on('pointerup', stopDrag)
      app.stage.on('pointerupoutside', stopDrag)

      // ── Wheel zoom ─────────────────────────────────────────────────────
      // Cursor-position aware:
      //   • Cursor over the picture (inside the mat opening) → zoom the
      //     PICTURE (fit / crop the uploaded image).
      //   • Cursor over the frame moulding or empty canvas → zoom the
      //     WHOLE FRAME (canvas zoom).
      // The opening rect in stage coords is refreshed each render via
      // openingScreenRectRef so the check stays in sync with the live
      // frame size + pan offset.
      ;(app.canvas as HTMLElement).addEventListener('wheel', (e: WheelEvent) => {
        e.preventDefault()
        const s = useEditorStore.getState()
        const factor = e.deltaY < 0 ? 1.06 : 0.94

        const canvasEl = app.canvas as HTMLCanvasElement
        const bounds = canvasEl.getBoundingClientRect()
        const mouseX = e.clientX - bounds.left
        const mouseY = e.clientY - bounds.top

        const r = openingScreenRectRef.current
        const cursorOverPicture =
          !!s.artworkImageUrl &&
          mouseX >= r.x && mouseX <= r.x + r.w &&
          mouseY >= r.y && mouseY <= r.y + r.h

        if (cursorOverPicture) {
          // Picture zoom is clamped to [1, 8]: 1.0 is the cover-fit that fills
          // the frame opening exactly, so zooming out can never shrink the
          // picture below the opening and expose empty space inside the frame.
          const next = Math.min(8, Math.max(1, s.artworkScale * factor))
          s.setArtworkScale(next)
        } else {
          // Canvas zoom: 1.0 = the frame's natural viewport-fit size (you can
          // never shrink the frame below that). The upper bound is dynamic —
          // the frame can only zoom in until it fills the canvas, never past
          // its bounds (maxZoomRef, recomputed each render from frame/canvas).
          const next = Math.min(maxZoomRef.current, Math.max(1, s.designZoom * factor))
          s.setDesignZoom(next)
        }
      }, { passive: false })

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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Main render ───────────────────────────────────────────────────────────
  const render = useCallback(() => {
    const app = appRef.current
    const L = layersRef.current
    if (!app || !L) return

    const W = app.screen.width
    const H = app.screen.height
    if (W < 10 || H < 10) return

    const cx = W / 2
    const cy = H / 2

    const s = useEditorStore.getState()
    const frame: ApiFrame | null = frameOverrideRef.current ?? s.selectedFrame
    // Stretcher category: never show the moulding — the picture fills the whole
    // frame (gallery-wrap canvas), before and after an image is uploaded. Any
    // category whose slug contains "stretcher" (case-insensitive) qualifies, so
    // variants like "canvas-stretcher" or "stretcher-frames" also match.
    const stretcherHideFrame =
      (frame?.categorySlug ?? '').toLowerCase().includes('stretcher')
    const interior: ApiScene | null = s.selectedInterior
    const scenery: ApiScene | null = s.selectedScenery
    const matSizeItem = s.selectedMatSize
    const matColorItem = s.selectedMatColor
    const effect: ApiEffectItem | null = s.selectedEffect
    const bgMode = s.backgroundMode

    // ── 1. Background ──────────────────────────────────────────────────────
    L.bgGraphics.clear()

    const bgScene = bgMode === 'interior' ? interior : bgMode === 'scenery' ? scenery : null
    const bgUrl = bgScene ? resolveUrl(bgScene.ossUrl) : ''

    // Compute background scale/offset
    let bgScale = 1
    let bgOffX = 0
    let bgOffY = 0
    const bgSceneW = bgScene?.sceneWidth || 0
    const bgSceneH = bgScene?.sceneHeight || 0

    // Interiors use "contain" (fit full scene), scenery uses "cover" (fill canvas)
    const useContain = bgMode === 'interior'
    const computeBgTransform = (texW: number, texH: number) => {
      const sx = W / texW
      const sy = H / texH
      bgScale = useContain ? Math.min(sx, sy) : Math.max(sx, sy)
      bgOffX = (W - texW * bgScale) / 2
      bgOffY = (H - texH * bgScale) / 2
    }

    if (bgSceneW > 0 && bgSceneH > 0) {
      computeBgTransform(bgSceneW, bgSceneH)
    }

    if (bgUrl && bgUrl !== L.loadedBgUrl) {
      L.loadedBgUrl = bgUrl
      if (L.bgSprite) {
        L.bgContainer.removeChild(L.bgSprite)
        L.bgSprite.destroy()
        L.bgSprite = null
      }
      loadTexture(bgUrl).then(tex => {
        const L2 = layersRef.current
        if (!L2 || L2.loadedBgUrl !== bgUrl) return
        if (tex) {
          const sp = new PIXI.Sprite(tex)
          L2.bgContainer.addChild(sp)
          L2.bgSprite = sp
        }
        render()
      })
    } else if (!bgUrl) {
      if (L.bgSprite) {
        L.bgContainer.removeChild(L.bgSprite)
        L.bgSprite.destroy()
        L.bgSprite = null
        L.loadedBgUrl = ''
      }
      if (L.frontSprite) {
        L.frontContainer.removeChild(L.frontSprite)
        L.frontSprite.destroy()
        L.frontSprite = null
        L.loadedFrontUrl = ''
      }
      const floorY = H * 0.72
      L.bgGraphics.rect(0, 0, W, floorY).fill({ color: 0xede8e0 })
      L.bgGraphics.rect(0, floorY, W, H - floorY).fill({ color: 0xf5f0eb })
      L.bgGraphics.rect(0, floorY - 5, W, 5).fill({ color: 0x000000, alpha: 0.1 })
    }

    // Position/size background sprite
    if (L.bgSprite && bgSceneW > 0) {
      L.bgSprite.x = bgOffX
      L.bgSprite.y = bgOffY
      L.bgSprite.width = bgSceneW * bgScale
      L.bgSprite.height = bgSceneH * bgScale
    }

    // Brand watermark — top-centred, ~45% of the smaller canvas dimension, shown
    // only in plain mode (a scene image would otherwise cover it anyway).
    {
      const wm = L.watermark
      const hasTex = !!wm.texture && wm.texture.width > 2
      wm.visible = hasTex && !bgScene
      if (wm.visible) {
        const k = (Math.min(W, H) * 0.45) / wm.texture.width
        wm.scale.set(k)
        // Anchored at its centre → offset y by half its scaled height so it
        // sits just below the top edge with a small padding.
        const topPad = Math.max(24, H * 0.04)
        wm.x = cx
        wm.y = topPad + (wm.texture.height * k) / 2
      }
    }

    // ── 1b. Front layer (foreground objects from interior) ───────────────
    const frontUrl = (bgMode === 'interior' && interior?.frontOssUrl)
      ? resolveUrl(interior.frontOssUrl) : ''

    if (frontUrl && frontUrl !== L.loadedFrontUrl) {
      L.loadedFrontUrl = frontUrl
      if (L.frontSprite) {
        L.frontContainer.removeChild(L.frontSprite)
        L.frontSprite.destroy()
        L.frontSprite = null
      }
      loadTexture(frontUrl).then(tex => {
        const L2 = layersRef.current
        if (!L2 || L2.loadedFrontUrl !== frontUrl) return
        if (tex) {
          const sp = new PIXI.Sprite(tex)
          L2.frontContainer.addChild(sp)
          L2.frontSprite = sp
        }
        render()
      })
    } else if (!frontUrl && L.frontSprite) {
      L.frontContainer.removeChild(L.frontSprite)
      L.frontSprite.destroy()
      L.frontSprite = null
      L.loadedFrontUrl = ''
    }

    // Position/size front sprite using same bg transform
    if (L.frontSprite && interior?.frontPos && bgSceneW > 0) {
      const fp = interior.frontPos
      L.frontSprite.x = bgOffX + fp.x * bgScale
      L.frontSprite.y = bgOffY + fp.y * bgScale
      L.frontSprite.width = fp.w * bgScale
      L.frontSprite.height = fp.h * bgScale
    }

    // ── 2. Design group zoom + position ─────────────────────────────────
    const zoom = s.designZoom
    L.designGroup.scale.set(zoom)
    L.designGroup.x = cx - cx * zoom + s.frameOffsetX
    L.designGroup.y = cy - cy * zoom + s.frameOffsetY

    // ── Compute frame dimensions ────────────────────────────────────────
    // Three modes — the FRAME OUTER is always drawn at the chosen source
    // PNG's native aspect, so the moulding is never anisotropically
    // stretched:
    //   landscape / portrait → renders the corresponding source PNG;
    //     the picture fills the alpha-detected opening.
    //   custom               → renders whichever PNG matches the user's
    //     cm orientation (landscape if width ≥ height, portrait
    //     otherwise). The cm dimensions only shape the PICTURE rect
    //     INSIDE the opening — the picture rect is fit at width:height
    //     aspect, top-anchored, and the mat fills the surrounding gap.
    const interiorPos = (bgMode === 'interior' && interior?.position) ? interior.position : null
    const isCustom = s.frameAspectRatio === 'custom'
    // Square is "wanted" by either the Square radio OR Custom mode with
    // exactly equal width × height (e.g. 40 × 40 cm). When the admin
    // uploaded a dedicated square PNG we route to that asset directly
    // so the picture fills its own opening (no side-strip mat needed).
    // Otherwise we fall back to landscape and the renderer fits a 1:1
    // picture rect inside its opening, with mat filling the side gap.
    const wantSquare =
      s.frameAspectRatio === 'square' ||
      (isCustom && s.customWidthCm === s.customHeightCm)
    // When a dedicated square PNG is uploaded for this frame, route to
    // it whenever Square is wanted — including in interior mode. The
    // interior position fitting below still constrains the outer rect,
    // so the square frame fits cleanly inside the wall area at the
    // smaller of the position's width / height. Without a dedicated
    // square PNG, fall back to the landscape PNG and fit a 1:1 picture
    // rect inside its opening (the moulding stays landscape-shaped —
    // that's the unavoidable cost of not having a square asset).
    const hasDedicatedSquare = wantSquare && !!frame?.squareUrl
    let orientation: 'landscape' | 'portrait' | 'square'
    if (wantSquare) {
      orientation = hasDedicatedSquare ? 'square' : 'landscape'
    } else if (isCustom) {
      orientation = s.customWidthCm < s.customHeightCm ? 'portrait' : 'landscape'
    } else {
      orientation = s.frameAspectRatio === 'portrait' ? 'portrait' : 'landscape'
    }

    // Kick off the async load of the chosen PNG so we know its native
    // dimensions on the next render.
    let frameAsset = null as ReturnType<typeof getCachedFrameAsset>
    if (frame) {
      const assetUrl = pickFrameAssetUrl(frame, orientation)
      frameAsset = getCachedFrameAsset(assetUrl)
      if (!frameAsset) {
        const snap = frame.id
        void loadFrameAsset(assetUrl).then(() => {
          const L2 = layersRef.current
          if (!L2) return
          const s2 = useEditorStore.getState()
          const current = frameOverrideRef.current ?? s2.selectedFrame
          if (current?.id !== snap) return
          render()
        })
      }
    }

    // ── Loader overlay state ───────────────────────────────────────────────
    // The frame is "ready" once BOTH its PNG texture and its alpha-measured
    // opening are cached for the chosen orientation. Until then, drive the
    // HTML loader overlay (frame select / swap / ratio switch). When no
    // frame is selected there's nothing to wait on.
    const readyUrl = frame ? pickFrameAssetUrl(frame, orientation) : ''
    // Stretcher never draws the frame, so it needs none of its assets — treat it
    // as ready immediately (otherwise the loader waits forever for a texture we
    // never load).
    const frameReady =
      !frame || stretcherHideFrame || (!!texCache.get(readyUrl) && !!getCachedFrameAsset(readyUrl))
    const needLoading = !frameReady
    if (loadingRef.current !== needLoading) {
      loadingRef.current = needLoading
      setCanvasLoading(needLoading)
    }

    // Frame outer aspect = ALWAYS the source PNG's native aspect (so
    // moulding is never stretched). Prefer the PIXI texture dims when
    // available, since that's what actually gets drawn — using only the
    // alpha-detector's frameAsset can drift if its load races with the
    // PIXI texture load, which produced visible anisotropic stretching
    // on canvas-resize events. Until either loads we fall back to a
    // coarse orientation-based ratio.
    const frameAssetUrlForAspect = frame ? pickFrameAssetUrl(frame, orientation) : ''
    const cachedFrameTex = frameAssetUrlForAspect
      ? texCache.get(frameAssetUrlForAspect)
      : undefined
    const fallbackAspect = orientation === 'portrait' ? 2 / 3 : 3 / 2
    let aspectRatio: number
    if (cachedFrameTex && cachedFrameTex.width > 0 && cachedFrameTex.height > 0) {
      aspectRatio = cachedFrameTex.width / cachedFrameTex.height
    } else if (frameAsset && frameAsset.width > 0 && frameAsset.height > 0) {
      aspectRatio = frameAsset.width / frameAsset.height
    } else {
      aspectRatio = isCustom ? fallbackAspect : getAspectRatioValue(s.frameAspectRatio)
    }

    let outerW: number, outerH: number, frameX0: number, frameY0: number

    if (interiorPos && bgSceneW > 0) {
      const posCanvasW = interiorPos.w * bgScale
      const posCanvasH = interiorPos.h * bgScale
      const posCenterX = bgOffX + (interiorPos.x + interiorPos.w / 2) * bgScale
      const posCenterY = bgOffY + (interiorPos.y + interiorPos.h / 2) * bgScale
      const fitByW = posCanvasW / aspectRatio <= posCanvasH
      outerW = fitByW ? posCanvasW : posCanvasH * aspectRatio
      outerH = fitByW ? posCanvasW / aspectRatio : posCanvasH

      // Square frame cap. Interior position rects vary a lot in aspect:
      // some are wide (great for landscape frames), some are tall
      // (designed for portrait frames). For a wider position the square
      // fits comfortably by height, but for tall positions a square
      // fitting the smaller dim ends up much TALLER than a landscape
      // frame would render there — which the user perceives as "too
      // large" on some interiors and "perfect" on others. Cap the
      // square side to the projected height of a landscape frame in
      // the same position, so square never visually exceeds the wall
      // area a landscape frame would occupy.
      if (wantSquare && hasDedicatedSquare) {
        const fallbackLandscape = 3 / 2
        const landscapeTex = frame ? texCache.get(frame.landscapeUrl) : undefined
        const landscapeAspect = (landscapeTex && landscapeTex.width > 0 && landscapeTex.height > 0)
          ? landscapeTex.width / landscapeTex.height
          : fallbackLandscape
        const lFitByW = posCanvasW / landscapeAspect <= posCanvasH
        const landscapeHeight = lFitByW ? posCanvasW / landscapeAspect : posCanvasH
        const cappedSide = Math.min(outerW, outerH, landscapeHeight)
        outerW = cappedSide
        outerH = cappedSide
      }

      frameX0 = posCenterX - outerW / 2
      frameY0 = posCenterY - outerH / 2
    } else {
      // Default viewport cap — fits frame to 55% W / 65% H of canvas, then
      // scaled down by FRAME_FIT so the frame renders ~25% smaller on the
      // editor canvas. Every ratio (including Custom) renders at this same
      // viewport fit so switching ratio always lands at zoom 1 with no
      // zoom-out: the cm dimensions only choose orientation + aspect.
      const FRAME_FIT = 0.75
      const maxW = Math.max(W * 0.55, 280) * FRAME_FIT
      const maxH = Math.max(H * 0.65, 280) * FRAME_FIT
      const fitByW = maxW / aspectRatio <= maxH
      outerW = fitByW ? maxW : maxH * aspectRatio
      outerH = fitByW ? maxW / aspectRatio : maxH
      frameX0 = cx - outerW / 2
      frameY0 = cy - outerH / 2
    }

    // Inner content rectangle (where mat + artwork sit), derived from the
    // alpha-measured opening on the source PNG and mapped into canvas
    // pixels. With no asset loaded yet we fall back to a centred 60%
    // window so the upload overlay has a sane default position.
    let contentX: number, contentY: number, contentW: number, contentH: number
    if (frameAsset && frameAsset.width > 0 && frameAsset.height > 0) {
      const sxAsset = outerW / frameAsset.width
      const syAsset = outerH / frameAsset.height
      contentX = frameX0 + frameAsset.opening.x * sxAsset
      contentY = frameY0 + frameAsset.opening.y * syAsset
      contentW = frameAsset.opening.w * sxAsset
      contentH = frameAsset.opening.h * syAsset
    } else {
      contentX = frameX0 + outerW * 0.2
      contentY = frameY0 + outerH * 0.2
      contentW = outerW * 0.6
      contentH = outerH * 0.6
    }

    // Stretcher (with artwork): the image is the whole surface — expand the
    // content area to the full frame bounds so it fills edge-to-edge with no
    // moulding opening.
    if (stretcherHideFrame) {
      contentX = frameX0
      contentY = frameY0
      contentW = outerW
      contentH = outerH
    }

    // Mat border from the selected mat size's width in cm. The opening
    // (contentW × contentH px) represents the frame's real size in cm — the
    // same basis the price calc uses — so px-per-cm = contentW / wCm. The
    // border is drawn at the physical width (matWidthCm × px-per-cm) and is
    // capped so a large mat can never swallow the whole opening.
    const matWidthCm = matSizeItem?.widthCm ?? 0
    // Frame width (cm) for the active ratio — the same basis the price calc
    // uses. contentW maps to this width, so px-per-cm = contentW / matWCm.
    const matWCm =
      s.frameAspectRatio === 'landscape'
        ? A4_LONG_CM
        : s.frameAspectRatio === 'portrait'
          ? A4_SHORT_CM
          : s.frameAspectRatio === 'square'
            ? A4_SHORT_CM
            : s.customWidthCm
    const pxPerCm = matWCm > 0 ? contentW / matWCm : 0
    const matBorder =
      stretcherHideFrame || matWidthCm <= 0
        ? 0
        : Math.min(
            Math.round(matWidthCm * pxPerCm),
            Math.floor(Math.min(contentW, contentH) * 0.45),
          )

    const matX = contentX
    const matY = contentY
    const matTotalW = contentW
    const matTotalH = contentH

    // Picture rect — sized depending on the active mode:
    //   - landscape / portrait / custom → fills the available opening.
    //   - square (1:1)                  → fit a 1:1 picture rect inside
    //     the available area, centred horizontally and top-anchored; the
    //     mat fills the surrounding side strips.
    const availX = contentX + matBorder
    const availY = contentY + matBorder
    const availW = Math.max(contentW - matBorder * 2, 20)
    const availH = Math.max(contentH - matBorder * 2, 20)
    // Square mode: when there's a dedicated square PNG we use its
    // opening as-is (picture fills it). When falling back to the
    // landscape PNG we fit a 1:1 picture rect inside the opening with
    // mat filling the side gap.
    // Stretcher fills the whole frame edge-to-edge (no square inset), so the
    // picture rect always spans the full bounds — which also makes the picture
    // the entire hover area for wheel zoom.
    const needsSquareInsideFit = wantSquare && !hasDedicatedSquare && !stretcherHideFrame

    let openX: number, openY: number, openW: number, openH: number
    if (needsSquareInsideFit) {
      const side = Math.min(availW, availH)
      openW = side
      openH = side
      openX = availX + (availW - side) / 2
      openY = availY
    } else {
      openX = availX
      openY = availY
      openW = availW
      openH = availH
    }
    // A non-zero gap inside the opening (anything other than the full
    // openW × openH rect) means the mat backing needs to fill the whole
    // contentRect so the gap is visibly mat, not the white default.
    const hasPictureMatGap = needsSquareInsideFit &&
      (openW < availW - 0.5 || openH < availH - 0.5)

    // ── 3. Shadow ──────────────────────────────────────────────────────
    const frameCx = frameX0 + outerW / 2
    const frameCy = frameY0 + outerH / 2
    if (s.shadowEnabled) {
      drawShadow(L.shadowG, frameCx, frameCy, outerW, outerH, s.shadowBlur, s.shadowOpacity)
    } else {
      L.shadowG.clear()
    }

    // ── 4. Frame rendering ───────────────────────────────────────────────
    L.frameCont.removeChildren()

    if (frame && stretcherHideFrame) {
      // Stretcher with artwork — no moulding is drawn; the full-bounds image
      // (rendered below) is the visible surface.
      L.loadedFrameId = frame.id
    } else if (frame) {
      // ── Full-frame single-sprite render ──
      // The chosen full-frame PNG (landscape or portrait) is drawn at the
      // texture's native aspect using a UNIFORM scale — assigning
      // sp.width / sp.height independently can drift into anisotropic
      // stretching when outerW/outerH is computed from a stale fallback
      // aspect (e.g. during canvas resize). Computing a single scale
      // factor from the texture's own dimensions guarantees the moulding
      // is never squished, and we recentre inside the outer rect if the
      // fit picks a smaller axis.
      const assetUrl = pickFrameAssetUrl(frame, orientation)
      const cachedTex = texCache.get(assetUrl)
      if (cachedTex && cachedTex.width > 0 && cachedTex.height > 0) {
        const sp = new PIXI.Sprite(cachedTex)
        const sx = outerW / cachedTex.width
        const sy = outerH / cachedTex.height
        const k = Math.min(sx, sy)
        sp.scale.set(k, k)
        const drawnW = cachedTex.width * k
        const drawnH = cachedTex.height * k
        sp.x = frameX0 + (outerW - drawnW) / 2
        sp.y = frameY0 + (outerH - drawnH) / 2
        L.frameCont.addChild(sp)
        L.loadedFrameId = frame.id
      } else if (cachedTex) {
        const sp = new PIXI.Sprite(cachedTex)
        sp.x = frameX0
        sp.y = frameY0
        sp.width = outerW
        sp.height = outerH
        L.frameCont.addChild(sp)
        L.loadedFrameId = frame.id
      } else {
        const snap = frame.id
        L.loadedFrameId = snap
        loadTexture(assetUrl).then(() => {
          const L2 = layersRef.current
          if (!L2 || L2.loadedFrameId !== snap) return
          render()
        })
      }
    } else {
      // No frame selected — draw fallback
      L.loadedFrameId = -1
      const g = new PIXI.Graphics()
      g.rect(frameX0, frameY0, outerW, outerH).fill({ color: 0xd4c4a0 })
      g.rect(contentX, contentY, contentW, contentH).fill({ color: 0xffffff })
      L.frameCont.addChild(g)
    }


    // ── 5. White backing + Mat ─────────────────────────────────────────
    L.matSolidG.clear()
    L.matTexCont.removeChildren()

    // White canvas backing — fills only the content area inside the frame border
    L.matSolidG.rect(contentX, contentY, contentW, contentH).fill({ color: 0xffffff })

    // Mat appearance colour — the selected mat colour, or a default off-white
    // once a mat size is chosen so the mat reads clearly against the picture.
    const matColor = matColorItem?.color || ''

    // Square mode introduces a side gap between the (smaller) picture
    // rect and the (wider) available area inside the opening. Fill the
    // whole contentRect with the mat colour so that gap reads as mat
    // instead of as the white backing. The picture (drawn later) covers
    // openX/Y/W/H on top.
    if (hasPictureMatGap) {
      const matFill = matColor ? hexToNum(matColor) : 0xf8f8f8
      L.matSolidG.rect(contentX, contentY, contentW, contentH).fill({ color: matFill })
    }

    // Mat strips (drawn on top of white backing, below artwork)
    if (matBorder > 0) {
      drawSolidMatStrips(
        L.matSolidG, matX, matY, matTotalW, matTotalH, matBorder,
        matColor || 'f8f8f8',
      )
    }

    // ── 7. Artwork mask ──────────────────────────────────────────────
    L.artMask.clear()
    L.artMask.rect(openX, openY, openW, openH).fill({ color: 0xffffff })

    // Record the opening in canvas (stage) coords so the wheel handler
    // can tell when the cursor is hovering the picture vs the frame.
    // The designGroup transform is x = (cx - cx*zoom + offset), scale =
    // zoom — so a point (px, py) in designGroup-local lands at
    // (px * zoom + designGroup.x, py * zoom + designGroup.y) in stage.
    openingScreenRectRef.current = {
      x: L.designGroup.x + openX * zoom,
      y: L.designGroup.y + openY * zoom,
      w: openW * zoom,
      h: openH * zoom,
    }

    // Pan clamp bounds. The on-stage frame centre sits at (cx + offsetX,
    // cy + offsetY) regardless of zoom. We want either the frame to stay
    // inside the canvas (when it fits) OR the canvas viewport to stay
    // inside the frame (when the frame is bigger than the canvas). Both
    // conditions reduce to |offsetX| ≤ |cx - outerW × zoom / 2| and
    // similarly on Y — so the pan handler can clamp without branching
    // on which case it is.
    panBoundsRef.current = {
      maxX: Math.abs(cx - (outerW * zoom) / 2),
      maxY: Math.abs(cy - (outerH * zoom) / 2),
    }

    // Cap canvas zoom to the canvas bounds: the frame may zoom in only until
    // its limiting dimension fills the canvas (W or H), never larger. outerW/H
    // are the un-zoomed frame size, so W/outerW and H/outerH are the zoom
    // factors at which each dimension would exactly meet the canvas edge.
    const fitZoomX = outerW > 0 ? W / outerW : 1
    const fitZoomY = outerH > 0 ? H / outerH : 1
    maxZoomRef.current = Math.max(1, Math.min(fitZoomX, fitZoomY))

    // ── 8. Artwork ──────────────────────────────────────────────────
    if (s.artworkImageUrl) {
      L.uploadOverlay.visible = false

      if (s.artworkImageUrl !== L.loadedArtUrl) {
        const urlSnap = s.artworkImageUrl
        L.loadedArtUrl = urlSnap

        loadArtworkTexture(urlSnap).then((tex) => {
          const L2 = layersRef.current
          if (!L2 || L2.loadedArtUrl !== urlSnap) return
          if (!tex) return
          mountSprite(L2, tex, render, openFilePicker)
        }).catch((err) => {
          console.error('[FrameDesigner] Failed to load artwork:', err)
        })
      } else if (L.artSprite) {
        // Cover fit — the picture FILLS the mat opening on both axes
        // (cropping the longer dimension via the artMask). Runs every
        // render, so any change to mat size / frame ratio / opening
        // dimensions automatically re-fits the picture. The user's
        // zoom factor (artworkScale) and drag offset (artworkX/Y) are
        // applied on TOP of the cover fit so a manual zoom survives a
        // mat change.
        const sp = L.artSprite
        const tex = sp.texture
        const imgA = tex.width / tex.height
        const areaA = openW / openH
        let bw: number, bh: number
        if (imgA > areaA) {
          // Image wider than opening → fit by height, overflow horizontally.
          bh = openH
          bw = openH * imgA
        } else {
          // Image taller → fit by width, overflow vertically.
          bw = openW
          bh = openW / imgA
        }
        const dispW = bw * s.artworkScale
        const dispH = bh * s.artworkScale
        sp.width = dispW
        sp.height = dispH

        // Constrain the picture so it ALWAYS covers the opening: the picture
        // may only move within its overflow past the opening (the part the
        // mask crops). A dimension that fits exactly has zero slack, so it
        // can't be dragged there — no empty space ever shows inside the frame.
        //   X: sprite is centre-anchored → ±half the horizontal overflow.
        //   Y: sprite is top-anchored → from (openH - dispH) up to 0.
        const marginX = Math.max(0, (dispW - openW) / 2)
        const minY = Math.min(0, openH - dispH)
        const maxY = 0
        artworkBoundsRef.current = { marginX, minY, maxY }

        const clampedX = Math.max(-marginX, Math.min(marginX, s.artworkX))
        const clampedY = Math.max(minY, Math.min(maxY, s.artworkY))
        sp.x = openX + openW / 2 + clampedX
        // sp.anchor.y = 0 → sp.y is the picture's top edge. artworkY = 0
        // therefore pins the top of the picture to the top of the opening;
        // any drag stores a positive Y to shift the picture down, negative
        // to shift it up.
        sp.y = openY + clampedY

        // If a zoom-out / ratio change shrank the draggable range, fold the
        // stored offset back in-bounds so the next drag starts correctly and
        // the export matches. Deferred to avoid a re-entrant render mid-draw.
        if (
          Math.abs(clampedX - s.artworkX) > 0.5 ||
          Math.abs(clampedY - s.artworkY) > 0.5
        ) {
          queueMicrotask(() => {
            const st = useEditorStore.getState()
            const b = artworkBoundsRef.current
            const cx2 = Math.max(-b.marginX, Math.min(b.marginX, st.artworkX))
            const cy2 = Math.max(b.minY, Math.min(b.maxY, st.artworkY))
            if (
              Math.abs(cx2 - st.artworkX) > 0.5 ||
              Math.abs(cy2 - st.artworkY) > 0.5
            ) {
              st.setArtworkPosition(cx2, cy2)
            }
          })
        }
      }
    } else {
      // Upload overlay
      L.uploadOverlay.visible = true
      if (L.artSprite) {
        L.artworkCont.removeChild(L.artSprite)
        L.artSprite.destroy()
        L.artSprite = null
        L.loadedArtUrl = null
      }
      L.overlayBg.clear()
      L.overlayBg.rect(openX, openY, openW, openH).fill({ color: 0xffffff })
      // Centred image-upload icon + "Upload image" caption below it.
      // Both scale with the picture rect; both hide entirely when the
      // opening is too small to render them cleanly. The click target
      // stays via uploadOverlay's hitArea (the full opening).
      const minDim = Math.min(openW, openH)
      const iconSize = Math.max(18, Math.min(96, Math.round(minDim * 0.26)))
      const labelSize = Math.max(9, Math.min(14, Math.round(minDim / 14)))
      const gap = Math.max(4, Math.round(iconSize * 0.18))
      const labelH = labelSize * 1.3 // approx — anchor 0.5,0 makes this less critical
      // The icon + gap + label form a single column. Centre that whole
      // column vertically inside the opening so the visual mid is the
      // group's mid, not just the icon's mid.
      const blockH = iconSize + gap + labelH
      const showIcon = minDim > 30
      const showLabel = showIcon && openH > blockH + 6 && openW > 60

      L.overlayIcon.visible = showIcon
      if (showIcon) {
        const cxIcon = openX + openW / 2
        const cyIconTop = openY + (openH - (showLabel ? blockH : iconSize)) / 2
        const cyIcon = cyIconTop + iconSize / 2
        drawUploadIcon(L.overlayIcon, cxIcon, cyIcon, iconSize)

        L.overlayLabel.visible = showLabel
        if (showLabel) {
          L.overlayLabel.style.fontSize = labelSize
          L.overlayLabel.x = openX + openW / 2
          L.overlayLabel.y = cyIcon + iconSize / 2 + gap
        }
      } else {
        L.overlayIcon.clear()
        L.overlayLabel.visible = false
      }
      L.uploadOverlay.hitArea = new PIXI.Rectangle(openX, openY, openW, openH)
    }

    // ── 9. Effect overlay ──────────────────────────────────────────────
    if (effect) {
      const effectUrl = effect.squareUrl || effect.acrossUrl || effect.verticalUrl
      if (effectUrl && effect.id !== L.loadedEffectId) {
        L.loadedEffectId = effect.id
        if (L.effectSprite) {
          L.effectContainer.removeChild(L.effectSprite)
          L.effectSprite.destroy()
          L.effectSprite = null
        }
        loadTexture(effectUrl).then(tex => {
          const L2 = layersRef.current
          if (!L2 || L2.loadedEffectId !== effect.id) return
          if (!tex) return
          const sp = new PIXI.Sprite(tex)
          sp.width = W
          sp.height = H
          sp.alpha = effect.opacity
          // Set blend mode
          if (effect.blendMode === 'BlendMultiply') {
            sp.blendMode = 'multiply'
          } else {
            sp.blendMode = 'normal'
          }
          L2.effectContainer.addChild(sp)
          L2.effectSprite = sp
        })
      } else if (L.effectSprite) {
        // Resize existing effect
        L.effectSprite.width = W
        L.effectSprite.height = H
        L.effectSprite.alpha = effect.opacity
      }
    } else {
      // No effect selected
      if (L.effectSprite) {
        L.effectContainer.removeChild(L.effectSprite)
        L.effectSprite.destroy()
        L.effectSprite = null
      }
      L.loadedEffectId = -1
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Subscribe to state + resize ───────────────────────────────────────────
  useEffect(() => {
    const unsub = useEditorStore.subscribe(() => render())
    const onResize = () => requestAnimationFrame(render)
    window.addEventListener('resize', onResize)
    return () => { unsub(); window.removeEventListener('resize', onResize) }
  }, [render])

  // Sync prop-based frame override → ref + re-render
  useEffect(() => {
    frameOverrideRef.current = frameOverride ?? null
    // Force the next render to refetch piece textures for the new frame.
    if (layersRef.current) layersRef.current.loadedFrameId = -1
    render()
  }, [frameOverride, render])

  // ── Panel collapse / expand → flush PIXI buffer before paint ─────────────
  // The canvas element has CSS width/height: 100% so it always fills its
  // container. When EITHER side panel collapses (right inspector or left
  // tool panel), the flex layout immediately gives that space to the canvas
  // main area. Without this synchronous resize, the browser would paint the
  // OLD drawing buffer pixels stretched into the NEW (wider) CSS box for at
  // least one frame, and PIXI's stale screen width would re-centre the frame
  // off to one side — leaving an empty band where the panel used to be.
  // useLayoutEffect runs after React's DOM commit but BEFORE the next browser
  // paint, so resizing + redrawing here lands a correctly-sized first paint.
  const inspectorCollapsed = useEditorStore((s) => s.inspectorCollapsed)
  const toolPanelCollapsed = useEditorStore((s) => s.toolPanelCollapsed)
  useLayoutEffect(() => {
    const app = appRef.current
    if (!app) return
    try {
      app.resize()
    } catch {
      /* renderer torn down */
    }
    render()
  }, [inspectorCollapsed, toolPanelCollapsed, render])

  // Live theme → PIXI renderer background.
  useEffect(() => {
    const apply = () => {
      const app = appRef.current
      if (!app) return
      const theme = useEditorStore.getState().editorTheme
      const bg = theme === 'dark' ? 0x0e1220 : 0xeceae3
      // PIXI v8 renderer background.
      ;(app.renderer as any).background.color = bg
      render()
    }
    apply()
    const unsub = useEditorStore.subscribe((s, prev) => {
      if (s.editorTheme !== prev.editorTheme) apply()
    })
    return unsub
  }, [render])

  // ── Re-render the instant the PIXI canvas resizes ─────────────────────────
  // When the right inspector collapses/expands (or any sibling shifts the
  // canvas column's width), the container reflows and PIXI's resizeTo
  // resizes the drawing buffer asynchronously. Without an immediate
  // re-render, the browser briefly rasterises the OLD buffer pixels into
  // the NEW canvas CSS box, which looks like an anisotropic stretch of
  // the whole canvas (including the frame and the mat backing). Hooking
  // PIXI's own 'resize' event guarantees we redraw at the exact moment
  // the buffer changes size.
  useEffect(() => {
    const app = appRef.current
    if (!app) return
    const onPixiResize = () => render()
    app.renderer.on('resize', onPixiResize)
    // Also observe the host container so we redraw if a layout change
    // happens before PIXI's own observer notices.
    const container = mountRef.current
    let ro: ResizeObserver | null = null
    if (container && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        // Force PIXI to flush the new size, then redraw.
        try { app.resize() } catch { /* renderer torn down */ }
        render()
      })
      ro.observe(container)
    }
    return () => {
      app.renderer.off('resize', onPixiResize)
      ro?.disconnect()
    }
  }, [render])

  // ── Expose save ───────────────────────────────────────────────────────────
  useEffect(() => {
    ;(window as any).__frameSave = () => {
      const app = appRef.current
      if (!app) return
      // Force one fresh render so the back buffer matches the latest
      // state, THEN extract via PIXI's renderer.extract — which writes
      // pixels straight from the framebuffer to a fresh canvas. This
      // avoids the all-black PNG you get when toDataURL races against
      // WebGL's buffer swap.
      try {
        render()
        app.renderer.render(app.stage)
        const extractedCanvas = app.renderer.extract.canvas(app.stage) as HTMLCanvasElement
        const a = document.createElement('a')
        a.download = 'framed-artwork.png'
        a.href = extractedCanvas.toDataURL('image/png')
        a.click()
      } catch (err) {
        console.error('[FrameDesigner] Save failed:', err)
        // Fallback to the raw canvas (works when preserveDrawingBuffer is on).
        const canvas = app.canvas as HTMLCanvasElement | undefined
        if (!canvas) return
        const a = document.createElement('a')
        a.download = 'framed-artwork.png'
        a.href = canvas.toDataURL('image/png')
        a.click()
      }
    }
  }, [render])

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <div
        ref={mountRef}
        className="w-full h-full"
        onDrop={(e) => { handleDrop(e); setTimeout(render, 300) }}
        onDragOver={handleDragOver}
      />

      {/* Canvas loader — fades in over the stage while the frame's PNG +
          measured opening load (initial select, frame swap, ratio switch). */}
      <div
        className={`pointer-events-none absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-300 ${
          canvasLoading ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background:
            'radial-gradient(circle at center, color-mix(in srgb, var(--ed-canvas) 70%, transparent) 0%, color-mix(in srgb, var(--ed-canvas) 30%, transparent) 70%)',
          backdropFilter: 'blur(2px)',
        }}
        aria-hidden={!canvasLoading}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-14 w-14">
            {/* soft glow */}
            <div
              className="absolute inset-0 rounded-full blur-md"
              style={{
                background:
                  'radial-gradient(circle, color-mix(in srgb, var(--ed-accent) 45%, transparent) 0%, transparent 70%)',
              }}
            />
            {/* static track */}
            <div
              className="absolute inset-0 rounded-full border-[3px]"
              style={{ borderColor: 'var(--ed-border-strong)', opacity: 0.5 }}
            />
            {/* spinning arc */}
            <div
              className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent"
              style={{
                borderTopColor: 'var(--ed-accent)',
                borderRightColor: 'var(--ed-accent)',
                animationDuration: '0.7s',
              }}
            />
          </div>
          <p
            className="text-xs font-medium tracking-wide"
            style={{ color: 'var(--ed-fg-muted)' }}
          >
            {t('canvas.loadingFrame')}
          </p>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-5 flex justify-center pointer-events-none">
        <div className="bg-black/75 backdrop-blur-md border border-white/15 rounded-full px-4 py-1.5 text-xs font-medium text-white/95 shadow-lg">
          {t('canvas.hint')}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import * as PIXI from 'pixi.js'
import {
  useEditorStore,
  OSS_PREFIX,
  getAspectRatioValue,
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

function rebuildTextureMat(
  container: PIXI.Container,
  texture: PIXI.Texture,
  matX: number, matY: number, matW: number, matH: number,
  border: number
) {
  container.removeChildren()
  if (border <= 0) return
  const ts = new PIXI.TilingSprite({
    texture,
    width: Math.max(1, matW),
    height: Math.max(1, matH),
    tileScale: new PIXI.Point(matW / texture.width, matH / texture.height),
  })
  ts.x = matX
  ts.y = matY
  container.addChild(ts)
  const bev = new PIXI.Graphics()
  bev.rect(matX + border, matY + border, matW - border * 2, 3).fill({ color: 0x000000, alpha: 0.18 })
  bev.rect(matX + border, matY + border, 3, matH - border * 2).fill({ color: 0x000000, alpha: 0.18 })
  container.addChild(bev)
}

// ─── Layer state ──────────────────────────────────────────────────────────────

interface Layers {
  // Background (not zoomable)
  bgContainer: PIXI.Container
  bgSprite: PIXI.Sprite | null
  bgGraphics: PIXI.Graphics

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
  overlayText: PIXI.Text
  overlaySubText: PIXI.Text

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

      const overlayText = new PIXI.Text({
        text: 'Click here to\nupload',
        style: new PIXI.TextStyle({
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 26, fontWeight: '700',
          fill: '#111111', align: 'center',
          wordWrap: true, wordWrapWidth: 220, lineHeight: 34,
        }),
      })
      overlayText.anchor.set(0.5)

      const overlaySubText = new PIXI.Text({
        text: 'Scroll to zoom',
        style: new PIXI.TextStyle({
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 14, fill: '#666666',
        }),
      })
      overlaySubText.anchor.set(0.5, 0)

      uploadOverlay.addChild(overlayBg, overlayText, overlaySubText)
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

      // Design group z-order: shadow → white/mat → artwork → frame (top) → overlay
      // Frame on top so its inner shadow textures overlay artwork naturally
      designGroup.addChild(shadowG, matSolidG, matTexCont, artworkCont, frameCont, uploadOverlay)

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
        bgContainer, bgSprite: null, bgGraphics,
        designGroup, shadowG, frameCont,
        matSolidG, matTexCont,
        artworkCont, artMask,
        uploadOverlay, overlayBg, overlayText, overlaySubText,
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
          useEditorStore.getState().setArtworkPosition(
            origX + e.globalX - startX,
            origY + e.globalY - startY,
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
          const next = Math.min(8, Math.max(0.1, s.artworkScale * factor))
          s.setArtworkScale(next)
        } else {
          const next = Math.min(3, Math.max(0.3, s.designZoom * factor))
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
    const interior: ApiScene | null = s.selectedInterior
    const scenery: ApiScene | null = s.selectedScenery
    const matSizeItem = s.selectedMatSize
    const matColorItem = s.selectedMatColor
    const matTextureItem = s.selectedMatTexture
    const matBorderItem = s.selectedMatBorder
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
    const orientation: 'landscape' | 'portrait' = isCustom
      ? (s.customWidthCm < s.customHeightCm ? 'portrait' : 'landscape')
      : (s.frameAspectRatio === 'portrait' ? 'portrait' : 'landscape')

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
      frameX0 = posCenterX - outerW / 2
      frameY0 = posCenterY - outerH / 2
    } else {
      // Default viewport cap — fits frame to 55% W / 65% H of canvas.
      let maxW = Math.max(W * 0.55, 280)
      let maxH = Math.max(H * 0.65, 280)
      // In Custom mode the cm Width × Height ALSO scale the displayed
      // frame: bigger cm → bigger preview, until the dim crosses the
      // reference size (CUSTOM_REF_CM) where the frame is at full
      // viewport size. Small frames stay smaller; large frames are
      // capped so the preview never escapes the canvas. The frame outer
      // aspect stays at the source PNG's native ratio (no stretch).
      if (isCustom) {
        const CUSTOM_REF_CM = 60 // cm dim that fills the viewport box
        const maxCm = Math.max(1, s.customWidthCm, s.customHeightCm)
        const scale = Math.max(0.2, Math.min(1, maxCm / CUSTOM_REF_CM))
        maxW *= scale
        maxH *= scale
      }
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

    // Mat border from selected mat size ratio (0 when none → no gap)
    const matRatio = matSizeItem?.leftRatio ?? 0
    const matBorder = Math.round(Math.min(contentW, contentH) * matRatio)

    const matX = contentX
    const matY = contentY
    const matTotalW = contentW
    const matTotalH = contentH

    // Picture rect ALWAYS fills the available opening (after the Mat
    // Size border). This holds for all three modes:
    //   - landscape / portrait → picture fills the picked PNG's opening.
    //   - custom               → cm Width × Height drive the orientation
    //     pick (landscape PNG vs portrait PNG) and act as a print-size
    //     annotation; the picture still fills the opening so the frame
    //     "fits" the image and there's no visible empty mat gap.
    const openX = contentX + matBorder
    const openY = contentY + matBorder
    const openW = Math.max(contentW - matBorder * 2, 20)
    const openH = Math.max(contentH - matBorder * 2, 20)

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

    if (frame) {
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

    // Mat strips (drawn on top of white backing, below artwork)
    if (matBorder > 0) {
      // Texture tab overrides color tab for mat appearance
      const texUrl = matTextureItem?.ossUrl ? resolveUrl(matTextureItem.ossUrl) : ''
      const matColor = matColorItem?.color || ''

      if (texUrl) {
        const cached = texCache.get(texUrl)
        if (cached) {
          rebuildTextureMat(L.matTexCont, cached, matX, matY, matTotalW, matTotalH, matBorder)
        } else {
          loadTexture(texUrl).then(tex => {
            const L2 = layersRef.current
            if (!L2 || !tex) return
            rebuildTextureMat(L2.matTexCont, tex, matX, matY, matTotalW, matTotalH, matBorder)
          })
        }
      } else if (matColor) {
        drawSolidMatStrips(L.matSolidG, matX, matY, matTotalW, matTotalH, matBorder, matColor)
      } else {
        // Size selected but no color/texture yet — default off-white mat
        drawSolidMatStrips(L.matSolidG, matX, matY, matTotalW, matTotalH, matBorder, 'f8f8f8')
      }

      // Mat inner border line (Border tab)
      if (matBorderItem?.ossUrl) {
        const borderLineUrl = resolveUrl(matBorderItem.ossUrl)
        const borderW = 2 // thin inner line
        const cached = texCache.get(borderLineUrl)
        const drawBorderLine = (tex: PIXI.Texture) => {
          const bCont = new PIXI.Container()
          // Top line
          const top = new PIXI.TilingSprite({ texture: tex, width: openW, height: borderW })
          top.x = openX; top.y = openY - borderW
          bCont.addChild(top)
          // Bottom line
          const bot = new PIXI.TilingSprite({ texture: tex, width: openW, height: borderW })
          bot.x = openX; bot.y = openY + openH
          bCont.addChild(bot)
          // Left line
          const left = new PIXI.TilingSprite({ texture: tex, width: borderW, height: openH + borderW * 2 })
          left.x = openX - borderW; left.y = openY - borderW
          bCont.addChild(left)
          // Right line
          const right = new PIXI.TilingSprite({ texture: tex, width: borderW, height: openH + borderW * 2 })
          right.x = openX + openW; right.y = openY - borderW
          bCont.addChild(right)
          L.matTexCont.addChild(bCont)
        }
        if (cached) {
          drawBorderLine(cached)
        } else {
          loadTexture(borderLineUrl).then(tex => {
            if (!tex || !layersRef.current) return
            drawBorderLine(tex)
          })
        }
      } else if (matBorderItem?.color) {
        // Solid color border line
        const bw = 2
        const c = hexToNum(matBorderItem.color)
        L.matSolidG.rect(openX - bw, openY - bw, openW + bw * 2, bw).fill({ color: c })
        L.matSolidG.rect(openX - bw, openY + openH, openW + bw * 2, bw).fill({ color: c })
        L.matSolidG.rect(openX - bw, openY, bw, openH).fill({ color: c })
        L.matSolidG.rect(openX + openW, openY, bw, openH).fill({ color: c })
      }
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
        sp.width = bw * s.artworkScale
        sp.height = bh * s.artworkScale
        sp.x = openX + openW / 2 + s.artworkX
        // sp.anchor.y = 0 → sp.y is the picture's top edge. artworkY = 0
        // therefore pins the top of the picture to the top of the opening;
        // any drag stores a positive Y to shift the picture down, negative
        // to shift it up.
        sp.y = openY + s.artworkY
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
      // Scale the upload text + sub-text to the picture rect so the
      // overlay never overflows on small openings (e.g. interior scenes
      // with a compact position rect on the wall). The main text is
      // sized off the smaller axis with a generous floor/ceiling so it
      // stays readable. The subtext hides when the opening is too small
      // to fit it gracefully.
      const minDim = Math.min(openW, openH)
      const mainSize = Math.max(8, Math.min(26, Math.round(minDim / 6.5)))
      const subSize = Math.max(7, Math.min(14, Math.round(minDim / 14)))
      const showSub = openH > mainSize * 3 && openW > 80
      L.overlayText.style.fontSize = mainSize
      L.overlayText.style.lineHeight = mainSize * 1.3
      L.overlayText.style.wordWrapWidth = Math.max(40, openW * 0.85)
      L.overlaySubText.style.fontSize = subSize
      L.overlaySubText.visible = showSub
      L.overlayText.x = openX + openW / 2
      const subGap = showSub ? subSize * 0.5 : 0
      L.overlayText.y = openY + openH / 2 - L.overlayText.height / 2 - subGap
      L.overlaySubText.x = openX + openW / 2
      L.overlaySubText.y = L.overlayText.y + L.overlayText.height + 2
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

  // ── Inspector collapse / expand → flush PIXI buffer before paint ─────────
  // The canvas element has CSS width/height: 100% so it always fills its
  // container. When the right inspector collapses, the flex layout
  // immediately gives that space to the canvas main area. Without this
  // synchronous resize, the browser would paint the OLD drawing buffer
  // pixels stretched into the NEW (wider) CSS box for at least one frame,
  // producing a visible anisotropic stretch. useLayoutEffect runs after
  // React's DOM commit but BEFORE the next browser paint — we resize the
  // renderer + redraw in that gap so the first paint already shows the
  // correctly-sized buffer.
  const inspectorCollapsed = useEditorStore((s) => s.inspectorCollapsed)
  useLayoutEffect(() => {
    const app = appRef.current
    if (!app) return
    try {
      app.resize()
    } catch {
      /* renderer torn down */
    }
    render()
  }, [inspectorCollapsed, render])

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
      <div className="absolute inset-x-0 bottom-5 flex justify-center pointer-events-none">
        <div className="bg-black/75 backdrop-blur-md border border-white/15 rounded-full px-4 py-1.5 text-xs font-medium text-white/95 shadow-lg">
          Scroll over picture = zoom picture · Scroll outside = zoom frame · Drag to reposition
        </div>
      </div>
    </div>
  )
}

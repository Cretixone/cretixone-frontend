import { useEffect, useRef, useCallback } from 'react'
import * as PIXI from 'pixi.js'
import { useEditorStore, OSS_PREFIX, getAspectRatioValue } from '@/store/editorStore'
import type { ApiFrame, ApiScene, ApiEffectItem } from '@/types/api'
import { useCanvasSize } from '@/hooks/useCanvasSize'
import { useImageUpload } from '@/hooks/useImageUpload'
import type { PieceBox } from '@/data/localFrames'
import {
  isLocalFrame,
  getCachedLocalFrame,
  getLocalFrameGeometry,
  loadLocalFrame,
} from '@/data/localFrames'

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

async function loadTexture(url: string): Promise<PIXI.Texture | null> {
  if (!url) return null
  if (texCache.has(url)) return texCache.get(url)!
  try {
    const tex = await PIXI.Assets.load(url)
    texCache.set(url, tex)
    return tex
  } catch {
    console.warn('[FrameDesigner] Could not load texture:', url)
    return null
  }
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

function mountSprite(L: Layers, tex: PIXI.Texture, renderFn: () => void) {
  if (L.artSprite) {
    L.artworkCont.removeChild(L.artSprite)
    L.artSprite.destroy()
  }
  const sp = new PIXI.Sprite(tex)
  sp.anchor.set(0.5)
  sp.eventMode = 'static'
  sp.cursor = 'grab'
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
  // Cached single-canvas composite used to render local frames with
  // pixel-perfect (seam-free) joints. Keyed on the geometry inputs that
  // affect what gets baked.
  const localCompositeRef = useRef<{
    canvas: HTMLCanvasElement
    minX: number
    minY: number
    compositeW: number
    compositeH: number
    key: string
  } | null>(null)
  const { openFilePicker, handleDrop, handleDragOver } = useImageUpload()

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    let cancelled = false
    const app = new PIXI.Application()

    const boot = async () => {
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

      // ── Build layer tree ────────────────────────────────────────────────

      // 1. Background container (not zoomable)
      const bgContainer = new PIXI.Container()
      const bgGraphics = new PIXI.Graphics()
      bgContainer.addChild(bgGraphics)

      // 2. Design group (zoomable)
      const designGroup = new PIXI.Container()
      const shadowG = new PIXI.Graphics()
      const frameCont = new PIXI.Container()
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
      uploadOverlay.on('pointerdown', () => openFilePicker())

      artworkCont.addChild(artMask)
      artworkCont.mask = artMask
      artworkCont.eventMode = 'static'

      // Design group z-order: shadow → white/mat → artwork → frame (top) → overlay
      // Frame on top so its inner shadow textures overlay artwork naturally
      designGroup.addChild(shadowG, matSolidG, matTexCont, artworkCont, frameCont, uploadOverlay)

      // 3. Front container (foreground objects from interior scenes)
      const frontContainer = new PIXI.Container()

      // 4. Effect container (not zoomable)
      const effectContainer = new PIXI.Container()

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

      // ── Artwork drag ──────────────────────────────────────────────────
      let dragging = false
      let startX = 0, startY = 0, origX = 0, origY = 0

      artworkCont.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
        if (!layersRef.current?.artSprite) return
        dragging = true
        startX = e.globalX; startY = e.globalY
        origX = useEditorStore.getState().artworkX
        origY = useEditorStore.getState().artworkY
      })
      app.stage.on('pointermove', (e: PIXI.FederatedPointerEvent) => {
        if (!dragging) return
        useEditorStore.getState().setArtworkPosition(
          origX + e.globalX - startX,
          origY + e.globalY - startY
        )
      })
      const stopDrag = () => { dragging = false }
      app.stage.on('pointerup', stopDrag)
      app.stage.on('pointerupoutside', stopDrag)

      // ── Wheel zoom — zooms design group only ──────────────────────────
      ;(app.canvas as HTMLElement).addEventListener('wheel', (e: WheelEvent) => {
        e.preventDefault()
        const s = useEditorStore.getState()
        const newZoom = Math.min(3, Math.max(0.3, s.designZoom * (e.deltaY < 0 ? 1.06 : 0.94)))
        s.setDesignZoom(newZoom)
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
    L.designGroup.x = cx - cx * zoom
    L.designGroup.y = cy - cy * zoom

    // ── Compute frame dimensions ────────────────────────────────────────
    const interiorPos = (bgMode === 'interior' && interior?.position) ? interior.position : null
    // Aspect ratio = width / height. 'auto' (the default) keeps the legacy
    // canvas-fit behaviour where the frame is always square. Anything else
    // sizes the longer axis to fit and derives the shorter from the ratio.
    const aspectRatio = s.frameAspectRatio === 'auto'
      ? 1
      : getAspectRatioValue(s.frameAspectRatio)
    let outerW: number, outerH: number, frameX0: number, frameY0: number

    if (interiorPos && bgSceneW > 0) {
      // Map interior position to canvas coordinates
      const posCanvasW = interiorPos.w * bgScale
      const posCanvasH = interiorPos.h * bgScale
      const posCenterX = bgOffX + (interiorPos.x + interiorPos.w / 2) * bgScale
      const posCenterY = bgOffY + (interiorPos.y + interiorPos.h / 2) * bgScale
      if (s.frameAspectRatio === 'auto') {
        // Legacy: square frame fit to the smaller side
        const outerSize = Math.min(posCanvasW, posCanvasH)
        outerW = outerSize
        outerH = outerSize
      } else {
        // Fit the user-chosen aspect inside the interior's position box.
        const fitByW = posCanvasW / aspectRatio <= posCanvasH
        outerW = fitByW ? posCanvasW : posCanvasH * aspectRatio
        outerH = fitByW ? posCanvasW / aspectRatio : posCanvasH
      }
      frameX0 = posCenterX - outerW / 2
      frameY0 = posCenterY - outerH / 2
    } else {
      // Default: centered, sized to fit the viewport at the chosen ratio.
      // The "auto" path keeps the original square-fit behaviour exactly.
      if (s.frameAspectRatio === 'auto') {
        const outerSize = Math.max(Math.min(W * 0.55, H * 0.65), 280)
        outerW = outerSize
        outerH = outerSize
      } else {
        // Cap to roughly the same area the auto fit allowed (55% W × 65% H),
        // then crop to the chosen aspect ratio so portrait and landscape
        // both feel like "as large as the viewport can comfortably show."
        const maxW = Math.max(W * 0.55, 280)
        const maxH = Math.max(H * 0.65, 280)
        const fitByW = maxW / aspectRatio <= maxH
        outerW = fitByW ? maxW : maxH * aspectRatio
        outerH = fitByW ? maxW / aspectRatio : maxH
      }
      frameX0 = cx - outerW / 2
      frameY0 = cy - outerH / 2
    }

    // Detect frame type and compute border thickness
    const dto = (frame?.isOtherFrame && frame.otherFrameInfoDTO) ? frame.otherFrameInfoDTO : null
    // Slider 5–30 maps directly to 5–30% of smaller dimension per side
    let framePx = Math.round(Math.min(outerW, outerH) * s.frameWidth / 100)
    // For local frames the corner image extends a per-axis amount
    // inward — horizontally `cornerBboxW × framePx / verticalThicknessSrc`
    // and vertically `cornerBboxH × framePx / horizontalThicknessSrc`.
    // Two corners must fit within outerW (horizontally) and outerH
    // (vertically). Clamp framePx so neither axis overflows. API frames
    // are unaffected.
    if (frame && isLocalFrame(frame)) {
      const geom = getLocalFrameGeometry(frame.id)
      if (geom) {
        const ratioH = geom.cornerBboxW / geom.verticalThicknessSrc
        const ratioV = geom.cornerBboxH / geom.horizontalThicknessSrc
        const maxFramePxH = Math.floor(outerW / 2 / ratioH)
        const maxFramePxV = Math.floor(outerH / 2 / ratioV)
        const maxFramePx = Math.min(maxFramePxH, maxFramePxV)
        if (framePx > maxFramePx) framePx = maxFramePx
      }
    }

    // Content area inside the frame border
    // For "other" frames, derive from otherFrameInfoDTO proportions
    let contentX: number, contentY: number, contentW: number, contentH: number

    if (dto) {
      const srcW = (dto.leftW || 0) + (dto.cropWidth || 1) + (dto.rightW || 0)
      const srcH = (dto.topH || 0) + (dto.cropHeight || 1) + (dto.downH || 0)
      contentX = frameX0 + Math.round(outerW * (dto.leftW || 0) / srcW)
      contentY = frameY0 + Math.round(outerH * (dto.topH || 0) / srcH)
      contentW = Math.round(outerW * (dto.cropWidth || 1) / srcW)
      contentH = Math.round(outerH * (dto.cropHeight || 1) / srcH)
    } else {
      contentX = frameX0 + framePx
      contentY = frameY0 + framePx
      contentW = outerW - framePx * 2
      contentH = outerH - framePx * 2
    }

    // Mat border from selected mat size ratio (0 when none → no gap)
    const matRatio = matSizeItem?.leftRatio ?? 0
    const matBorder = Math.round(Math.min(contentW, contentH) * matRatio)

    const openW = Math.max(contentW - matBorder * 2, 20)
    const openH = Math.max(contentH - matBorder * 2, 20)
    const matX = contentX
    const matY = contentY
    const matTotalW = contentW
    const matTotalH = contentH
    const openX = matX + matBorder
    const openY = matY + matBorder

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
      const prefix = frame.urlPrefix || OSS_PREFIX

      // Check which pieces have valid images
      const pieceImages = [
        frame.leftUpImg, frame.upImg, frame.rightUpImg,
        frame.leftImg, frame.rightImg,
        frame.leftDownImg, frame.downImg, frame.rightDownImg,
      ]
      const validPieceCount = pieceImages.filter(img => img && img.length > 0).length

      if (dto && dto.cropBackground) {
        // ── "Other" frame: single image with transparent inner area ──
        const frameImgUrl = dto.cropBackground
        const cached = texCache.get(frameImgUrl)
        if (cached) {
          const sp = new PIXI.Sprite(cached)
          sp.x = frameX0; sp.y = frameY0
          sp.width = outerW; sp.height = outerH
          L.frameCont.addChild(sp)
          L.loadedFrameId = frame.id
        } else {
          const snap = frame.id
          L.loadedFrameId = snap
          loadTexture(frameImgUrl).then(() => {
            const L2 = layersRef.current
            if (!L2 || L2.loadedFrameId !== snap) return
            render()
          })
        }

      } else if (validPieceCount >= 4) {
        // ── 8-piece frame construction ──
        // Two paths:
        //
        // 1. LOCAL FRAME PATH — uses per-piece moulding-box geometry
        //    (LocalFrameGeometry) to position each piece so the visible
        //    moulding (not the transparent outer-shadow padding around
        //    it) aligns exactly with the frame's outer edge. Each piece
        //    can have different shadow padding on different sides; the
        //    image gets drawn slightly larger than the visible moulding
        //    rectangle, with the extra extending outward into the
        //    shadow space — never overlapping a neighbor.
        //
        // 2. API FRAME PATH — keeps the existing simple model where
        //    every piece exactly fills its visible slot (corners are
        //    framePx × framePx, sticks are framePx thick). API frame
        //    assets are designed for this model.

        const localGeom = frame && isLocalFrame(frame)
          ? getLocalFrameGeometry(frame.id)
          : null
        const localLoaded = frame && isLocalFrame(frame)
          ? getCachedLocalFrame(frame.id)
          : null

        // Kick off the eager local-frame load if we haven't yet, so the
        // geometry-aware path can take over once images are ready.
        if (frame && isLocalFrame(frame) && !localLoaded) {
          const snap = frame.id
          void loadLocalFrame(frame.id)?.then(() => {
            const L2 = layersRef.current
            if (!L2) return
            const s2 = useEditorStore.getState()
            const current = frameOverrideRef.current ?? s2.selectedFrame
            if (current?.id !== snap) return
            render()
          })
        }

        if (localGeom && localLoaded) {
          // ── LOCAL FRAME: single-canvas composite ──
          // Bake all 8 pieces onto ONE offscreen canvas at super-sampled
          // resolution and hand it to PIXI as a single sprite. Eliminates
          // inter-piece sampling seams that would appear at design-group
          // zoom even with mathematically perfect geometry.
          // eslint-disable-next-line no-console
          console.log(
            `[CanvasStage] composite render frame=${frame.id} ` +
              `cornerStyle=${localGeom.cornerStyle} ` +
              `cornerFillColor=${localGeom.cornerFillColor} ` +
              `framePx=${framePx}`,
          )
          const sxCorner = framePx / localGeom.verticalThicknessSrc
          const syCorner = framePx / localGeom.horizontalThicknessSrc
          const cornerCanvasW = localGeom.cornerBboxW * sxCorner
          const cornerCanvasH = localGeom.cornerBboxH * syCorner
          const sideH = Math.max(1, outerW - 2 * cornerCanvasW)
          const sideV = Math.max(1, outerH - 2 * cornerCanvasH)

          // Frame-local coordinates (0,0 = visible top-left of the
          // frame). Composite cache is independent of the stage position.
          type LocalSlot = {
            img: HTMLImageElement
            box: PieceBox
            tX: number; tY: number; tW: number; tH: number
            kind: 'corner' | 'stick'
          }
          const slots: LocalSlot[] = [
            { img: localLoaded.images.leftUp,    box: localGeom.pieces.leftUp,
              tX: 0,                          tY: 0,
              tW: cornerCanvasW,              tH: cornerCanvasH,
              kind: 'corner' },
            { img: localLoaded.images.up,        box: localGeom.pieces.up,
              tX: cornerCanvasW,              tY: 0,
              tW: sideH,                      tH: framePx,
              kind: 'stick' },
            { img: localLoaded.images.rightUp,   box: localGeom.pieces.rightUp,
              tX: outerW - cornerCanvasW,     tY: 0,
              tW: cornerCanvasW,              tH: cornerCanvasH,
              kind: 'corner' },
            { img: localLoaded.images.left,      box: localGeom.pieces.left,
              tX: 0,                          tY: cornerCanvasH,
              tW: framePx,                    tH: sideV,
              kind: 'stick' },
            { img: localLoaded.images.right,     box: localGeom.pieces.right,
              tX: outerW - framePx,           tY: cornerCanvasH,
              tW: framePx,                    tH: sideV,
              kind: 'stick' },
            { img: localLoaded.images.leftDown,  box: localGeom.pieces.leftDown,
              tX: 0,                          tY: outerH - cornerCanvasH,
              tW: cornerCanvasW,              tH: cornerCanvasH,
              kind: 'corner' },
            { img: localLoaded.images.down,      box: localGeom.pieces.down,
              tX: cornerCanvasW,              tY: outerH - framePx,
              tW: sideH,                      tH: framePx,
              kind: 'stick' },
            { img: localLoaded.images.rightDown, box: localGeom.pieces.rightDown,
              tX: outerW - cornerCanvasW,     tY: outerH - cornerCanvasH,
              tW: cornerCanvasW,              tH: cornerCanvasH,
              kind: 'corner' },
          ]

          // Composite bounds (frame-local). Each piece's image may
          // extend OUTSIDE its moulding box on the outer side (shadow
          // padding) — grow the canvas so those extensions stay visible.
          let minX = 0, minY = 0, maxX = outerW, maxY = outerH
          for (const slot of slots) {
            const sx = slot.tW / slot.box.w
            const sy = slot.tH / slot.box.h
            const drawX = slot.tX - slot.box.x * sx
            const drawY = slot.tY - slot.box.y * sy
            const drawW = slot.img.naturalWidth * sx
            const drawH = slot.img.naturalHeight * sy
            if (drawX < minX) minX = drawX
            if (drawY < minY) minY = drawY
            if (drawX + drawW > maxX) maxX = drawX + drawW
            if (drawY + drawH > maxY) maxY = drawY + drawH
          }
          const compositeW = maxX - minX
          const compositeH = maxY - minY

          const cacheKey = `${frame.id}|${framePx.toFixed(2)}|${outerW.toFixed(2)}|${outerH.toFixed(2)}`
          let cached = localCompositeRef.current
          if (!cached || cached.key !== cacheKey) {
            const SUPER_SAMPLE = 2
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            const bakeScale = SUPER_SAMPLE * dpr
            const canvas = document.createElement('canvas')
            canvas.width = Math.max(1, Math.ceil(compositeW * bakeScale))
            canvas.height = Math.max(1, Math.ceil(compositeH * bakeScale))
            const cctx = canvas.getContext('2d')!
            cctx.imageSmoothingEnabled = true
            cctx.imageSmoothingQuality = 'high'
            cctx.scale(bakeScale, bakeScale)
            cctx.translate(-minX, -minY)

            for (const slot of slots) {
              const sx = slot.tW / slot.box.w
              const sy = slot.tH / slot.box.h
              const drawX = slot.tX - slot.box.x * sx
              const drawY = slot.tY - slot.box.y * sy
              const drawW = slot.img.naturalWidth * sx
              const drawH = slot.img.naturalHeight * sy
              cctx.drawImage(slot.img, drawX, drawY, drawW, drawH)

              // ── Corner backfill ──
              // Backend-uploaded frames typically have small transparent
              // pixels somewhere inside each corner image — chamfer dots
              // at the L's inner corner, exporter artifacts, AA fringes,
              // etc. The mat backing sitting behind the frame shows
              // through any such hole as a visible white "dot".
              //
              // Paint sampled moulding color BEHIND each corner's full
              // bbox using destination-over: it only writes to pixels
              // that are currently transparent, so the opaque moulding
              // (L-arms + any decorative interior) is left untouched
              // and every transparent hole inside the bbox gets filled
              // with the matching moulding color. Universal — works for
              // any uploaded frame, no per-frame configuration.
              // ── Corner dot backfill (chamfer only) ──
              // Backend frames have small transparent pixels right at
              // the L's inner corner point (the photo-opening corner)
              // that would otherwise show the mat backing as visible
              // white "dots". We paint a small box of sampled moulding
              // color BEHIND the corner JUST at that point — not the
              // whole bbox. This preserves the corner image's own
              // shadow / semi-transparent pixels (which sit elsewhere)
              // and only fills the dot area.
              //
              // The L's inner corner sits at (framePx, framePx) in
              // slot-local canvas coords for top-left, mirrored for the
              // other 3 corners. `chamfer` sizes the fill — generous
              // enough to cover the dot, small enough to not intrude
              // into the rest of the bbox.
              // ── Corner dot backfill (chamfer only) ──
              // Backend frames have small transparent pixels right at
              // the L's inner corner point (the photo-opening corner)
              // that would otherwise show the mat backing as visible
              // white "dots". We paint a small box of sampled moulding
              // color BEHIND the corner JUST at that point — not the
              // whole bbox — so the corner image's own shadow / semi-
              // transparent pixels (which sit elsewhere) are preserved.
              if (slot.kind === 'corner') {
                const chamfer = Math.max(4, Math.ceil(framePx * 0.35))
                const half = chamfer / 2
                const isLeft = slot.tX === 0
                const isTop = slot.tY === 0
                const cx = isLeft ? framePx : slot.tW - framePx
                const cy = isTop  ? framePx : slot.tH - framePx
                cctx.globalCompositeOperation = 'destination-over'
                cctx.fillStyle = localGeom.cornerFillColor
                cctx.fillRect(
                  slot.tX + cx - half,
                  slot.tY + cy - half,
                  chamfer,
                  chamfer,
                )
                cctx.globalCompositeOperation = 'source-over'
              }
            }

            cached = { canvas, minX, minY, compositeW, compositeH, key: cacheKey }
            localCompositeRef.current = cached
          }

          const tex = PIXI.Texture.from(cached.canvas)
          tex.source.scaleMode = 'linear'
          const sp = new PIXI.Sprite(tex)
          sp.x = frameX0 + cached.minX
          sp.y = frameY0 + cached.minY
          sp.width = cached.compositeW
          sp.height = cached.compositeH
          L.frameCont.addChild(sp)
          L.loadedFrameId = frame.id
        } else {
          // ── API-frame path (original 8-sprite behaviour) ──
          const pieceDefs = [
            { url: frame.leftUpImg,    x: frameX0,                        y: frameY0,                        w: framePx,              h: framePx },
            { url: frame.upImg,        x: frameX0 + framePx,              y: frameY0,                        w: outerW - framePx * 2, h: framePx },
            { url: frame.rightUpImg,   x: frameX0 + outerW - framePx,     y: frameY0,                        w: framePx,              h: framePx },
            { url: frame.leftImg,      x: frameX0,                        y: frameY0 + framePx,              w: framePx,              h: outerH - framePx * 2 },
            { url: frame.rightImg,     x: frameX0 + outerW - framePx,     y: frameY0 + framePx,              w: framePx,              h: outerH - framePx * 2 },
            { url: frame.leftDownImg,  x: frameX0,                        y: frameY0 + outerH - framePx,     w: framePx,              h: framePx },
            { url: frame.downImg,      x: frameX0 + framePx,              y: frameY0 + outerH - framePx,     w: outerW - framePx * 2, h: framePx },
            { url: frame.rightDownImg, x: frameX0 + outerW - framePx,     y: frameY0 + outerH - framePx,     w: framePx,              h: framePx },
          ]
            .filter(p => p.url && p.url.length > 0)
            .map(p => ({ ...p, url: prefix + p.url }))

          let needsLoad = false
          for (const p of pieceDefs) {
            const cached = texCache.get(p.url)
            if (cached) {
              const sp = new PIXI.Sprite(cached)
              sp.x = p.x; sp.y = p.y
              sp.width = Math.max(1, p.w); sp.height = Math.max(1, p.h)
              L.frameCont.addChild(sp)
            } else {
              needsLoad = true
            }
          }

          if (needsLoad) {
            const snap = frame.id
            L.loadedFrameId = snap
            Promise.all(pieceDefs.map(p => loadTexture(p.url))).then(() => {
              const L2 = layersRef.current
              if (!L2 || L2.loadedFrameId !== snap) return
              render()
            })
          } else {
            L.loadedFrameId = frame.id
          }
        }

      } else if (frame.imgUrl) {
        // ── Single-image frame (use imgUrl as full frame image) ──
        const frameImgUrl = frame.imgUrl
        const cached = texCache.get(frameImgUrl)
        if (cached) {
          const sp = new PIXI.Sprite(cached)
          sp.x = frameX0; sp.y = frameY0
          sp.width = outerW; sp.height = outerH
          L.frameCont.addChild(sp)
          // For non-transparent images, apply border-strip mask
          if (!frameImgUrl.endsWith('.png')) {
            const mask = new PIXI.Graphics()
            mask.rect(frameX0, frameY0, outerW, framePx).fill({ color: 0xffffff })
            mask.rect(frameX0, frameY0 + outerH - framePx, outerW, framePx).fill({ color: 0xffffff })
            mask.rect(frameX0, frameY0 + framePx, framePx, outerH - framePx * 2).fill({ color: 0xffffff })
            mask.rect(frameX0 + outerW - framePx, frameY0 + framePx, framePx, outerH - framePx * 2).fill({ color: 0xffffff })
            L.frameCont.addChild(mask)
            sp.mask = mask
          }
          L.loadedFrameId = frame.id
        } else {
          const snap = frame.id
          L.loadedFrameId = snap
          loadTexture(frameImgUrl).then(() => {
            const L2 = layersRef.current
            if (!L2 || L2.loadedFrameId !== snap) return
            render()
          })
        }
      }
    } else {
      // No frame selected — draw fallback
      L.loadedFrameId = -1
      const g = new PIXI.Graphics()
      g.rect(frameX0, frameY0, outerW, outerH).fill({ color: 0xd4c4a0 })
      g.rect(matX, matY, matTotalW, matTotalH).fill({ color: 0xffffff })
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
          mountSprite(L2, tex, render)
        }).catch((err) => {
          console.error('[FrameDesigner] Failed to load artwork:', err)
        })
      } else if (L.artSprite) {
        const sp = L.artSprite
        const tex = sp.texture
        const imgA = tex.width / tex.height
        const areaA = openW / openH
        let bw: number, bh: number
        if (imgA > areaA) { bw = openW; bh = openW / imgA }
        else { bh = openH; bw = openH * imgA }
        sp.width = bw * s.artworkScale
        sp.height = bh * s.artworkScale
        sp.x = openX + openW / 2 + s.artworkX
        sp.y = openY + openH / 2 + s.artworkY
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
      L.overlayText.style.wordWrapWidth = openW * 0.72
      L.overlayText.x = openX + openW / 2
      L.overlayText.y = openY + openH / 2 - 12
      L.overlaySubText.x = openX + openW / 2
      L.overlaySubText.y = openY + openH / 2 + L.overlayText.height / 2 - 4
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

  // ── Expose save ───────────────────────────────────────────────────────────
  useEffect(() => {
    ;(window as any).__frameSave = () => {
      const canvas = appRef.current?.canvas as HTMLCanvasElement | undefined
      if (!canvas) return
      const a = document.createElement('a')
      a.download = 'framed-artwork.png'
      a.href = canvas.toDataURL('image/png')
      a.click()
    }
  }, [])

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <div
        ref={mountRef}
        className="w-full h-full"
        onDrop={(e) => { handleDrop(e); setTimeout(render, 300) }}
        onDragOver={handleDragOver}
      />
      <div className="absolute inset-x-0 bottom-5 flex justify-center pointer-events-none">
        <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 text-xs text-gray-400">
          Drag &amp; drop image · Scroll to zoom · Drag to reposition
        </div>
      </div>
    </div>
  )
}

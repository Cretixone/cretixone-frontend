import { create } from 'zustand'
import type { ApiFrame, ApiScene, ApiPaperItem, ApiEffectItem } from '@/types/api'

// ─── Constants ───────────────────────────────────────────────────────────────

export const OSS_PREFIX = 'https://oss.aiframeit.com/'

// ─── Store ───────────────────────────────────────────────────────────────────

export type BackgroundMode = 'interior' | 'scenery' | null

// The user picks one of three options in the Ratio tab:
//   - Landscape → render the LANDSCAPE source PNG at its native aspect
//   - Portrait  → render the PORTRAIT source PNG at its native aspect
//   - Custom    → enter width × height in cm and the PNG (landscape if
//                 width ≥ height, otherwise portrait) is stretched to
//                 that aspect.
// The two fallback ratios below are only used until the picked source
// PNG has loaded; Custom always uses the cm dimensions on the store.
export type FrameAspectRatio = 'landscape' | 'portrait' | 'custom'

export const FRAME_ASPECT_RATIOS: Array<{
  id: FrameAspectRatio
  label: string
  /** Fallback width/height (used by Landscape/Portrait until the PNG
   *  loads; for Custom this is just a placeholder — the actual aspect
   *  comes from customWidthCm / customHeightCm). */
  ratio: number
  orientation: 'landscape' | 'portrait' | 'auto'
}> = [
  { id: 'landscape', label: 'Landscape', ratio: 3 / 2, orientation: 'landscape' },
  { id: 'portrait',  label: 'Portrait',  ratio: 2 / 3, orientation: 'portrait'  },
  { id: 'custom',    label: 'Custom',    ratio: 1,     orientation: 'auto'      },
]

export const getAspectRatioValue = (id: FrameAspectRatio): number => {
  const found = FRAME_ASPECT_RATIOS.find((r) => r.id === id)
  return found?.ratio ?? 1
}

// CSS pixel ↔ centimetre conversion at the standard web 96 DPI:
//   1 in = 2.54 cm, 96 px = 1 in → 1 cm ≈ 37.7952756 px.
export const PX_PER_CM = 96 / 2.54

export type EditorState = {
  // Selected API items
  selectedFrame: ApiFrame | null
  selectedInterior: ApiScene | null
  selectedScenery: ApiScene | null
  selectedEffect: ApiEffectItem | null
  backgroundMode: BackgroundMode

  // Mat — each tab controls a separate aspect (they combine together)
  selectedMatSize: ApiPaperItem | null       // Size tab → controls mat border ratio
  selectedMatColor: ApiPaperItem | null      // Color tab → solid color
  selectedMatTexture: ApiPaperItem | null    // Texture tab → texture image
  selectedMatBorder: ApiPaperItem | null     // Border tab → thin inner line

  // Sub-tabs
  activeMatTab: string
  activeEffectTab: string
  // Frame category — null = "All", a string = category slug.
  // Initial value is set on first fetch to the first category's slug
  // so a category is always active by default.
  activeFrameCategorySlug: string | null

  // Sizing
  frameAspectRatio: FrameAspectRatio
  // Custom-size dimensions in centimetres, used when frameAspectRatio === 'custom'.
  customWidthCm: number
  customHeightCm: number
  // When true, changing one custom dimension auto-updates the other to
  // keep the ratio constant (Photoshop-style aspect lock).
  customAspectLocked: boolean
  lineWidth: number               // rendered line strip thickness

  // Shadow
  shadowEnabled: boolean
  shadowBlur: number
  shadowOpacity: number

  // Artwork
  artworkImageUrl: string | null
  artworkScale: number
  artworkX: number
  artworkY: number

  // Design zoom + pan offset (used to reposition the whole frame on the
  // canvas — dragging an empty area of the canvas pans the frame).
  designZoom: number
  frameOffsetX: number
  frameOffsetY: number

  // UI
  activeSidebarTab: string
  activeControlTab: string
  // Editor chrome theme — scoped to the editor route only.
  editorTheme: 'light' | 'dark'
  // Right inspector collapsed state.
  inspectorCollapsed: boolean

  // Canvas size
  canvasWidth: number
  canvasHeight: number

  // Actions
  setSelectedFrame: (frame: ApiFrame | null) => void
  setSelectedInterior: (scene: ApiScene | null) => void
  setSelectedScenery: (scene: ApiScene | null) => void
  setSelectedEffect: (item: ApiEffectItem | null) => void
  setBackgroundMode: (mode: BackgroundMode) => void
  setSelectedMatSize: (item: ApiPaperItem | null) => void
  setSelectedMatColor: (item: ApiPaperItem | null) => void
  setSelectedMatTexture: (item: ApiPaperItem | null) => void
  setSelectedMatBorder: (item: ApiPaperItem | null) => void
  setActiveMatTab: (tab: string) => void
  setActiveEffectTab: (tab: string) => void
  setActiveFrameCategorySlug: (slug: string | null) => void
  setFrameAspectRatio: (r: FrameAspectRatio) => void
  setCustomWidthCm: (w: number) => void
  setCustomHeightCm: (h: number) => void
  setCustomAspectLocked: (locked: boolean) => void
  setLineWidth: (w: number) => void
  setShadowEnabled: (e: boolean) => void
  setShadowBlur: (b: number) => void
  setShadowOpacity: (o: number) => void
  setArtworkImageUrl: (url: string | null) => void
  setArtworkScale: (s: number) => void
  setArtworkPosition: (x: number, y: number) => void
  setDesignZoom: (z: number) => void
  setFrameOffset: (x: number, y: number) => void
  setActiveSidebarTab: (tab: string) => void
  setActiveControlTab: (tab: string) => void
  setCanvasSize: (w: number, h: number) => void
  setEditorTheme: (t: 'light' | 'dark') => void
  toggleEditorTheme: () => void
  setInspectorCollapsed: (c: boolean) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  selectedFrame: null,
  selectedInterior: null,
  selectedScenery: null,
  selectedEffect: null,
  backgroundMode: null,

  selectedMatSize: null,
  selectedMatColor: null,
  selectedMatTexture: null,
  selectedMatBorder: null,

  activeMatTab: 'Size',
  activeEffectTab: 'Light effect',
  activeFrameCategorySlug: null,

  frameAspectRatio: 'landscape',
  customWidthCm: 30,
  customHeightCm: 20,
  // Default OFF — users typing into Custom usually want two independent
  // dimensions. They can opt back into Photoshop-style lock if needed.
  customAspectLocked: false,
  lineWidth: 0,

  shadowEnabled: false,
  shadowBlur: 16,
  shadowOpacity: 0.2,

  artworkImageUrl: null,
  artworkScale: 1,
  artworkX: 0,
  artworkY: 0,

  designZoom: 1,
  frameOffsetX: 0,
  frameOffsetY: 0,

  activeSidebarTab: 'frames',
  activeControlTab: 'Width',
  editorTheme: 'light',
  inspectorCollapsed: false,

  canvasWidth: 800,
  canvasHeight: 600,

  // ── Actions ──────────────────────────────────────────────────────────────

  setSelectedFrame: (frame) => set({ selectedFrame: frame }),

  setSelectedInterior: (scene) => set({
    selectedInterior: scene,
    selectedScenery: null,
    backgroundMode: scene ? 'interior' : null,
  }),

  setSelectedScenery: (scene) => set({
    selectedScenery: scene,
    selectedInterior: null,
    backgroundMode: scene ? 'scenery' : null,
  }),

  setSelectedEffect: (item) => set({ selectedEffect: item }),

  setBackgroundMode: (mode) => set({ backgroundMode: mode }),

  // Mat selections — each tab is independent
  setSelectedMatSize: (item) => set({ selectedMatSize: item }),
  setSelectedMatColor: (item) => set({ selectedMatColor: item }),
  setSelectedMatTexture: (item) => set({ selectedMatTexture: item }),
  setSelectedMatBorder: (item) => set({ selectedMatBorder: item }),

  setActiveMatTab: (tab) => set({ activeMatTab: tab }),
  setActiveEffectTab: (tab) => set({ activeEffectTab: tab }),
  setActiveFrameCategorySlug: (slug) => set({ activeFrameCategorySlug: slug }),
  // Switching frame ratio resets ALL transient transforms — the canvas
  // zoom (designZoom), the frame pan (frameOffsetX/Y) and the picture's
  // zoom + drag offset (artworkScale, artworkX/Y) — so the new ratio
  // renders at its natural moderate viewport-fit size with the picture
  // re-fitted to the new opening's top edge. Users can re-zoom and
  // pan again after the change.
  setFrameAspectRatio: (r) => set({
    frameAspectRatio: r,
    designZoom: 1,
    frameOffsetX: 0,
    frameOffsetY: 0,
    artworkScale: 1,
    artworkX: 0,
    artworkY: 0,
  }),
  setCustomWidthCm: (w) => set({ customWidthCm: w }),
  setCustomHeightCm: (h) => set({ customHeightCm: h }),
  setCustomAspectLocked: (locked) => set({ customAspectLocked: locked }),
  setLineWidth: (w) => set({ lineWidth: w }),
  setShadowEnabled: (e) => set({ shadowEnabled: e }),
  setShadowBlur: (b) => set({ shadowBlur: b }),
  setShadowOpacity: (o) => set({ shadowOpacity: o }),
  setArtworkImageUrl: (url) => set({ artworkImageUrl: url, artworkX: 0, artworkY: 0, artworkScale: 1 }),
  setArtworkScale: (s) => set({ artworkScale: s }),
  setArtworkPosition: (x, y) => set({ artworkX: x, artworkY: y }),
  setDesignZoom: (z) => set({ designZoom: z }),
  setFrameOffset: (x, y) => set({ frameOffsetX: x, frameOffsetY: y }),
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),
  setActiveControlTab: (tab) => set({ activeControlTab: tab }),
  setCanvasSize: (w, h) => set({ canvasWidth: w, canvasHeight: h }),
  setEditorTheme: (t) => set({ editorTheme: t }),
  toggleEditorTheme: () => set((s) => ({ editorTheme: s.editorTheme === 'light' ? 'dark' : 'light' })),
  setInspectorCollapsed: (c) => set({ inspectorCollapsed: c }),
}))

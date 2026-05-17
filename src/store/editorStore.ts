import { create } from 'zustand'
import type { ApiFrame, ApiScene, ApiPaperItem, ApiEffectItem } from '@/types/api'

// ─── Constants ───────────────────────────────────────────────────────────────

export const OSS_PREFIX = 'https://oss.aiframeit.com/'

// ─── Store ───────────────────────────────────────────────────────────────────

export type BackgroundMode = 'interior' | 'scenery' | null

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
  frameWidth: number              // 5–30, grows inward
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

  // Design zoom
  designZoom: number

  // UI
  activeSidebarTab: string
  activeControlTab: string

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
  setFrameWidth: (w: number) => void
  setLineWidth: (w: number) => void
  setShadowEnabled: (e: boolean) => void
  setShadowBlur: (b: number) => void
  setShadowOpacity: (o: number) => void
  setArtworkImageUrl: (url: string | null) => void
  setArtworkScale: (s: number) => void
  setArtworkPosition: (x: number, y: number) => void
  setDesignZoom: (z: number) => void
  setActiveSidebarTab: (tab: string) => void
  setActiveControlTab: (tab: string) => void
  setCanvasSize: (w: number, h: number) => void
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

  frameWidth: 10,
  lineWidth: 0,

  shadowEnabled: false,
  shadowBlur: 16,
  shadowOpacity: 0.2,

  artworkImageUrl: null,
  artworkScale: 1,
  artworkX: 0,
  artworkY: 0,

  designZoom: 1,

  activeSidebarTab: 'frames',
  activeControlTab: 'Width',

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
  setFrameWidth: (w) => set({ frameWidth: w }),
  setLineWidth: (w) => set({ lineWidth: w }),
  setShadowEnabled: (e) => set({ shadowEnabled: e }),
  setShadowBlur: (b) => set({ shadowBlur: b }),
  setShadowOpacity: (o) => set({ shadowOpacity: o }),
  setArtworkImageUrl: (url) => set({ artworkImageUrl: url, artworkX: 0, artworkY: 0, artworkScale: 1 }),
  setArtworkScale: (s) => set({ artworkScale: s }),
  setArtworkPosition: (x, y) => set({ artworkX: x, artworkY: y }),
  setDesignZoom: (z) => set({ designZoom: z }),
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),
  setActiveControlTab: (tab) => set({ activeControlTab: tab }),
  setCanvasSize: (w, h) => set({ canvasWidth: w, canvasHeight: h }),
}))

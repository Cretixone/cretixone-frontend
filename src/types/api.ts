// ─── Base API response ────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  code: number
  msg?: string
  data: T
}

// ─── Frame ───────────────────────────────────────────────────────────────────
//
// Each frame ships two full-frame PNGs (landscape + portrait) plus a square
// thumbnail. The editor renders whichever full-frame matches the active
// aspect ratio.

export interface ApiFrame {
  id: number                              // hashed-uuid number so it can coexist with frameit ids
  categoryId: string | null
  categorySlug: string | null
  isVip: boolean
  isNew: boolean
  imgUrl: string                          // sidebar thumbnail
  landscapeUrl: string                    // full-frame landscape PNG
  portraitUrl: string                     // full-frame portrait PNG
}

// ─── Scene (findScene — Interiors & Scenery) ─────────────────────────────────

export interface ApiScene {
  id: number
  type: number
  isVip: boolean
  isSuper: boolean
  ossUrl: string
  rightId: number
  haveScope: boolean
  position: { x: number; y: number; w: number; h: number } | null
  isNew: boolean
  sceneWidth: number
  sceneHeight: number
  scaleLevel: number
  scaleChecked: boolean
  scaleListOrder: number
  isFull: boolean
  displayModel: boolean
  frontOssUrl: string | null
  frontPos: { x: number; y: number; w: number; h: number } | null
  supportSideView: boolean
  sideThickness: number
  frontSceneId: number
  sideSceneId: number
  perspectiveParams: unknown
  sceneSize: number
  layoutPosition: { x: number; y: number; w: number; h: number }
  shadowPreset: number
  shadowDegree: number
  shadowOpacity: number
  classify: number
  sceneObject: unknown
}

// ─── Paper / Mat (findPaper) ─────────────────────────────────────────────────

export interface ApiPaperItem {
  id: number
  type: number
  isVip: boolean
  ossUrl: string
  color: string
  leftRatio: number | null
  topRatio: number | null
  rightRatio: number | null
  bottomRatio: number | null
  rightId: number
}

export interface ApiPaperCategory {
  id: number
  name: string
  englishName: string
  imgs: ApiPaperItem[]
}

// ─── Special Effects (findSpecialEffects) ────────────────────────────────────

export interface ApiEffectItem {
  id: number
  type: number
  listOrder: number
  englishName: string
  filterName: string
  filterValue: string
  acrossUrl: string
  img: string
  verticalUrl: string
  squareUrl: string
  isVip: boolean
  rightId: number
  blendPosition: string
  hadSlider: boolean
  blendMode: string
  opacity: number
  isTransparent: boolean
  supportSideView: boolean
  sideFullUrl: string | null
  sideSquareUrl: string | null
  sideAcrossUrl: string | null
}

export interface ApiEffectCategory {
  id: number
  name: string
  englishName: string
  list: ApiEffectItem[]
}

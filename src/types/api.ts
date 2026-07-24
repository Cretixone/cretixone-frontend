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
  name: string
  categoryId: string | null
  nameAr?: string | null
  descriptionAr?: string | null
  categorySlug: string | null
  isVip: boolean
  isNew: boolean
  imgUrl: string                          // sidebar thumbnail
  landscapeUrl: string                    // full-frame landscape PNG
  portraitUrl: string                     // full-frame portrait PNG
  squareUrl: string | null                // optional 1:1 PNG (falls back to landscape)
  pricePerCm: number                      // price per cm; Frame Price = pricePerCm × (w + h) × 2
  oldPricePerCm: number                   // display-only "was" rate (struck-through); never used in calculations
  sizeFrom: number                        // min manufacturable size (cm)
  sizeTo: number                          // max manufacturable size (cm)
  description: string | null              // product description (whitespace preserved)
  gallery: string[]                       // extra product images (resolved URLs)
  specifications: Record<string, string>  // spec sheet { label: value }
}

// ─── Frame size preset (Cretixone backend — admin-managed) ───────────────────

export interface ApiFrameSize {
  id: string
  name: string
  widthCm: number
  lengthCm: number
  isActive: boolean
  sortOrder: number
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

// ─── Mat (Cretixone backend — admin-managed) ─────────────────────────────────
//
// Mat sizes and colors are managed in the admin and served by our own backend
// (/mats/sizes/public, /mats/colors/public). A mat SIZE is a border width in
// cm plus a flat price added to the framed item; a mat COLOR is a solid hex.

export interface ApiMatSize {
  id: string
  name: string
  widthCm: number          // border width (cm) — drives the on-canvas thickness
  price: number            // flat price (OMR) added once when selected
  isActive: boolean
  sortOrder: number
}

export interface ApiMatColor {
  id: string
  name: string
  color: string            // 6-digit hex, no leading "#"
  isActive: boolean
  sortOrder: number
}

// ─── MDF backing board (Cretixone backend — admin-managed) ───────────────────
//
// MDF price = pricePerCm × (frameWidthCm × frameLengthCm). The thickness (mm)
// is a descriptive spec; imgUrl is the uploaded board photo (resolved to an
// absolute URL on fetch).

export interface ApiMdf {
  id: string
  name: string
  thicknessMm: number      // board thickness (mm) — spec/label only
  imgUrl: string           // board photo (resolved absolute URL)
  pricePerCm: number       // price per cm² of frame face
  isActive: boolean
  sortOrder: number
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

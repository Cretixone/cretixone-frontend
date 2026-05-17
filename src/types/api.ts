// ─── Base API response ────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  code: number
  msg?: string
  data: T
}

// ─── Frame (findFrame) ───────────────────────────────────────────────────────

export interface ApiFrame {
  urlPrefix: string
  id: number
  type: number
  // Cretixone backend frames carry a category id so the user-side sidebar
  // can show category tabs. Bundled/local frames leave this undefined.
  categoryId?: string | null
  categorySlug?: string | null
  isVip: boolean
  isSuper: boolean
  leftUpWidth: number
  leftUpHeight: number
  leftUpImg: string
  upShadowHeight: number
  upHeight: number
  upImg: string
  rightUpWidth: number
  rightUpHeight: number
  rightUpImg: string
  rightWidth: number
  rightShadowWidth: number
  rightNeiShadowWidth: number
  rightImg: string
  rightDownWidth: number
  rightDownHeight: number
  rightDownImg: string
  downHeight: number
  downShadowHeight: number
  downNeiShadowHeight: number
  downImg: string
  leftDownWidth: number
  leftDownHeight: number
  leftDownImg: string
  leftWidth: number
  leftShadowWidth: number
  leftImg: string
  roundBorder: number | null
  imgUrl: string
  isScroll: number
  round: number | null
  rightId: number
  supportFormat: number
  supportShadow: boolean
  supportInnerShadow: boolean
  leftUpRoundParam: number
  rightUpRoundParam: number
  rightDownRoundParam: number
  leftDownRoundParam: number
  colorLevel: number
  colorListOrder: number
  isNew: boolean
  isOtherFrame: boolean
  otherFrameInfoDTO: {
    frameWidth: number
    frameHeight: number
    topH: number
    rightW: number
    downH: number
    leftW: number
    path: string
    cropWidth: number
    cropHeight: number
    cropBackground: string
  } | null
  frameWidth: number
  horizontalAxis: number
  supportSideView: boolean
  sideViewMethod: number
  topSideImg: string | null
  middleSideImg: string | null
  bottomSideImg: string | null
  frontFrameId: number
  sideFrameId: number
  frameShadowPreset: number
  frameShadowOpacity: number
  supportPaper: boolean
  frameShadowImgInfoList: unknown
  supportPutShadow: boolean
  accessoryInfoList: unknown[]
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

import { createApi } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn } from '@reduxjs/toolkit/query'
import type { AxiosRequestConfig, AxiosError, AxiosInstance } from 'axios'
import axiosInstance from './axiosInstance'
import cretixAxios from './cretixAxios'
import type {
  ApiResponse,
  ApiFrame,
  ApiScene,
  ApiPaperCategory,
  ApiEffectCategory,
} from '@/types/api'
import { loadLocalFrame, registerLocalFrame } from '@/data/localFrames'

// ─── Custom Axios baseQuery for RTK Query ────────────────────────────────────
//
// The `client` arg lets each endpoint pick which axios instance to use —
// the legacy frameit client (default) or our own Cretixone backend.

const makeAxiosBaseQuery = (
  client: AxiosInstance,
): BaseQueryFn<
  { url: string; method?: AxiosRequestConfig['method']; data?: unknown },
  unknown,
  unknown
> => async ({ url, method = 'POST', data }) => {
  try {
    const result = await client({ url, method, data })
    return { data: result.data }
  } catch (axiosError) {
    const err = axiosError as AxiosError
    return {
      error: {
        status: err.response?.status,
        data: err.response?.data || err.message,
      },
    }
  }
}

// One baseQuery routes between two clients based on the endpoint's
// `client` arg so we don't need a second createApi.
const routingBaseQuery: BaseQueryFn<
  {
    url: string
    method?: AxiosRequestConfig['method']
    data?: unknown
    client?: 'frameit' | 'cretix'
  },
  unknown,
  unknown
> = async ({ client = 'frameit', ...rest }, api, extraOptions) => {
  const target = client === 'cretix' ? cretixAxios : axiosInstance
  return makeAxiosBaseQuery(target)(rest, api, extraOptions)
}

// ─── Cretixone backend → user-frontend shape transform ──────────────────────
//
// Our backend stores just the 8 piece URLs, a thumbnail, and metadata.
// `CanvasStage` reads the legacy `ApiFrame` shape, so we map our DTO into a
// safe approximation — defaulting everything the canvas doesn't strictly
// need to 0/null/false.
//
// The pieces are also registered with `localFrames` so backend frames go
// through the SAME alpha-measured 8-piece renderer used by the bundled
// /public/frames samples (instead of the simpler "each piece exactly fills
// its slot" fallback). The local-frame path measures moulding thickness +
// corner bbox from each image's alpha channel, then composes the frame so
// every piece's visible moulding aligns with the outer edge — same logic
// the bundled local frames already proved out.
//
// urlPrefix is set to "/" with leading slashes stripped from each piece
// path so `frame.urlPrefix + piece` yields `/uploads/frames/abc.png`,
// which vite forwards to our backend in dev (no fall-through to OSS).

const stripLeadingSlash = (p: string) => (p.startsWith('/') ? p.slice(1) : p)

interface CretixFrameDto {
  id: string
  name: string
  categoryId: string | null
  category: { id: string; name: string; slug: string } | null
  isVip: boolean
  isNew: boolean
  isActive: boolean
  thumbnailUrl: string
  leftUpImg: string
  upImg: string
  rightUpImg: string
  leftImg: string
  rightImg: string
  leftDownImg: string
  downImg: string
  rightDownImg: string
  sortOrder: number
}

export interface CretixCategoryDto {
  id: string
  name: string
  slug: string
  description: string | null
  sortOrder: number
}

interface CretixApiOk<T> {
  success: true
  data: T
}

// UUIDs need to live alongside the numeric ids the editor already uses.
// We hash the UUID into a stable negative number so it never collides with
// frameit's positive ids or with the local frame ids (-1001, -1002).
const hashIdToNumber = (uuid: string): number => {
  let h = 0
  for (let i = 0; i < uuid.length; i++) {
    h = ((h << 5) - h + uuid.charCodeAt(i)) | 0
  }
  // Negative so it never collides with positive frameit ids; keep -1000
  // through -1999 reserved for the legacy local frames.
  return -(2000 + (Math.abs(h) % 1_000_000))
}

const mapCretixFrame = (f: CretixFrameDto): ApiFrame => {
  const id = hashIdToNumber(f.id)
  // Register this frame's pieces with the local-frame renderer and
  // eagerly load them so geometry is measured before the user clicks.
  // `loadLocalFrame` is idempotent — re-fetching the same id resolves to
  // the cached LoadedLocalFrame without re-decoding the images.
  if (typeof window !== 'undefined') {
    registerLocalFrame(id, {
      leftUp: f.leftUpImg,
      up: f.upImg,
      rightUp: f.rightUpImg,
      left: f.leftImg,
      right: f.rightImg,
      leftDown: f.leftDownImg,
      down: f.downImg,
      rightDown: f.rightDownImg,
    })
    void loadLocalFrame(id)
  }
  return ({
  urlPrefix: '/',
  id,
  type: 0,
  categoryId: f.categoryId,
  categorySlug: f.category?.slug ?? null,
  isVip: f.isVip,
  isSuper: false,
  leftUpWidth: 0, leftUpHeight: 0, leftUpImg: stripLeadingSlash(f.leftUpImg),
  upShadowHeight: 0, upHeight: 0, upImg: stripLeadingSlash(f.upImg),
  rightUpWidth: 0, rightUpHeight: 0, rightUpImg: stripLeadingSlash(f.rightUpImg),
  rightWidth: 0, rightShadowWidth: 0, rightNeiShadowWidth: 0,
  rightImg: stripLeadingSlash(f.rightImg),
  rightDownWidth: 0, rightDownHeight: 0,
  rightDownImg: stripLeadingSlash(f.rightDownImg),
  downHeight: 0, downShadowHeight: 0, downNeiShadowHeight: 0,
  downImg: stripLeadingSlash(f.downImg),
  leftDownWidth: 0, leftDownHeight: 0,
  leftDownImg: stripLeadingSlash(f.leftDownImg),
  leftWidth: 0, leftShadowWidth: 0,
  leftImg: stripLeadingSlash(f.leftImg),
  roundBorder: null,
  // Sidebar thumbnail loads <img src={imgUrl}> directly — keep the leading
  // slash so the browser resolves it against the dev/prod origin.
  imgUrl: f.thumbnailUrl,
  isScroll: 0,
  round: null,
  rightId: 0,
  supportFormat: 0,
  supportShadow: true,
  supportInnerShadow: false,
  leftUpRoundParam: 0, rightUpRoundParam: 0,
  rightDownRoundParam: 0, leftDownRoundParam: 0,
  colorLevel: 0, colorListOrder: f.sortOrder,
  isNew: f.isNew,
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
  })
}

// ─── RTK Query API ───────────────────────────────────────────────────────────

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: routingBaseQuery,
  endpoints: (builder) => ({

    // ── Frames (Cretixone backend) ─────────────────────────────────────────
    fetchFrames: builder.query<ApiFrame[], void>({
      query: () => ({
        url: '/frames/public',
        method: 'GET',
        client: 'cretix',
      }),
      transformResponse: (response: CretixApiOk<CretixFrameDto[]>) =>
        response.data.map(mapCretixFrame),
    }),

    // ── Frame categories (Cretixone backend) ───────────────────────────────
    fetchFrameCategories: builder.query<CretixCategoryDto[], void>({
      query: () => ({
        url: '/frames/categories/public',
        method: 'GET',
        client: 'cretix',
      }),
      transformResponse: (response: CretixApiOk<CretixCategoryDto[]>) => response.data,
    }),

    // ── Interiors (type 50) ────────────────────────────────────────────────
    fetchInteriors: builder.query<ApiScene[], void>({
      query: () => ({
        url: '/findScene',
        method: 'POST',
        data: { type: 50 },
      }),
      transformResponse: (response: ApiResponse<ApiScene[]>) => response.data,
    }),

    // ── Scenery (type 32) ──────────────────────────────────────────────────
    fetchScenery: builder.query<ApiScene[], void>({
      query: () => ({
        url: '/findScene',
        method: 'POST',
        data: { type: 32 },
      }),
      transformResponse: (response: ApiResponse<ApiScene[]>) => response.data,
    }),

    // ── Mat / Paper ────────────────────────────────────────────────────────
    fetchPaper: builder.query<ApiPaperCategory[], void>({
      query: () => ({
        url: '/findPaper',
        method: 'POST',
        data: {},
      }),
      transformResponse: (response: ApiResponse<ApiPaperCategory[]>) => response.data,
    }),

    // ── Special Effects ────────────────────────────────────────────────────
    fetchEffects: builder.query<ApiEffectCategory[], void>({
      query: () => ({
        url: '/findSpecialEffects',
        method: 'POST',
        data: {},
      }),
      transformResponse: (response: ApiResponse<ApiEffectCategory[]>) => response.data,
    }),
  }),
})

export const {
  useFetchFramesQuery,
  useFetchFrameCategoriesQuery,
  useFetchInteriorsQuery,
  useFetchSceneryQuery,
  useFetchPaperQuery,
  useFetchEffectsQuery,
} = apiSlice

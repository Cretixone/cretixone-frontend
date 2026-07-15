import { createApi } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn } from '@reduxjs/toolkit/query'
import type { AxiosRequestConfig, AxiosError, AxiosInstance } from 'axios'
import axiosInstance from './axiosInstance'
import cretixAxios from './cretixAxios'
import type {
  ApiResponse,
  ApiFrame,
  ApiFrameSize,
  ApiScene,
  ApiMatSize,
  ApiMatColor,
  ApiMdf,
  ApiEffectCategory,
} from '@/types/api'

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

interface CretixFrameDto {
  id: string
  name: string
  categoryId: string | null
  category: { id: string; name: string; slug: string } | null
  isVip: boolean
  isNew: boolean
  isActive: boolean
  thumbnailUrl: string
  landscapeUrl: string
  portraitUrl: string
  squareUrl: string | null
  pricePerCm: number
  oldPricePerCm: number
  sizeFrom: number
  sizeTo: number
  sortOrder: number
  description: string | null
  gallery: string[]
  specifications: Record<string, string>
}

interface CretixFrameSizeDto {
  id: string
  name: string
  widthCm: number
  lengthCm: number
  isActive: boolean
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

interface CretixMdfDto {
  id: string
  name: string
  thicknessMm: number
  imageUrl: string | null
  pricePerCm: number
  isActive: boolean
  sortOrder: number
}

// UUIDs need to coexist with frameit's numeric ids. We hash each UUID to a
// stable negative number so collisions can't happen.
const hashIdToNumber = (uuid: string): number => {
  let h = 0
  for (let i = 0; i < uuid.length; i++) {
    h = ((h << 5) - h + uuid.charCodeAt(i)) | 0
  }
  return -(2000 + (Math.abs(h) % 1_000_000))
}

// Host the backend serves /uploads from. Empty in dev — relative paths
// flow through the vite proxy. In prod we point at api.cretixone.com so
// the static frontend can load frame PNGs cross-origin.
const UPLOADS_HOST: string =
  (import.meta.env.VITE_UPLOADS_HOST as string | undefined) ||
  (import.meta.env.PROD ? 'https://api.cretixone.com' : '')

const resolveBackendUrl = (url: string | null | undefined): string => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (!UPLOADS_HOST) return url
  return url.startsWith('/') ? `${UPLOADS_HOST}${url}` : `${UPLOADS_HOST}/${url}`
}

const mapCretixFrame = (f: CretixFrameDto): ApiFrame => ({
  id: hashIdToNumber(f.id),
  name: f.name,
  categoryId: f.categoryId,
  categorySlug: f.category?.slug ?? null,
  isVip: f.isVip,
  isNew: f.isNew,
  imgUrl: resolveBackendUrl(f.thumbnailUrl),
  landscapeUrl: resolveBackendUrl(f.landscapeUrl),
  portraitUrl: resolveBackendUrl(f.portraitUrl),
  squareUrl: f.squareUrl ? resolveBackendUrl(f.squareUrl) : null,
  pricePerCm: f.pricePerCm ?? 0,
  oldPricePerCm: f.oldPricePerCm ?? 0,
  sizeFrom: f.sizeFrom ?? 0,
  sizeTo: f.sizeTo ?? 0,
  description: f.description ?? null,
  gallery: (f.gallery ?? []).map((g) => resolveBackendUrl(g)),
  specifications: f.specifications ?? {},
})

// ─── RTK Query API ───────────────────────────────────────────────────────────

export interface FrameFacets {
  categories: { id: string; name: string; slug: string; count: number }[]
  frameTypes: { name: string; count: number }[]
  frameColors: { name: string; color: string; count: number }[]
}

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

    // ── Paginated active frames (storefront products grid) ─────────────────
    fetchFramesPage: builder.query<
      { items: ApiFrame[]; total: number; page: number; pageCount: number },
      {
        page: number
        limit: number
        category?: string[]
        frameType?: string[]
        color?: string[]
      }
    >({
      query: ({ page, limit, category, frameType, color }) => {
        const parts = [`page=${page}`, `limit=${limit}`]
        const add = (key: string, vals?: string[]) => {
          if (vals && vals.length) parts.push(`${key}=${encodeURIComponent(vals.join(','))}`)
        }
        add('category', category)
        add('frameType', frameType)
        add('color', color)
        return { url: `/frames/public?${parts.join('&')}`, method: 'GET', client: 'cretix' }
      },
      transformResponse: (
        response: CretixApiOk<CretixFrameDto[]> & {
          meta?: { page: number; limit: number; total: number; pageCount: number }
        },
      ) => ({
        items: response.data.map(mapCretixFrame),
        total: response.meta?.total ?? response.data.length,
        page: response.meta?.page ?? 1,
        pageCount: response.meta?.pageCount ?? 1,
      }),
    }),

    // ── Single frame by hashed id (product detail — avoids fetching all) ────
    fetchFrameById: builder.query<ApiFrame, number>({
      query: (id) => ({
        url: `/frames/public/${id}`,
        method: 'GET',
        client: 'cretix',
      }),
      transformResponse: (response: CretixApiOk<CretixFrameDto>) => mapCretixFrame(response.data),
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

    // ── Filter facets (categories / frame types / frame colours + counts) ──
    fetchFacets: builder.query<FrameFacets, void>({
      query: () => ({
        url: '/frames/facets',
        method: 'GET',
        client: 'cretix',
      }),
      transformResponse: (response: CretixApiOk<FrameFacets>) => response.data,
    }),

    // ── Frame sizes (Cretixone backend — admin-managed presets) ────────────
    fetchFrameSizes: builder.query<ApiFrameSize[], void>({
      query: () => ({
        url: '/frame-sizes/public',
        method: 'GET',
        client: 'cretix',
      }),
      transformResponse: (response: CretixApiOk<CretixFrameSizeDto[]>) => response.data,
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

    // ── Mat sizes (Cretixone backend — admin-managed, priced) ──────────────
    fetchMatSizes: builder.query<ApiMatSize[], void>({
      query: () => ({
        url: '/mats/sizes/public',
        method: 'GET',
        client: 'cretix',
      }),
      transformResponse: (response: CretixApiOk<ApiMatSize[]>) => response.data,
    }),

    // ── Mat colors (Cretixone backend — admin-managed) ─────────────────────
    fetchMatColors: builder.query<ApiMatColor[], void>({
      query: () => ({
        url: '/mats/colors/public',
        method: 'GET',
        client: 'cretix',
      }),
      transformResponse: (response: CretixApiOk<ApiMatColor[]>) => response.data,
    }),

    // ── MDF backing boards (Cretixone backend — admin-managed, priced) ─────
    fetchMdf: builder.query<ApiMdf[], void>({
      query: () => ({
        url: '/mdf/public',
        method: 'GET',
        client: 'cretix',
      }),
      transformResponse: (response: CretixApiOk<CretixMdfDto[]>) =>
        response.data.map((m) => ({
          id: m.id,
          name: m.name,
          thicknessMm: m.thicknessMm,
          imgUrl: resolveBackendUrl(m.imageUrl),
          pricePerCm: m.pricePerCm ?? 0,
          isActive: m.isActive,
          sortOrder: m.sortOrder,
        })),
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
  useFetchFramesPageQuery,
  useFetchFrameByIdQuery,
  useFetchFrameCategoriesQuery,
  useFetchFacetsQuery,
  useFetchFrameSizesQuery,
  useFetchInteriorsQuery,
  useFetchSceneryQuery,
  useFetchMatSizesQuery,
  useFetchMatColorsQuery,
  useFetchMdfQuery,
  useFetchEffectsQuery,
} = apiSlice

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

// UUIDs need to coexist with frameit's numeric ids. We hash each UUID to a
// stable negative number so collisions can't happen.
const hashIdToNumber = (uuid: string): number => {
  let h = 0
  for (let i = 0; i < uuid.length; i++) {
    h = ((h << 5) - h + uuid.charCodeAt(i)) | 0
  }
  return -(2000 + (Math.abs(h) % 1_000_000))
}

const mapCretixFrame = (f: CretixFrameDto): ApiFrame => ({
  id: hashIdToNumber(f.id),
  categoryId: f.categoryId,
  categorySlug: f.category?.slug ?? null,
  isVip: f.isVip,
  isNew: f.isNew,
  imgUrl: f.thumbnailUrl,
  landscapeUrl: f.landscapeUrl,
  portraitUrl: f.portraitUrl,
})

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

import { createApi } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn } from '@reduxjs/toolkit/query'
import type { AxiosRequestConfig, AxiosError } from 'axios'
import axiosInstance from './axiosInstance'
import type {
  ApiResponse,
  ApiFrame,
  ApiScene,
  ApiPaperCategory,
  ApiEffectCategory,
} from '@/types/api'

// ─── Custom Axios baseQuery for RTK Query ────────────────────────────────────

const axiosBaseQuery: BaseQueryFn<
  { url: string; method?: AxiosRequestConfig['method']; data?: unknown },
  unknown,
  unknown
> = async ({ url, method = 'POST', data }) => {
  try {
    const result = await axiosInstance({ url, method, data })
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

// ─── RTK Query API ───────────────────────────────────────────────────────────

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery,
  endpoints: (builder) => ({

    // ── Frames ─────────────────────────────────────────────────────────────
    fetchFrames: builder.query<ApiFrame[], void>({
      query: () => ({
        url: '/findFrame',
        method: 'POST',
        data: { type: 2, area: 'HK', notFrame: false },
      }),
      transformResponse: (response: ApiResponse<ApiFrame[]>) => response.data,
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
  useFetchInteriorsQuery,
  useFetchSceneryQuery,
  useFetchPaperQuery,
  useFetchEffectsQuery,
} = apiSlice

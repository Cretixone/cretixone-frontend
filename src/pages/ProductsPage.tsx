import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  ChevronUp,
  ChevronDown,
  Home,
  Filter,
} from 'lucide-react'
import Navbar, { PillNav } from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { cn } from '@/lib/utils'
import { BannerStrip } from '@/components/product/BannerStrip'
import { useFetchFacetsQuery, useFetchFramesPageQuery, useFetchFrameSizesQuery } from '@/store/api/apiSlice'
import { Pagination } from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatOMR, formatOMRRate } from '@/lib/format'
import { pickLocalized } from '@/lib/localized'
import { useIsRtl } from '@/store/langStore'
import type { ApiFrame } from '@/types/api'

const PAGE_SIZE = 12

// ── Theme tokens (kept inline so the page reads against the brand palette) ──
const COUNT_FG = '#7C8AA5'

// ── Banner strip imagery (reuse the bundled lifestyle slides) ──────────────
// ── Filter configuration — labels + counts mirror the Figma spec ───────────
type FilterGroupKey = 'type' | 'color'

interface FilterOption {
  value: string // stable value sent to the API (category slug or type/colour name)
  label: string
  count: number
}
interface FilterGroup {
  key: FilterGroupKey
  title: string
  options: FilterOption[]
  collapsedAfter?: number // show "show N more" beyond this many
}

// Stable keys resolved to labels via t('sort.options.<key>') at render time.
const SORT_OPTION_KEYS = ['popularity', 'newest', 'priceLowHigh', 'priceHighLow'] as const
type SortKey = (typeof SORT_OPTION_KEYS)[number]

export default function ProductsPage() {
  const { t } = useTranslation('products')
  // Landing pages set body bg/color manually (see LandingPage) since the
  // editor scopes its own theme onto <body>. Mirror that here.
  useEffect(() => {
    const prevBg = document.body.style.background
    const prevColor = document.body.style.color
    document.body.style.background = '#ffffff'
    document.body.style.color = '#000000'
    return () => {
      document.body.style.background = prevBg
      document.body.style.color = prevColor
    }
  }, [])

  // The landing Frame Types / Frame Colors cards deep-link here with ?type=
  // and ?color= (comma-separated) — seed those into the selection so the
  // grid opens pre-filtered.
  const [searchParams, setSearchParams] = useSearchParams()

  // Selected filter checkboxes — keyed "groupKey::value".
  const [selected, setSelected] = useState<Set<string>>(() => {
    const init = new Set<string>()
    const seed = (key: FilterGroupKey, raw: string | null) =>
      raw?.split(',').forEach((v) => v.trim() && init.add(`${key}::${v.trim()}`))
    seed('type', searchParams.get('type'))
    seed('color', searchParams.get('color'))
    return init
  })
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  const reset = () => setSelected(new Set())

  // Filter facets (frame types / frame colours) with usage counts, built
  // dynamically from admin-managed data.
  const { data: facets } = useFetchFacetsQuery()
  const filterGroups: FilterGroup[] = useMemo(() => {
    if (!facets) return []
    return [
      {
        key: 'type',
        title: t('filter.groups.type'),
        options: facets.frameTypes.map((ft) => ({ value: ft.name, label: ft.name, count: ft.count })),
      },
      {
        key: 'color',
        title: t('filter.groups.color'),
        collapsedAfter: 7,
        options: facets.frameColors.map((c) => ({ value: c.name, label: c.name, count: c.count })),
      },
    ]
  }, [facets, t])

  // Selected values per group (OR within a group, AND across groups on the API).
  // Parsed straight from the selection set so URL-seeded filters apply even
  // before the facet list has loaded.
  const pickedFor = (key: FilterGroupKey) =>
    [...selected]
      .filter((id) => id.startsWith(`${key}::`))
      .map((id) => id.slice(key.length + 2))
  const typeSel = pickedFor('type')
  const colorSel = pickedFor('color')

  // Server-side pagination + filtering. Reset to page 1 when any filter changes.
  // Page and sort live in the URL, not component state: opening a product
  // and coming back used to reset the grid to page 1 because local state is
  // discarded when the route unmounts. In the URL the position survives the
  // round trip, the Back button and a shared link.
  const pageParam = Number(searchParams.get('page'))
  const page = Number.isFinite(pageParam) && pageParam >= 1 ? Math.floor(pageParam) : 1
  const sortParam = searchParams.get('sort') as SortKey | null
  const sort: SortKey = sortParam && SORT_OPTION_KEYS.includes(sortParam) ? sortParam : SORT_OPTION_KEYS[0]

  const patchParams = (patch: Record<string, string | null>) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(patch)) {
          if (v === null) next.delete(k)
          else next.set(k, v)
        }
        return next
      },
      { replace: true },
    )

  // Page 1 is the default — keep it out of the URL so the common case stays
  // a clean /products.
  const setPage = (next: number) => patchParams({ page: next <= 1 ? null : String(next) })
  const setSort = (next: SortKey) =>
    patchParams({ sort: next === SORT_OPTION_KEYS[0] ? null : next, page: null })

  const filterKey = [...selected].sort().join('|')
  // A filter change invalidates the current page number — but this effect
  // still fires once on every MOUNT too (React runs a dependency-array
  // effect after the first render regardless), which was wiping a perfectly
  // valid ?page= right back to 1 the instant you arrived here with one
  // already in the URL (a direct link, or the browser's back button
  // restoring /products?page=3). The ref makes it fire the reset only on an
  // actual change to filterKey after mount, never on mount itself.
  const prevFilterKeyRef = useRef(filterKey)
  useEffect(() => {
    if (prevFilterKeyRef.current === filterKey) return
    prevFilterKeyRef.current = filterKey
    if (searchParams.get('page')) patchParams({ page: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey])

  const { data, isLoading, isError } = useFetchFramesPageQuery({
    page,
    limit: PAGE_SIZE,
    frameType: typeSel.length ? typeSel : undefined,
    color: colorSel.length ? colorSel : undefined,
    sort,
  })
  const total = data?.total ?? 0
  const pageCount = data?.pageCount ?? 1
  const current = data?.page ?? page
  const paged = data?.items ?? []

  // Cheapest real size preset drives each card's "from" price — the same
  // presets the detail page prices by, so the two pages agree (instead of the
  // card pricing a theoretical 1 cm frame). 0 when no presets exist yet.
  const { data: frameSizes } = useFetchFrameSizesQuery()
  const minPerimeter = useMemo(() => {
    const perims = (frameSizes ?? []).map((s) => (s.widthCm + s.lengthCm) * 2)
    return perims.length ? Math.min(...perims) : 0
  }, [frameSizes])

  return (
    <div className="min-h-screen w-full bg-white font-sans text-[#000000]">
      {/* ── Header: top utility bar + floating gold pill nav ── */}
      <header className="relative z-30">
        <Navbar />
      </header>
      <PillNav />

      <main className="mx-auto max-w-[1400px] px-5 pb-4 pt-20 md:px-10 md:pt-24">
        <BannerStrip />

        {/* Breadcrumb */}
        <nav
          aria-label={t('breadcrumb.aria')}
          className="mt-7 flex items-center gap-2 text-sm text-foreground/70"
        >
          <Link to="/" className="inline-flex items-center hover:text-brand-navy">
            <Home className="h-4 w-4" />
          </Link>
          <span className="text-foreground/40">›</span>
          <span className="text-foreground/80">{t('breadcrumb.current')}</span>
        </nav>

        {/* Title + intro */}
        <div className="mt-4">
          <h1 className="font-display text-3xl font-medium tracking-tight text-brand-navy md:text-[40px]">
            {t('title')}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-foreground/70 md:text-[15px]">
            {t('intro')}
          </p>
        </div>

        {/* Filters + product grid */}
        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:gap-10">
          <FilterSidebar groups={filterGroups} selected={selected} onToggle={toggle} onReset={reset} />

          <section className="min-w-0 flex-1">
            <ResultsBar count={total} loading={isLoading} sort={sort} onSort={setSort} />

            {isError ? (
              <div className="flex h-64 items-center justify-center rounded-xl border border-black/5 bg-black/[0.02] text-sm text-foreground/60">
                {t('states.error')}
              </div>
            ) : isLoading ? (
              <ProductGridSkeleton />
            ) : (
              <>
                <ProductGrid frames={paged} minPerimeter={minPerimeter} />
                <Pagination
                  page={current}
                  pageCount={pageCount}
                  onPage={(p) => {
                    setPage(p)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="mt-10"
                />
              </>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}

// ── Left filter sidebar ────────────────────────────────────────────────────
function FilterSidebar({
  groups,
  selected,
  onToggle,
  onReset,
}: {
  groups: FilterGroup[]
  selected: Set<string>
  onToggle: (id: string) => void
  onReset: () => void
}) {
  const { t } = useTranslation('products')
  return (
    <aside className="w-full shrink-0 lg:w-[260px]">
      {/* Filter header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#002365]">
          <Filter className="h-4 w-4" />
          <span className="text-base font-semibold">{t('filter.heading')}</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full bg-[#C08C40] px-3 py-1 text-xs font-medium text-white transition hover:bg-[#C08C40]/90"
        >
          {t('filter.reset')}
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {groups.map((group) => (
          <FilterGroupBlock
            key={group.key}
            group={group}
            selected={selected}
            onToggle={onToggle}
          />
        ))}
      </div>
    </aside>
  )
}

function FilterGroupBlock({
  group,
  selected,
  onToggle,
}: {
  group: FilterGroup
  selected: Set<string>
  onToggle: (id: string) => void
}) {
  const { t } = useTranslation('products')
  const [open, setOpen] = useState(true)
  const [expanded, setExpanded] = useState(false)

  const limit = group.collapsedAfter
  const hiddenCount =
    limit != null ? Math.max(0, group.options.length - limit) : 0
  const visible =
    limit != null && !expanded ? group.options.slice(0, limit) : group.options

  return (
    <div className="rounded-xl bg-[#F8F8F8] p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-[15px] font-semibold text-foreground">
          {group.title}
        </span>
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E6E6E6]">
          {open ? (
            <ChevronUp className="h-3 w-3 text-foreground/50" />
          ) : (
            <ChevronDown className="h-3 w-3 text-foreground/50" />
          )}
        </span>
      </button>

      {open && (
        <ul className="mt-3 space-y-2.5">
          {visible.map((opt) => {
            const id = `${group.key}::${opt.value}`
            const checked = selected.has(id)
            return (
              <li key={id}>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground/80">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(id)}
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition',
                      checked
                        ? 'border-brand-gold bg-brand-gold text-white'
                        : 'border-black/25 bg-white',
                    )}
                  >
                    {checked && (
                      <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
                        <path
                          d="M2.5 6.2 5 8.5 9.5 3.5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  <span>{opt.label}</span>
                  <span
                    className="px-2 py-0.5 text-[11px] font-medium leading-none"
                    style={{
                      background: '#FFFFFF',
                      color: COUNT_FG,
                      border: '0.5px solid #ADADAD',
                      borderRadius: '35px',
                    }}
                  >
                    {opt.count}
                  </span>
                </label>
              </li>
            )
          })}

          {hiddenCount > 0 && (
            <li>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="text-xs font-medium text-foreground/60 underline underline-offset-2 hover:text-brand-navy"
              >
                {expanded ? t('filter.showLess') : t('filter.showMore', { count: hiddenCount })}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

// ── Results count + sort ───────────────────────────────────────────────────
function ResultsBar({
  count,
  loading,
  sort,
  onSort,
}: {
  count: number
  loading: boolean
  sort: SortKey
  onSort: (s: SortKey) => void
}) {
  const { t } = useTranslation('products')
  return (
    <div className="mb-5 flex items-center justify-between">
      <p className="text-base font-semibold text-brand-navy">
        {loading ? t('results.loading') : t('results.count', { count })}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground/60">{t('sort.label')}</span>
        <Select
          value={sort}
          onValueChange={(v) => onSort(v as SortKey)}
        >
          <SelectTrigger className="h-9 w-[190px] rounded-lg border-black/10 bg-white text-sm text-foreground/80 focus:ring-brand-gold/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTION_KEYS.map((key) => (
              <SelectItem key={key} value={key}>
                {t(`sort.options.${key}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// ── Product grid ───────────────────────────────────────────────────────────
function ProductGrid({ frames, minPerimeter }: { frames: ApiFrame[]; minPerimeter: number }) {
  const { t } = useTranslation('products')
  if (frames.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-black/5 bg-black/[0.02] text-sm text-foreground/60">
        {t('states.empty')}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 xl:grid-cols-4">
      {frames.map((frame) => (
        <ProductCard key={frame.id} frame={frame} minPerimeter={minPerimeter} />
      ))}
    </div>
  )
}

function ProductCard({ frame, minPerimeter }: { frame: ApiFrame; minPerimeter: number }) {
  const { t } = useTranslation('products')
  const navigate = useNavigate()
  const location = useLocation()
  const isRtl = useIsRtl()
  // Show the square thumbnail first (imgUrl = thumbnailUrl), then fall back.
  const img = frame.imgUrl || frame.portraitUrl || frame.landscapeUrl

  // "from" price = the cheapest real size preset × the frame's rate (matches the
  // detail page). If no presets exist yet, show the per-cm rate instead of a
  // misleading 1 cm minimum. `null` when the frame carries no price.
  const priced = frame.pricePerCm > 0
  const hasRealSize = priced && minPerimeter > 0
  const priceLabel = !priced
    ? null
    : hasRealSize
      ? formatOMR(frame.pricePerCm * minPerimeter)
      : `${formatOMRRate(frame.pricePerCm)} / cm`
  const subtitle = frame.specifications?.['Frame Type'] ?? t('card.fallbackSubtitle')

  // Clicking a product opens its detail page (which in turn links into the
  // editor via "Upload a preview image"). Carries the current ?page=/?sort=
  // in location.state so the detail page's "back to products" breadcrumb can
  // return to this exact page instead of resetting to page 1.
  const openDetail = () => navigate(`/product/${frame.id}`, { state: { from: location.search } })

  return (
    <motion.div
      onClick={openDetail}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="group cursor-pointer rounded-2xl border-[0.5px] border-transparent p-3 transition-shadow hover:border-[#F1F1F1] hover:bg-white hover:shadow-[0_18px_40px_-18px_rgba(10,31,77,0.18)]"
    >
      {/* Frame image */}
      <div className="flex h-[203px] items-center justify-center overflow-hidden rounded-xl">
        {img ? (
          <img
            src={img}
            alt={t('card.imageAlt')}
            loading="lazy"
            draggable={false}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="h-full w-full bg-black/5" />
        )}
      </div>

      {/* Meta */}
      <div className="mt-3">
        <h3 className="truncate text-sm font-semibold leading-snug text-foreground">
          {pickLocalized(frame.name, frame.nameAr, isRtl)}
        </h3>
        <p className="mt-1 truncate text-[11px] capitalize leading-tight text-foreground/50">
          {subtitle}
        </p>
        {priceLabel && (
          <div className="mt-2 flex items-baseline gap-1.5">
            {hasRealSize && <span className="text-[11px] text-foreground/45">{t('card.from')}</span>}
            <span className="text-sm font-bold tabular-nums text-brand-navy">
              {priceLabel}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function ProductGridSkeleton() {
  const items = useMemo(() => Array.from({ length: 8 }), [])
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 xl:grid-cols-4">
      {items.map((_, i) => (
        <div key={i} className="rounded-2xl p-3">
          <div className="h-[203px] animate-pulse rounded-xl bg-black/[0.06]" />
          <div className="mt-3 h-3 w-4/5 animate-pulse rounded bg-black/[0.06]" />
          <div className="mt-2 h-2.5 w-3/5 animate-pulse rounded bg-black/[0.05]" />
          <div className="mt-3 h-3 w-1/3 animate-pulse rounded bg-black/[0.06]" />
        </div>
      ))}
    </div>
  )
}

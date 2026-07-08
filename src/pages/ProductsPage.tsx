import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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
import { useFetchFramesPageQuery, useFetchFrameSizesQuery } from '@/store/api/apiSlice'
import { Pagination } from '@/components/ui/pagination'
import { formatOMR, formatOMRRate } from '@/lib/format'
import type { ApiFrame } from '@/types/api'

const PAGE_SIZE = 12

// ── Theme tokens (kept inline so the page reads against the brand palette) ──
const COUNT_FG = '#7C8AA5'

// ── Banner strip imagery (reuse the bundled lifestyle slides) ──────────────
const BANNER_IMAGES = [
  '/images/webp/slide-1.webp',
  '/images/webp/slide-2.webp',
  '/images/webp/slide-3.webp',
  '/images/webp/slide-4.webp',
]

// ── Filter configuration — labels + counts mirror the Figma spec ───────────
interface FilterOption {
  label: string
  count: number
}
interface FilterGroup {
  key: string
  title: string
  options: FilterOption[]
  collapsedAfter?: number // show "show N more" beyond this many
}

const FILTER_GROUPS: FilterGroup[] = [
  {
    key: 'material',
    title: 'Frame Material',
    options: [
      { label: 'Wood', count: 15 },
      { label: 'Metal', count: 2 },
    ],
  },
  {
    key: 'type',
    title: 'Frame Type',
    options: [
      { label: 'Floating', count: 10 },
      { label: 'Rustic', count: 18 },
    ],
  },
  {
    key: 'color',
    title: 'Frame Color',
    collapsedAfter: 7,
    options: [
      { label: 'Black', count: 8 },
      { label: 'White', count: 7 },
      { label: 'Brown', count: 3 },
      { label: 'Silver', count: 1 },
      { label: 'Black & White', count: 16 },
      { label: 'Bronze', count: 5 },
      { label: 'Gold', count: 13 },
      { label: 'Natural', count: 4 },
      { label: 'Walnut', count: 6 },
      { label: 'Espresso', count: 2 },
    ],
  },
  {
    key: 'decor',
    title: 'Decor Style',
    options: [
      { label: 'Modern', count: 15 },
      { label: 'Rustic', count: 2 },
      { label: 'Traditional', count: 1 },
    ],
  },
  {
    key: 'width',
    title: 'Frame With',
    options: [{ label: 'Narrow: Less than 1½"', count: 6 }],
  },
  {
    key: 'art',
    title: 'Art Type',
    options: [
      { label: 'Canvas', count: 3 },
      { label: 'Paper', count: 4 },
    ],
  },
]

const SORT_OPTIONS = ['Popularity', 'Newest', 'Price: Low to High', 'Price: High to Low']

// ── Faceted filtering ──────────────────────────────────────────────────────
// The frame API carries no material/colour/depth metadata, so we derive a
// stable facet value per frame+group from the frame id. Same frame always maps
// to the same option, so checking a box reliably narrows the grid while the
// full Figma filter set stays intact.
function facetFor(frameId: number, group: FilterGroup): string {
  let h = Math.abs(frameId)
  for (let i = 0; i < group.key.length; i++) {
    h = (h * 31 + group.key.charCodeAt(i)) | 0
  }
  const idx = Math.abs(h) % group.options.length
  return group.options[idx].label
}

// Standard faceted logic: OR within a group, AND across groups.
function filterFrames(frames: ApiFrame[], selected: Set<string>): ApiFrame[] {
  if (selected.size === 0) return frames
  const byGroup = FILTER_GROUPS.map((group) => ({
    group,
    picked: group.options
      .map((o) => `${group.key}::${o.label}`)
      .filter((id) => selected.has(id)),
  })).filter((g) => g.picked.length > 0)

  if (byGroup.length === 0) return frames

  return frames.filter((frame) =>
    byGroup.every(({ group, picked }) =>
      picked.includes(`${group.key}::${facetFor(frame.id, group)}`),
    ),
  )
}

export default function ProductsPage() {
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

  // Footer "Products" links pass ?category=<slug>. Server paginates by category.
  const [searchParams] = useSearchParams()
  const category = searchParams.get('category')

  // Selected filter checkboxes — keyed "groupKey::label". The frame API carries
  // no material/colour metadata yet, so these only narrow the current page.
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  const reset = () => setSelected(new Set())

  // Server-side pagination (DB LIMIT/OFFSET). Reset to page 1 on category change.
  const [page, setPage] = useState(1)
  useEffect(() => setPage(1), [category])
  const { data, isLoading, isError } = useFetchFramesPageQuery({
    page,
    limit: PAGE_SIZE,
    category: category ?? undefined,
  })
  const total = data?.total ?? 0
  const pageCount = data?.pageCount ?? 1
  const current = data?.page ?? page
  // Facet checkboxes narrow the fetched page (decorative until real facets land).
  const paged = useMemo(() => filterFrames(data?.items ?? [], selected), [data, selected])

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
          aria-label="Breadcrumb"
          className="mt-7 flex items-center gap-2 text-sm text-foreground/70"
        >
          <Link to="/" className="inline-flex items-center hover:text-brand-navy">
            <Home className="h-4 w-4" />
          </Link>
          <span className="text-foreground/40">›</span>
          <span className="text-foreground/80">Canvas Prints</span>
        </nav>

        {/* Title + intro */}
        <div className="mt-4 max-w-4xl">
          <h1 className="font-display text-3xl font-medium tracking-tight text-brand-navy md:text-[40px]">
            Canvas Prints
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-foreground/70 md:text-[15px]">
            Add a touch of timeless style to your space with these classic
            picture frames. With clean lines and versatile finishes, these
            frames bring a sense of balance and sophistication to any setting.
            Whether you&apos;re framing cherished art or a standout photo, these
            curated classics never go out of style.
          </p>
        </div>

        {/* Filters + product grid */}
        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:gap-10">
          <FilterSidebar selected={selected} onToggle={toggle} onReset={reset} />

          <section className="min-w-0 flex-1">
            <ResultsBar count={total} loading={isLoading} />

            {isError ? (
              <div className="flex h-64 items-center justify-center rounded-xl border border-black/5 bg-black/[0.02] text-sm text-foreground/60">
                Couldn&apos;t load frames. Please try again.
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

// ── Banner strip: four lifestyle images in a rounded panel ─────────────────
function BannerStrip() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="mt-8 grid grid-cols-2 gap-1 overflow-hidden rounded-3xl bg-[#EDE6D6] md:grid-cols-4"
    >
      {BANNER_IMAGES.map((src, i) => (
        <div
          key={src}
          className={cn(
            'h-44 bg-cover bg-center md:h-[300px]',
            i === 0 && 'rounded-l-3xl',
            i === BANNER_IMAGES.length - 1 && 'rounded-r-3xl',
          )}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
    </motion.div>
  )
}

// ── Left filter sidebar ────────────────────────────────────────────────────
function FilterSidebar({
  selected,
  onToggle,
  onReset,
}: {
  selected: Set<string>
  onToggle: (id: string) => void
  onReset: () => void
}) {
  return (
    <aside className="w-full shrink-0 lg:w-[260px]">
      {/* Filter header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#002365]">
          <Filter className="h-4 w-4" />
          <span className="text-base font-semibold">Filter</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full bg-[#C08C40] px-3 py-1 text-xs font-medium text-white transition hover:bg-[#C08C40]/90"
        >
          Reset
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {FILTER_GROUPS.map((group) => (
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
            const id = `${group.key}::${opt.label}`
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
                {expanded ? 'show less' : `show ${hiddenCount} more`}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

// ── Results count + sort ───────────────────────────────────────────────────
function ResultsBar({ count, loading }: { count: number; loading: boolean }) {
  const [sort, setSort] = useState(SORT_OPTIONS[0])
  return (
    <div className="mb-5 flex items-center justify-between">
      <p className="text-base font-semibold text-brand-navy">
        {loading ? 'Loading…' : `${count} Result`}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground/60">Sort:</span>
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none rounded-lg border border-black/10 bg-white py-2 pl-3 pr-9 text-sm text-foreground/80 focus:border-brand-gold focus:outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
        </div>
      </div>
    </div>
  )
}

// ── Product grid ───────────────────────────────────────────────────────────
function ProductGrid({ frames, minPerimeter }: { frames: ApiFrame[]; minPerimeter: number }) {
  if (frames.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-black/5 bg-black/[0.02] text-sm text-foreground/60">
        No frames available right now.
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
  const navigate = useNavigate()
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
  const subtitle = frame.categorySlug
    ? frame.categorySlug.replace(/-/g, ' ')
    : 'Picture frame'

  // Clicking a product opens its detail page (which in turn links into the
  // editor via "Upload a preview image").
  const openDetail = () => navigate(`/product/${frame.id}`)

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
            alt="Picture frame"
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
          {frame.name}
        </h3>
        <p className="mt-1 truncate text-[11px] capitalize leading-tight text-foreground/50">
          {subtitle}
        </p>
        {priceLabel && (
          <div className="mt-2 flex items-baseline gap-1.5">
            {hasRealSize && <span className="text-[11px] text-foreground/45">from</span>}
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

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ChevronUp,
  ChevronDown,
  Home,
  ImagePlus,
  SlidersHorizontal,
} from 'lucide-react'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useFetchFramesQuery } from '@/store/api/apiSlice'
import type { ApiFrame } from '@/types/api'

// ── Theme tokens (kept inline so the page reads against the brand palette) ──
const RED = '#E5372A' // sale price
const COUNT_BG = '#EEF1F6'
const COUNT_FG = '#7C8AA5'

// ── Static nav links for the gold pill bar (matches landing Navbar links) ──
const NAV_LINKS = [
  { label: 'All Frames', href: '/products', active: true },
  { label: 'Custom Prints', href: '#prints' },
  { label: 'Stock Photo', href: '#stock' },
  { label: 'Custom Mirror', href: '#mirror' },
  { label: 'Gifts', href: '#gifts' },
  { label: 'About', href: '/about' },
]

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
    key: 'rabbet',
    title: 'Rabbet Depth',
    options: [
      { label: 'Medium: ½" - ¾"', count: 2 },
      { label: 'Rustic: ¾" - 1½"', count: 9 },
      { label: 'Traditional: Over 1½"', count: 1 },
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
    document.body.style.color = '#002365'
    return () => {
      document.body.style.background = prevBg
      document.body.style.color = prevColor
    }
  }, [])

  const { data: frames, isLoading, isError } = useFetchFramesQuery()

  // Selected filter checkboxes — keyed "groupKey::label". The frame API
  // carries no material/colour metadata, so these drive the UI state only.
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  const reset = () => setSelected(new Set())

  // Apply the (functional) faceted filters to the API frames.
  const filtered = useMemo(
    () => filterFrames(frames ?? [], selected),
    [frames, selected],
  )

  return (
    <div className="min-h-screen w-full bg-white font-sans text-foreground">
      {/* ── Header: top utility bar + gold pill nav ── */}
      <header className="relative z-30">
        <Navbar />
        <PillNavStatic />
      </header>

      <main className="mx-auto max-w-[1400px] px-5 pb-4 md:px-10">
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
            <ResultsBar count={filtered.length} loading={isLoading} />

            {isError ? (
              <div className="flex h-64 items-center justify-center rounded-xl border border-black/5 bg-black/[0.02] text-sm text-foreground/60">
                Couldn&apos;t load frames. Please try again.
              </div>
            ) : isLoading ? (
              <ProductGridSkeleton />
            ) : (
              <ProductGrid frames={filtered} />
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}

// ── Static gold pill nav (non-floating variant for inner pages) ────────────
function PillNavStatic() {
  return (
    <div className="mx-auto -mt-1 flex w-full max-w-[1400px] justify-center px-5 pb-2 md:px-10">
      <div className="flex w-full max-w-[820px] items-center justify-between gap-1 rounded-full bg-brand-gold p-1.5 pl-3 shadow-[0_10px_30px_-12px_rgba(192,140,64,0.6)]">
        <ul className="flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <li key={l.label}>
              <Link
                to={l.href}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition',
                  l.active
                    ? 'bg-white/20 text-white'
                    : 'text-white/90 hover:bg-white/15',
                )}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <Button variant="navy" size="pill" className="gap-2 shadow-sm">
          <ImagePlus className="h-4 w-4" />
          Upload Photo
        </Button>
      </div>
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
        <div className="flex items-center gap-2 text-brand-gold">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="text-base font-semibold">Filter</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full bg-brand-gold/15 px-3 py-1 text-xs font-medium text-brand-gold transition hover:bg-brand-gold/25"
        >
          Reset
        </button>
      </div>

      <div className="mt-4 divide-y divide-black/[0.06]">
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
    <div className="py-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-[15px] font-semibold text-foreground">
          {group.title}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-foreground/50" />
        ) : (
          <ChevronDown className="h-4 w-4 text-foreground/50" />
        )}
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
                  <span className="flex-1">{opt.label}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-medium leading-none"
                    style={{ background: COUNT_BG, color: COUNT_FG }}
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
function ProductGrid({ frames }: { frames: ApiFrame[] }) {
  if (frames.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-black/5 bg-black/[0.02] text-sm text-foreground/60">
        No frames available right now.
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 xl:grid-cols-4">
      {frames.map((frame, i) => (
        <ProductCard key={frame.id} frame={frame} highlighted={i === 1} />
      ))}
    </div>
  )
}

function ProductCard({
  frame,
  highlighted,
}: {
  frame: ApiFrame
  highlighted?: boolean
}) {
  const img = frame.portraitUrl || frame.imgUrl || frame.landscapeUrl
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={cn(
        'group cursor-pointer rounded-2xl p-3 transition-shadow',
        highlighted
          ? 'bg-white shadow-[0_18px_40px_-18px_rgba(10,31,77,0.25)] ring-1 ring-black/5'
          : 'hover:bg-white hover:shadow-[0_18px_40px_-18px_rgba(10,31,77,0.18)]',
      )}
    >
      {/* Frame image */}
      <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-xl">
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
        <h3 className="text-sm font-semibold leading-snug text-foreground">
          Sofia - Satin, Distressed Black &amp; Silver
        </h3>
        <p className="mt-1 text-[11px] leading-tight text-foreground/50">
          Silver Leaf Cube Wood Picture Frame
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: RED }}>
            $38.44
          </span>
          <span className="text-xs text-foreground/40 line-through">$54.92</span>
        </div>
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
          <div className="aspect-[4/5] animate-pulse rounded-xl bg-black/[0.06]" />
          <div className="mt-3 h-3 w-4/5 animate-pulse rounded bg-black/[0.06]" />
          <div className="mt-2 h-2.5 w-3/5 animate-pulse rounded bg-black/[0.05]" />
          <div className="mt-3 h-3 w-1/3 animate-pulse rounded bg-black/[0.06]" />
        </div>
      ))}
    </div>
  )
}

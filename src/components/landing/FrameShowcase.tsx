import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDirection } from '@/hooks/useDirection'
import { localizedName } from '@/lib/localizedName'
import { motion } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import type { Swiper as SwiperType } from 'swiper'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useFetchFrameColorsPublicQuery,
  useFetchFrameTypesPublicQuery,
} from '@/store/api/apiSlice'

import 'swiper/css'
import { useLangStore } from '@/store/langStore'
import omanSlides from '@/data/omanSlides.json'

// Oman collage — each tile is ABSOLUTELY positioned (as a % of the collage
// "frame") to reproduce the exact scatter + gaps from the design: a left
// cluster, a standalone centre image, a gap, then a right cluster with the tall
// image on the far edge. The frame repeats and scrolls infinitely right → left.
//
// The 9 positions/sizes below are the permanent layout — that part of the
// design never changes. WHICH photo fills each slot does change over time:
// `slides-chunks/` holds a large pool of photos (see src/data/omanSlides.json),
// split into "chunks" of AT MOST 9 (never more — there are only 9 physical
// tile slots). One chunk fills the slots at a time; every CHUNK_DURATION_MS
// the marquee's scroll loop restarts, `useOmanChunk` below swaps in the next
// chunk, so the swap lands on the loop boundary instead of mid-scroll.
const SLIDES_DIR = '/images/inspired-by-oman/slides-chunks/'
const slideSrc = (filename: string) => SLIDES_DIR + encodeURIComponent(filename)

const TILES_PER_CHUNK = 9
// Matches OmanMarquee's scroll `transition.duration` (seconds) below — the
// two are kept in lockstep so the image swap always lands on a loop restart.
const CHUNK_DURATION_MS = 20_000

// Every photo appears EXACTLY ONCE across the whole rotation — no repeats,
// ever. 102 isn't a multiple of 9, so the groups can't all be exactly 9;
// rather than pad a short last group by reusing photos from group 1 (which
// is a repeat, just a deferred one), the remainder is spread one-per-group
// across the first few groups instead: with 102 photos that's
// Math.ceil(102/9) = 12 groups, sizes [9,9,9,9,9,9,8,8,8,8,8,8] (6 nines +
// 6 eights = 102). A group of 8 simply renders one fewer tile that cycle
// (see OmanFrame) — a much smaller, once-in-12-cycles visual change than a
// group showing photos already seen a few cycles ago.
function buildChunks(pool: readonly string[], tilesPerChunk: number): string[][] {
  const groupCount = Math.ceil(pool.length / tilesPerChunk)
  const base = Math.floor(pool.length / groupCount)
  const remainder = pool.length % groupCount
  const chunks: string[][] = []
  let offset = 0
  for (let c = 0; c < groupCount; c++) {
    const size = base + (c < remainder ? 1 : 0)
    chunks.push(pool.slice(offset, offset + size).map(slideSrc))
    offset += size
  }
  return chunks
}

const OMAN_CHUNKS: string[][] = buildChunks(omanSlides, TILES_PER_CHUNK)
const CHUNK_COUNT = OMAN_CHUNKS.length

// Module-level (not per-mount) so a URL is only ever handed to `new Image()`
// once — remounting the section (e.g. navigating away and back) won't
// re-trigger a network request for a photo the browser already cached.
const preloadedUrls = new Set<string>()

/**
 * Fetches AND fully decodes every photo in a chunk, in parallel, without
 * touching the DOM. `img.decode()` is the important part: just setting
 * `.src` only warms the HTTP cache — the browser still has to decode the
 * (often multi-MB, non-optimised) original photo into a paintable bitmap the
 * first time it's actually displayed, which alone can be enough of a delay to
 * show the tile's placeholder background before the photo pops in. Awaiting
 * `decode()` here, ahead of time, means the decoded bitmap is already sitting
 * in the browser's image cache by the time the chunk is swapped in — so
 * setting `<img src>` paints immediately.
 */
function preloadChunk(chunkIndex: number): void {
  for (const url of OMAN_CHUNKS[chunkIndex]!) {
    if (preloadedUrls.has(url)) continue
    preloadedUrls.add(url)
    const img = new Image()
    img.src = url
    img.decode().catch(() => {
      // A handful of older browsers (or a genuinely broken file) reject
      // decode() — falling back to the plain "bytes are cached" preload is
      // still strictly better than not preloading at all, so just let the
      // real <img> load it normally when its turn comes.
    })
  }
}

/**
 * Advances through the photo chunks on a timer, looping forever. Returns
 * BOTH the current chunk and the one after it: the marquee (see
 * OmanMarquee) renders two frame copies side by side at all times to fake an
 * infinite scroll, so both are simultaneously ON SCREEN together, not shown
 * one after the other — feeding them the same chunk would put the same 8-9
 * photos in view twice at once. Chunks never overlap (buildChunks), so
 * "current" and "next" are always a disjoint set of photos.
 */
function useOmanChunk(): { current: string[]; next: string[] } {
  const [chunkIndex, setChunkIndex] = useState(0)

  // Warm chunk N+1 and N+2 the whole time chunk N is current: N+1 is
  // rendered immediately (as "next", alongside N) the moment N becomes
  // current, so it must already be ready BEFORE that happens — it's N+2
  // that this specific effect run actually buys lead time for for the cycle
  // after next. (On first mount both N=0 and N+1=1 load "cold" regardless,
  // same as any page's first paint — there's no earlier cycle to have
  // preloaded them ahead of time.)
  useEffect(() => {
    preloadChunk((chunkIndex + 1) % CHUNK_COUNT)
    preloadChunk((chunkIndex + 2) % CHUNK_COUNT)
  }, [chunkIndex])

  useEffect(() => {
    const id = setInterval(() => {
      setChunkIndex((i) => (i + 1) % CHUNK_COUNT)
    }, CHUNK_DURATION_MS)
    return () => clearInterval(id)
  }, [])

  return {
    current: OMAN_CHUNKS[chunkIndex]!,
    next: OMAN_CHUNKS[(chunkIndex + 1) % CHUNK_COUNT]!,
  }
}

// `width` is the %-of-viewport used at ≥576px. `mw` is a FIXED pixel width used
// on phones (<576px), where the collage becomes a fixed MOBILE_FRAME_W-wide band
// (see below) — left/top/height stay as % so the scatter still lines up, only
// the image widths switch to px. mw defaults track width × MOBILE_FRAME_W; tune
// any of them freely.
const OMAN_TILE_LAYOUT: { left: string; top: string; width: string; height: string; mw: number }[] = [
  // ── left cluster ──
  { left: '0%', top: '7%', width: '19.2%', height: '50%', mw: 157 },   // top-left
  { left: '19.8%', top: '17.8%', width: '24.3%', height: '39%', mw: 199 },
  { left: '6%', top: '58.3%', width: '19.2%', height: '45%', mw: 157 }, // bottom-left
  { left: '25.8%', top: '58.2%', width: '18.2%', height: '30.2%', mw: 149 },
  // ── centre (standalone) ──
  { left: '44.6%', top: '26.2%', width: '15.9%', height: '51%', mw: 130 },
  // ── right cluster ──
  { left: '61%', top: '19%', width: '15.1%', height: '42.1%', mw: 124 },
  { left: '76.6%', top: '8%', width: '17.3%', height: '53.1%', mw: 142 },  // top-right tall
  { left: '61%', top: '62.4%', width: '10%', height: '35%', mw: 82 },
  { left: '71.6%', top: '62.4%', width: '17.9%', height: '27.4%', mw: 147 },
]

// ── Section heading ──────────────────────────────────────────────────────────
function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display md:text-5xl font-medium text-center tracking-tight text-brand-navy text-3xl">
      {children}
    </h2>
  )
}

// ── Prev/next controls for a Swiper slider ───────────────────────────────────
// Overlaid on the slider's left/right edges rather than below it — the two
// showcase sliders have no accompanying label to sit next to (unlike
// StackSlider's under-slider layout). Bound to `slidePrev`/`slideNext`
// directly (not Swiper's own Navigation module) so the same pair of buttons
// works for both sliders without per-instance CSS-selector wiring.
// Physical position is swapped in RTL so the arrow that visually points
// "backward" always steps backward, matching the mirrored reading direction.
function SliderArrows({
  swiper,
  isRtl,
}: {
  /** The live Swiper instance (null until Swiper's onSwiper fires). */
  swiper: SwiperType | null
  isRtl: boolean
}) {
  const { t } = useTranslation('landingSections')
  // Mirrors the instance's own isBeginning/isEnd/isLocked into state so the
  // buttons actually re-render on each slide change and breakpoint switch —
  // reading swiper.isBeginning directly wouldn't do that, since it's a plain
  // property, not observable.
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  // Swiper's own flag for "every slide already fits in the view — there is
  // nothing to slide to" (e.g. Frame Colors shows 6 per view at ≥1300px, so
  // 6 or fewer colours total means this slider can never move). Hide the
  // arrows entirely rather than just disabling them, since disabled still
  // implies "there's more, you're just at the edge," which isn't true here.
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    if (!swiper) return
    const sync = () => {
      setAtStart(swiper.isBeginning)
      setAtEnd(swiper.isEnd)
      setLocked(swiper.isLocked)
    }
    sync()
    swiper.on('slideChange', sync)
    swiper.on('resize', sync)
    // `breakpoint` is the important one: Swiper's onSwiper fires with the
    // BASE config (slidesPerView: 1) still active — the 1300px:{slidesPerView:6}
    // override, and the isLocked recheck that goes with it, is only applied
    // moments later, in a separate step. Without this, the initial sync()
    // above can catch a stale "not locked" (computed for slidesPerView: 1,
    // which 6 items never fit into) that then never corrects itself.
    swiper.on('breakpoint', sync)
    swiper.on('lock', sync)
    swiper.on('unlock', sync)
    return () => {
      swiper.off('slideChange', sync)
      swiper.off('resize', sync)
      swiper.off('breakpoint', sync)
      swiper.off('lock', sync)
      swiper.off('unlock', sync)
    }
  }, [swiper])

  if (locked) return null

  const goToStart = () => (isRtl ? swiper?.slideNext() : swiper?.slidePrev())
  const goToEnd = () => (isRtl ? swiper?.slidePrev() : swiper?.slideNext())
  // The physical start/end buttons swap which boundary disables them in RTL,
  // same swap as goToStart/goToEnd above.
  const startDisabled = isRtl ? atEnd : atStart
  const endDisabled = isRtl ? atStart : atEnd

  const btn =
    'absolute top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white text-brand-navy shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition hover:bg-brand-navy hover:text-white sm:h-10 sm:w-10 disabled:pointer-events-none disabled:opacity-30 disabled:shadow-none disabled:hover:bg-white disabled:hover:text-brand-navy'
  return (
    <>
      <button
        type="button"
        aria-label={t('frameShowcase.prevSlide')}
        onClick={goToStart}
        disabled={startDisabled}
        className={cn(btn, '-left-2 sm:-left-4 lg:-left-5')}
      >
        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
      <button
        type="button"
        aria-label={t('frameShowcase.nextSlide')}
        onClick={goToEnd}
        disabled={endDisabled}
        className={cn(btn, '-right-2 sm:-right-4 lg:-right-5')}
      >
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
    </>
  )
}

// ── A swatch card (frame type / colour) ──────────────────────────────────────
// Shows the uploaded thumbnail; falls back to a solid colour block (colours) or
// an empty tile (types) when no image has been uploaded yet.
function SwatchCard({
  img,
  label,
  ratio,
  color,
  contain,
  to,
}: {
  img?: string | null
  label: string
  ratio: string
  color?: string
  /** Centre a fixed-width image (frame colours) instead of filling the card. */
  contain?: boolean
  /** When set, the whole card links here (e.g. /products?type=Floating). */
  to?: string
}) {
  const body = (
    <>
      <div className="rounded-2xl bg-white ring-1 ring-black/[0.04] transition group-hover:ring-black/10">
        <div
          className={`${ratio} flex items-center justify-center overflow-hidden rounded-xl`}
          style={!img && color ? { background: `#${color}` } : undefined}
        >
          {img &&
            (contain ? (
              <img src={img} alt={label} loading="lazy" draggable={false} className="h-auto w-[118px] object-contain" />
            ) : (
              <img src={img} alt={label} loading="lazy" draggable={false} className="h-full w-full object-cover" />
            ))}
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-foreground/70">{label}</p>
    </>
  )
  return to ? (
    <Link to={to} className="group block cursor-pointer text-center">
      {body}
    </Link>
  ) : (
    <div className="text-center">{body}</div>
  )
}

// ── Full-bleed collage marquee (infinite right → left) ───────────────────────
// ≥576px: each "frame" is one viewport (100vw) wide, tiles sized in %. Phones
// (<576px) would squash the 9 tiles into ~375px, so below 576px each frame
// becomes a fixed MOBILE_FRAME_W-wide band and tiles use fixed px widths (`mw`).
// The rightmost tile (palm) leaves a small empty right margin; we OVERLAP the
// second copy by that margin (minus one seam gap) and translate by exactly one
// period so the loop repeats seamlessly — the transform version of
// `background-repeat: repeat-x`. All distances are in the frame's own unit
// (vw on desktop, px on mobile) so the math holds in both.
const OVERLAP_VW = 5.5 // ≥576px: ~6.1vw right margin − ~0.6vw seam gap
const PERIOD_VW = 100 - OVERLAP_VW // 94.5vw
const MOBILE_MAX_PX = 575
const MOBILE_FRAME_W = 820 // px — collage band width on phones (<576px)
const MOBILE_OVERLAP = Math.round((OVERLAP_VW / 100) * MOBILE_FRAME_W) // ≈ 45px
const MOBILE_PERIOD = MOBILE_FRAME_W - MOBILE_OVERLAP // ≈ 775px

// Track < 576px so the collage can swap %-of-viewport widths for fixed px widths.
function useIsMobile() {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(`(max-width: ${MOBILE_MAX_PX}px)`).matches,
  )
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX_PX}px)`)
    const sync = () => setMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return mobile
}

function OmanFrame({
  images,
  mobile,
  rtl = false,
  style,
}: {
  /**
   * The current chunk's photo URLs, one per OMAN_TILE_LAYOUT slot in order.
   * Usually 9; occasionally 8 (see buildChunks) — never more than
   * OMAN_TILE_LAYOUT.length, and only ever sliced to `images.length` tile
   * slots below, so a shorter chunk just renders one fewer tile rather than
   * an empty/broken one or a repeated photo filling the gap.
   */
  images: string[]
  mobile: boolean
  rtl?: boolean
  style?: React.CSSProperties
}) {
  return (
    <div
      className="relative h-[360px] shrink-0 md:h-[420px] lg:h-[688px]"
      style={{ width: mobile ? MOBILE_FRAME_W : '100vw', ...style }}
    >
      {OMAN_TILE_LAYOUT.slice(0, images.length).map((t, i) => (
        <div
          key={i}
          className="absolute overflow-hidden bg-black/5 [transform:translateZ(0)] [backface-visibility:hidden]"
          style={{
            ...(rtl ? { right: t.left } : { left: t.left }),
            top: t.top,
            width: mobile ? t.mw : t.width,
            height: t.height,
          }}
        >
          <img
            src={images[i]}
            alt=""
            aria-hidden
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>
      ))}
    </div>
  )
}

function OmanMarquee() {
  const mobile = useIsMobile()
  const isRtl = useLangStore((s) => s.isRtl)
  // Two DIFFERENT (guaranteed non-overlapping) chunks — see useOmanChunk for
  // why: both frame copies below are on screen at once, so they must never
  // show the same photo set.
  const { current, next } = useOmanChunk()

  const xAnimation = useMemo(() => {
    if (mobile) {
      return isRtl
        ? [MOBILE_PERIOD, 0]
        : [0, -MOBILE_PERIOD]
    }

    return isRtl
      ? [`${PERIOD_VW}vw`, '0vw']
      : ['0vw', `-${PERIOD_VW}vw`]
  }, [mobile, isRtl])

  const overlapStyle = isRtl
    ? {
      marginRight: mobile ? -MOBILE_OVERLAP : `-${OVERLAP_VW}vw`,
    }
    : {
      marginLeft: mobile ? -MOBILE_OVERLAP : `-${OVERLAP_VW}vw`,
    };

  return (
    <motion.div
      className="flex w-max will-change-transform [backface-visibility:hidden]"
      animate={{ x: xAnimation }}
      transition={{
        duration: 20,
        ease: 'linear',
        repeat: Infinity,
      }}
    >
      {/* First-rendered copy is always the "current" chunk, second is
          "next" — DOM order (not the isRtl branch) is what the scroll
          animation above treats as first-in-view vs. scrolling-in-behind. */}
      <>
        {isRtl ? (
          <>
            <OmanFrame images={current} mobile={mobile} style={overlapStyle} />
            <OmanFrame images={next} mobile={mobile} />
          </>
        ) : (
          <>
            <OmanFrame images={current} mobile={mobile} />
            <OmanFrame images={next} mobile={mobile} style={overlapStyle} />
          </>
        )}
      </>
    </motion.div>
  )
}

export default function FrameShowcase() {
  const { t } = useTranslation('landingSections')
  const dir = useDirection()
  const isRtl = dir === 'rtl'
  const { data: frameTypes } = useFetchFrameTypesPublicQuery()
  const { data: frameColors } = useFetchFrameColorsPublicQuery()
  // State (not a ref) so SliderArrows re-renders — and can react to
  // slideChange events — once the Swiper instance becomes available.
  const [frameTypesSwiper, setFrameTypesSwiper] = useState<SwiperType | null>(null)
  const [frameColorsSwiper, setFrameColorsSwiper] = useState<SwiperType | null>(null)

  return (
    <section className="relative w-full overflow-hidden pt-16 md:pt-20">
      {/* Frame Types + Frame Colors live inside the page container. Skip the
          whole wrapper (and its padding) when neither list has items. */}
      {(!!frameTypes?.length || !!frameColors?.length) && (
        <div className="mx-auto max-w-[1400px] px-6 md:px-10">
          {/* ── Frame Types (slider) ─────────────────────────────────────────── */}
          {!!frameTypes?.length && (
            <>
              <Heading>{t('frameShowcase.frameTypes')}</Heading>
              <div className="relative mt-9">
                <Swiper
                  key={dir}
                  dir={dir}
                  onSwiper={setFrameTypesSwiper}
                  slidesPerView={1}
                  spaceBetween={18}
                  grabCursor
                  breakpoints={{
                    576: { slidesPerView: 2 },
                    768: { slidesPerView: 3 },
                    1024: { slidesPerView: 4 },
                  }}
                  className="!px-1 !py-2"
                >
                  {frameTypes.map((t) => (
                    <SwiperSlide key={t.id}>
                      <SwatchCard
                        img={t.imageUrl}
                        label={localizedName(t, isRtl)}
                        ratio="h-[385px]"
                        to={`/products?type=${encodeURIComponent(t.name)}`}
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
                <SliderArrows swiper={frameTypesSwiper} isRtl={isRtl} />
              </div>
            </>
          )}

          {/* ── Frame Colors (slider) ────────────────────────────────────────── */}
          {!!frameColors?.length && (
            <div className="mt-16 md:mt-20">
              <Heading>{t('frameShowcase.frameColors')}</Heading>
              <div className="relative mt-9">
                <Swiper
                  key={dir}
                  dir={dir}
                  onSwiper={setFrameColorsSwiper}
                  slidesPerView={1}
                  spaceBetween={10}
                  grabCursor
                  breakpoints={{
                    576: { slidesPerView: 3 },
                    768: { slidesPerView: 4 },
                    992: { slidesPerView: 5 },
                    1300: { slidesPerView: 6 },
                  }}
                  className="!px-1 !py-2"
                >
                  {frameColors.map((c) => (
                    <SwiperSlide key={c.id}>
                      <SwatchCard
                        img={c.imageUrl}
                        color={c.color}
                        label={localizedName(c, isRtl)}
                        ratio="h-[238px]"
                        contain
                        to={`/products?color=${encodeURIComponent(c.name)}`}
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
                <SliderArrows swiper={frameColorsSwiper} isRtl={isRtl} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Inspired by Oman ───────────────────────────────────────────────── */}
      <div className="mt-16 md:mt-24">
        {/* heading + copy stay centred within the container */}
        <div className="mx-auto max-w-4xl px-5 text-center">
          <Heading>{t('frameShowcase.inspiredByOman')}</Heading>
          <p className="mx-auto mt-4 tracking-[0.09em] text-sm text-foreground/80 md:text-base">
            {t('frameShowcase.omanDescription')}
          </p>
        </div>

        {/* full-bleed staggered marquee — starts at the left edge */}
        <div className="mt-10">
          <OmanMarquee />
        </div>
      </div>
    </section>
  )
}

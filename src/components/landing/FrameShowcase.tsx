import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDirection } from '@/hooks/useDirection'
import { localizedName } from '@/lib/localizedName'
import { motion } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import {
  useFetchFrameColorsPublicQuery,
  useFetchFrameTypesPublicQuery,
} from '@/store/api/apiSlice'

import 'swiper/css'
import { useLangStore } from '@/store/langStore'

// Oman collage — each tile is ABSOLUTELY positioned (as a % of the collage
// "frame") to reproduce the exact scatter + gaps from the design: a left
// cluster, a standalone centre image, a gap, then a right cluster with the tall
// image on the far edge. The frame repeats and scrolls infinitely right → left.
// Real images live in /public/images/inspired-by-oman (swap for optimised
// versions later — the current files are large). Reorder freely to change which
// photo sits where.
const OMAN = (f: string) => `/images/inspired-by-oman/${f}`
// `width` is the %-of-viewport used at ≥576px. `mw` is a FIXED pixel width used
// on phones (<576px), where the collage becomes a fixed MOBILE_FRAME_W-wide band
// (see below) — left/top/height stay as % so the scatter still lines up, only
// the image widths switch to px. mw defaults track width × MOBILE_FRAME_W; tune
// any of them freely.
const OMAN_TILES: { src: string; left: string; top: string; width: string; height: string; mw: number }[] = [
  // ── left cluster ──
  { src: OMAN('29999408f8994556ce59a632f8675733cd39b6a2.jpg'), left: '0%', top: '7%', width: '19.2%', height: '50%', mw: 157 },   // castle (top-left)
  { src: OMAN('03486307b5dd46d361550d5793ce1c533fb16af5.jpg'), left: '19.8%', top: '17.8%', width: '24.3%', height: '39%', mw: 199 }, // mountains + valley
  { src: OMAN('4a5a9610c1ecbc52c9bd53475202e385b1a1a18e.jpg'), left: '6%', top: '58.3%', width: '19.2%', height: '45%', mw: 157 }, // turquoise wadi (bottom-left)
  { src: OMAN('f475e911ce5cfe2d389e7eccb1fb9fe251ae6c21.jpg'), left: '25.8%', top: '58.2%', width: '18.2%', height: '30.2%', mw: 149 }, // Muscat gate
  // ── centre (standalone) ──
  { src: OMAN('971278bacdad911d76d3422fd53dbdf3e11f78b2.jpg'), left: '44.6%', top: '26.2%', width: '15.9%', height: '51%', mw: 130 }, // winding road
  // ── right cluster ──
  { src: OMAN('7de1cfced9260d0ebe8fae7242e0e0c262baff21.jpg'), left: '61%', top: '19%', width: '15.1%', height: '42.1%', mw: 124 }, // waterfalls + pool
  { src: OMAN('a34fe86058ae3579b15948c527eba7bd4b964a52.jpg'), left: '76.6%', top: '8%', width: '17.3%', height: '53.1%', mw: 142 },  // palm sunset (top-right tall)
  { src: OMAN('f60421689be700bcf7261527154e84bccf39eef1.jpg'), left: '61%', top: '62.4%', width: '10%', height: '35%', mw: 82 },   // small waterfall
  { src: OMAN('275c027383a7e6c21227aa2ba5ef68ac4816e214.jpg'), left: '71.6%', top: '62.4%', width: '17.9%', height: '27.4%', mw: 147 },   // fort + mountains
]

// ── Section heading ──────────────────────────────────────────────────────────
function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display md:text-5xl font-medium text-center tracking-tight text-brand-navy text-3xl">
      {children}
    </h2>
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
  mobile,
  rtl = false,
  style,
}: {
  mobile: boolean
  rtl?: boolean
  style?: React.CSSProperties
}) {
  return (
    <div
      className="relative h-[360px] shrink-0 md:h-[420px] lg:h-[688px]"
      style={{ width: mobile ? MOBILE_FRAME_W : '100vw', ...style }}
    >
      {OMAN_TILES.map((t, i) => (
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
            src={t.src}
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
      <>
        {isRtl ? (
          <>
            <OmanFrame mobile={mobile} style={overlapStyle} />
            <OmanFrame mobile={mobile} />
          </>
        ) : (
          <>
            <OmanFrame mobile={mobile} />
            <OmanFrame mobile={mobile} style={overlapStyle} />
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
              <div className="mt-9">
                <Swiper
                  key={dir}
                  dir={dir}
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
              </div>
            </>
          )}

          {/* ── Frame Colors (slider) ────────────────────────────────────────── */}
          {!!frameColors?.length && (
            <div className="mt-16 md:mt-20">
              <Heading>{t('frameShowcase.frameColors')}</Heading>
              <div className="mt-9">
                <Swiper
                  key={dir}
                  dir={dir}
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

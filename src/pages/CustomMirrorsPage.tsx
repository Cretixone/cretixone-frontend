import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import Navbar, { PillNav } from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { useLangStore } from '@/store/langStore'
import { cn } from '@/lib/utils'

// ── Animation variants ───────────────────────────────────────────────────────
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}

const CATEGORIES = [
  { titleKey: 'wall', img: '/images/mirors/miror-1.png' },
  { titleKey: 'decorative', img: '/images/mirors/miror-2.png' },
  { titleKey: 'led', img: '/images/mirors/miror-3.png' },
  { titleKey: 'customShapes', img: '/images/mirors/miror-4.png' },
  { titleKey: 'beveled', img: '/images/mirors/miror-6.png' },
  { titleKey: 'framed', img: '/images/mirors/miror-5.png' },
]

const COLLAGE = {
  topLeft: '/images/craft-miror.png',
  bottomLeft: '/images/craft-light-miror.png',
  right: '/images/craft.png',
}

export default function CustomMirrorsPage() {
  const { t } = useTranslation('pages')
  const navigate = useNavigate()
  const isRtl = useLangStore((s) => s.isRtl)

  useEffect(() => {
    const prevBg = document.body.style.background
    const prevColor = document.body.style.color
    document.body.style.background = '#ffffff'
    document.body.style.color = '#002365'
    window.scrollTo(0, 0)
    return () => {
      document.body.style.background = prevBg
      document.body.style.color = prevColor
    }
  }, [])

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white font-sans text-foreground">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Full-bleed room photo (mirror sits centre-right) */}
        <img
          src="/images/miror-bg.png"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        {/* Soft grey glow ellipse */}
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            width: '1530px',
            height: '1530px',
            ...(isRtl ? { right: '-707px' } : { left: '-707px' }),
            top: '-374px',
            background: '#D9D9D9',
            filter: 'blur(303.35px)',
          }}
        />

        {/* White fade */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: isRtl
              ? 'linear-gradient(270deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.55) 30%, rgba(255,255,255,0) 56%)'
              : 'linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.55) 30%, rgba(255,255,255,0) 56%)',
          }}
        />
        {/* Nav overlays the hero image */}
        <div className="relative z-30">
          <Navbar />
        </div>
        <PillNav />

        {/* Hero copy + CTA */}
        <div className="relative z-10 mx-auto flex min-h-[540px] max-w-[1400px] flex-col px-5 pb-14 pt-10 mt-[100px] md:min-h-[600px] md:px-10 md:pb-16 md:pt-14">
          <motion.div
            className="max-w-2xl"
            initial="hidden"
            animate="show"
            variants={stagger}
          >
            <motion.h1 variants={fadeUp} className="font-bold leading-[1.03] tracking-tight">
              <span className="block text-[42px] text-brand-navy sm:text-6xl md:text-7xl">
                {t('customMirrors.hero.titleLine1')}
              </span>
              <span className="mt-1 block text-[28px] text-black sm:text-4xl md:text-5xl">
                {t('customMirrors.hero.titleLine2')}
              </span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-8 max-w-md text-sm leading-relaxed text-foreground/70"
            >
              {t('customMirrors.hero.text')}
            </motion.p>
          </motion.div>

          <motion.button
            type="button"
            onClick={() => navigate('/editor')}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.35 }}
            className="mt-10 inline-flex w-fit items-center justify-center self-start rounded-full bg-brand-gold px-8 py-3.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-brand-gold/90"
          >
            {t('customMirrors.hero.cta')}
          </motion.button>
        </div>
      </section>

      <main className="mx-auto max-w-[1400px] px-5 pb-20 pt-16 md:px-8 md:pb-28 md:pt-20 lg:px-10">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.div
          className="mx-auto max-w-2xl pb-4 text-center"
          initial="hidden"
          animate="show"
          variants={stagger}
        >
          <motion.h1
            variants={fadeUp}
            className="text-[28px] font-medium tracking-tight text-brand-navy sm:text-[40px]"
          >
            {t('customMirrors.header.title')}
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-1 max-w-md text-[16px] leading-relaxed text-foreground/60"
          >
            {t('customMirrors.header.subtitle')}
          </motion.p>
        </motion.div>

        {/* ── Category grid ──────────────────────────────────────────────── */}
        <motion.div
          className="mx-auto mt-12 grid grid-cols-1 gap-x-12 gap-y-9 sm:grid-cols-2 lg:grid-cols-3"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
        >
          {CATEGORIES.map((c) => (
            <motion.div key={c.titleKey} variants={fadeUp} className="group text-center">
              <div className="overflow-hidden rounded-3xl bg-black/5">
                <div className="h-[380px] w-full">
                  <img
                    src={c.img}
                    alt={t(`customMirrors.categories.${c.titleKey}`)}
                    loading="lazy"
                    draggable={false}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                  />
                </div>
              </div>
              <p className="mt-3 text-[16px] font-normal text-black">
                {t(`customMirrors.categories.${c.titleKey}`)}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Crafted with Precision ─────────────────────────────────────── */}
        <section className="mt-24 md:mt-28">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
            {/* Copy + CTA */}
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-80px' }}
              variants={stagger}
            >
              <motion.h2
                variants={fadeUp}
                className="text-[28px] font-medium tracking-tight text-brand-navy md:text-[46px]"
              >
                {t('customMirrors.crafted.title')}
              </motion.h2>
              <motion.p
                variants={fadeUp}
                className="mt-4 max-w-md text-[13px] leading-relaxed text-foreground/60 md:text-sm"
              >
                {t('customMirrors.crafted.text')}
              </motion.p>
              <motion.button
                variants={fadeUp}
                type="button"
                onClick={() => navigate('/editor')}
                className="mt-7 inline-flex items-center justify-center rounded-md bg-brand-gold px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-gold/90"
              >
                {t('customMirrors.crafted.cta')}
              </motion.button>
            </motion.div>

            {/* Image collage: two stacked left, one tall right */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="grid h-[360px] grid-cols-4 grid-rows-2 gap-1 md:h-[600px]"
            >
              <div className="col-span-1 col-start-1 rounded-l-3xl row-start-1 overflow-hidden bg-black/5">
                <img
                  src={COLLAGE.topLeft}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div
                className="col-span-1 rounded-l-3xl col-start-1 row-start-2  overflow-hidden bg-black/5">
                <img
                  src={COLLAGE.bottomLeft}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="col-span-3 col-start-2 row-span-2 rounded-r-3xl row-start-1 overflow-hidden  bg-black/5">
                <img
                  src={COLLAGE.right}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  className="h-full w-full object-cover object-top"
                />
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
      <div
        aria-hidden
        className="pointer-events-none z-10 absolute top-[30%] rounded-full"
        style={{
          width: '450px',
          height: '450px',
          background: 'rgba(65, 105, 226, 0.18)',
          filter: 'blur(150px)',
          left: '-225px',
        }}
      />
    </div>
  )
}

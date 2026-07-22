import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { motion, type Variants } from 'framer-motion'
import Navbar, { PillNav } from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { cn } from '@/lib/utils'

// ── Shared scroll-in animation variants (match landing-page sections) ────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

const inViewProps = {
  initial: 'hidden' as const,
  whileInView: 'show' as const,
  viewport: { once: true, margin: '-80px' },
}

// ── Image asset paths ────────────────────────────────────────────────────────
const HERO_BG_FRAMES = '/images/frames-wallpaper.jpg'
const SHOWCASE_IMAGES = [
  '/images/legacy-1.jpg',
  '/images/legacy-2.jpg',
  '/images/legacy-3.png',
]
const WHAT_WE_DO_IMAGE = '/images/art-gallery.jpg'
const COMMITMENT_IMAGE = '/images/commitment.jpg'
const PROMISE_IMAGE = '/images/promise.jpg'

export default function AboutPage() {
  const { t } = useTranslation('pages')

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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 z-0 overflow-hidden"
        style={{ top: '-184px', height: '1070px' }}
      >
        <motion.div
          className="absolute inset-x-0 top-0"
          style={{ height: '200%' }}
          animate={{ y: ['0%', '-50%'] }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        >
          <img
            src={HERO_BG_FRAMES}
            alt=""
            className="block h-1/2 w-full object-cover"
          />
          <img
            src={HERO_BG_FRAMES}
            alt=""
            className="block h-1/2 w-full object-cover"
          />
        </motion.div>
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.76) 15.38%, #FFFEFE 47.12%)',
          }}
        />
      </div>

      {/* Wrapped so the Navbar's mobile-menu absolute has a positioned ancestor. */}
      <div className="relative">
        <Navbar />
      </div>
      <PillNav />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative">
        <div className="mx-auto max-w-[1400px] px-5 pt-28 md:px-8 md:pt-32 lg:px-10 lg:pt-40">
          {/* Breadcrumb */}
          <nav
            aria-label={t('about.breadcrumb.aria')}
            className="flex items-center gap-2 text-xs text-brand-navy md:text-[13px]"
          >
            <Link
              to="/"
              aria-label={t('about.breadcrumb.home')}
              className="inline-flex items-center transition hover:opacity-80"
            >
              <Home className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
            <ChevronRight className="h-3 w-3 text-brand-navy/60" />
            <span className="text-brand-navy/70">{t('about.breadcrumb.current')}</span>
          </nav>

          {/* Centered intro */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="mt-12 text-center md:mt-20"
          >
            <h1 className="text-4xl font-medium text-brand-navy md:text-[40px] lg:text-[50px]">
              Cretixone
            </h1>
            <p className="mt-2 text-sm text-foreground md:text-base">
              {t('about.hero.by')}
            </p>
            <p className="mt-8 text-base text-foreground md:text-[27px]">
              {t('about.hero.tagline')}
            </p>
            <div className="mx-auto color-gray mt-8 max-w-[1200px] space-y-3 text-[13px] leading-relaxed md:text-sm">
              <p>{t('about.hero.intro1')}</p>
              <p>{t('about.hero.intro2')}</p>
              <p>{t('about.hero.intro3')}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── LEGACY WE HONOR ──────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-[1100px] px-5 pt-16 pb-16 md:px-8 md:pt-20 md:pb-20 lg:px-10">
        <motion.div className="text-center" variants={stagger} {...inViewProps}>
          <motion.h2
            className="text-2xl font-medium text-brand-navy md:text-[34px]"
            variants={fadeUp}
          >
            {t('about.legacy.title')}
          </motion.h2>
          <motion.div
            className="mx-auto mt-7 md:pb-7 max-w-[820px] text-[13px] leading-relaxed color-gray md:text-sm"
            variants={fadeUp}
          >
            <p>{t('about.legacy.p1')}</p>
            <p>{t('about.legacy.p2')}</p>
          </motion.div>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-7 sm:grid-cols-2 md:grid-cols-3">
          {SHOWCASE_IMAGES.map((src, i) => {
            const radiusClass =
              i === 0
                ? 'rounded-2xl sm:rounded-[28px] md:rounded-none md:rounded-tl-[60px]'
                : i === 2
                ? 'rounded-2xl sm:rounded-[28px] md:rounded-none md:rounded-br-[60px]'
                : 'rounded-2xl sm:rounded-[28px] md:rounded-none'
            const offsetClass = i === 1 ? '' : 'md:mt-[30px]'
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.03 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
                className={`aspect-[4/5] overflow-hidden bg-[#E8EAED] ${radiusClass} ${offsetClass}`}
              >
                <img
                  src={src}
                  alt={t('about.legacy.showcaseAlt', { num: i + 1 })}
                  className={`block object-cover ${
                    i === 2 ? '' : 'h-full w-full'
                  } ${i === 0 ? 'scale-[2]' : i === 1 ? 'scale-[1.8]' : ''}`}
                  style={
                    i === 0
                      ? { objectPosition: '76% -62px' }
                      : i === 1
                      ? { objectPosition: '73% -64px' }
                      : i === 2
                      ? { width: '95px', marginInline: 'auto' }
                      : undefined
                  }
                  loading="lazy"
                  onError={(e) => {
                    // Placeholder fallback while real assets aren't dropped in yet.
                    ;(e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
                  }}
                />
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ── Our Foundation (light blue band) ────────────────────────────── */}
      <section className="relative bg-[#F1F7FF] py-16 ">
        <motion.div
          className="mx-auto max-w-[1400px] px-5 md:px-8 lg:px-10"
          variants={stagger}
          {...inViewProps}
        >
          <motion.h2
            className="text-center text-2xl font-medium text-brand-navy md:text-[32px]"
            variants={fadeUp}
          >
            {t('about.foundation.title')}
          </motion.h2>

          <motion.div
            className="mt-12 rounded-3xl bg-white px-6 shadow-[0_8px_30px_rgba(0,35,101,0.06)] md:px-8"
            variants={fadeUp}
          >
            <motion.div
              className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
              variants={stagger}
            >
              <motion.div variants={fadeUp}>
                <FoundationItem
                  iconSrc="/images/svg/history.svg"
                  iconAlt={t('about.foundation.established.alt')}
                  title={t('about.foundation.established.title')}
                  text={t('about.foundation.established.text')}
                  hasDivider
                />
              </motion.div>
              <motion.div variants={fadeUp}>
                <FoundationItem
                  iconSrc="/images/svg/transformation.svg"
                  iconAlt={t('about.foundation.modern.alt')}
                  title={t('about.foundation.modern.title')}
                  text={t('about.foundation.modern.text')}
                  hasDivider
                />
              </motion.div>
              <motion.div variants={fadeUp}>
                <FoundationItem
                  iconSrc="/images/svg/eye.svg"
                  iconAlt={t('about.foundation.vision.alt')}
                  title={t('about.foundation.vision.title')}
                  text={t('about.foundation.vision.text')}
                  hasDivider
                />
              </motion.div>
              <motion.div variants={fadeUp}>
                <FoundationItem
                  iconSrc="/images/svg/together.svg"
                  iconAlt={t('about.foundation.value.alt')}
                  title={t('about.foundation.value.title')}
                  text={t('about.foundation.value.text')}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── WHAT WE DO ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute z-10"
          style={{
            top: '0%',
            left: '-150px',
            width: 'min(300px, 60vw)',
            height: '300px',
            borderRadius: '9999px',
            background: '#506795',
            filter: 'blur(160px)',
          }}
        />

        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 px-5 md:px-8 lg:grid-cols-12 lg:items-center lg:gap-16 lg:px-10">
          <motion.div
            className="lg:col-span-7"
            variants={stagger}
            {...inViewProps}
          >
            <motion.h2
              className="text-2xl font-medium text-brand-navy md:text-[32px]"
              variants={fadeUp}
            >
              {t('about.whatWeDo.title')}
            </motion.h2>

            <motion.ul
              className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2"
              variants={stagger}
            >
              <motion.div variants={fadeUp}>
                <ServiceItem
                  iconSrc="/images/svg/art.svg"
                  iconAlt={t('about.whatWeDo.services.framing.alt')}
                  label={t('about.whatWeDo.services.framing.label')}
                />
              </motion.div>
              <motion.div variants={fadeUp}>
                <ServiceItem
                  iconSrc="/images/svg/print.svg"
                  iconAlt={t('about.whatWeDo.services.print.alt')}
                  label={t('about.whatWeDo.services.print.label')}
                />
              </motion.div>
              <motion.div variants={fadeUp}>
                <ServiceItem
                  iconSrc="/images/svg/creative.svg"
                  iconAlt={t('about.whatWeDo.services.design.alt')}
                  label={t('about.whatWeDo.services.design.label')}
                />
              </motion.div>
              <motion.div variants={fadeUp}>
                <ServiceItem
                  iconSrc="/images/svg/corporate.svg"
                  iconAlt={t('about.whatWeDo.services.corporate.alt')}
                  label={t('about.whatWeDo.services.corporate.label')}
                />
              </motion.div>
              <motion.div variants={fadeUp}>
                <ServiceItem
                  iconSrc="/images/svg/development.svg"
                  iconAlt={t('about.whatWeDo.services.development.alt')}
                  label={t('about.whatWeDo.services.development.label')}
                />
              </motion.div>
            </motion.ul>

            <motion.h3
              className="mt-12 text-base font-jasmine leading-8 uppercase tracking-wide text-brand-navy md:text-[40px]"
              variants={fadeUp}
            >
              {t('about.whatWeDo.marketplaceLine1')}
              <br />
              {t('about.whatWeDo.marketplaceLine2')}
            </motion.h3>
            <motion.div
              className="mt-12 space-y-3 text-[13px] leading-relaxed text-foreground md:text-sm"
              variants={fadeUp}
            >
              <p>{t('about.whatWeDo.p1')}</p>
              <p>{t('about.whatWeDo.p2')}</p>
            </motion.div>
          </motion.div>

          {/* Right: collage image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="aspect-[6/8] overflow-hidden rounded-2xl bg-[#E8EAED] sm:rounded-[28px] lg:col-span-5 lg:rounded-none lg:rounded-tl-[80px]"
          >
            <img
              src={WHAT_WE_DO_IMAGE}
              alt={t('about.whatWeDo.imageAlt')}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </motion.div>
        </div>
      </section>

      {/* ── OUR COMMITMENT (4 pastel cards) ─────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-5 pt-4 pb-16 md:px-8 md:pb-20 lg:px-10">
        <motion.div variants={stagger} {...inViewProps}>
          <motion.h2
            className="text-2xl font-medium text-brand-navy md:text-[32px]"
            variants={fadeUp}
          >
            {t('about.commitment.title')}
          </motion.h2>

          <motion.div
            className="mt-10 grid auto-rows-fr grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="h-full">
              <CommitmentCard
                iconSrc="/images/svg/deliver-permium.svg"
                iconAlt={t('about.commitment.deliver.alt')}
                text={t('about.commitment.deliver.text')}
                bg="rgba(207, 189, 255, 0.25)"
              />
            </motion.div>
            <motion.div variants={fadeUp} className="h-full">
              <CommitmentCard
                iconSrc="/images/svg/support.svg"
                iconAlt={t('about.commitment.support.alt')}
                text={t('about.commitment.support.text')}
                bg="rgba(196, 247, 255, 0.25)"
              />
            </motion.div>
            <motion.div variants={fadeUp} className="h-full">
              <CommitmentCard
                iconSrc="/images/svg/bell-check.svg"
                iconAlt={t('about.commitment.innovative.alt')}
                text={t('about.commitment.innovative.text')}
                bg="rgba(205, 216, 255, 0.25)"
              />
            </motion.div>
            <motion.div variants={fadeUp} className="h-full">
              <CommitmentCard
                iconSrc="/images/svg/rocket.svg"
                iconAlt={t('about.commitment.elevate.alt')}
                text={t('about.commitment.elevate.text')}
                bg="rgba(253, 240, 221, 0.56)"
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── PROMISE / COMMITMENT (two dark cards) ───────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-5 pb-20 md:px-8 lg:px-10">
        <motion.div
          className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5"
          variants={stagger}
          {...inViewProps}
        >
          {/* Left card: photo + 'Our Commitment' overlay */}
          <motion.div
            variants={fadeUp}
            className="relative h-[800px] overflow-hidden rounded-3xl bg-[#1a1a2e]"
          >
            <img
              src={COMMITMENT_IMAGE}
              alt={t('about.promise.commitmentAlt')}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 pl-7 py-5 text-white md:pl-12 md:py-12">
              <div className="flex items-center gap-4">
                <h3 className="whitespace-nowrap font-medium text-2xl md:text-[28px]">
                  {t('about.promise.commitmentTitle')}
                </h3>
                <div aria-hidden className="h-px flex-1 bg-[#D9D9D9]" />
              </div>
              <p className="mt-4  text-[13px] leading-relaxed text-white md:text-sm md:pr-16 pr-10">
                {t('about.promise.commitmentText')}
              </p>
            </div>
          </motion.div>

          {/* Right card: dark with promise text + glowing accent image */}
          <motion.div
            variants={fadeUp}
            className="relative h-[800px] overflow-hidden rounded-3xl bg-[#0B0B12]"
          >
            <img
              src={PROMISE_IMAGE}
              alt=""
              aria-hidden
              className="absolute inset-y-[9%] right-0 w-full object-cover"
              loading="lazy"
            />
            <div
              aria-hidden
             
            />
            <div className="relative z-10  pl-7 py-5 text-white md:pl-12 md:py-12">
              <div className="flex items-center gap-4">
                <h3 className="whitespace-nowrap font-medium text-2xl md:text-[28px]">
                  {t('about.promise.promiseTitle')}
                </h3>
                <div aria-hidden className="h-px flex-1 bg-[#D9D9D9]" />
              </div>
              <div className="mt-4 max-w-md space-y-3 text-[13px] leading-relaxed text-white md:text-sm">
                <p>{t('about.promise.promiseP1')}</p>
                <p>{t('about.promise.promiseP2')}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <Footer />
    </div>
  )
}

// ─── Section helpers ─────────────────────────────────────────────────────────

interface FoundationItemProps {
  iconSrc: string
  iconAlt: string
  title: string
  text: string
  hasDivider?: boolean
}

function FoundationItem({
  iconSrc,
  iconAlt,
  title,
  text,
  hasDivider,
}: FoundationItemProps) {
  return (
    <div
      className={
        cn(
          {
            '!lg:border-r !border-l-0 lg:border-brand-navy/15 lg:pr-6': hasDivider,
          },
          "py-7 h-full"
        )
      }
    >
      <img src={iconSrc} alt={iconAlt} className="h-7 w-7" />
      <h3 className="mt-4 text-[14px] font-bold text-brand-navy md:text-[15px]">
        {title}
      </h3>
      <p className="mt-4 text-[12.5px] leading-relaxed text-foreground md:text-[13px]">
        {text}
      </p>
    </div>
  )
}

interface ServiceItemProps {
  iconSrc: string
  iconAlt: string
  label: string
}

function ServiceItem({ iconSrc, iconAlt, label }: ServiceItemProps) {
  return (
    <li
      className="flex items-center gap-3 rounded-[6px] bg-white px-4 py-2 transition"
      style={{ border: '1px solid rgba(0, 35, 101, 0.12)' }}
    >
      <img src={iconSrc} alt={iconAlt} className="h-6 w-6 shrink-0" />
      <span className="text-[13px]  text-brand-navy md:text-sm">
        {label}
      </span>
    </li>
  )
}

interface CommitmentCardProps {
  iconSrc: string
  iconAlt: string
  text: string
  bg: string
}

function CommitmentCard({ iconSrc, iconAlt, text, bg }: CommitmentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="flex h-full min-h-[220px] flex-col justify-between rounded-[30px] px-6 py-6 md:py-10"
      style={{ backgroundColor: bg }}
    >
      <img src={iconSrc} alt={iconAlt} className="h-14 w-14" />
      <p className="text-[13px] mt-5 font-medium leading-relaxed text-brand-navy md:text-sm">
        {text}
      </p>
    </motion.div>
  )
}

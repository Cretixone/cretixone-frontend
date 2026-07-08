import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import { Gem, Sun, Maximize2, Rocket, BadgeCheck, type LucideIcon } from 'lucide-react'
import Navbar, { PillNav } from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'

// ── Animation variants ───────────────────────────────────────────────────────
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}

// ── Print categories ──────────────────────────────────────────────────────────
// NOTE: `img` paths are placeholders using existing photos. Drop real print
// photos in /public/images and update the paths to match.
const CATEGORIES = [
  { title: 'Photo Prints', img: '/images/prints/print-1.png' },
  { title: 'Canvas Prints', img: '/images/prints/print-2.jpg' },
  { title: 'Fine Art Prints', img: '/images/prints/print-3.jpg' },
  { title: 'Large Format Printing', img: '/images/prints/print-4.jpg' },
  { title: 'Personalized Wall Décor', img: '/images/prints/print-5.jpg' },
  { title: 'Corporate Printing Solutions', img: '/images/prints/print-6.jpg' },
]

// ── "Why Choose Us?" features ─────────────────────────────────────────────────
// `highlight` paints the cream background — arranged as a diagonal checkerboard
// across the 2-column grid, matching the design.
interface Feature {
  icon: string
  title: string
  desc: string
  highlight: boolean
}

const FEATURE_DESC =
  'Crafted from premium materials, our custom prints offer exceptional clarity, lasting durability, and an elegant finish for every space.'

const FEATURES: Feature[] = [
  { icon: '/images/svg/premium.svg', title: 'Premium quality materials', desc: FEATURE_DESC, highlight: true },
  { icon: '/images/svg/fade.svg', title: 'Fade-resistant printing', desc: FEATURE_DESC, highlight: false },
  { icon: '/images/svg/multiple-size.svg', title: 'Multiple sizes available', desc: FEATURE_DESC, highlight: false },
  { icon: '/images/svg/fast.svg', title: 'Fast production', desc: FEATURE_DESC, highlight: true },
  { icon: '/images/svg/professional.svg', title: 'Professional finishing', desc: FEATURE_DESC, highlight: true },
]

// Landscape used for the fanned pills in the closing section (placeholder).
const PILL_IMG = '/images/slide-3.jpg'

const SECTION_BLURB =
  "Whether it's family portraits, wedding memories, travel adventures, artwork, or business branding, we provide vibrant colors, sharp details, and long-lasting quality using premium printing materials."

export default function CustomPrintsPage() {
  const navigate = useNavigate()

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
        {/* Full-bleed room photo (canvas print sits on the right) */}
        <img
          src="/images/print-banner.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        {/* Soft grey glow ellipse on the left (per design spec) */}
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            width: '1530px',
            height: '1530px',
            left: '-707px',
            top: '-374px',
            background: '#D9D9D9',
            filter: 'blur(303.35px)',
          }}
        />
        {/* White fade on the left so the dark heading stays legible */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.58) 30%, rgba(255,255,255,0) 56%)',
          }}
        />

        {/* Nav overlays the hero image */}
        <div className="relative z-30">
          <Navbar />
        </div>
        <PillNav />

        {/* Hero copy + CTA */}
        <div className="relative z-10 mx-auto flex min-h-[520px] max-w-[1400px] flex-col px-5 pb-14 pt-10 mt-[100px] md:min-h-[580px] md:px-10 md:pb-16 md:pt-14">
          <motion.div className="max-w-3xl" initial="hidden" animate="show" variants={stagger}>
            <motion.h1 variants={fadeUp} className="font-bold leading-[1.03] tracking-tight">
              <span className="block text-[42px] text-brand-navy sm:text-6xl md:text-7xl">
                Turn Your Memories
              </span>
              <span className="mt-1 block text-[28px] text-black sm:text-4xl md:text-5xl">
                into Timeless Art
              </span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-8 max-w-md text-sm leading-relaxed text-black"
            >
              At Creative One Business SPC, we believe every photograph tells a
              story. Our Custom Print service allows you to transform your
              favorite memories into premium-quality prints crafted with
              precision and care.
            </motion.p>
          </motion.div>

          <motion.button
            type="button"
            onClick={() => navigate('/editor')}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.35 }}
            className="mt-12 inline-flex w-fit items-center justify-center self-start rounded-full bg-brand-gold px-8 py-3.5 text-sm font-semibold uppercase tracking-wide text-white shadow-md transition hover:bg-brand-gold/90"
          >
            Buy Your Design
          </motion.button>
        </div>
      </section>

      <main className="mx-auto max-w-[1400px] px-5 md:px-8 lg:px-10">
        {/* ── Custom Prints ────────────────────────────────────────────────── */}
        <section className="pt-16 md:pt-20">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial="hidden"
            animate="show"
            variants={stagger}
          >
            <motion.h2
              variants={fadeUp}
              className="text-[28px] font-medium tracking-tight text-brand-navy sm:text-[40px]"
            >
              Custom Prints
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mx-auto mt-3 max-w-xl text-[13px] leading-relaxed text-foreground/60 md:text-sm"
            >
              {SECTION_BLURB}
            </motion.p>
          </motion.div>

          <motion.div
            className="mt-12 grid grid-cols-1 gap-x-12 lg:pt-4 gap-y-9 sm:grid-cols-2 lg:grid-cols-3"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
          >
            {CATEGORIES.map((c) => (
              <motion.div key={c.title} variants={fadeUp} className="group text-center">
                <div className="overflow-hidden rounded-3xl bg-black/5">
                  <div className="h-[380px] w-full">
                    <img
                      src={c.img}
                      alt={c.title}
                      loading="lazy"
                      draggable={false}
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                </div>
                <p className="mt-3 text-[15px] font-normal text-black md:text-base">
                  {c.title}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── Why Choose Us? ───────────────────────────────────────────────── */}
        <section className="pt-24 md:pt-28">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            <motion.h2
              variants={fadeUp}
              className="text-[28px] font-medium tracking-tight text-brand-navy sm:text-[40px]"
            >
              Why Choose Us?
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mx-auto mt-3 max-w-xl text-[13px] leading-relaxed text-foreground/60 md:text-sm"
            >
              {SECTION_BLURB}
            </motion.p>
          </motion.div>

          <motion.div
            className="mx-auto mt-12 lg:pt-4 grid max-w-[1100px] grid-cols-1 gap-4 md:grid-cols-2"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
          >
            {FEATURES.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className={
                  'rounded-2xl p-7 ' + (f.highlight ? 'bg-[#FBF6EC]' : 'bg-transparent hover:bg-[#FBF6EC] transition-colors')
                }
              >
                <img src={f.icon} className="w-[70px]" />
                <h3 className="mt-5 text-[15px] font-semibold text-brand-navy md:text-base">
                  {f.title}
                </h3>
                <p className="mt-2 text-[12px] leading-relaxed text-foreground/55">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── Bring your ideas to life ─────────────────────────────────────── */}
        <section className="pt-24 pb-24 md:pt-28 md:pb-28 max-w-[1100px] mx-auto">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="max-w-md text-[26px] font-medium leading-snug tracking-tight text-black sm:text-[34px]"
            >
              Bring your ideas to life with custom prints made just for you.
            </motion.h2>

            {/* Fanned landscape pills */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="flex items-center justify-center gap-3"
            >
              <img src="/images/bg-pills.png" className="h-[360px]" />
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
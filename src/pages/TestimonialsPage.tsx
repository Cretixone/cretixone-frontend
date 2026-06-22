import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Home, Smile, Star } from 'lucide-react'
import { motion, type Variants } from 'framer-motion'
import Navbar, { PillNav } from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { cn } from '@/lib/utils'

// Colorful art banner shown at the very top (swap the file to change it).
const BANNER_IMG = '/images/banner.jpg'
// Heart graphic (avatars) + the brand logo overlaid in its centre.
const HEART_IMG = '/images/testimonial-heart.png'
const HEART_LOGO_IMG = '/images/testimonial-logo.png'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

interface Testimonial {
  name: string
  role: string
  avatar: string
  quote: string
}

// Three columns of testimonials for the vertical marquee.
const COL_A: Testimonial[] = [
  {
    name: 'Emily Johnson',
    role: 'Interior Designer',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    quote:
      "Cretixone's custom framing turned my client's photos into gallery-worthy pieces. The quality and finish exceeded every expectation.",
  },
  {
    name: 'Sarah Lee',
    role: 'Home Stylist',
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    quote:
      'The range of frame styles and mat options is incredible. I found the perfect match for every room in just minutes.',
  },
  {
    name: 'Olivia Martinez',
    role: 'Illustrator',
    avatar: 'https://randomuser.me/api/portraits/women/29.jpg',
    quote:
      'Being able to sell my artwork and have it printed and framed on demand completely changed how I run my studio.',
  },
  {
    name: 'Ethan Lee',
    role: 'Marketing Lead',
    avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
    quote:
      'Quick, reliable, and the print quality is exceptional. Cretixone has become our go-to for wall art.',
  },
]

const COL_B: Testimonial[] = [
  {
    name: 'James Wilson',
    role: 'Photographer',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    quote:
      'The preview editor let me see exactly how my prints would look before ordering. Zero surprises, beautiful results.',
  },
  {
    name: 'Michael Roberts',
    role: 'Freelance Designer',
    avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
    quote:
      'Cretixone makes framing effortless — upload, choose a style, done. The floater frames are my new favorite.',
  },
  {
    name: 'David Turner',
    role: 'Architect',
    avatar: 'https://randomuser.me/api/portraits/men/76.jpg',
    quote:
      'The craftsmanship is outstanding. Natural wood, clean lines — these frames genuinely elevate any space.',
  },
  {
    name: 'Daniel Brown',
    role: 'Gallery Curator',
    avatar: 'https://randomuser.me/api/portraits/men/41.jpg',
    quote:
      'The variety and quality on Cretixone exceeded our expectations. Perfect for professional presentations.',
  },
]

const COL_C: Testimonial[] = [
  {
    name: 'Laura Smith',
    role: 'Art Collector',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    quote:
      'From upload to delivery the whole experience felt premium. My framed prints arrived flawless and ready to hang.',
  },
  {
    name: 'Chris Brown',
    role: 'Business Owner',
    avatar: 'https://randomuser.me/api/portraits/men/52.jpg',
    quote:
      'I ordered prints in bulk for our office and the consistency was spot on. Great service and fast turnaround.',
  },
  {
    name: 'Mia Clark',
    role: 'Content Creator',
    avatar: 'https://randomuser.me/api/portraits/women/12.jpg',
    quote:
      'Easy to navigate, beautiful results, and the support team is genuinely helpful. Highly recommended!',
  },
  {
    name: 'Sophia Reyes',
    role: 'Interior Architect',
    avatar: 'https://randomuser.me/api/portraits/women/90.jpg',
    quote:
      'Every detail, from the mat to the moulding, is considered. The result is timeless and elegant.',
  },
]

export default function TestimonialsPage() {
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
      {/* ── Top banner: colorful art, fading to white, with a blue glow ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 z-0 overflow-hidden"
        style={{ top: '-184px', height: '1070px' }}
      >
        <img src={BANNER_IMG} alt="" className="h-full w-full object-cover" />
        {/* Blue effect */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(55% 38% at 50% 16%, rgba(65,105,226,0.40) 0%, rgba(65,105,226,0.10) 45%, transparent 72%)',
          }}
        />
        {/* White fade (per spec) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.76) 15.38%, #FFFEFE 47.12%)',
          }}
        />
      </div>

      <div className="relative">
        <Navbar />
      </div>
      <PillNav />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-20 md:pt-24">
        <div className="relative mx-auto max-w-[1100px] px-5 md:px-8 lg:px-10">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs text-brand-navy md:text-[13px]"
          >
            <Link to="/" aria-label="Home" className="inline-flex items-center transition hover:opacity-80">
              <Home className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
            <ChevronRight className="h-3 w-3 text-brand-navy/60" />
            <span className="text-brand-navy/70">Testimonials</span>
          </nav>

          {/* Heart graphic with avatars + glowing brand mark */}
          <HeartGraphic />

          <motion.div
            className="mx-auto -mt-2 max-w-2xl text-center"
            initial="hidden"
            animate="show"
            variants={stagger}
          >
            <motion.span
              variants={fadeUp}
              className="mx-auto inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-medium"
              style={{
                width: '149px',
                height: '38px',
                position: 'relative',
                top: '-70px',
                fontSize: '17px',
                color: 'rgb(61, 61, 61)',
                background: 'rgb(255, 251, 235)',
                border: '1px solid rgb(244, 199, 120)',
              }}
            >
              <Smile size={20} className="text-[#E0A23A]" />
              Testimonials
            </motion.span>
            <motion.h1
              variants={fadeUp}
              className="mt-5 text-3xl font-semibold tracking-tight text-brand-navy md:text-[44px]"
            >
              Hear from Our Users
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-foreground/60 md:text-[15px]"
            >
              Read how our users have framed their best moments and elevated their
              spaces with Cretixone&apos;s custom prints and frames.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── MARQUEE GRID ─────────────────────────────────────────────────── */}
      <section className="relative mx-auto mt-10 max-w-[1280px] px-5 pb-20 md:mt-14 md:px-8 md:pb-28 lg:px-10">
        <div
          className="relative grid h-[560px] grid-cols-1 gap-6 overflow-hidden md:h-[680px] md:grid-cols-2 lg:grid-cols-3"
          style={{
            maskImage:
              'linear-gradient(180deg, transparent 0%, #000 11%, #000 89%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(180deg, transparent 0%, #000 11%, #000 89%, transparent 100%)',
          }}
        >
          <MarqueeColumn data={COL_A} duration="34s" />
          <MarqueeColumn data={COL_B} duration="42s" className="hidden md:block" />
          <MarqueeColumn data={COL_C} duration="30s" className="hidden lg:block" />
        </div>
      </section>

      <Footer />

      <style>{`
        @keyframes tm-marquee-up {
          from { transform: translateY(0); }
          to { transform: translateY(-50%); }
        }
        .tm-track {
          animation-name: tm-marquee-up;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }
        .tm-col:hover .tm-track { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .tm-track { animation: none; }
        }
      `}</style>
    </div>
  )
}

// ── Vertical marquee column ──────────────────────────────────────────────────
function MarqueeColumn({
  data,
  duration,
  className,
}: {
  data: Testimonial[]
  duration: string
  className?: string
}) {
  const items = [...data, ...data]
  return (
    <div className={cn('tm-col relative h-full overflow-hidden', className)}>
      <div className="tm-track flex flex-col" style={{ animationDuration: duration }}>
        {items.map((t, i) => (
          <Card key={`${t.name}-${i}`} t={t} />
        ))}
      </div>
    </div>
  )
}

// ── Testimonial card (styled per the provided spec) ──────────────────────────
function Card({ t }: { t: Testimonial }) {
  return (
    <article
      className="mb-6 flex w-full flex-col items-start gap-6 rounded-[20px] border p-[30px]"
      style={{
        backgroundImage:
          'linear-gradient(180deg, rgba(234,243,251,0) 0%, #FFFFFF 100%), radial-gradient(rgba(120,98,68,0.13) 1px, transparent 1.6px), linear-gradient(180deg, #FFF6E7 0%, #FFFFFF 100%)',
        backgroundBlendMode: 'normal, luminosity, normal',
        backgroundSize: 'auto, 16px 16px, auto',
        backgroundRepeat: 'no-repeat, repeat, no-repeat',
        borderColor: '#E1E4EB',
        boxShadow: '0 0 0 4px #FFFFFF',
      }}
    >
      <p className="text-[14px] leading-relaxed text-[#486284]">
        &ldquo;{t.quote}&rdquo;
      </p>
      <div className="flex w-full items-center gap-3 border-t border-[#E8EAF0] pt-6">
        <img
          src={t.avatar}
          alt={t.name}
          loading="lazy"
          draggable={false}
          className="h-10 w-10 flex-shrink-0 rounded-full bg-neutral-200 object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-brand-navy">{t.name}</p>
          <p className="truncate text-xs text-foreground/50">{t.role}</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-[#FBBF24] text-[#FBBF24]" aria-hidden />
          ))}
        </div>
      </div>
    </article>
  )
}

// ── Heart graphic (heart + avatars image) with the brand logo centred ────────
function HeartGraphic() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="relative mx-auto"
      style={{ width: '280px', height: 'auto' }}
    >
      <img
        src={HEART_IMG}
        alt="Happy Cretixone users"
        draggable={false}
        className="h-full w-full select-none object-cover object-top"
      />
      {/* Brand logo centred on the heart */}
      <img
        src={HEART_LOGO_IMG}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute left-1/2 top-[57%] w-[22%] -translate-x-1/2 -translate-y-1/2 select-none"
        style={{ width: '105px', height: '105px' }}
      />
    </motion.div>
  )
}

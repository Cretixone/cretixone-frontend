import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight,
  Home,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from 'lucide-react'
import { motion, type Variants } from 'framer-motion'
import Navbar, { PillNav } from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'

// ── Animation variants ───────────────────────────────────────────────────────
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
}

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.92 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 110, damping: 16 },
  },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

// ── Team data ────────────────────────────────────────────────────────────────
interface Member {
  name: string
  role: string
  bio: string
  img: string
  initials: string
}

const TEAM: Member[] = [
  {
    name: 'Elena Moreau',
    role: 'Creative Director',
    bio: 'A visionary with a passion for aesthetics and storytelling. Elena shapes the visual language behind everything we do.',
    img: 'https://randomuser.me/api/portraits/women/44.jpg',
    initials: 'EM',
  },
  {
    name: 'Tobias Schmidt',
    role: 'Lead Developer',
    bio: 'From backend architecture to pixel-perfect interfaces, Tobias ensures every detail works — and works beautifully.',
    img: 'https://randomuser.me/api/portraits/men/32.jpg',
    initials: 'TS',
  },
  {
    name: 'Amara Chen',
    role: 'Brand Designer',
    bio: 'Amara brings elegance to design systems, blending form and function into every visual touchpoint.',
    img: 'https://randomuser.me/api/portraits/women/68.jpg',
    initials: 'AC',
  },
  {
    name: 'Julian Reyes',
    role: 'Marketing Strategist',
    bio: 'Julian crafts campaigns that connect. He knows how to make the right people care — and act.',
    img: 'https://randomuser.me/api/portraits/men/45.jpg',
    initials: 'JR',
  },
  {
    name: 'Sofia Ivanova',
    role: 'UX Researcher',
    bio: 'With empathy at her core, Sofia translates user needs into insights that drive meaningful design decisions.',
    img: 'https://randomuser.me/api/portraits/women/65.jpg',
    initials: 'SI',
  },
  {
    name: 'Miles Carter',
    role: 'Product Manager',
    bio: 'Miles bridges vision and execution, aligning strategy, people, and purpose into one seamless roadmap.',
    img: 'https://randomuser.me/api/portraits/men/52.jpg',
    initials: 'MC',
  },
  {
    name: 'Hana Masri',
    role: 'Customer Experience Lead',
    bio: 'Hana ensures every client interaction feels thoughtful, personal, and memorable — every time.',
    img: 'https://randomuser.me/api/portraits/women/29.jpg',
    initials: 'HM',
  },
  {
    name: 'Leo Fernandes',
    role: 'Innovation Architect',
    bio: 'Leo explores future possibilities, turning new tech into opportunities for smarter, more human-centered solutions.',
    img: 'https://randomuser.me/api/portraits/men/76.jpg',
    initials: 'LF',
  },
]

const SOCIALS = [
  { Icon: Facebook, label: 'Facebook' },
  { Icon: Twitter, label: 'Twitter' },
  { Icon: Instagram, label: 'Instagram' },
  { Icon: Linkedin, label: 'LinkedIn' },
]

export default function TeamPage() {
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
      {/* Hero banner image at the top, fading to white behind the nav + heading. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 z-0 overflow-hidden"
        style={{ top: '-180px', height: '760px' }}
      >
        <img
          src="/images/team-hero.jpg"
          alt=""
          className="h-full w-full object-cover object-top"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.76) 15.38%, #FFFEFE 47.12%)',
          }}
        />
      </div>
      <MeshBackground />

      <div className="relative">
        <Navbar />
      </div>
      <PillNav />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-24 md:pt-32">
        <div className="relative mx-auto max-w-[1100px] px-5 md:px-8 lg:px-10">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs text-brand-navy md:text-[13px]"
          >
            <Link to="/" aria-label="Home" className="inline-flex items-center transition hover:opacity-80">
              <Home className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
            <ChevronRight className="h-3 w-3 text-brand-navy/60" />
            <span className="text-brand-navy/70">Team</span>
          </nav>

          <motion.div
            className="mx-auto mt-12 max-w-3xl text-center md:mt-16"
            initial="hidden"
            animate="show"
            variants={stagger}
          >
            <motion.h1
              variants={fadeUp}
              className="text-[34px] font-semibold leading-[1.06] tracking-tight text-brand-navy sm:text-5xl md:text-[68px]"
            >
              The{' '}
              <motion.span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    'linear-gradient(90deg,#C08C40,#E9C079,#C08C40,#E9C079)',
                  backgroundSize: '200% auto',
                }}
                animate={{ backgroundPosition: ['0% 50%', '200% 50%'] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              >
                Creative Minds
              </motion.span>
              <br />
              Behind the Work We Love
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-foreground/60 md:text-[15px]"
            >
              We&apos;re a group of passionate experts driven by creativity, innovation,
              and a commitment to excellence. United by shared values and a bold vision,
              we work together to push boundaries, embrace new ideas, and turn challenges
              into opportunities.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── TEAM GRID ────────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-[1320px] px-5 pb-20 pt-16 md:px-8 md:pb-28 md:pt-24 lg:px-10">
        <motion.div
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
        >
          {TEAM.map((member, i) => (
            <TeamCard key={member.name} member={member} index={i} />
          ))}
        </motion.div>
      </section>

      <Footer />
    </div>
  )
}

// ── Member card: 3D tilt + spotlight + animated avatar ───────────────────────
function TeamCard({ member, index }: { member: Member; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [imgError, setImgError] = useState(false)
  const [hover, setHover] = useState(false)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })
  const [glow, setGlow] = useState({ x: 50, y: 50 })

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    // Subtle tilt — toward the cursor, capped at ~8°.
    setTilt({ rx: (0.5 - py) * 8, ry: (px - 0.5) * 8 })
    setGlow({ x: px * 100, y: py * 100 })
  }

  const reset = () => {
    setHover(false)
    setTilt({ rx: 0, ry: 0 })
  }

  return (
    <motion.div variants={cardVariant} className="mx-auto w-full max-w-[360px] [perspective:1100px]">
      <div
        ref={ref}
        onMouseEnter={() => setHover(true)}
        onMouseMove={onMove}
        onMouseLeave={reset}
        className="group relative h-[440px]"
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: hover ? 'transform 80ms linear' : 'transform 450ms ease',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Frame card — hidden until hover, then reveals around the avatar */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[16px] p-[6px] opacity-0 scale-[0.96] transition-all duration-500 ease-out group-hover:scale-100 group-hover:opacity-100"
          style={{
            background: 'linear-gradient(145deg, #E8C988 0%, #C08C40 42%, #A6772E 100%)',
            boxShadow:
              '0 30px 64px -28px rgba(0,35,101,0.42), inset 0 2px 2px rgba(255,255,255,0.55), inset 0 -4px 8px rgba(0,0,0,0.26)',
          }}
        >
          {/* Mat panel — the white "artwork" area inside the frame */}
          <div className="relative flex h-full flex-col items-center overflow-hidden rounded-[10px] bg-gradient-to-b from-white to-[#F7F9FE] px-6 pb-7 pt-[172px] text-center">
            {/* Inset mat line */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-[7px] rounded-[6px] border border-brand-gold/25"
            />
            {/* Cursor spotlight */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(260px circle at ${glow.x}% ${glow.y}%, rgba(192,140,64,0.14), transparent 65%)`,
              }}
            />
            {/* Faded index watermark */}
            <span
              aria-hidden
              className="pointer-events-none absolute right-4 top-2 select-none text-[42px] font-bold leading-none text-brand-navy/[0.05]"
            >
              {String(index + 1).padStart(2, '0')}
            </span>

            {/* Name + role */}
            <h3 className="text-lg font-semibold tracking-tight text-brand-navy">
              {member.name}
            </h3>
            <span className="mt-2 inline-block rounded-full bg-brand-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-gold">
              {member.role}
            </span>
            <p className="mt-3.5 text-[13px] leading-relaxed text-foreground/60">
              {member.bio}
            </p>

            {/* Socials — pinned to the bottom so every card matches height */}
            <div className="mt-auto flex items-center gap-2 pt-5">
              {SOCIALS.map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={`${member.name} on ${label}`}
                  onClick={(e) => e.preventDefault()}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-navy/10 bg-white text-brand-navy/70 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-gold hover:bg-brand-gold hover:text-white"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Name + role + description shown in the resting state under the big
            avatar (hidden on hover, where the revealed frame shows its own). */}
        <div className="pointer-events-none absolute inset-x-0 top-[300px] z-10 px-6 text-center opacity-100 transition-opacity duration-300 group-hover:opacity-0">
          <h3 className="text-lg font-semibold tracking-tight text-brand-navy">
            {member.name}
          </h3>
          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-gold">
            {member.role}
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-foreground/60">
            {member.bio}
          </p>
        </div>

        {/* Avatar — big & centered by default; shrinks to the top on hover */}
        <div className="absolute left-1/2 top-[96px] z-10 -translate-x-1/2 transition-[top] duration-500 ease-out group-hover:top-[20px]">
          <motion.div
            animate={{ y: [0, -9, 0] }}
            transition={{
              duration: 4.5 + (index % 3) * 0.8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: index * 0.3,
            }}
          >
            <div className="relative h-[200px] w-[200px] transition-all duration-500 ease-out group-hover:h-[136px] group-hover:w-[136px]">
              <motion.div
                aria-hidden
                className="absolute inset-0 rounded-full opacity-80"
                style={{ background: 'conic-gradient(from 0deg, #C08C40, #4169E2, #002365, #C08C40)' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 11, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                aria-hidden
                className="absolute inset-[2px] rounded-full opacity-40"
                style={{ background: 'conic-gradient(from 180deg, transparent, rgba(255,255,255,0.8), transparent 40%)' }}
                animate={{ rotate: -360 }}
                transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
              />
              <div className="absolute inset-[5px] overflow-hidden rounded-full bg-white">
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-navy to-[#4169E2] text-2xl font-semibold tracking-wide text-white">
                  {member.initials}
                </div>
                {!imgError && (
                  <img
                    src={member.img}
                    alt={member.name}
                    loading="lazy"
                    draggable={false}
                    onError={() => setImgError(true)}
                    className="relative h-full w-full object-cover"
                  />
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Mesh-gradient background (animated, fixed-ish to the top) ─────────────────
function MeshBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* drifting colour blob */}
      <motion.div
        className="absolute left-1/2 top-[280px] h-72 w-72 -translate-x-1/2 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(0,35,101,0.10), transparent 70%)', filter: 'blur(60px)' }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

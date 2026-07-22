import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { motion, type Variants } from 'framer-motion'
import Navbar, { PillNav } from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { cn } from '@/lib/utils'

// ── Animation variants ───────────────────────────────────────────────────────
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 120, damping: 17 },
  },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

// ── Team data ────────────────────────────────────────────────────────────────
// Each member sits on a coloured "blob" background (a PNG vector) with their
// cut-out headshot on top. The founder (first card) has no blob vector — her
// backdrop is a coral circle we draw with a div, plus a small pink accent dot.
interface Member {
  name: string
  /** Key under the `team.roles.*` i18n namespace (role/title is translated). */
  roleKey: string
  avatar: string
  /** Blob background PNG. Omitted for the founder (drawn as a circle instead). */
  bg?: string
  /** Founder-only: colour of the circle backdrop drawn with a div. */
  circleColor?: string
  /** Founder-only: colour of the small accent dot. */
  dotColor?: string
  /**
   * Per-avatar horizontal positioning override — some cut-outs aren't centred
   * within their own image, so they need a nudge to sit right in the blob.
   * Tailwind classes; defaults to centred (`left-1/2 -translate-x-1/2`).
   */
  avatarPos?: string
}

const TEAM: Member[] = [
  {
    name: 'Ayesha Saboor',
    roleKey: 'founder',
    avatar: '/images/vector-circle.png',
    circleColor: '#FC6875',
    dotColor: '#FC6875',
  },
  {
    name: 'Yousif Al Jabri',
    roleKey: 'ceo',
    avatar: '/images/vector-1-avatar.png',
    bg: '/images/vector-1.png',
    avatarPos: 'right-[15px]',
  },
  {
    name: 'Shantunu Chowdhury',
    roleKey: 'cfo',
    avatar: '/images/vector-2-avatar.png',
    bg: '/images/vector-2.png',
    avatarPos: 'right-[0px]',
  },
  {
    name: 'Kavinda',
    roleKey: 'designer',
    avatar: '/images/vector-3-avatar.png',
    bg: '/images/vector-3.png',
  },
  {
    name: 'Faisal',
    roleKey: 'framerIndoor',
    avatar: '/images/vector-4-avatar.png',
    bg: '/images/vector-4.png',
    avatarPos: 'right-[0px]',
  },
  {
    name: 'Babar Khan',
    roleKey: 'framerWorkshop',
    avatar: '/images/vector-5-avatar.png',
    bg: '/images/vector-5.png',
    avatarPos: 'right-[0px]',
  },
  {
    name: 'Ahsan Farooq',
    roleKey: 'glassSpecialist',
    avatar: '/images/vector-6-avatar.png',
    bg: '/images/vector-6.png',
    avatarPos: 'right-[20px]',
  },
]

export default function TeamPage() {
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

      <div className="relative z-30">
        <Navbar />
      </div>
      <PillNav />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-24 md:pt-32">
        <div className="mx-auto max-w-[1100px] px-5 md:px-8 lg:px-10">
          <nav
            aria-label={t('team.breadcrumb.aria')}
            className="flex items-center gap-2 text-xs text-brand-navy md:text-[13px]"
          >
            <Link to="/" aria-label={t('team.breadcrumb.home')} className="inline-flex items-center transition hover:opacity-80">
              <Home className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
            <ChevronRight className="h-3 w-3 text-brand-navy/60" />
            <span className="text-brand-navy/70">{t('team.breadcrumb.current')}</span>
          </nav>

          <motion.div
            className="mx-auto mt-10 text-center md:mt-12"
            initial="hidden"
            animate="show"
            variants={stagger}
          >
            <motion.h1
              variants={fadeUp}
              className="text-[30px] font-medium leading-[1.1] tracking-tight text-brand-navy sm:text-[38px] md:text-[44px]"
            >
              {t('team.hero.titleLine1')}
              <br />
              {t('team.hero.titleLine2')}
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mx-auto mt-6  text-sm leading-relaxed text-foreground/60 md:text-[15px]"
            >
              {t('team.hero.subtitle')}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── TEAM GRID ────────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-[1120px] px-5 pb-20 pt-15 md:px-8 md:pb-28 md:pt-16 lg:px-10">
        <motion.div
          className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
        >
          {TEAM.map((member) => (
            <TeamCard key={member.name} member={member} />
          ))}
        </motion.div>
      </section>

      <Footer />
    </div>
  )
}

// ── Member card: coloured blob backdrop + cut-out headshot + name/role ────────
// The headshot is clipped to the exact blob shape (via a CSS mask using the blob
// PNG's alpha) so it never overflows the blob's edges. The founder has no blob
// vector — her backdrop is a coral circle, and her avatar is clipped to it with
// a plain `overflow-hidden rounded-full`.
function TeamCard({ member }: { member: Member }) {
  const { t } = useTranslation('pages')
  return (
    <motion.div
      variants={cardVariant}
      className="relative flex flex-col mt-8 mt-md-0 items-center text-center"
    >
      {/* Only the blob + headshot zoom on hover — the name/role stay put. */}
      <motion.div
        whileHover={{ scale: 1.1, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
        className="relative h-[210px] w-[250px] hover:z-10"
      >
        {member.bg ? (
          <>
            {/* coloured blob */}
            <img
              src={member.bg}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-contain"
            />
            {/* headshot, masked to the blob shape so it stays inside it */}
            <div
              className="absolute inset-0"
              style={{
                WebkitMaskImage: `url(${member.bg})`,
                maskImage: `url(${member.bg})`,
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
              }}
            >
              <img
                src={member.avatar}
                alt={member.name}
                loading="lazy"
                draggable={false}
                className={cn(
                  'absolute bottom-0 h-[196px] w-auto object-contain object-bottom',
                  member.avatarPos ?? 'left-1/2 -translate-x-1/2',
                )}
              />
            </div>
          </>
        ) : (
          <>
            {/* Founder: small pink accent dot, upper-right of the circle */}
            <div
              className="absolute right-[10px] top-[20px] z-10 h-[30px] w-[30px] rounded-full"
              style={{ background: member.dotColor }}
            />
            {/* coral circle backdrop with the headshot clipped inside it */}
            <div
              className="absolute left-1/2 top-1/2 h-[196px] w-[196px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full"
              style={{ background: member.circleColor }}
            >
              <img
                src={member.avatar}
                alt={member.name}
                loading="lazy"
                draggable={false}
                className="absolute inset-x-0 bottom-0 mx-auto h-[160px] w-auto object-contain object-bottom"
              />
            </div>
          </>
        )}
      </motion.div>

      <h3 className="mt-6 text-[15px] font-semibold tracking-tight text-brand-navy md:text-base">
        {member.name}
      </h3>
      <p className="mt-1 text-[12px] leading-snug text-foreground/55 md:text-[13px]">
        {t(`team.roles.${member.roleKey}`)}
      </p>
    </motion.div>
  )
}

// ── Mesh-gradient background (animated blur, fixed-ish to the top) ─────────────
export function MeshBackground() {
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

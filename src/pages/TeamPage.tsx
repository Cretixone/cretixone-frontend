import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ChevronRight, Home, Loader2, Mail } from 'lucide-react'
import { motion, type Variants } from 'framer-motion'
import Navbar, { PillNav } from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { teamApi, type TeamMember } from '@/api/team.api'
import { resolveAsset } from '@/lib/assets'
import { pickLocalized } from '@/lib/localized'
import { useIsRtl } from '@/store/langStore'

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

export default function TeamPage() {
  const { t } = useTranslation('pages')
  const isRtl = useIsRtl()

  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    let alive = true
    teamApi
      .list()
      .then((rows) => alive && setMembers(rows))
      .catch(() => alive && setMembers([]))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
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
          // Keyed on loading so the grid remounts (and re-animates in) the
          // moment real cards replace the spinner, instead of relying on
          // `whileInView`'s one-shot IntersectionObserver — which can fire
          // while the grid is still empty and never re-trigger once the
          // fetched cards actually mount.
          key={loading ? 'loading' : 'content'}
          className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {loading ? (
            <div className="col-span-full flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-brand-navy/50" />
            </div>
          ) : members.length === 0 ? (
            <p className="col-span-full text-center text-sm text-foreground/60">
              {t('team.empty')}
            </p>
          ) : (
            members.map((member) => (
              <TeamCard key={member.id} member={member} isRtl={isRtl} />
            ))
          )}
        </motion.div>
      </section>

      <Footer />
    </div>
  )
}

// ── Member card: photo, name and position — no backdrop. The photo is a plain
// upload from the admin, so it is shown as-is (object-cover into a fixed box)
// rather than clipped to a decorative shape.
function TeamCard({ member, isRtl }: { member: TeamMember; isRtl: boolean }) {
  const name = pickLocalized(member.name, member.nameAr, isRtl)
  const position = pickLocalized(member.position, member.positionAr, isRtl)

  return (
    <motion.div
      variants={cardVariant}
      className="relative flex flex-col mt-8 mt-md-0 items-center text-center"
    >
      <motion.div
        whileHover={{ scale: 1.05, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
        className="relative h-[210px] w-[250px] max-w-full overflow-hidden rounded-2xl hover:z-10"
      >
        {member.image && (
          <img
            src={resolveAsset(member.image)}
            alt={name}
            loading="lazy"
            draggable={false}
            className="h-full w-full"
          />
        )}
      </motion.div>

      <h3 className="mt-6 text-[15px] font-semibold tracking-tight text-brand-navy md:text-base">
        {name}
      </h3>
      <p className="mt-1 text-[12px] leading-snug text-foreground/55 md:text-[13px]">
        {position}
      </p>
      {member.email && (
        <a
          href={`mailto:${member.email}`}
          className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-foreground/45 transition hover:text-brand-gold md:text-[12px]"
          dir="ltr"
        >
          <Mail className="h-3 w-3 shrink-0" strokeWidth={2} />
          <span className="break-all">{member.email}</span>
        </a>
      )}
    </motion.div>
  )
}

// ── Mesh-gradient background (animated blur, fixed-ish to the top) ─────────────
// Not exported: this page is React.lazy-loaded, and a lazy module with more
// than one component export defeats Vite's Fast Refresh for the whole file
// (it falls back to a full reload, which can leave a long-open tab showing a
// stale bundle instead of the latest edit).
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

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { motion } from 'framer-motion'
import Navbar, { PillNav } from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'

const PAGE_BG = '#EEF3FB'

/**
 * Privacy policy. Deliberately the same layout, spacing and section styling as
 * TermsPage so the two legal pages read as a pair.
 *
 * This page must stay publicly reachable with no sign-in: Google's OAuth
 * verification review fetches the privacy policy URL directly.
 */
export default function PrivacyPolicyPage() {
  const { t } = useTranslation('pages')

  useEffect(() => {
    const prevBg = document.body.style.background
    const prevColor = document.body.style.color
    document.body.style.background = PAGE_BG
    document.body.style.color = '#002365'
    window.scrollTo(0, 0)
    return () => {
      document.body.style.background = prevBg
      document.body.style.color = prevColor
    }
  }, [])

  return (
    <div
      className="min-h-screen w-full font-sans text-foreground"
      style={{ backgroundColor: '#fff' }}
    >
      <div className="relative">
        <Navbar />
      </div>
      <PillNav />

      <main className="mx-auto max-w-[1400px] px-5 pt-28 pb-16 md:px-8 md:pt-32 lg:px-10 lg:pt-40">
        {/* Breadcrumb */}
        <nav
          aria-label={t('privacy.breadcrumb.aria')}
          className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-brand-navy md:text-[13px]"
        >
          <Link
            to="/"
            aria-label={t('privacy.breadcrumb.home')}
            className="inline-flex items-center transition hover:opacity-80"
          >
            <Home className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
          <ChevronRight className="h-3 w-3 text-brand-navy/60" />
          <span className="text-brand-navy/70">{t('privacy.breadcrumb.current')}</span>
        </nav>

        {/* Title block */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mt-5"
        >
          <h1 className="text-2xl font-medium leading-tight text-brand-navy md:text-[32px]">
            {t('privacy.title')}
          </h1>
          <p className="mt-1 text-[13px] text-foreground/80 md:text-sm">
            {t('privacy.company')}{' '}
            <span className="font-medium">{t('privacy.lastUpdatedLabel')}</span>{' '}
            {t('privacy.lastUpdatedDate')}
          </p>
        </motion.header>

        {/* Sections */}
        <motion.div
          className="mt-10 space-y-9"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        >
          <Section n={1} title={t('privacy.s1.title')}>
            <p>{t('privacy.s1.p1')}</p>
            <p>{t('privacy.s1.p2')}</p>
          </Section>

          <Section n={2} title={t('privacy.s2.title')}>
            <p>{t('privacy.s2.p1')}</p>
            <p>{t('privacy.s2.p2')}</p>
            <p>{t('privacy.s2.p3')}</p>
            <p>{t('privacy.s2.p4')}</p>
          </Section>

          <Section n={3} title={t('privacy.s3.title')}>
            <p>{t('privacy.s3.p1')}</p>
            <p>{t('privacy.s3.p2')}</p>
          </Section>

          <Section n={4} title={t('privacy.s4.title')}>
            <p>{t('privacy.s4.p1')}</p>
            <p>{t('privacy.s4.p2')}</p>
            <p>{t('privacy.s4.p3')}</p>
            <p>{t('privacy.s4.p4')}</p>
            <p>{t('privacy.s4.p5')}</p>
          </Section>

          <Section n={5} title={t('privacy.s5.title')}>
            <p>{t('privacy.s5.p1')}</p>
            <p>{t('privacy.s5.p2')}</p>
            <p>{t('privacy.s5.p3')}</p>
          </Section>

          <Section n={6} title={t('privacy.s6.title')}>
            <p>{t('privacy.s6.p1')}</p>
            <p>{t('privacy.s6.p2')}</p>
            <p>{t('privacy.s6.p3')}</p>
          </Section>

          <Section n={7} title={t('privacy.s7.title')}>
            <p>{t('privacy.s7.p1')}</p>
            <p>{t('privacy.s7.p2')}</p>
          </Section>

          <Section n={8} title={t('privacy.s8.title')}>
            <p>{t('privacy.s8.p1')}</p>
            <p>{t('privacy.s8.p2')}</p>
          </Section>

          <Section n={9} title={t('privacy.s9.title')}>
            <p>{t('privacy.s9.p1')}</p>
            <p>{t('privacy.s9.p2')}</p>
          </Section>

          <Section n={10} title={t('privacy.s10.title')}>
            <p>{t('privacy.s10.p1')}</p>
            <p>{t('privacy.s10.p2')}</p>
          </Section>

          <Section n={11} title={t('privacy.s11.title')}>
            <p>{t('privacy.s11.p1')}</p>
          </Section>

          <Section n={12} title={t('privacy.s12.title')}>
            <p>{t('privacy.s12.p1')}</p>
          </Section>

          <Section n={13} title={t('privacy.s13.title')}>
            <p>{t('privacy.s13.p1')}</p>
          </Section>
        </motion.div>
      </main>

      <Footer />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 z-0 -translate-x-1/2 rounded-full"
        style={{
          top: '-186px',
          width: 'min(1560px, 140vw)',
          height: '270px',
          background: 'rgba(65, 105, 226, 0.2)',
          filter: 'blur(130px)',
        }}
      />
    </div>
  )
}

interface SectionProps {
  n: number
  title: string
  children: React.ReactNode
}

function Section({ n, title, children }: SectionProps) {
  return (
    <section>
      <h2 className="text-[15px] font-medium tracking-wide text-brand-navy md:text-[18px]">
        {n}. {title}
      </h2>
      <div className="mt-3 space-y-1.5 text-[13px] leading-relaxed text-foreground md:text-sm">
        {children}
      </div>
    </section>
  )
}

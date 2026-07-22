import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { motion } from 'framer-motion'
import Navbar, { PillNav } from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'

const PAGE_BG = '#EEF3FB'

export default function TermsPage() {
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
          aria-label={t('terms.breadcrumb.aria')}
          className="flex items-center gap-2 text-xs text-brand-navy md:text-[13px]"
        >
          <Link
            to="/"
            aria-label={t('terms.breadcrumb.home')}
            className="inline-flex items-center transition hover:opacity-80"
          >
            <Home className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
          <ChevronRight className="h-3 w-3 text-brand-navy/60" />
          <span className="text-brand-navy/70">{t('terms.breadcrumb.current')}</span>
        </nav>

        {/* Title block */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mt-5"
        >
          <h1 className="text-2xl font-medium leading-tight text-brand-navy md:text-[32px]">
            {t('terms.title')}
          </h1>
          <p className="mt-1 text-[13px] text-foreground/80 md:text-sm">
            {t('terms.company')}{' '}
            <span className="font-medium">{t('terms.lastUpdatedLabel')}</span>{' '}
            {t('terms.lastUpdatedDate')}
          </p>
        </motion.header>

        {/* Sections */}
        <motion.div
          className="mt-10 space-y-9"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        >
          <Section n={1} title={t('terms.s1.title')}>
            <p>{t('terms.s1.p1')}</p>
          </Section>

          <Section n={2} title={t('terms.s2.title')}>
            <Definition label={t('terms.s2.platformLabel')} text={t('terms.s2.platformText')} />
            <Definition label={t('terms.s2.userLabel')} text={t('terms.s2.userText')} />
            <Definition label={t('terms.s2.contributorLabel')} text={t('terms.s2.contributorText')} />
            <Definition label={t('terms.s2.contentLabel')} text={t('terms.s2.contentText')} />
            <Definition label={t('terms.s2.buyerLabel')} text={t('terms.s2.buyerText')} />
          </Section>

          <Section n={3} title={t('terms.s3.title')}>
            <p>{t('terms.s3.intro')}</p>
            <p>{t('terms.s3.p1')}</p>
            <p>{t('terms.s3.p2')}</p>
            <p>{t('terms.s3.p3')}</p>
            <p>{t('terms.s3.p4')}</p>
          </Section>

          <Section n={4} title={t('terms.s4.title')}>
            <p>{t('terms.s4.p1')}</p>
            <p>{t('terms.s4.p2')}</p>
            <p>{t('terms.s4.p3')}</p>
            <p>{t('terms.s4.p4')}</p>
          </Section>

          <Section n={5} title={t('terms.s5.title')}>
            <p>{t('terms.s5.p1')}</p>
          </Section>

          <Section n={6} title={t('terms.s6.title')}>
            <p>
              <span className="font-semibold">{t('terms.s6.label1')}</span>{' '}
              {t('terms.s6.text1')}
            </p>
            <p>
              <span className="font-semibold">{t('terms.s6.label2')}</span>{' '}
              {t('terms.s6.text2')}
            </p>
            <p>
              <span className="font-semibold">{t('terms.s6.label3')}</span>{' '}
              {t('terms.s6.text3')}
            </p>
          </Section>

          <Section n={7} title={t('terms.s7.title')}>
            <p>{t('terms.s7.intro')}</p>
            <p>{t('terms.s7.p1')}</p>
            <p>{t('terms.s7.p2')}</p>
            <p>{t('terms.s7.p3')}</p>
            <p>{t('terms.s7.p4')}</p>
          </Section>

          <Section n={8} title={t('terms.s8.title')}>
            <p>{t('terms.s8.intro')}</p>
            <p>{t('terms.s8.p1')}</p>
            <p>{t('terms.s8.p2')}</p>
            <p>{t('terms.s8.p3')}</p>
          </Section>

          <Section n={9} title={t('terms.s9.title')}>
            <Definition label={t('terms.s9.pricingLabel')} text={t('terms.s9.pricingText')} />
            <Definition label={t('terms.s9.commissionsLabel')} text={t('terms.s9.commissionsText')} />
            <Definition label={t('terms.s9.refundsLabel')} text={t('terms.s9.refundsText')} />
          </Section>

          <Section n={10} title={t('terms.s10.title')}>
            <p>{t('terms.s10.p1')}</p>
          </Section>

          <Section n={11} title={t('terms.s11.title')}>
            <p>{t('terms.s11.p1')}</p>
          </Section>

          <Section n={12} title={t('terms.s12.title')}>
            <p>{t('terms.s12.p1')}</p>
          </Section>

          <Section n={13} title={t('terms.s13.title')}>
            <p>{t('terms.s13.intro')}</p>
            <p>{t('terms.s13.p1')}</p>
            <p>{t('terms.s13.p2')}</p>
            <p>{t('terms.s13.p3')}</p>
          </Section>

          <Section n={14} title={t('terms.s14.title')}>
            <p>{t('terms.s14.p1')}</p>
          </Section>

          <Section n={15} title={t('terms.s15.title')}>
            <p>{t('terms.s15.p1')}</p>
          </Section>

          <Section n={16} title={t('terms.s16.title')}>
            <p>{t('terms.s16.p1')}</p>
          </Section>

          <Section n={17} title={t('terms.s17.title')}>
            <p>{t('terms.s17.p1')}</p>
            <div className="mt-4 flex flex-col gap-2 text-foreground sm:flex-row sm:gap-12">
              <p>
                <span className="font-semibold">{t('terms.s17.emailLabel')}</span>{' '}
                {t('terms.s17.emailValue')}
              </p>
              <p>
                <span className="font-semibold">{t('terms.s17.websiteLabel')}</span>{' '}
                {t('terms.s17.websiteValue')}
              </p>
            </div>
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

function Definition({ label, text }: { label: string; text: string }) {
  return (
    <p>
      <span className="font-semibold">{label}</span> {text}
    </p>
  )
}

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import Navbar, { PillNav } from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import PhotoStocks from '@/components/landing/PhotoStocks'

export default function StockPage() {
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
      <div className="relative z-30">
        <Navbar />
      </div>
      <PillNav />

      <section className="relative pt-24 md:pt-32">
        <div className="mx-auto max-w-[1400px] px-5 md:px-8 lg:px-10">
          <nav
            aria-label={t('stock.breadcrumb.aria')}
            className="flex items-center gap-2 text-xs text-brand-navy md:text-[13px]"
          >
            <Link to="/" aria-label={t('stock.breadcrumb.home')} className="inline-flex items-center transition hover:opacity-80">
              <Home className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
            <ChevronRight className="h-3 w-3 text-brand-navy/60" />
            <span className="text-brand-navy/70">{t('stock.breadcrumb.current')}</span>
          </nav>
        </div>
      </section>

      <div className="py-24 md:pt-[100px]">
        <PhotoStocks showImage={false} />
      </div>

      <Footer />
      <div
        aria-hidden
        className="pointer-events-none z-10 absolute top-[20%] rounded-full"
        style={{
          width: '300px',
          height: '300px',
          background: 'rgba(65, 105, 226, 0.18)',
          filter: 'blur(120px)',
          left: '-150px',
        }}
      />
    </div>
  )
}

import { useEffect } from 'react'
import { PillNav } from '@/components/landing/Navbar'
import Banner from '@/components/landing/Banner'
import Categories from '@/components/landing/Categories'
import Journey from '@/components/landing/Journey'
import FrameShowcase from '@/components/landing/FrameShowcase'
import Spaces from '@/components/landing/Spaces'
import PhotoStocks from '@/components/landing/PhotoStocks'
import Testimonials from '@/components/landing/Testimonials'
import BusinessCustomers from '@/components/landing/BusinessCustomers'
import Footer from '@/components/landing/Footer'

export default function LandingPage() {
  useEffect(() => {
    const prevBg = document.body.style.background
    const prevColor = document.body.style.color
    document.body.style.background = '#ffffff'
    document.body.style.color = '#002365'
    return () => {
      document.body.style.background = prevBg
      document.body.style.color = prevColor
    }
  }, [])

  return (
    <div className="min-h-screen w-full bg-white font-sans text-foreground">
      <PillNav />

      <main>
        <Banner />
        <Categories />
        <Journey />
        <div className="relative">
          <FrameShowcase />
          <Spaces />
          <PhotoStocks />
          <Testimonials />
          <BusinessCustomers />
          <div
            aria-hidden
            className="pointer-events-none absolute rounded-[50%]"
            style={{
              left: '-247px',
              top: '21%',
              bottom: 0,
              width: 'min(494px, 55vw)',
              background: '#4169E2',
              opacity: 0.19,
              filter: 'blur(150px)',
            }}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}

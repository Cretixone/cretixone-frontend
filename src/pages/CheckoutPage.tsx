import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { useEditorStore, A4_LONG_CM, A4_SHORT_CM } from '@/store/editorStore'
import { formatOMR } from '@/lib/format'

// Placeholder checkout — the full design + DB cart save land once the
// reference screenshot is provided. For now it summarises the current
// selection from the editor so the flow is coherent end-to-end.
export default function CheckoutPage() {
  const [params] = useSearchParams()
  const inquiry = params.get('inquiry') === '1'

  const selectedFrame = useEditorStore((s) => s.selectedFrame)
  const frameAspectRatio = useEditorStore((s) => s.frameAspectRatio)
  const customWidthCm = useEditorStore((s) => s.customWidthCm)
  const customHeightCm = useEditorStore((s) => s.customHeightCm)

  useEffect(() => {
    const prevBg = document.body.style.background
    const prevColor = document.body.style.color
    document.body.style.background = '#ffffff'
    document.body.style.color = '#000000'
    window.scrollTo(0, 0)
    return () => {
      document.body.style.background = prevBg
      document.body.style.color = prevColor
    }
  }, [])

  const [w, h] =
    frameAspectRatio === 'landscape'
      ? [A4_LONG_CM, A4_SHORT_CM]
      : frameAspectRatio === 'portrait'
        ? [A4_SHORT_CM, A4_LONG_CM]
        : frameAspectRatio === 'square'
          ? [A4_SHORT_CM, A4_SHORT_CM]
          : [customWidthCm, customHeightCm]
  const price = selectedFrame ? selectedFrame.pricePerCm * (w + h) * 2 : 0

  return (
    <div className="min-h-screen w-full bg-white font-sans text-[#000000]">
      <header className="relative z-30">
        <Navbar />
      </header>

      <main className="mx-auto max-w-[760px] px-5 pt-28 pb-20 md:px-8 md:pt-32 lg:pt-40">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-brand-navy md:text-[13px]"
        >
          <Link to="/" aria-label="Home" className="inline-flex items-center hover:opacity-80">
            <Home className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
          <ChevronRight className="h-3 w-3 text-brand-navy/60" />
          <span className="text-brand-navy/70">{inquiry ? 'Inquiry' : 'Checkout'}</span>
        </nav>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-brand-navy md:text-[40px]">
          {inquiry ? 'Request an Inquiry' : 'Checkout'}
        </h1>

        {selectedFrame ? (
          <div className="mt-8 rounded-2xl border border-black/10 p-5 md:p-6">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-black/[0.04]">
                {selectedFrame.imgUrl && (
                  <img
                    src={selectedFrame.imgUrl}
                    alt="Selected frame"
                    className="h-full w-full object-contain p-1"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-brand-navy">Custom frame</p>
                <p className="mt-1 text-sm text-foreground/60">
                  Size: {w.toFixed(1)} × {h.toFixed(1)} cm
                </p>
              </div>
              {!inquiry && (
                <div className="text-right">
                  <p className="text-xs text-foreground/50">Total</p>
                  <p className="text-lg font-bold text-brand-navy tabular-nums">
                    {formatOMR(price)}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-8 text-sm text-foreground/60">No item selected yet.</p>
        )}

        <p className="mt-6 rounded-xl bg-brand-gold/[0.07] px-4 py-3 text-[13px] text-foreground/70">
          {inquiry
            ? "This size is outside the frame's standard range — submit an inquiry and our team will get back to you with a custom quote. (Inquiry form coming soon.)"
            : 'Full checkout + cart is being set up. The order summary above reflects your current selection.'}
        </p>
      </main>

      <Footer />
    </div>
  )
}

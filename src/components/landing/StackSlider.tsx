import { useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCards, Keyboard, Mousewheel } from 'swiper/modules'
import { cn } from '@/lib/utils'
import { useDirection } from '@/hooks/useDirection'

import 'swiper/css'
import 'swiper/css/effect-cards'

export interface StackSlide {
  image: string
  label: string
}

export interface StackSliderProps {
  slides: StackSlide[]
  heightClass?: string
  className?: string
}

export default function StackSlider({
  slides,
  heightClass = 'h-[420px] md:h-[520px] lg:h-[600px]',
  className,
}: StackSliderProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const dir = useDirection()

  if (slides.length === 0) return null
  const active = slides[activeIdx]

  return (
    <div className={cn('w-full', className)}>
      <Swiper
        key={dir}
        dir={dir}
        modules={[EffectCards, Keyboard, Mousewheel]}
        effect="cards"
        grabCursor
        keyboard={{ enabled: true }}
        cardsEffect={{
          slideShadows: false,
          // Horizontal-only stack: no rotation/tilt, push each next card to
          // the right so only the right edge peeks past the active card.
          perSlideOffset: 10,
          perSlideRotate: 0,
          rotate: false,
        }}
        onSlideChange={(s) => setActiveIdx(s.realIndex)}
        className={cn(
          // Override Swiper's default .swiper-cards box so the active card
          // hugs the left of the container instead of centering.
          'mx-auto !overflow-visible',
          heightClass,
        )}
        style={{ width: '92%' }}
      >
        {slides.map((slide) => (
          <SwiperSlide
            key={slide.label}
            className="!overflow-hidden !rounded-[33px] !bg-neutral-200 border-r-[3px] border-white shadow-[0px_4px_15px_rgba(0,0,0,0.25)]"
          >
            <div
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
              role="img"
              aria-label={slide.label}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Active label — bottom-left under the slider */}
      <div className="mt-5 px-2 md:px-4 relative z-10">
        <span
          key={active.label}
          className="inline-block animate-[stackFade_400ms_ease-out] font-display font-normal text-2xl tracking-wide text-[#C1B199] md:text-3xl"
        >
          {active.label}
        </span>
      </div>

      <style>{`
        @keyframes stackFade {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

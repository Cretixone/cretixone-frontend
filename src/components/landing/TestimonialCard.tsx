import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TestimonialCardProps {
  name: string
  location: string
  avatar: string
  rating: number
  quote: string
  className?: string
}

export default function TestimonialCard({
  name,
  location,
  avatar,
  rating,
  quote,
  className,
}: TestimonialCardProps) {
  return (
    <div className={cn('relative h-full', className)}>
      <div
        className="relative flex h-full flex-col rounded-[24px] bg-[#F1F7FF] p-6 md:p-7 shadow-[0_110px_40px_-75px_rgba(72,98,132,0.1)]"
      >
        <div className="flex items-center gap-3">
          <img
            src={avatar}
            alt={name}
            className="h-9 w-9 flex-shrink-0 rounded-full bg-neutral-200 object-cover"
            loading="lazy"
          />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-brand-navy md:text-[15px]">
              {name}
            </h3>
            <p className="truncate text-xs text-foreground/55">{location}</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1 text-sm">
            <Star
              className="h-3.5 w-3.5 fill-[#FBBF24] text-[#FBBF24]"
              aria-hidden
            />
            <span className="font-medium text-foreground/80">
              {rating.toFixed(1)}
            </span>
          </div>
        </div>

        <p className="mt-4 text-[13px] font-rubik leading-relaxed font-normal text-[#486284] md:text-[14px] lg:pe-6">
          &ldquo;{quote}&rdquo;
        </p>
      </div>
    </div>
  )
}

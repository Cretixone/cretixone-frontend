import { cn } from '@/lib/utils'

export interface JourneyStepProps {
  iconSrc: string
  iconAlt?: string
  title: string
  description: string
  showLeftBorder?: boolean
  className?: string
}

export default function JourneyStep({
  iconSrc,
  iconAlt = '',
  title,
  description,
  showLeftBorder,
  className,
}: JourneyStepProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center px-6 py-10 text-center transition md:px-8',
        {
          'md:border-l md:border-[#fff]': showLeftBorder
        },
        className,
      )}
    >
      <img
        src={iconSrc}
        alt={iconAlt}
        className="h-14 w-14 md:h-16 md:w-16"
        aria-hidden={iconAlt === '' ? true : undefined}
      />
      <h3 className="mt-6 text-base font-semibold text-brand-navy md:text-[18px]">
        {title}
      </h3>
      <p className="mt-1 text-xs text-[#756C5E] font-normal md:text-[13px]">
        {description}
      </p>
    </div>
  )
}

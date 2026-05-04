import { cn } from '@/lib/utils'

export interface CretixoneMarkProps {
  className?: string
  /** Stroke / fill color — defaults to currentColor */
  color?: string
  /** Stroke width on the circle. Defaults to 3. */
  strokeWidth?: number
}

/**
 * Cretixone brand mark — the α-style swoosh + circle.
 * Sizes via the className (e.g. 'h-12 w-20') or width/height.
 */
export default function CretixoneMark({
  className,
  color,
  strokeWidth = 3,
}: CretixoneMarkProps) {
  const fill = color ?? 'currentColor'
  return (
    <svg
      viewBox="0 0 60 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn(className)}
    >
      <path
        d="M30 4c-9 0-16 6-16 14s7 14 16 14c5 0 9-2 12-5l-3-3c-2 2-5 4-9 4-6 0-11-4-11-10s5-10 11-10c4 0 7 2 9 4l3-3c-3-3-7-5-12-5z"
        fill={fill}
      />
      <circle
        cx="46"
        cy="18"
        r="6"
        stroke={fill}
        strokeWidth={strokeWidth}
        fill="none"
      />
    </svg>
  )
}

import * as React from 'react'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'navy' | 'gold' | 'ghost' | 'outline'
type Size = 'default' | 'sm' | 'lg' | 'pill'

const variants: Record<Variant, string> = {
  default:
    'bg-foreground text-background hover:bg-foreground/90',
  navy: 'bg-brand-navy text-white hover:bg-brand-navy/90',
  gold: 'bg-brand-gold text-white hover:bg-brand-gold/90',
  ghost: 'bg-transparent hover:bg-white/10 text-white',
  outline:
    'border border-white/20 bg-transparent text-white hover:bg-white/10',
}

const sizes: Record<Size, string> = {
  default: 'h-10 px-4 py-2 text-sm rounded-md',
  sm: 'h-8 px-3 text-xs rounded-md',
  lg: 'h-12 px-8 text-sm rounded-md',
  pill: 'h-11 px-6 text-sm rounded-full',
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

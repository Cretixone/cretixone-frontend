import * as React from 'react'
import { cn } from '@/lib/utils'

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-navy/80',
          className,
        )}
        {...props}
      />
    )
  },
)
Label.displayName = 'Label'

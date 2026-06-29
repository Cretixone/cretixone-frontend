import { motion } from 'framer-motion'
import { formatOMR } from '@/lib/format'
import { Button } from '@/components/ui/button'

interface Props {
  orderNumber: string
  total: number
  onViewOrders: () => void
  onContinue: () => void
}

/**
 * Full-screen order confirmation with a staged checkmark animation:
 * ripple → ring draw → circle fill pop → checkmark stroke → content fade-in.
 */
export function OrderSuccess({ orderNumber, total, onViewOrders, onContinue }: Props) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-8 text-center shadow-2xl"
      >
        {/* Check badge */}
        <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
          {/* ripples */}
          {[0, 1].map((i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full bg-emerald-400/25"
              initial={{ scale: 0.6, opacity: 0.6 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 1.4, delay: 0.4 + i * 0.3, ease: 'easeOut', repeat: Infinity, repeatDelay: 0.6 }}
            />
          ))}

          <svg viewBox="0 0 100 100" className="relative h-28 w-28">
            {/* filled disc pops in */}
            <motion.circle
              cx="50" cy="50" r="44"
              fill="#10b981"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{ transformOrigin: '50% 50%' }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 14 }}
            />
            {/* ring draws around */}
            <motion.circle
              cx="50" cy="50" r="44"
              fill="none" stroke="#059669" strokeWidth="3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.7, ease: 'easeInOut' }}
            />
            {/* checkmark strokes on */}
            <motion.path
              d="M30 51 L44 65 L72 36"
              fill="none" stroke="#ffffff" strokeWidth="7"
              strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.55, duration: 0.45, ease: 'easeOut' }}
            />
          </svg>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-brand-navy">Order placed!</h2>
          <p className="mt-1.5 text-sm text-foreground/60">
            Thank you — we've emailed your confirmation. Your order is now being processed.
          </p>

          <div className="mt-5 rounded-2xl bg-black/[0.03] px-4 py-3 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-foreground/50">Order number</span>
              <span className="font-semibold tracking-wide text-brand-navy">{orderNumber}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[12px] text-foreground/50">Total</span>
              <span className="font-bold tabular-nums text-brand-navy">{formatOMR(total)}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            <Button variant="navy" className="w-full" onClick={onViewOrders}>
              View my orders
            </Button>
            <Button
              variant="outline"
              className="w-full border-black/15 bg-transparent text-foreground hover:bg-black/5"
              onClick={onContinue}
            >
              Continue shopping
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useIsRtl } from '@/store/langStore'

/** Sentinel size value meaning "the shopper typed their own width × height". */
export const CUSTOM_SIZE = '__custom__'

/**
 * Size selector shared by the frame product page and the custom-print pages:
 * a few quick pills, everything else behind "More sizes", and a "Custom size"
 * entry that opens CustomSizeDialog.
 *
 * Sizes are addressed by name so one component serves both catalogues (frames
 * and prints resolve the name back to their own size record).
 */
export function SizePicker({
  sizes,
  value,
  displayValue,
  onChange,
}: {
  sizes: string[]
  value: string
  displayValue: string
  onChange: (s: string) => void
}) {
  const { t } = useTranslation('productDetail')
  const [open, setOpen] = useState(false)
  // Quick-pick pills for the first few presets; anything else lives behind
  // "More sizes". If the active selection isn't one of the quick pills (an
  // overflow preset, or a custom size), show it as its own highlighted pill
  // so the current choice is never hidden behind the dropdown.
  const QUICK_COUNT = 3
  const quickSizes = sizes.slice(0, QUICK_COUNT)
  const hasOverflowSelection = !!value && !quickSizes.includes(value)

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {quickSizes.map((s) => {
        const selected = s === value
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            aria-pressed={selected}
            className={cn(
              'rounded-full px-4 py-1 text-sm font-medium transition',
              selected ? 'bg-brand-gold text-white' : 'bg-black/[0.04] text-foreground/80 hover:bg-black/[0.07]',
            )}
          >
            {s}
          </button>
        )
      })}
      {hasOverflowSelection && (
        <span className="rounded-full bg-brand-gold px-4 py-1 text-sm font-medium text-white">
          {displayValue || t('sizePicker.selectSize')}
        </span>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-4 py-1 text-sm font-medium text-foreground/70 transition hover:bg-black/[0.07] focus-visible:outline-none"
        >
          {t('sizePicker.moreSizes')}
          <ChevronRight className={cn('h-4 w-4 transition-transform', open && 'rotate-90')} />
        </button>
        {open && (
          <>
            {/* click-away */}
            <button
              type="button"
              aria-hidden
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-10 cursor-default"
            />
            <ul
              role="listbox"
              className="absolute left-0 z-20 mt-1.5 w-44 overflow-hidden rounded-lg border border-black/10 bg-white p-1 shadow-[0_18px_40px_-18px_rgba(10,31,77,0.35)]"
            >
              {sizes.map((s) => {
                const selected = s === value
                return (
                  <li key={s}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        onChange(s)
                        setOpen(false)
                      }}
                      className={cn(
                        'block w-full rounded-md px-3 py-1.5 text-left text-sm transition hover:bg-black/[0.05]',
                        selected ? 'font-semibold text-brand-gold' : 'text-foreground/80',
                      )}
                    >
                      {s}
                    </button>
                  </li>
                )
              })}
              {/* Custom size — opens the size dialog */}
              <li className={cn(sizes.length > 0 && 'mt-1 border-t border-black/10 pt-1')}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === CUSTOM_SIZE}
                  onClick={() => {
                    onChange(CUSTOM_SIZE)
                    setOpen(false)
                  }}
                  className={cn(
                    'block w-full rounded-md px-3 py-1.5 text-left text-sm transition hover:bg-black/[0.05]',
                    value === CUSTOM_SIZE ? 'font-semibold text-brand-gold' : 'text-foreground/80',
                  )}
                >
                  {t('sizePicker.customSize')}
                </button>
              </li>
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Width × height entry for a custom size. Nothing is applied until Confirm —
 * Cancel or closing discards the draft.
 *
 * The live price comes from `priceLabelFor` rather than being computed here, so
 * each catalogue keeps its own formula (frames price by perimeter + waste,
 * prints by area).
 */
export function CustomSizeDialog({
  open,
  onOpenChange,
  sizeFrom,
  sizeTo,
  initialW,
  initialH,
  priceLabelFor,
  canConfirm,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Manufacturable range, shown as a hint and used for the warning. */
  sizeFrom: number
  sizeTo: number
  initialW: number
  initialH: number
  priceLabelFor: (widthCm: number, heightCm: number) => string
  /** False when the product has no rate, which disables Confirm. */
  canConfirm: boolean
  onConfirm: (widthCm: number, heightCm: number) => void
}) {
  const { t } = useTranslation('productDetail')
  const isRtl = useIsRtl()
  const [draftW, setDraftW] = useState(0)
  const [draftH, setDraftH] = useState(0)

  // Re-seed each time it opens so the dialog reflects the current selection.
  useEffect(() => {
    if (!open) return
    setDraftW(initialW)
    setDraftH(initialH)
  }, [open, initialW, initialH])

  const draftHasSize = draftW > 0 && draftH > 0
  const draftInRange =
    sizeTo > 0 &&
    draftW >= sizeFrom && draftW <= sizeTo &&
    draftH >= sizeFrom && draftH <= sizeTo

  const inputClass =
    'mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-foreground outline-none transition focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/30'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={isRtl ? 'rtl' : 'ltr'} className="max-w-sm">
        <DialogHeader className="border-b p-6">
          <DialogTitle>{t('customDialog.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 p-6">
          {sizeTo > 0 && (
            <p className="text-[13px] text-foreground/60">
              {t('customDialog.range', { from: sizeFrom, to: sizeTo })}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-foreground">{t('customDialog.width')}</span>
              <input
                type="number"
                min={1}
                inputMode="decimal"
                value={draftW || ''}
                onChange={(e) => setDraftW(Math.max(0, Number(e.target.value) || 0))}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-foreground">{t('customDialog.height')}</span>
              <input
                type="number"
                min={1}
                inputMode="decimal"
                value={draftH || ''}
                onChange={(e) => setDraftH(Math.max(0, Number(e.target.value) || 0))}
                className={inputClass}
              />
            </label>
          </div>
          {draftHasSize && (
            <div className="flex items-center justify-between rounded-lg bg-black/[0.03] px-3.5 py-2.5">
              <span className="text-sm text-foreground/70">{t('customDialog.price')}</span>
              <span className="text-base font-bold text-brand-navy tabular-nums">
                {priceLabelFor(draftW, draftH)}
              </span>
            </div>
          )}
          {draftHasSize && !draftInRange && (
            <p className="text-[12px] leading-relaxed text-amber-600">{t('customDialog.outOfRange')}</p>
          )}
        </div>
        <DialogFooter className="border-t bg-background p-4 sm:p-6">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t('customDialog.cancel')}
          </Button>
          <Button
            type="button"
            variant="navy"
            disabled={!canConfirm || !draftHasSize}
            onClick={() => {
              if (!draftHasSize) return
              onConfirm(draftW, draftH)
              onOpenChange(false)
            }}
          >
            {t('customDialog.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { InquiryFields, useInquiryForm } from '@/components/InquiryForm'
import { useIsRtl } from '@/store/langStore'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Canonical (English) name stored on the inquiry record. */
  frameName: string
  /** Localized name shown to the shopper (falls back to frameName). */
  displayName?: string
  thumbnail?: string
  widthCm: number
  heightCm: number
  /** Numeric estimate stored on the record (0 when the frame isn't priced). */
  unitPrice: number
  /** Pre-formatted price shown in the summary (e.g. "12.500 OMR" or "—"). */
  priceLabel: string
  currency?: string
  /** Artwork already picked on the product page, pre-attached to the form. */
  initialImage?: File | null
}

/**
 * "Request an inquiry" form for custom / out-of-range sizes. The frame and size
 * are shown read-only (the shopper can't change them here — they're carried in
 * from the product page) and only the contact details are editable. Submits to
 * POST /inquiries, which records it and emails the platform inbox.
 *
 * The fields and submit logic live in InquiryForm so this dialog and the
 * standalone /custom-prints/:slug/inquiry page never drift apart.
 */
export function InquiryDialog({
  open,
  onOpenChange,
  frameName,
  displayName,
  thumbnail,
  widthCm,
  heightCm,
  unitPrice,
  priceLabel,
  currency = 'OMR',
  initialImage = null,
}: Props) {
  const { t } = useTranslation('productDetail')
  const isRtl = useIsRtl()

  const form = useInquiryForm(
    { frameName, widthCm, heightCm, unitPrice, currency },
    { active: open, onSuccess: () => onOpenChange(false), initialImage },
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={isRtl ? 'rtl' : 'ltr'} className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('inquiry.title')}</DialogTitle>
          <DialogDescription>{t('inquiry.subtitle')}</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-5">
          {/* Read-only selection summary — frame + size carried in from the page */}
          <div className="rounded-xl border border-black/10 bg-black/[0.02] p-4">
            <div className="flex items-center gap-3.5">
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-lg border border-black/10 bg-white object-contain p-1.5"
                  draggable={false}
                />
              ) : (
                <div className="h-16 w-16 shrink-0 rounded-lg border border-black/10 bg-white" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-brand-navy">
                  {displayName || frameName}
                </p>
                <p className="mt-1 text-[13px] text-foreground/60 tabular-nums">
                  {t('inquiry.size')}: {widthCm}×{heightCm} cm
                </p>
              </div>
              <div className="shrink-0 rounded-lg border border-black/10 bg-white px-3.5 py-2 text-end">
                <p className="text-[11px] text-foreground/50">{t('inquiry.estimate')}</p>
                <p className="mt-0.5 text-sm font-bold text-brand-navy tabular-nums">{priceLabel}</p>
              </div>
            </div>
          </div>

          <InquiryFields form={form} />
        </DialogBody>

        <DialogFooter className="border-t border-black/[0.06] pt-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={form.submitting}>
            {t('inquiry.cancel')}
          </Button>
          <Button type="button" variant="navy" onClick={form.submit} disabled={!form.canSubmit}>
            {form.submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {form.submitting ? t('inquiry.submitting') : t('inquiry.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

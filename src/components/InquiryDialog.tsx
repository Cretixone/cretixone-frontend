import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
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
import { PhoneField } from '@/components/auth/PhoneField'
import { inquiriesApi } from '@/api/inquiries.api'
import { useAuthStore } from '@/store/authStore'
import { useIsRtl } from '@/store/langStore'
import { cn } from '@/lib/utils'

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
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * "Request an inquiry" form for custom / out-of-range sizes. The frame and size
 * are shown read-only (the shopper can't change them here — they're carried in
 * from the product page) and only the contact details are editable. Submits to
 * POST /inquiries, which records it and emails the platform inbox.
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
}: Props) {
  const { t } = useTranslation('productDetail')
  const isRtl = useIsRtl()
  const user = useAuthStore((s) => s.user)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState<string | undefined>(undefined)
  const [message, setMessage] = useState('')
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Prefill from the signed-in profile each time the dialog opens (so a later
  // login is reflected). Editable — the shopper may want a different contact.
  useEffect(() => {
    if (!open) return
    setTouched(false)
    setName(user ? `${user.firstName} ${user.lastName}`.trim() : '')
    setEmail(user?.email ?? '')
    setPhone(user?.phone ?? undefined)
    setMessage('')
  }, [open, user])

  const nameValid = name.trim().length > 0
  const emailValid = EMAIL_RE.test(email.trim())
  const canSubmit = nameValid && emailValid && !submitting

  const handleSubmit = async () => {
    setTouched(true)
    if (!nameValid || !emailValid) return
    setSubmitting(true)
    try {
      await inquiriesApi.create({
        frameName,
        widthCm,
        heightCm,
        unitPrice,
        currency,
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerPhone: phone || undefined,
        message: message.trim() || undefined,
      })
      toast.success(t('inquiry.success'))
      onOpenChange(false)
    } catch {
      toast.error(t('inquiry.error'))
    } finally {
      setSubmitting(false)
    }
  }

  const fieldClass =
    'mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-foreground outline-none transition focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/30'

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

          {/* Contact fields */}
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-foreground">{t('inquiry.name')}</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('inquiry.namePlaceholder')}
                className={cn(fieldClass, touched && !nameValid && 'border-red-400 focus:border-red-400 focus:ring-red-200')}
              />
              {touched && !nameValid && (
                <span className="mt-1 block text-[12px] text-red-500">{t('inquiry.invalidName')}</span>
              )}
            </label>

            <label className="block">
              <span className="text-sm font-medium text-foreground">{t('inquiry.email')}</span>
              <input
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('inquiry.emailPlaceholder')}
                className={cn(
                  fieldClass,
                  isRtl && 'text-right',
                  touched && !emailValid && 'border-red-400 focus:border-red-400 focus:ring-red-200',
                )}
              />
              {touched && !emailValid && (
                <span className="mt-1 block text-[12px] text-red-500">{t('inquiry.invalidEmail')}</span>
              )}
            </label>

            <div className="block">
              <span className="text-sm font-medium text-foreground">
                {t('inquiry.phone')}{' '}
                <span className="font-normal text-foreground/45">({t('inquiry.optional')})</span>
              </span>
              <div className="mt-1.5">
                <PhoneField value={phone} onChange={setPhone} />
              </div>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-foreground">
                {t('inquiry.message')}{' '}
                <span className="font-normal text-foreground/45">({t('inquiry.optional')})</span>
              </span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('inquiry.messagePlaceholder')}
                rows={3}
                maxLength={5000}
                className={cn(fieldClass, 'resize-none')}
              />
            </label>
          </div>
        </DialogBody>

        <DialogFooter className="border-t border-black/[0.06] pt-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t('inquiry.cancel')}
          </Button>
          <Button type="button" variant="navy" onClick={handleSubmit} disabled={!canSubmit}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? t('inquiry.submitting') : t('inquiry.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

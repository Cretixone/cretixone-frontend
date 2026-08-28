import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ImagePlus, X } from 'lucide-react'

import { PhoneField } from '@/components/auth/PhoneField'
import { inquiriesApi } from '@/api/inquiries.api'
import { useAuthStore } from '@/store/authStore'
import { useIsRtl } from '@/store/langStore'
import { cn } from '@/lib/utils'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** What the inquiry is about — carried in from the page that opened the form. */
export interface InquirySubject {
  /** Canonical (English) name stored on the inquiry record. */
  frameName: string
  widthCm: number
  heightCm: number
  /** Numeric estimate stored on the record (0 when the product isn't priced). */
  unitPrice: number
  currency?: string
}

export interface InquiryFormState {
  name: string
  setName: (v: string) => void
  email: string
  setEmail: (v: string) => void
  phone: string | undefined
  setPhone: (v: string | undefined) => void
  message: string
  setMessage: (v: string) => void
  image: File | null
  setImage: (f: File | null) => void
  touched: boolean
  submitting: boolean
  nameValid: boolean
  emailValid: boolean
  canSubmit: boolean
  submit: () => Promise<void>
  reset: () => void
}

/**
 * Contact state, validation and submission for a product inquiry. Extracted
 * from InquiryDialog so the dialog and the standalone inquiry page run the
 * exact same logic — a change to either stays in sync automatically.
 *
 * `active` controls prefilling: the dialog passes its `open` flag so a later
 * login is reflected the next time it opens; a page passes `true`.
 */
export function useInquiryForm(
  subject: InquirySubject,
  {
    active = true,
    onSuccess,
    initialImage = null,
  }: { active?: boolean; onSuccess?: () => void; initialImage?: File | null } = {},
): InquiryFormState {
  const { t } = useTranslation('productDetail')
  const user = useAuthStore((s) => s.user)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState<string | undefined>(undefined)
  const [message, setMessage] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setTouched(false)
    setName('')
    setEmail('')
    setPhone(undefined)
    setMessage('')
    setImage(null)
  }

  // Prefill from the signed-in profile. Editable — the shopper may want a
  // different contact.
  useEffect(() => {
    if (!active) return
    setTouched(false)
    setName(user ? `${user.firstName} ${user.lastName}`.trim() : '')
    setEmail(user?.email ?? '')
    setPhone(user?.phone ?? undefined)
    setMessage('')
    // Carries in a file the shopper already picked on the product page.
    setImage(initialImage)
  }, [active, user, initialImage])

  const nameValid = name.trim().length > 0
  const emailValid = EMAIL_RE.test(email.trim())

  const submit = async () => {
    setTouched(true)
    if (!nameValid || !emailValid) return
    setSubmitting(true)
    try {
      await inquiriesApi.create({
        frameName: subject.frameName,
        widthCm: subject.widthCm,
        heightCm: subject.heightCm,
        unitPrice: subject.unitPrice,
        currency: subject.currency ?? 'OMR',
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerPhone: phone || undefined,
        message: message.trim() || undefined,
        image,
      })
      toast.success(t('inquiry.success'))
      onSuccess?.()
    } catch {
      toast.error(t('inquiry.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return {
    name, setName,
    email, setEmail,
    phone, setPhone,
    message, setMessage,
    image, setImage,
    touched, submitting,
    nameValid, emailValid,
    canSubmit: nameValid && emailValid && !submitting,
    submit, reset,
  }
}

const fieldClass =
  'mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-foreground outline-none transition focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/30'

/**
 * The four contact inputs. Layout-agnostic so the dialog and the page can wrap
 * them in their own chrome.
 */
/**
 * `showImage` opts out of the artwork field for products where a customer
 * image is not useful (custom mirrors, for one). Everything else about the
 * form is unchanged, so the pages stay consistent.
 */
export function InquiryFields({
  form,
  showImage = true,
}: {
  form: InquiryFormState
  showImage?: boolean
}) {
  const { t } = useTranslation('productDetail')
  const isRtl = useIsRtl()
  const { touched, nameValid, emailValid } = form

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-foreground">{t('inquiry.name')}</span>
        <input
          type="text"
          value={form.name}
          onChange={(e) => form.setName(e.target.value)}
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
          value={form.email}
          onChange={(e) => form.setEmail(e.target.value)}
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
          <PhoneField value={form.phone} onChange={form.setPhone} />
        </div>
      </div>

      {showImage && <ArtworkField form={form} />}

      <label className="block">
        <span className="text-sm font-medium text-foreground">
          {t('inquiry.message')}{' '}
          <span className="font-normal text-foreground/45">({t('inquiry.optional')})</span>
        </span>
        <textarea
          value={form.message}
          onChange={(e) => form.setMessage(e.target.value)}
          placeholder={t('inquiry.messagePlaceholder')}
          rows={3}
          maxLength={5000}
          className={cn(fieldClass, 'resize-none')}
        />
      </label>
    </div>
  )
}

/** Client-side guard; the API enforces its own 3 MB limit too. */
const IMAGE_MAX_BYTES = 3 * 1024 * 1024
const IMAGE_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

/**
 * Optional artwork attached to the inquiry. The file is emailed to the
 * platform inbox as an attachment — it is never sent to the frame editor.
 */
function ArtworkField({ form }: { form: InquiryFormState }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation('productDetail')
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!form.image) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(form.image)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [form.image])

  const pick = (file: File | undefined) => {
    if (!file) return
    if (!IMAGE_MIME.includes(file.type)) {
      toast.error(t('inquiry.imageOnlyImages'))
      return
    }
    if (file.size > IMAGE_MAX_BYTES) {
      toast.error(t('inquiry.imageTooLarge', { mb: IMAGE_MAX_BYTES / (1024 * 1024) }))
      return
    }
    form.setImage(file)
  }

  return (
    <div className="block">
      <span className="text-sm font-medium text-foreground">
        {t('inquiry.image')}{' '}
        <span className="font-normal text-foreground/45">({t('inquiry.optional')})</span>
      </span>

      {form.image ? (
        <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-black/15 bg-white p-2.5">
          {preview && (
            <img
              src={preview}
              alt=""
              className="h-14 w-14 shrink-0 rounded-md border border-black/10 object-cover"
              draggable={false}
            />
          )}
          <span className="min-w-0 flex-1 truncate text-[13px] text-foreground/70">
            {form.image.name}
          </span>
          <button
            type="button"
            onClick={() => form.setImage(null)}
            aria-label={t('inquiry.imageRemove')}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-foreground/50 transition hover:bg-black/[0.06] hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-black/20 bg-white px-3 py-3 text-sm font-medium text-foreground/70 transition hover:border-brand-gold hover:text-brand-navy"
        >
          <ImagePlus className="h-4 w-4" />
          {t('inquiry.imageUpload')}
        </button>
      )}
      <p className="mt-1 text-[12px] text-foreground/45">{t('inquiry.imageHint')}</p>

      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_MIME.join(',')}
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0])
          e.currentTarget.value = ''
        }}
      />
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { isValidPhoneNumber } from 'react-phone-number-input'
import { Box, CheckCircle2, Loader2, Mail, Maximize2, Send, User } from 'lucide-react'
import { toast } from 'sonner'

import Navbar, { PillNav } from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { PhoneField } from '@/components/auth/PhoneField'
import {
  ChoiceCards,
  Dropzone,
  Field,
  FieldError,
  InquiryCard,
  SafetyNote,
  TextArea,
  TextInput,
} from '@/components/inquiry/InquiryFormKit'
import { inquiriesApi } from '@/api/inquiries.api'
import { printsApi, type PrintCategory } from '@/api/prints.api'
import { useAuthStore } from '@/store/authStore'

const FILE_MAX = 20 * 1024 * 1024
const FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/postscript', // .ai / .eps
  'image/vnd.adobe.photoshop',
]

/** The three printing services offered. */
const SERVICE_IDS = ['largeFormat', 'wallDecor', 'corporate'] as const

const SERVICE_IMAGES: Record<(typeof SERVICE_IDS)[number], string> = {
  largeFormat: '/images/prints/inquiry/img1.jpg',
  wallDecor: '/images/prints/inquiry/img2.jpg',
  corporate: '/images/prints/inquiry/img3.jpg',
}

/**
 * Validation lives in one schema so the same rules drive the inline messages
 * and the submit guard — a field can never be reported valid by one and
 * rejected by the other.
 *
 * Every question is required; only the reference file is not, matching the
 * "(optional)" it carries in the design.
 */
function makeSchema(t: TFunction<'inquiry'>) {
  const requiredText = (max: number) =>
    z.string().trim().min(1, t('common.required')).max(max, t('common.tooLong'))

  return z.object({
    service: z.enum(SERVICE_IDS, { message: t('printing.errors.serviceRequired') }),
    fullName: z
      .string()
      .trim()
      .min(1, t('common.invalidName'))
      .max(200, t('common.tooLong')),
    email: z
      .string()
      .trim()
      .min(1, t('common.invalidEmail'))
      .max(255, t('common.tooLong'))
      .email(t('common.invalidEmail')),
    phone: z
      .string()
      .min(1, t('common.required'))
      .refine((v) => isValidPhoneNumber(v), t('common.invalidPhone')),
    dimensions: requiredText(200),
    quantity: z
      .string()
      .min(1, t('common.required'))
      .refine((v) => /^\d+$/.test(v) && Number(v) > 0, t('common.invalidQuantity')),
    message: requiredText(5000),
  })
}
type Values = z.infer<ReturnType<typeof makeSchema>>

/**
 * Standalone printing-services inquiry, reached from an enquiry-only print
 * category or the "Request inquiry" action on a print product page.
 *
 * Answers the inquiry table does not model as columns (service, dimensions as
 * typed, quantity) travel in `details`; both the admin notification and the
 * customer confirmation render them as label/value rows.
 */
export default function PrintInquiryPage() {
  const { t } = useTranslation('inquiry')
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const [category, setCategory] = useState<PrintCategory | null>(null)
  const [sent, setSent] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const schema = useMemo(() => makeSchema(t), [t])
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      service: SERVICE_IDS[0],
      fullName: '',
      email: '',
      phone: '',
      dimensions: '',
      quantity: '',
      message: '',
    },
  })
  const e = form.formState.errors

  useEffect(() => {
    const prevBg = document.body.style.background
    const prevColor = document.body.style.color
    document.body.style.background = '#F7F8FA'
    document.body.style.color = '#000000'
    window.scrollTo(0, 0)
    return () => {
      document.body.style.background = prevBg
      document.body.style.color = prevColor
    }
  }, [])

  // Prefill from the signed-in profile; still editable.
  useEffect(() => {
    if (!user) return
    form.reset({
      ...form.getValues(),
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email ?? '',
      phone: user.phone ?? '',
    })
  }, [user, form])

  // The category only labels the record — the form works without one.
  useEffect(() => {
    if (!slug) return
    let alive = true
    printsApi
      .categoryBySlug(slug)
      .then((c) => alive && setCategory(c))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [slug])

  const services = useMemo(
    () =>
      SERVICE_IDS.map((id) => ({
        id,
        title: t(`printing.services.${id}.title`),
        description: t(`printing.services.${id}.desc`),
        image: SERVICE_IMAGES[id],
      })),
    [t],
  )

  const onSubmit = form.handleSubmit(async (v) => {
    // English labels: admin reads these regardless of the visitor's locale.
    const details: Record<string, string> = {
      Service: t(`printing.services.${v.service}.title`, { lng: 'en' }),
    }
    details['Print size'] = v.dimensions.trim()
    details['Quantity'] = v.quantity.trim()

    try {
      await inquiriesApi.create({
        frameName: category ? `Printing — ${category.name}` : 'Printing Services',
        widthCm: 0,
        heightCm: 0,
        unitPrice: 0,
        currency: 'OMR',
        customerName: v.fullName.trim(),
        customerEmail: v.email.trim(),
        customerPhone: v.phone,
        message: v.message.trim(),
        details,
        image: file,
      })
      setSent(true)
    } catch {
      toast.error(t('common.error'))
    }
  })

  const submitting = form.formState.isSubmitting

  return (
    <div className="min-h-screen w-full font-sans text-[#000000]" style={{ background: '#F7F8FA' }}>
      <header className="relative z-30">
        <Navbar />
      </header>
      <PillNav />

      <main className="mx-auto max-w-[1400px] px-4 pb-20 pt-28 md:px-8 md:pt-32 lg:pt-40">
        {sent ? (
          <InquiryCard title={t('printing.title')} subtitle={t('printing.subtitle')} wide>
            <div className="py-10 text-center">
              <CheckCircle2 className="mx-auto h-11 w-11 text-brand-gold" strokeWidth={1.6} />
              <p className="mt-4 text-lg font-semibold text-brand-navy">{t('common.sentTitle')}</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-foreground/60">
                {t('common.sentText')}
              </p>
              <Button variant="navy" className="mt-6 rounded-lg" onClick={() => navigate('/custom-prints')}>
                {t('printing.back')}
              </Button>
            </div>
          </InquiryCard>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <InquiryCard
              icon={<span aria-hidden className="text-[34px] leading-none">🖨️</span>}
              title={t('printing.title')}
              subtitle={t('printing.subtitle')}
              wide
            >
              <Field step={1} label={t('printing.fields.service')}>
                <Controller
                  control={form.control}
                  name="service"
                  render={({ field }) => (
                    <ChoiceCards
                      name="print-service"
                      items={services}
                      value={field.value}
                      onChange={(id) => field.onChange(id)}
                    />
                  )}
                />
                <FieldError>{e.service?.message}</FieldError>
              </Field>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <Field step={2} label={t('common.fullName')}>
                  <TextInput
                    icon={<User className="h-4 w-4" />}
                    placeholder={t('common.fullNamePlaceholder')}
                    invalid={!!e.fullName}
                    {...form.register('fullName')}
                  />
                  <FieldError>{e.fullName?.message}</FieldError>
                </Field>

                <Field step={3} label={t('common.email')}>
                  <TextInput
                    icon={<Mail className="h-4 w-4" />}
                    type="email"
                    dir="ltr"
                    placeholder={t('common.emailPlaceholder')}
                    invalid={!!e.email}
                    {...form.register('email')}
                  />
                  <FieldError>{e.email?.message}</FieldError>
                </Field>

                <Field step={4} label={t('common.phone')}>
                  <Controller
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <PhoneField
                        value={field.value || undefined}
                        onChange={(v) => field.onChange(v ?? '')}
                        invalid={!!e.phone}
                      />
                    )}
                  />
                  <FieldError>{e.phone?.message}</FieldError>
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <Field step={5} label={t('printing.fields.dimensions')}>
                  <TextInput
                    icon={<Maximize2 className="h-4 w-4" />}
                    placeholder={t('printing.fields.dimensionsPlaceholder')}
                    invalid={!!e.dimensions}
                    {...form.register('dimensions')}
                  />
                  <FieldError>{e.dimensions?.message}</FieldError>
                </Field>

                <Field step={6} label={t('common.quantity')}>
                  <TextInput
                    icon={<Box className="h-4 w-4" />}
                    inputMode="numeric"
                    placeholder={t('common.quantityPlaceholder')}
                    invalid={!!e.quantity}
                    {...form.register('quantity')}
                  />
                  <FieldError>{e.quantity?.message}</FieldError>
                </Field>

                <Field step={7} label={t('common.message')}>
                  <TextArea
                    rows={3}
                    placeholder={t('printing.fields.messagePlaceholder')}
                    invalid={!!e.message}
                    {...form.register('message')}
                  />
                  <FieldError>{e.message?.message}</FieldError>
                </Field>
              </div>

              <Field step={8} label={t('printing.fields.upload')} optional={t('common.optional')}>
                <Dropzone
                  file={file}
                  onFile={setFile}
                  accept={FILE_TYPES}
                  maxBytes={FILE_MAX}
                  primaryLabel={t('common.dropFiles')}
                  browseLabel={t('common.browse')}
                  hint={t('printing.fields.uploadHint')}
                  tooLargeMessage={t('printing.fields.uploadTooLarge')}
                  wrongTypeMessage={t('printing.fields.uploadWrongType')}
                  removeLabel={t('common.removeFile')}
                  onError={(m) => toast.error(m)}
                />
              </Field>

              <div>
                <Button
                  type="submit"
                  variant="navy"
                  size="lg"
                  disabled={submitting}
                  className="w-full gap-2 rounded-lg"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {submitting ? t('common.submitting') : t('common.submit')}
                </Button>
                <SafetyNote>{t('common.safety')}</SafetyNote>
              </div>
            </InquiryCard>
          </form>
        )}
      </main>

      <Footer />
    </div>
  )
}

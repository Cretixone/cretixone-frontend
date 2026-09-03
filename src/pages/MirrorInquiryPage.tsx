import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { isValidPhoneNumber } from 'react-phone-number-input'
import {
  ArrowLeftRight,
  Box,
  CheckCircle2,
  Loader2,
  Mail,
  MoveVertical,
  Send,
  User,
} from 'lucide-react'
import { toast } from 'sonner'

import Navbar, { PillNav } from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { PhoneField } from '@/components/auth/PhoneField'
import {
  ChoiceTiles,
  Dropzone,
  Field,
  FieldError,
  InquiryCard,
  SafetyNote,
  TextArea,
  TextInput,
} from '@/components/inquiry/InquiryFormKit'
import { inquiriesApi } from '@/api/inquiries.api'
import { findMirrorCategory } from '@/lib/mirror-categories'
import { useAuthStore } from '@/store/authStore'

const IMAGE_MAX = 5 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Mirror types offered on the form, each with its illustration from
 * public/images/svg/inquiry. The ids double as the i18n keys under
 * `mirror.types.*` and as the value stored on the inquiry.
 */
const MIRROR_TYPE_ICONS = {
  wall: '/images/svg/inquiry/wall-mirror.svg',
  bathroom: '/images/svg/inquiry/bathroom-mirror.svg',
  decorative: '/images/svg/inquiry/decorative-mirror.svg',
  led: '/images/svg/inquiry/led-mirror.svg',
  framed: '/images/svg/inquiry/framed-mirror.svg',
  fullLength: '/images/svg/inquiry/full-length-mirror.svg',
  customShape: '/images/svg/inquiry/custom-shape-mirror.svg',
  other: '/images/svg/inquiry/other.svg',
} as const

const MIRROR_TYPES = Object.keys(MIRROR_TYPE_ICONS) as (keyof typeof MIRROR_TYPE_ICONS)[]

/** Preferred shapes, each with its illustration from the same icon set. */
const SHAPE_ICONS = {
  rectangle: '/images/svg/inquiry/Rectangle.svg',
  round: '/images/svg/inquiry/Round.svg',
  oval: '/images/svg/inquiry/Oval.svg',
  square: '/images/svg/inquiry/Square.svg',
  arch: '/images/svg/inquiry/Arch.svg',
  custom: '/images/svg/inquiry/Custom.svg',
} as const

const SHAPES = Object.keys(SHAPE_ICONS) as (keyof typeof SHAPE_ICONS)[]

/**
 * One schema drives both the inline messages and the submit guard, so a field
 * can never be accepted by one and rejected by the other.
 *
 * Every question is required; only the reference image is not, matching the
 * "(optional)" it carries in the design.
 */
function makeSchema(t: TFunction<'inquiry'>) {
  const positiveNumber = (message: string) =>
    z
      .string()
      .min(1, t('common.required'))
      .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, message)

  return z.object({
    fullName: z.string().trim().min(1, t('common.invalidName')).max(200, t('common.tooLong')),
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
    // The product being asked about — without it the inquiry is not actionable.
    mirrorType: z.enum(MIRROR_TYPES, { message: t('mirror.errors.typeRequired') }),
    width: positiveNumber(t('mirror.errors.invalidSize')),
    height: positiveNumber(t('mirror.errors.invalidSize')),
    quantity: z
      .string()
      .min(1, t('common.required'))
      .refine((v) => /^\d+$/.test(v) && Number(v) > 0, t('common.invalidQuantity')),
    shape: z.enum(SHAPES, { message: t('mirror.errors.shapeRequired') }),
    message: z
      .string()
      .trim()
      .min(1, t('common.required'))
      .max(5000, t('common.tooLong')),
  })
}
type Values = z.infer<ReturnType<typeof makeSchema>>

/**
 * Standalone custom-mirror inquiry. Mirrors are made to order and never priced
 * up front, so every entry point on /custom-mirrors leads here. A tile passes
 * its selection as ?type=, which preselects the Mirror Type.
 */
export default function MirrorInquiryPage() {
  const { t } = useTranslation('inquiry')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useAuthStore((s) => s.user)

  const [sent, setSent] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const schema = useMemo(() => makeSchema(t), [t])
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      mirrorType: undefined as unknown as Values['mirrorType'],
      width: '',
      height: '',
      quantity: '',
      shape: undefined as unknown as Values['shape'],
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

  useEffect(() => {
    if (!user) return
    form.reset({
      ...form.getValues(),
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email ?? '',
      phone: user.phone ?? '',
    })
  }, [user, form])

  // A tile on /custom-mirrors passes which mirror was clicked; preselect it so
  // the visitor does not answer a question they already answered.
  useEffect(() => {
    const picked = findMirrorCategory(searchParams.get('type'))
    if (!picked) return
    const map: Record<string, (typeof MIRROR_TYPES)[number]> = {
      wall: 'wall',
      decorative: 'decorative',
      led: 'led',
      customShapes: 'customShape',
      framed: 'framed',
      beveled: 'other',
    }
    const mapped = map[picked.titleKey]
    if (mapped) form.setValue('mirrorType', mapped, { shouldValidate: false })
  }, [searchParams, form])

  const typeTiles = useMemo(
    () =>
      MIRROR_TYPES.map((id) => ({
        id,
        label: t(`mirror.types.${id}`),
        icon: (
          <img
            src={MIRROR_TYPE_ICONS[id]}
            alt=""
            aria-hidden
            className="h-8 w-8 object-contain"
            draggable={false}
          />
        ),
      })),
    [t],
  )
  const shapeTiles = useMemo(
    () =>
      SHAPES.map((id) => ({
        id,
        label: t(`mirror.shapes.${id}`),
        icon: (
          <img
            src={SHAPE_ICONS[id]}
            alt=""
            aria-hidden
            className="h-8 w-8 object-contain"
            draggable={false}
          />
        ),
      })),
    [t],
  )

  const onSubmit = form.handleSubmit(async (v) => {
    // English labels so admin reads the same thing whatever locale was used.
    const details: Record<string, string> = {
      'Mirror type': t(`mirror.types.${v.mirrorType}`, { lng: 'en' }),
    }
    details['Preferred shape'] = t(`mirror.shapes.${v.shape}`, { lng: 'en' })
    details['Quantity'] = v.quantity.trim()

    try {
      // Width/height are real columns, so they go there rather than in details.
      await inquiriesApi.create({
        frameName: 'Custom Mirror',
        widthCm: Number(v.width) || 0,
        heightCm: Number(v.height) || 0,
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
          <InquiryCard title={t('mirror.title')} subtitle={t('mirror.subtitle')}>
            <div className="py-10 text-center">
              <CheckCircle2 className="mx-auto h-11 w-11 text-brand-gold" strokeWidth={1.6} />
              <p className="mt-4 text-lg font-semibold text-brand-navy">{t('common.sentTitle')}</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-foreground/60">
                {t('common.sentText')}
              </p>
              <Button variant="navy" className="mt-6 rounded-lg" onClick={() => navigate('/custom-mirrors')}>
                {t('mirror.back')}
              </Button>
            </div>
          </InquiryCard>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <InquiryCard
              icon={<span aria-hidden className="text-[34px] leading-none">🪞</span>}
              title={t('mirror.title')}
              subtitle={t('mirror.subtitle')}
            >
              <Field step={1} label={t('common.fullName')}>
                <TextInput
                  icon={<User className="h-4 w-4" />}
                  placeholder={t('common.fullNamePlaceholder')}
                  invalid={!!e.fullName}
                  {...form.register('fullName')}
                />
                <FieldError>{e.fullName?.message}</FieldError>
              </Field>

              <Field step={2} label={t('common.email')}>
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

              <Field step={3} label={t('common.phone')} hint={t('mirror.fields.phoneHint')}>
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

              <Field step={4} label={t('mirror.fields.type')}>
                <Controller
                  control={form.control}
                  name="mirrorType"
                  render={({ field }) => (
                    <ChoiceTiles
                      items={typeTiles}
                      value={field.value ?? null}
                      onChange={(id) => field.onChange(id)}
                    />
                  )}
                />
                <FieldError>{e.mirrorType?.message}</FieldError>
              </Field>

              <Field step={5} label={t('mirror.fields.size')} optional={t('mirror.fields.sizeUnit')}>
                <div className="flex items-center gap-3">
                  <TextInput
                    icon={<ArrowLeftRight className="h-4 w-4" />}
                    inputMode="decimal"
                    placeholder={t('mirror.fields.width')}
                    invalid={!!e.width}
                    {...form.register('width')}
                  />
                  <span aria-hidden className="shrink-0 text-foreground/35">
                    ×
                  </span>
                  <TextInput
                    icon={<MoveVertical className="h-4 w-4" />}
                    inputMode="decimal"
                    placeholder={t('mirror.fields.height')}
                    invalid={!!e.height}
                    {...form.register('height')}
                  />
                </div>
                <FieldError>{e.width?.message ?? e.height?.message}</FieldError>
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

              <Field step={7} label={t('mirror.fields.shape')} hint={t('mirror.fields.shapeHint')}>
                <Controller
                  control={form.control}
                  name="shape"
                  render={({ field }) => (
                    <ChoiceTiles
                      items={shapeTiles}
                      value={field.value ?? null}
                      onChange={(id) => field.onChange(id)}
                      columns={6}
                    />
                  )}
                />
                <FieldError>{e.shape?.message}</FieldError>
              </Field>

              <Field step={8} label={t('common.message')}>
                <TextArea
                  rows={4}
                  placeholder={t('mirror.fields.messagePlaceholder')}
                  invalid={!!e.message}
                  {...form.register('message')}
                />
                <FieldError>{e.message?.message}</FieldError>
              </Field>

              <Field step={9} label={t('mirror.fields.upload')} optional={t('common.optional')}>
                <Dropzone
                  tinted
                  file={file}
                  onFile={setFile}
                  accept={IMAGE_TYPES}
                  maxBytes={IMAGE_MAX}
                  primaryLabel={t('mirror.fields.dropImage')}
                  browseLabel={t('common.browse')}
                  hint={t('mirror.fields.uploadHint')}
                  tooLargeMessage={t('mirror.fields.uploadTooLarge')}
                  wrongTypeMessage={t('mirror.fields.uploadWrongType')}
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

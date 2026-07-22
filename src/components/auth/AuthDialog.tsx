import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Loader2, Lock, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { PhoneField } from '@/components/auth/PhoneField'
import { authApi, errorCode, type AuthSession } from '@/api/auth.api'
import { useAuthStore } from '@/store/authStore'
import { useAuthUiStore } from '@/store/authUiStore'
import { useLangStore } from '@/store/langStore'
import { cn } from '@/lib/utils'

type Screen = 'login' | 'register' | 'verify' | 'forgot' | 'reset'

const makePasswordRule = (t: TFunction) =>
  z
    .string()
    .min(8, t('validation.passwordMin'))
    .regex(/[A-Za-z]/, t('validation.passwordLetter'))
    .regex(/\d/, t('validation.passwordNumber'))

const fieldCls = 'border border-black/15'

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="mt-1 text-[11px] text-red-500">{msg}</p>
}

// ── Login ───────────────────────────────────────────────────────────────────
const makeLoginSchema = (t: TFunction) =>
  z.object({
    email: z.string().trim().min(1, t('validation.emailRequired')).email(t('validation.emailInvalid')),
    password: z.string().min(1, t('validation.passwordRequired')),
  })
type LoginValues = z.infer<ReturnType<typeof makeLoginSchema>>

function LoginForm({
  onSession,
  onNeedsVerify,
  onForgot,
}: {
  onSession: (s: AuthSession) => void
  onNeedsVerify: (email: string) => void
  onForgot: () => void
}) {
  const { t } = useTranslation('auth')
  const loginSchema = useMemo(() => makeLoginSchema(t), [t])
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  const submit = form.handleSubmit(async (v) => {
    try {
      const session = await authApi.login(v.email, v.password)
      onSession(session)
    } catch (err) {
      if (errorCode(err) === 'EMAIL_NOT_VERIFIED') onNeedsVerify(v.email)
    }
  })
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="login-email">{t('fields.email')}</Label>
        <Input id="login-email" type="email" placeholder={t('fields.emailPlaceholder')} className={cn('mt-1', fieldCls)} {...form.register('email')} />
        <FieldError msg={form.formState.errors.email?.message} />
      </div>
      <div>
        <Label htmlFor="login-password">{t('fields.password')}</Label>
        <Input id="login-password" type="password" placeholder="••••••••" className={cn('mt-1', fieldCls)} {...form.register('password')} />
        <FieldError msg={form.formState.errors.password?.message} />
      </div>
      <button type="button" onClick={onForgot} className="text-[12px] font-medium text-brand-navy hover:underline">
        {t('login.forgot')}
      </button>
      <Button type="submit" variant="navy" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {t('login.submit')}
      </Button>
    </form>
  )
}

// ── Register ─────────────────────────────────────────────────────────────────
const makeRegisterSchema = (t: TFunction) =>
  z
    .object({
      firstName: z.string().trim().min(1, t('validation.required')).max(80),
      lastName: z.string().trim().min(1, t('validation.required')).max(80),
      email: z.string().trim().min(1, t('validation.emailRequired')).email(t('validation.emailInvalid')),
      phone: z.string().optional(),
      address: z.string().trim().min(1, t('validation.addressRequired')).max(500),
      zipcode: z.string().trim().min(1, t('validation.zipRequired')).max(20),
      password: makePasswordRule(t),
      confirmPassword: z.string().min(1, t('validation.confirmRequired')),
    })
    .refine((v) => v.password === v.confirmPassword, {
      message: t('validation.passwordMismatch'),
      path: ['confirmPassword'],
    })
type RegisterValues = z.infer<ReturnType<typeof makeRegisterSchema>>

function RegisterForm({ onPending }: { onPending: (email: string) => void }) {
  const { t } = useTranslation('auth')
  const registerSchema = useMemo(() => makeRegisterSchema(t), [t])
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '', lastName: '', email: '', phone: '', address: '', zipcode: '',
      password: '', confirmPassword: '',
    },
  })
  const submit = form.handleSubmit(async (v) => {
    await authApi.register({
      firstName: v.firstName,
      lastName: v.lastName,
      email: v.email,
      phone: v.phone || undefined,
      address: v.address,
      zipcode: v.zipcode,
      password: v.password,
    })
    onPending(v.email)
  })
  const e = form.formState.errors
  return (
    <form onSubmit={submit} className="space-y-3.5" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="r-first">{t('fields.firstName')}</Label>
          <Input id="r-first" className={cn('mt-1', fieldCls)} {...form.register('firstName')} />
          <FieldError msg={e.firstName?.message} />
        </div>
        <div>
          <Label htmlFor="r-last">{t('fields.lastName')}</Label>
          <Input id="r-last" className={cn('mt-1', fieldCls)} {...form.register('lastName')} />
          <FieldError msg={e.lastName?.message} />
        </div>
      </div>
      <div>
        <Label htmlFor="r-email">{t('fields.email')}</Label>
        <Input id="r-email" type="email" placeholder={t('fields.emailPlaceholder')} className={cn('mt-1', fieldCls)} {...form.register('email')} />
        <FieldError msg={e.email?.message} />
      </div>
      <div>
        <Label htmlFor="r-phone">
          {t('fields.phone')} <span className="font-normal text-foreground/40">{t('fields.phoneOptional')}</span>
        </Label>
        <div className="mt-1">
          <Controller
            control={form.control}
            name="phone"
            render={({ field }) => (
              <PhoneField id="r-phone" value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="r-address">{t('fields.address')}</Label>
        <Input id="r-address" placeholder={t('fields.addressPlaceholder')} className={cn('mt-1', fieldCls)} {...form.register('address')} />
        <FieldError msg={e.address?.message} />
      </div>
      <div>
        <Label htmlFor="r-zip">{t('fields.zipcode')}</Label>
        <Input id="r-zip" placeholder="100" className={cn('mt-1', fieldCls)} {...form.register('zipcode')} />
        <FieldError msg={e.zipcode?.message} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="r-pass">{t('fields.password')}</Label>
          <Input id="r-pass" type="password" className={cn('mt-1', fieldCls)} {...form.register('password')} />
          <FieldError msg={e.password?.message} />
        </div>
        <div>
          <Label htmlFor="r-pass2">{t('fields.confirm')}</Label>
          <Input id="r-pass2" type="password" className={cn('mt-1', fieldCls)} {...form.register('confirmPassword')} />
          <FieldError msg={e.confirmPassword?.message} />
        </div>
      </div>
      <Button type="submit" variant="navy" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {t('register.submit')}
      </Button>
    </form>
  )
}

// ── OTP verify ───────────────────────────────────────────────────────────────
const makeOtpSchema = (t: TFunction) =>
  z.object({ otp: z.string().regex(/^\d{6}$/, t('validation.otpInvalid')) })

function VerifyForm({
  email,
  onSession,
  onBack,
}: {
  email: string
  onSession: (s: AuthSession) => void
  onBack: () => void
}) {
  const { t } = useTranslation('auth')
  const [resending, setResending] = useState(false)
  const otpSchema = useMemo(() => makeOtpSchema(t), [t])
  const form = useForm<{ otp: string }>({ resolver: zodResolver(otpSchema), defaultValues: { otp: '' } })
  const submit = form.handleSubmit(async (v) => {
    const session = await authApi.verifyEmail(email, v.otp)
    onSession(session)
  })
  const resend = async () => {
    setResending(true)
    try {
      await authApi.resendOtp(email) // global toast shows the backend message
    } finally {
      setResending(false)
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <p className="text-sm text-foreground/60">
        <Trans
          t={t}
          i18nKey="verify.sent"
          values={{ email }}
          components={{ b: <span className="font-medium text-brand-navy" /> }}
        />
      </p>
      <div>
        <Input
          inputMode="numeric"
          maxLength={6}
          placeholder="••••••"
          className={cn('text-center text-xl font-semibold tracking-[0.5em]', fieldCls)}
          {...form.register('otp')}
        />
        <FieldError msg={form.formState.errors.otp?.message} />
      </div>
      <Button type="submit" variant="navy" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {t('verify.submit')}
      </Button>
      <div className="flex items-center justify-between text-[12px]">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-foreground/60 hover:text-brand-navy">
          <ArrowLeft className="h-3.5 w-3.5" /> {t('verify.back')}
        </button>
        <button type="button" onClick={resend} disabled={resending} className="font-medium text-brand-navy hover:underline disabled:opacity-50">
          {resending ? t('verify.sending') : t('verify.resend')}
        </button>
      </div>
    </form>
  )
}

// ── Forgot password (request) ────────────────────────────────────────────────
const makeForgotSchema = (t: TFunction) =>
  z.object({
    email: z.string().trim().min(1, t('validation.emailRequired')).email(t('validation.emailInvalid')),
  })

function ForgotForm({ onSent, onBack }: { onSent: (email: string) => void; onBack: () => void }) {
  const { t } = useTranslation('auth')
  const forgotSchema = useMemo(() => makeForgotSchema(t), [t])
  const form = useForm<{ email: string }>({ resolver: zodResolver(forgotSchema), defaultValues: { email: '' } })
  const submit = form.handleSubmit(async (v) => {
    await authApi.forgotPassword(v.email) // global toast shows the backend message
    onSent(v.email)
  })
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <p className="text-sm text-foreground/60">{t('forgot.intro')}</p>
      <div>
        <Label htmlFor="f-email">{t('fields.email')}</Label>
        <Input id="f-email" type="email" placeholder={t('fields.emailPlaceholder')} className={cn('mt-1', fieldCls)} {...form.register('email')} />
        <FieldError msg={form.formState.errors.email?.message} />
      </div>
      <Button type="submit" variant="navy" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {t('forgot.submit')}
      </Button>
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-[12px] text-foreground/60 hover:text-brand-navy">
        <ArrowLeft className="h-3.5 w-3.5" /> {t('forgot.back')}
      </button>
    </form>
  )
}

// ── Reset password ───────────────────────────────────────────────────────────
const makeResetSchema = (t: TFunction) =>
  z
    .object({
      otp: z.string().regex(/^\d{6}$/, t('validation.otpInvalid')),
      password: makePasswordRule(t),
      confirmPassword: z.string().min(1, t('validation.confirmRequired')),
    })
    .refine((v) => v.password === v.confirmPassword, {
      message: t('validation.passwordMismatch'),
      path: ['confirmPassword'],
    })
type ResetValues = z.infer<ReturnType<typeof makeResetSchema>>

function ResetForm({ email, onDone }: { email: string; onDone: () => void }) {
  const { t } = useTranslation('auth')
  const resetSchema = useMemo(() => makeResetSchema(t), [t])
  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { otp: '', password: '', confirmPassword: '' },
  })
  const submit = form.handleSubmit(async (v) => {
    await authApi.resetPassword(email, v.otp, v.password) // global toast shows the backend message
    onDone()
  })
  const e = form.formState.errors
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <p className="text-sm text-foreground/60">
        <Trans
          t={t}
          i18nKey="reset.intro"
          values={{ email }}
          components={{ b: <span className="font-medium text-brand-navy" /> }}
        />
      </p>
      <div>
        <Label htmlFor="rs-otp">{t('fields.code')}</Label>
        <Input id="rs-otp" inputMode="numeric" maxLength={6} placeholder="••••••" className={cn('mt-1 text-center tracking-[0.4em]', fieldCls)} {...form.register('otp')} />
        <FieldError msg={e.otp?.message} />
      </div>
      <div>
        <Label htmlFor="rs-pass">{t('fields.newPassword')}</Label>
        <Input id="rs-pass" type="password" className={cn('mt-1', fieldCls)} {...form.register('password')} />
        <FieldError msg={e.password?.message} />
      </div>
      <div>
        <Label htmlFor="rs-pass2">{t('fields.confirmPassword')}</Label>
        <Input id="rs-pass2" type="password" className={cn('mt-1', fieldCls)} {...form.register('confirmPassword')} />
        <FieldError msg={e.confirmPassword?.message} />
      </div>
      <Button type="submit" variant="navy" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {t('reset.submit')}
      </Button>
    </form>
  )
}

// ── Dialog shell ─────────────────────────────────────────────────────────────
export function AuthDialog() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const isRtl = useLangStore((s) => s.isRtl)
  const { open, view, redirectTo, close } = useAuthUiStore()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [screen, setScreen] = useState<Screen>('login')
  const [pendingEmail, setPendingEmail] = useState('')

  // Sync the internal screen to the requested view each time the dialog opens.
  useEffect(() => {
    if (open) setScreen(view === 'register' ? 'register' : view === 'forgot' ? 'forgot' : 'login')
  }, [open, view])

  const onSession = (s: AuthSession) => {
    setAuth({ accessToken: s.accessToken, refreshToken: s.refreshToken, user: s.user })
    toast.success(t('toast.welcome', { name: s.user.firstName }))
    close()
    if (redirectTo) navigate(redirectTo)
  }

  const titles: Record<Screen, { title: string; desc: string }> = {
    login: { title: t('titles.login.title'), desc: t('titles.login.desc') },
    register: { title: t('titles.register.title'), desc: t('titles.register.desc') },
    verify: { title: t('titles.verify.title'), desc: t('titles.verify.desc') },
    forgot: { title: t('titles.forgot.title'), desc: t('titles.forgot.desc') },
    reset: { title: t('titles.reset.title'), desc: t('titles.reset.desc') },
  }
  const isTabs = screen === 'login' || screen === 'register'

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      {/* Portaled to <body>; set dir explicitly so labels/inputs/placeholders
          align to the right in Arabic instead of relying on portal inheritance. */}
      <DialogContent dir={isRtl ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{titles[screen].title}</DialogTitle>
          <DialogDescription>{titles[screen].desc}</DialogDescription>
        </DialogHeader>

        <DialogBody>
          {isTabs ? (
            <Tabs value={screen} onValueChange={(v) => setScreen(v as Screen)}>
              <TabsList className="grid w-full grid-cols-2 bg-black/[0.05]">
                <TabsTrigger
                  value="login"
                  className="text-[13px] text-foreground/60 data-[state=active]:bg-brand-navy data-[state=active]:text-white"
                >
                  {t('tabs.login')}
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="text-[13px] text-foreground/60 data-[state=active]:bg-brand-navy data-[state=active]:text-white"
                >
                  {t('tabs.register')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-4">
                <LoginForm
                  onSession={onSession}
                  onNeedsVerify={(email) => { setPendingEmail(email); setScreen('verify') }}
                  onForgot={() => setScreen('forgot')}
                />
              </TabsContent>
              <TabsContent value="register" className="mt-4">
                <RegisterForm onPending={(email) => { setPendingEmail(email); setScreen('verify') }} />
              </TabsContent>
            </Tabs>
          ) : screen === 'verify' ? (
            <VerifyForm email={pendingEmail} onSession={onSession} onBack={() => setScreen('login')} />
          ) : screen === 'forgot' ? (
            <ForgotForm onSent={(email) => { setPendingEmail(email); setScreen('reset') }} onBack={() => setScreen('login')} />
          ) : (
            <ResetForm email={pendingEmail} onDone={() => setScreen('login')} />
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

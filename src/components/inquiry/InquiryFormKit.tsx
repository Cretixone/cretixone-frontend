import type { ReactNode } from 'react'
import { forwardRef, useRef, useState } from 'react'
import { UploadCloud, X } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Building blocks for the standalone inquiry pages (printing services, custom
 * mirrors). They share one visual language: a centred white card, numbered
 * steps down the left of each label, and full-width controls.
 *
 * Icon slots are deliberately generic — every `icon` prop takes a node, so the
 * real artwork can be dropped in later without touching layout.
 */

// ── Page shell ───────────────────────────────────────────────────────────────

export function InquiryCard({
  icon,
  title,
  subtitle,
  children,
  wide = false,
}: {
  icon?: ReactNode
  title: string
  subtitle: string
  children: ReactNode
  /** Printing services uses a wider card for its 3-across grids. */
  wide?: boolean
}) {
  return (
    <div className={cn('mx-auto w-full', wide ? 'max-w-[1180px]' : 'max-w-[1040px]')}>
      <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-7 md:p-9">
        <header className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center sm:text-start">
          {icon && <span className="shrink-0">{icon}</span>}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-[30px]">
              {title}
            </h1>
            <p className="mt-1 text-sm text-foreground/55 sm:text-[15px]">{subtitle}</p>
          </div>
        </header>

        <div className="mt-7 space-y-5">{children}</div>
      </div>
    </div>
  )
}

// ── Numbered field ───────────────────────────────────────────────────────────

export function Field({
  step,
  label,
  optional,
  hint,
  children,
  className,
}: {
  step: number
  label: string
  optional?: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex items-center gap-2">
        <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-brand-navy text-[11px] font-semibold text-white">
          {step}
        </span>
        <span className="text-[15px] font-semibold text-brand-navy">
          {label}
          {optional && (
            <span className="ms-1 font-normal text-foreground/45">({optional})</span>
          )}
        </span>
      </div>
      <div className="mt-2">{children}</div>
      {hint && <p className="mt-1.5 text-[12px] text-foreground/45">{hint}</p>}
    </div>
  )
}

// ── Controls ─────────────────────────────────────────────────────────────────

const controlBase =
  'w-full rounded-lg border bg-white text-sm text-foreground outline-none transition placeholder:text-foreground/35 focus:ring-2'
const controlIdle = 'border-black/[0.12] focus:border-brand-gold focus:ring-brand-gold/25'
const controlError = 'border-red-400 focus:border-red-400 focus:ring-red-200'

/**
 * forwardRef is required, not cosmetic: react-hook-form's register() returns
 * a ref, and React 18 silently drops a ref passed to a plain function
 * component. Without this the ref never reaches the <input>, RHF reads the
 * field as undefined, and zod rejects even a correctly filled box with its
 * default "Invalid input" message.
 */
export const TextInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode; invalid?: boolean }
>(function TextInput({ icon, invalid, className, ...props }, ref) {
  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute inset-y-0 start-0 flex w-11 items-center justify-center text-foreground/35">
          {icon}
        </span>
      )}
      <input
        ref={ref}
        {...props}
        className={cn(
          controlBase,
          invalid ? controlError : controlIdle,
          'h-11 px-3.5',
          icon && 'ps-11',
          className,
        )}
      />
    </div>
  )
})

/** Same forwardRef requirement as TextInput — see the note above. */
export const TextArea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function TextArea({ invalid, className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      {...props}
      className={cn(controlBase, invalid ? controlError : controlIdle, 'px-3.5 py-3', className)}
    />
  )
})

export function FieldError({ children }: { children?: string }) {
  if (!children) return null
  return <p className="mt-1.5 text-[12px] text-red-500">{children}</p>
}

// ── Big picture-led choice cards (printing service type) ─────────────────────

export interface ChoiceCard {
  id: string
  title: string
  description: string
  image?: string
}

export function ChoiceCards({
  items,
  value,
  onChange,
  name,
}: {
  items: ChoiceCard[]
  value: string | null
  onChange: (id: string) => void
  name: string
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => {
        const selected = value === it.id
        return (
          <button
            key={it.id}
            type="button"
            role="radio"
            aria-checked={selected}
            name={name}
            onClick={() => onChange(it.id)}
            className={cn(
              'relative flex items-stretch gap-3 rounded-xl border p-3 text-start transition',
              selected
                ? 'border-brand-navy bg-brand-navy/[0.02] ring-1 ring-brand-navy'
                : 'border-black/[0.10] hover:border-black/25',
            )}
          >
            {/* Artwork slot — a neutral block until the real photo is supplied. */}
            <span className="h-[92px] w-[110px] shrink-0 overflow-hidden rounded-lg bg-black/[0.06]">
              {it.image && (
                <img src={it.image} alt="" className="h-full w-full object-cover" draggable={false} />
              )}
            </span>
            <span className="min-w-0 flex-1 pe-6">
              <span className="block text-[15px] font-semibold leading-tight text-brand-navy">
                {it.title}
              </span>
              <span className="mt-1 block text-[12px] leading-snug text-foreground/55">
                {it.description}
              </span>
            </span>
            <span
              aria-hidden
              className={cn(
                'absolute end-3 top-3 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 transition',
                selected ? 'border-brand-navy' : 'border-black/20',
              )}
            >
              {selected && <span className="h-[9px] w-[9px] rounded-full bg-brand-navy" />}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── Compact icon tiles (mirror type, preferred shape) ────────────────────────

export interface ChoiceTile {
  id: string
  label: string
  icon?: ReactNode
}

export function ChoiceTiles({
  items,
  value,
  onChange,
  columns = 4,
}: {
  items: ChoiceTile[]
  value: string | null
  onChange: (id: string) => void
  columns?: 3 | 4 | 6
}) {
  const cols =
    columns === 6
      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
      : columns === 3
        ? 'grid-cols-2 sm:grid-cols-3'
        : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
  return (
    <div className={cn('grid gap-2.5', cols)}>
      {items.map((it) => {
        const selected = value === it.id
        return (
          <button
            key={it.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(it.id)}
            className={cn(
              'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-start transition',
              selected
                ? 'border-brand-navy bg-brand-navy/[0.03] ring-1 ring-brand-navy'
                : 'border-black/[0.10] hover:border-black/25',
            )}
          >
            {/* Real artwork renders as-is; the neutral square is only the
                fallback for a tile that has no icon yet. */}
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                !it.icon && 'bg-black/[0.06] text-foreground/40',
              )}
            >
              {it.icon}
            </span>
            <span className="min-w-0 truncate text-[13px] font-medium text-brand-navy">
              {it.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── File dropzone ────────────────────────────────────────────────────────────

export function Dropzone({
  file,
  onFile,
  accept,
  maxBytes,
  primaryLabel,
  browseLabel,
  hint,
  tooLargeMessage,
  wrongTypeMessage,
  removeLabel,
  onError,
  tinted = false,
}: {
  file: File | null
  onFile: (f: File | null) => void
  /** Comma-separated MIME list for the input plus the accepted-type check. */
  accept: string[]
  maxBytes: number
  primaryLabel: string
  browseLabel: string
  hint: string
  tooLargeMessage: string
  wrongTypeMessage: string
  removeLabel: string
  onError: (message: string) => void
  /** Mirrors page uses a lightly tinted panel. */
  tinted?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  const take = (f: File | undefined) => {
    if (!f) return
    if (accept.length && !accept.includes(f.type)) {
      onError(wrongTypeMessage)
      return
    }
    if (f.size > maxBytes) {
      onError(tooLargeMessage)
      return
    }
    onFile(f)
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-black/[0.12] bg-white p-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/[0.05] text-foreground/40">
          <UploadCloud className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] text-foreground/70">{file.name}</span>
        <button
          type="button"
          onClick={() => onFile(null)}
          aria-label={removeLabel}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-foreground/45 transition hover:bg-black/[0.06] hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          take(e.dataTransfer.files?.[0])
        }}
        className={cn(
          'rounded-xl border border-dashed px-6 py-8 text-center transition',
          tinted ? 'bg-brand-navy/[0.03]' : 'bg-black/[0.015]',
          over ? 'border-brand-gold bg-brand-gold/[0.06]' : 'border-black/20',
        )}
      >
        <UploadCloud className="mx-auto h-7 w-7 text-foreground/35" strokeWidth={1.6} />
        <p className="mt-2 text-[13px] text-foreground/60">
          {primaryLabel}{' '}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-semibold text-brand-blue underline-offset-2 hover:underline"
            style={{ color: '#2563EB' }}
          >
            {browseLabel}
          </button>
        </p>
        <p className="mt-1 text-[12px] text-foreground/40">{hint}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept.join(',')}
        className="hidden"
        onChange={(e) => {
          take(e.target.files?.[0])
          e.currentTarget.value = ''
        }}
      />
    </>
  )
}

// ── Footer ───────────────────────────────────────────────────────────────────

export function SafetyNote({ children }: { children: string }) {
  return (
    <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[12px] text-foreground/45">
      <span aria-hidden>🔒</span>
      {children}
    </p>
  )
}

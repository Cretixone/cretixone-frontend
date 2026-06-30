import { useEffect, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Sliders,
} from 'lucide-react'
import {
  useEditorStore,
  A4_LONG_CM,
  A4_SHORT_CM,
} from '@/store/editorStore'
import type { ApiFrameSize } from '@/types/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { formatOMR } from '@/lib/format'
import { useCartStore } from '@/store/cartStore'
import { useFetchFrameSizesQuery } from '@/store/api/apiSlice'
import { useNavigate, useSearchParams } from 'react-router-dom'

// ── Field row ─────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-[0.12em]"
      style={{ color: 'var(--ed-fg-subtle)' }}
    >
      {children}
    </span>
  )
}

function ValueText({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[11px] font-medium tabular-nums"
      style={{ color: 'var(--ed-fg)' }}
    >
      {children}
    </span>
  )
}

function SectionCard({
  title, children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      className="rounded-lg border p-3"
      style={{
        background: 'var(--ed-panel-elevated)',
        borderColor: 'var(--ed-border)',
      }}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <FieldLabel>{title}</FieldLabel>
      </div>
      {children}
    </div>
  )
}

// ── Number field ────────────────────────────────────────────────────────────

function NumberField({
  value, onChange, min = 1, step = 0.5,
}: {
  value: number
  onChange: (n: number) => void
  min?: number
  step?: number
}) {
  return (
    <input
      type="number"
      min={min}
      step={step}
      value={value}
      onChange={(e) => onChange(Math.max(min, Number(e.target.value) || min))}
      className="h-8 w-full rounded-md border bg-[var(--ed-panel)] px-2 text-[12px] tabular-nums focus:outline-none focus:ring-2"
      style={{
        borderColor: 'var(--ed-border-strong)',
        color: 'var(--ed-fg)',
      }}
    />
  )
}

// Picks the best size preset for an uploaded image's orientation — exact
// orientation match first, then the most extreme aspect in that direction.
function pickByOrientation(
  sizes: ApiFrameSize[],
  orient: 'square' | 'landscape' | 'portrait',
): ApiFrameSize | undefined {
  if (!sizes.length) return undefined
  if (orient === 'square') {
    return (
      sizes.find((s) => s.widthCm === s.lengthCm) ??
      [...sizes].sort(
        (a, b) => Math.abs(a.widthCm - a.lengthCm) - Math.abs(b.widthCm - b.lengthCm),
      )[0]
    )
  }
  if (orient === 'landscape') {
    return (
      sizes.find((s) => s.widthCm > s.lengthCm) ??
      [...sizes].sort((a, b) => b.widthCm / b.lengthCm - a.widthCm / a.lengthCm)[0]
    )
  }
  return (
    sizes.find((s) => s.lengthCm > s.widthCm) ??
    [...sizes].sort((a, b) => b.lengthCm / b.widthCm - a.lengthCm / a.widthCm)[0]
  )
}

function CustomSizeInputs() {
  const customWidthCm = useEditorStore((s) => s.customWidthCm)
  const customHeightCm = useEditorStore((s) => s.customHeightCm)
  const customAspectLocked = useEditorStore((s) => s.customAspectLocked)
  const setCustomWidthCm = useEditorStore((s) => s.setCustomWidthCm)
  const setCustomHeightCm = useEditorStore((s) => s.setCustomHeightCm)
  const setCustomAspectLocked = useEditorStore((s) => s.setCustomAspectLocked)

  const aspect = customHeightCm > 0 ? customWidthCm / customHeightCm : 1

  const onWidth = (n: number) => {
    setCustomWidthCm(n)
    if (customAspectLocked && aspect > 0) {
      setCustomHeightCm(Math.max(1, Math.round((n / aspect) * 10) / 10))
    }
  }
  const onHeight = (n: number) => {
    setCustomHeightCm(n)
    if (customAspectLocked && aspect > 0) {
      setCustomWidthCm(Math.max(1, Math.round(n * aspect * 10) / 10))
    }
  }

  return (
    <div className="mt-2 space-y-2.5 rounded-md border p-3"
      style={{
        background: 'var(--ed-panel)',
        borderColor: 'var(--ed-border)',
      }}
    >
      <div className="flex items-center justify-between">
        <FieldLabel>Custom (cm)</FieldLabel>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setCustomAspectLocked(!customAspectLocked)}
              aria-label={customAspectLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
              className="flex h-6 w-6 items-center justify-center rounded-md transition-colors"
              style={{
                background: customAspectLocked ? 'var(--ed-accent-soft)' : 'transparent',
                color: customAspectLocked ? 'var(--ed-accent)' : 'var(--ed-fg-muted)',
              }}
            >
              <Lock size={13} strokeWidth={1.8} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {customAspectLocked ? 'Aspect locked' : 'Aspect free'}
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <FieldLabel>Width</FieldLabel>
          <NumberField value={customWidthCm} onChange={onWidth} />
        </label>
        <label className="space-y-1">
          <FieldLabel>Height</FieldLabel>
          <NumberField value={customHeightCm} onChange={onHeight} />
        </label>
      </div>
    </div>
  )
}

// Admin-managed size presets. Selecting one applies its width × length (cm);
// the "Custom size" button reveals manual cm inputs. Defaults to the first
// size, and auto-selects an orientation-matching size when an image is added.
function SizePresetCard() {
  const { data: sizes } = useFetchFrameSizesQuery()
  const customWidthCm = useEditorStore((s) => s.customWidthCm)
  const customHeightCm = useEditorStore((s) => s.customHeightCm)
  const setCustomWidthCm = useEditorStore((s) => s.setCustomWidthCm)
  const setCustomHeightCm = useEditorStore((s) => s.setCustomHeightCm)
  const setFrameAspectRatio = useEditorStore((s) => s.setFrameAspectRatio)
  const artworkImageUrl = useEditorStore((s) => s.artworkImageUrl)

  const [showCustom, setShowCustom] = useState(false)
  const didDefault = useRef(false)
  const lastImg = useRef<string | null>(null)

  // Apply a preset → Custom mode with the preset's exact cm dimensions.
  const apply = (s: ApiFrameSize) => {
    setFrameAspectRatio('custom')
    setCustomWidthCm(s.widthCm)
    setCustomHeightCm(s.lengthCm)
  }

  // The preset whose dimensions match the live size (empty when manually edited).
  const selectedId =
    sizes?.find((s) => s.widthCm === customWidthCm && s.lengthCm === customHeightCm)?.id ?? ''

  // Default to the first size on first load (when there's no image to match).
  useEffect(() => {
    if (didDefault.current || !sizes?.length) return
    didDefault.current = true
    if (artworkImageUrl) return // the image effect below handles it
    if (selectedId) return // already matches a preset
    apply(sizes[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizes])

  // Auto-select an orientation-matching size whenever a new image is added —
  // mirrors how the old Landscape/Portrait/Square auto-switch worked on upload.
  useEffect(() => {
    if (!sizes?.length || !artworkImageUrl) return
    if (lastImg.current === artworkImageUrl) return
    lastImg.current = artworkImageUrl
    const probe = new Image()
    probe.onload = () => {
      if (!probe.naturalWidth || !probe.naturalHeight) return
      const r = probe.naturalWidth / probe.naturalHeight
      const orient = Math.abs(r - 1) <= 0.08 ? 'square' : r > 1 ? 'landscape' : 'portrait'
      const pick = pickByOrientation(sizes, orient)
      if (pick) {
        apply(pick)
        setShowCustom(false)
      }
    }
    probe.src = artworkImageUrl
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizes, artworkImageUrl])

  if (!sizes || sizes.length === 0) return null

  return (
    <div className="space-y-3">
      <SectionCard title="Size">
        <Select
          value={selectedId}
          onValueChange={(id) => {
            const s = sizes.find((x) => x.id === id)
            if (s) {
              apply(s)
              setShowCustom(false)
            }
          }}
        >
          <SelectTrigger aria-label="Frame size">
            <SelectValue placeholder="Choose a size…" />
          </SelectTrigger>
          <SelectContent>
            {sizes.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} · {s.widthCm}×{s.lengthCm} cm
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          type="button"
          onClick={() => setShowCustom((v) => !v)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-[11px] font-medium transition-colors"
          style={{
            borderColor: 'var(--ed-border-strong)',
            color: showCustom || !selectedId ? 'var(--ed-accent)' : 'var(--ed-fg-muted)',
            background: showCustom || !selectedId ? 'var(--ed-accent-soft)' : 'transparent',
          }}
        >
          <Sliders size={13} strokeWidth={1.8} /> Custom size
        </button>

        {(showCustom || !selectedId) && <CustomSizeInputs />}
      </SectionCard>
    </div>
  )
}

function RatioPanel() {
  return <SizePresetCard />
}

function StylePanel() {
  const selectedFrame = useEditorStore((s) => s.selectedFrame)
  const selectedMatSize = useEditorStore((s) => s.selectedMatSize)
  const selectedMatColor = useEditorStore((s) => s.selectedMatColor)
  const selectedMdf = useEditorStore((s) => s.selectedMdf)

  const list = [
    { label: 'Frame',    value: selectedFrame ? (selectedFrame.name || `#${selectedFrame.id}`) : 'None' },
    { label: 'Mat size', value: selectedMatSize ? selectedMatSize.name : 'None' },
    { label: 'Mat price', value: selectedMatSize && selectedMatSize.price > 0 ? formatOMR(selectedMatSize.price) : '—' },
    { label: 'Mat color', value: selectedMatColor ? selectedMatColor.name : 'None' },
    { label: 'MDF', value: selectedMdf ? selectedMdf.name : 'None' },
  ]

  return (
    <div className="space-y-3">
      <SectionCard title="Composition">
        <div className="space-y-2">
          {list.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-[11px]" style={{ color: 'var(--ed-fg-muted)' }}>
                {item.label}
              </span>
              <ValueText>{item.value}</ValueText>
            </div>
          ))}
        </div>
        <Separator className="my-3" />
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--ed-fg-subtle)' }}>
          Switch tools on the left rail to change Frame · Mat · Effects.
        </p>
      </SectionCard>
    </div>
  )
}

function ShadowPanel() {
  const shadowEnabled = useEditorStore((s) => s.shadowEnabled)
  const shadowBlur = useEditorStore((s) => s.shadowBlur)
  const shadowOpacity = useEditorStore((s) => s.shadowOpacity)
  const setShadowEnabled = useEditorStore((s) => s.setShadowEnabled)
  const setShadowBlur = useEditorStore((s) => s.setShadowBlur)
  const setShadowOpacity = useEditorStore((s) => s.setShadowOpacity)

  return (
    <div className="space-y-3">
      <SectionCard title="Drop shadow">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-medium" style={{ color: 'var(--ed-fg)' }}>
            Enable
          </span>
          <Switch checked={shadowEnabled} onCheckedChange={setShadowEnabled} />
        </div>
        <div className={cn('space-y-3', !shadowEnabled && 'pointer-events-none opacity-50')}>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <FieldLabel>Blur</FieldLabel>
              <ValueText>{shadowBlur}px</ValueText>
            </div>
            <Slider
              value={[shadowBlur]}
              min={0}
              max={80}
              step={1}
              onValueChange={(v) => setShadowBlur(v[0] ?? 0)}
              disabled={!shadowEnabled}
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <FieldLabel>Opacity</FieldLabel>
              <ValueText>{Math.round(shadowOpacity * 100)}%</ValueText>
            </div>
            <Slider
              value={[Math.round(shadowOpacity * 100)]}
              min={0}
              max={100}
              step={1}
              onValueChange={(v) => setShadowOpacity((v[0] ?? 0) / 100)}
              disabled={!shadowEnabled}
            />
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

// ── Checkout footer ─────────────────────────────────────────────────────────
// Pinned to the bottom of the inspector (top-border separator). Computes the
// frame price from the chosen size — Frame Price = pricePerCm × (w + h) × 2 —
// and shows Checkout when the size fits the frame's [sizeFrom, sizeTo] range
// (both width AND length within range), otherwise Request Inquiry.
function CheckoutFooter() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const addItem = useCartStore((s) => s.addItem)
  const updateItem = useCartStore((s) => s.updateItem)
  const selectedFrame = useEditorStore((s) => s.selectedFrame)
  const selectedMatSize = useEditorStore((s) => s.selectedMatSize)
  const selectedMatColor = useEditorStore((s) => s.selectedMatColor)
  const selectedMdf = useEditorStore((s) => s.selectedMdf)
  const frameAspectRatio = useEditorStore((s) => s.frameAspectRatio)
  const customWidthCm = useEditorStore((s) => s.customWidthCm)
  const customHeightCm = useEditorStore((s) => s.customHeightCm)

  if (!selectedFrame) return null

  const [w, h] =
    frameAspectRatio === 'landscape'
      ? [A4_LONG_CM, A4_SHORT_CM]
      : frameAspectRatio === 'portrait'
        ? [A4_SHORT_CM, A4_LONG_CM]
        : frameAspectRatio === 'square'
          ? [A4_SHORT_CM, A4_SHORT_CM]
          : [customWidthCm, customHeightCm]

  const framePrice = selectedFrame.pricePerCm * (w + h) * 2
  // Mat size adds a flat price (admin-managed); colour is free.
  const matPrice = selectedMatSize?.price ?? 0
  // MDF backing — price scales with the frame face: rate × width × length (cm).
  const mdfPrice = selectedMdf ? selectedMdf.pricePerCm * w * h : 0
  const price = framePrice + matPrice + mdfPrice
  const { sizeFrom, sizeTo } = selectedFrame
  const inRange =
    sizeTo > 0 &&
    w >= sizeFrom &&
    w <= sizeTo &&
    h >= sizeFrom &&
    h <= sizeTo

  return (
    <div
      className="border-t px-3 py-3"
      style={{ borderColor: 'var(--ed-border)' }}
    >
      {inRange ? (
        <button
          type="button"
          onClick={() => {
            const parts = [
              selectedMatSize ? `Mat: ${selectedMatSize.name}` : null,
              selectedMatColor ? selectedMatColor.name : null,
              selectedMdf ? `MDF: ${selectedMdf.name}` : null,
            ].filter(Boolean)
            const subtitle = parts.length ? parts.join(' · ') : 'Picture Frame'
            const content = {
              frameId: selectedFrame.id,
              name: selectedFrame.name || 'Custom Frame',
              subtitle,
              thumbnail: selectedFrame.imgUrl,
              widthCm: w,
              heightCm: h,
              pricePerItem: price,
              matSizeId: selectedMatSize?.id ?? null,
              matSizeName: selectedMatSize?.name ?? null,
              matPrice,
              matColorId: selectedMatColor?.id ?? null,
              matColorName: selectedMatColor?.name ?? null,
              mdfId: selectedMdf?.id ?? null,
              mdfName: selectedMdf?.name ?? null,
              mdfPrice,
            }
            // Coming from a cart "Edit" → update that line; otherwise add
            // (which increments the qty if the same item is already in cart).
            if (editId) updateItem(editId, content)
            else addItem(content)
            navigate('/cart')
          }}
          className="flex w-full items-center justify-between gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ed-ring)]"
          style={{ background: 'var(--ed-accent)', color: 'var(--ed-accent-fg)' }}
        >
          <span>Checkout</span>
          <span className="tabular-nums">{formatOMR(price)}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => navigate('/checkout?inquiry=1')}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ed-ring)]"
          style={{
            border: '1.5px solid var(--ed-accent)',
            color: 'var(--ed-accent)',
            background: 'transparent',
          }}
        >
          Request Inquiry
        </button>
      )}
    </div>
  )
}

// ── Right Inspector ───────────────────────────────────────────────────────

export default function RightInspector() {
  const activeControlTab = useEditorStore((s) => s.activeControlTab)
  const setActiveControlTab = useEditorStore((s) => s.setActiveControlTab)
  const inspectorCollapsed = useEditorStore((s) => s.inspectorCollapsed)
  const setInspectorCollapsed = useEditorStore((s) => s.setInspectorCollapsed)

  // Map old tab keys (Style/Ratio/Shadow) to keep behavior unchanged
  const tab = ['Style', 'Ratio', 'Shadow'].includes(activeControlTab)
    ? activeControlTab
    : 'Ratio'

  if (inspectorCollapsed) {
    return (
      <div
        className="flex w-7 flex-shrink-0 flex-col items-center justify-start border-l py-3"
        style={{
          background: 'var(--ed-panel)',
          borderColor: 'var(--ed-border)',
        }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setInspectorCollapsed(false)}
              aria-label="Expand inspector"
              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
              style={{
                color: 'var(--ed-fg-muted)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ed-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <ChevronLeft size={14} strokeWidth={1.8} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Expand inspector</TooltipContent>
        </Tooltip>
      </div>
    )
  }

  return (
    <aside
      className="flex h-full w-[300px] flex-shrink-0 flex-col border-l"
      style={{
        background: 'var(--ed-panel)',
        borderColor: 'var(--ed-border)',
      }}
    >
      <div
        className="flex items-center justify-between border-b px-3 py-2.5"
        style={{ borderColor: 'var(--ed-border)' }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: 'var(--ed-fg-subtle)' }}
        >
          Inspector
        </p>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setInspectorCollapsed(true)}
              aria-label="Collapse inspector"
              className="flex h-6 w-6 items-center justify-center rounded-md transition-colors"
              style={{ color: 'var(--ed-fg-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ed-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <ChevronRight size={13} strokeWidth={1.8} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Collapse</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 pt-3">
        <Tabs value={tab} onValueChange={setActiveControlTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="Ratio">Size</TabsTrigger>
            <TabsTrigger value="Style">Style</TabsTrigger>
            <TabsTrigger value="Shadow">Shadow</TabsTrigger>
          </TabsList>
          <TabsContent value="Ratio">
            <RatioPanel />
          </TabsContent>
          <TabsContent value="Style">
            <StylePanel />
          </TabsContent>
          <TabsContent value="Shadow">
            <ShadowPanel />
          </TabsContent>
        </Tabs>
      </div>

      <CheckoutFooter />
    </aside>
  )
}

import { ChevronLeft, ChevronRight, Lock, RectangleHorizontal, RectangleVertical, Sliders, Square as SquareIcon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  useEditorStore,
  FRAME_ASPECT_RATIOS,
  type FrameAspectRatio,
} from '@/store/editorStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

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

// ── Ratio picker ──────────────────────────────────────────────────────────

function RatioCard({
  id, label, icon: Icon, selected, onChange,
}: {
  id: FrameAspectRatio
  label: string
  icon: LucideIcon
  selected: boolean
  onChange: (id: FrameAspectRatio) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(id)}
      aria-pressed={selected}
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 rounded-lg py-3 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ed-ring)]',
      )}
      style={{
        background: selected ? 'var(--ed-accent-soft)' : 'var(--ed-panel)',
        outline: selected
          ? '1.5px solid var(--ed-accent)'
          : '1px solid var(--ed-border-strong)',
        outlineOffset: '-1px',
        color: selected ? 'var(--ed-accent)' : 'var(--ed-fg-muted)',
      }}
    >
      <Icon size={18} strokeWidth={1.6} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
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

function RatioPanel() {
  const frameAspectRatio = useEditorStore((s) => s.frameAspectRatio)
  const setFrameAspectRatio = useEditorStore((s) => s.setFrameAspectRatio)

  return (
    <div className="space-y-3">
      <SectionCard title="Frame ratio">
        <div className="grid grid-cols-2 gap-2">
          <RatioCard
            id="landscape"
            label="Landscape"
            icon={RectangleHorizontal}
            selected={frameAspectRatio === 'landscape'}
            onChange={setFrameAspectRatio}
          />
          <RatioCard
            id="portrait"
            label="Portrait"
            icon={RectangleVertical}
            selected={frameAspectRatio === 'portrait'}
            onChange={setFrameAspectRatio}
          />
          <RatioCard
            id="square"
            label="Square 1:1"
            icon={SquareIcon}
            selected={frameAspectRatio === 'square'}
            onChange={setFrameAspectRatio}
          />
          <RatioCard
            id="custom"
            label="Custom"
            icon={Sliders}
            selected={frameAspectRatio === 'custom'}
            onChange={setFrameAspectRatio}
          />
        </div>
        {frameAspectRatio === 'custom' && <CustomSizeInputs />}
      </SectionCard>
    </div>
  )
}

function StylePanel() {
  const selectedFrame = useEditorStore((s) => s.selectedFrame)
  const selectedMatSize = useEditorStore((s) => s.selectedMatSize)
  const selectedMatColor = useEditorStore((s) => s.selectedMatColor)
  const selectedMatTexture = useEditorStore((s) => s.selectedMatTexture)

  const list = [
    { label: 'Frame',    value: selectedFrame ? `#${selectedFrame.id}` : 'None' },
    { label: 'Mat size', value: selectedMatSize ? '1 cm step' : 'None' },
    { label: 'Mat color', value: selectedMatColor ? `#${selectedMatColor.color ?? ''}` : 'None' },
    { label: 'Mat texture', value: selectedMatTexture ? 'Custom' : 'None' },
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
            <TabsTrigger value="Ratio">Ratio</TabsTrigger>
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
    </aside>
  )
}

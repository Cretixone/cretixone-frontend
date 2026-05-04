import { useEditorStore } from '@/store/editorStore'
import { clsx } from 'clsx'

const TABS = ['Style', 'Width', 'Shadow']

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200',
        checked ? 'bg-accent' : 'bg-white/20'
      )}
    >
      <span className={clsx(
        'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200',
        checked ? 'translate-x-4' : 'translate-x-1'
      )} />
    </button>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number) => void
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">{label}</span>
        <span className="text-xs text-accent font-mono tabular-nums">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        className="custom-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
    </div>
  )
}

export default function ControlsPanel() {
  const {
    activeControlTab, setActiveControlTab,
    frameWidth, setFrameWidth,
    shadowEnabled, setShadowEnabled,
    shadowBlur, setShadowBlur,
    shadowOpacity, setShadowOpacity,
  } = useEditorStore()

  return (
    <div className="border-t border-white/10 flex-shrink-0">
      {/* Tab pills */}
      <div className="flex gap-1 px-3 pt-3 pb-2">
        {TABS.map(tab => (
          <button
            key={tab}
            className={clsx('tab-btn text-[11px]', activeControlTab === tab && 'active')}
            onClick={() => setActiveControlTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="px-3 pb-4">

        {/* ── Style tab ── */}
        {activeControlTab === 'Style' && (
          <div className="space-y-3">
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Use <span className="text-accent">Mat</span> tab for size, color, texture &amp; border.
            </p>
            <div className="rounded-lg bg-white/5 p-3 text-[10px] text-gray-400 space-y-1 border border-white/10">
              <p><strong className="text-white">Frame</strong> — 9-piece frame (5-30)</p>
              <p><strong className="text-white">Mat Size</strong> — from Size tab (cm)</p>
              <p><strong className="text-white">Mat Look</strong> — Color or Texture tab</p>
            </div>
          </div>
        )}

        {/* ── Width tab ── */}
        {activeControlTab === 'Width' && (
          <div className="pt-1">
            <Slider
              label="Frame Width"
              value={frameWidth}
              min={5}
              max={30}
              unit=""
              onChange={setFrameWidth}
            />
          </div>
        )}

        {/* ── Shadow tab ── */}
        {activeControlTab === 'Shadow' && (
          <div className="pt-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                Drop Shadow
              </span>
              <Toggle checked={shadowEnabled} onChange={setShadowEnabled} />
            </div>
            {shadowEnabled && (
              <>
                <Slider
                  label="Blur"
                  value={shadowBlur}
                  min={0}
                  max={80}
                  unit="px"
                  onChange={setShadowBlur}
                />
                <Slider
                  label="Opacity"
                  value={Math.round(shadowOpacity * 100)}
                  min={0}
                  max={100}
                  unit="%"
                  onChange={v => setShadowOpacity(v / 100)}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

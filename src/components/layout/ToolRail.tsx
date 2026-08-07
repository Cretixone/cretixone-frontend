import { LayoutGrid, Home, Mountain, Square, Layers3, FileImage, Shield, SquareStack, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEditorStore } from '@/store/editorStore'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// MDF/Paper Type/Lamination/Glass Type are frame-scoped — each tool only
// shows once a frame is selected AND that frame's admin-curated allow-list
// for it is non-empty (e.g. Lamination/Glass Type stay hidden for a
// stretcher Frame Type, matching the storefront and admin editor).
const TOOLS = [
  { id: 'frames',      labelKey: 'rail.frames',      icon: LayoutGrid },
  { id: 'interiors',   labelKey: 'rail.interiors',   icon: Home },
  { id: 'scenery',     labelKey: 'rail.scenery',     icon: Mountain },
  { id: 'mat',         labelKey: 'rail.mat',         icon: Square },
  { id: 'mdf',         labelKey: 'rail.mdf',         icon: Layers3, frameOption: 'mdfBoards' },
  { id: 'paperType',   labelKey: 'rail.paperType',   icon: FileImage, frameOption: 'paperTypes' },
  { id: 'lamination',  labelKey: 'rail.lamination',  icon: Shield, frameOption: 'laminations' },
  { id: 'glassType',   labelKey: 'rail.glassType',   icon: SquareStack, frameOption: 'glassTypes' },
  { id: 'effect',      labelKey: 'rail.effects',     icon: Sparkles },
] as const

export default function ToolRail() {
  const { t } = useTranslation('editor')
  const activeSidebarTab = useEditorStore((s) => s.activeSidebarTab)
  const setActiveSidebarTab = useEditorStore((s) => s.setActiveSidebarTab)
  const setToolPanelCollapsed = useEditorStore((s) => s.setToolPanelCollapsed)
  const selectedFrame = useEditorStore((s) => s.selectedFrame)

  const tools = TOOLS.filter(
    (tool) => !('frameOption' in tool) || (selectedFrame?.[tool.frameOption]?.length ?? 0) > 0,
  )

  return (
    <nav
      className="flex h-full w-14 flex-shrink-0 flex-col items-center gap-1 border-r py-2"
      style={{
        background: 'var(--ed-panel)',
        borderColor: 'var(--ed-border)',
      }}
      aria-label={t('rail.ariaLabel')}
    >
      {tools.map(({ id, labelKey, icon: Icon }) => {
        const label = t(labelKey)
        const active = activeSidebarTab === id
        return (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => { setActiveSidebarTab(id); setToolPanelCollapsed(false) }}
                aria-label={label}
                aria-pressed={active}
                className={cn(
                  'relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ed-ring)]',
                )}
                style={{
                  background: active ? 'var(--ed-accent-soft)' : 'transparent',
                  color: active ? 'var(--ed-accent)' : 'var(--ed-fg-muted)',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'var(--ed-hover)'
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent'
                }}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full"
                    style={{ background: 'var(--ed-accent)' }}
                  />
                )}
                <Icon size={18} strokeWidth={1.8} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        )
      })}
    </nav>
  )
}

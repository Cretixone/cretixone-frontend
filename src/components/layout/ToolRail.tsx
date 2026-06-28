import { LayoutGrid, Home, Mountain, Square, Layers3, Sparkles } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const TOOLS = [
  { id: 'frames',    label: 'Frames',    icon: LayoutGrid },
  { id: 'interiors', label: 'Interiors', icon: Home },
  { id: 'scenery',   label: 'Scenery',   icon: Mountain },
  { id: 'mat',       label: 'Mat',       icon: Square },
  { id: 'mdf',       label: 'MDF',       icon: Layers3 },
  { id: 'effect',    label: 'Effects',   icon: Sparkles },
] as const

export default function ToolRail() {
  const activeSidebarTab = useEditorStore((s) => s.activeSidebarTab)
  const setActiveSidebarTab = useEditorStore((s) => s.setActiveSidebarTab)
  const setToolPanelCollapsed = useEditorStore((s) => s.setToolPanelCollapsed)

  return (
    <nav
      className="flex h-full w-14 flex-shrink-0 flex-col items-center gap-1 border-r py-2"
      style={{
        background: 'var(--ed-panel)',
        borderColor: 'var(--ed-border)',
      }}
      aria-label="Editor tools"
    >
      {TOOLS.map(({ id, label, icon: Icon }) => {
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

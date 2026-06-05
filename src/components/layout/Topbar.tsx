import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, Download, ImagePlus, Moon, Redo2, Sun, Undo2 } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { useImageUpload } from '@/hooks/useImageUpload'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick?: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
            'text-[var(--ed-fg-muted)] hover:bg-[var(--ed-hover)] hover:text-[var(--ed-fg)]',
            'disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed',
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export default function Topbar() {
  const navigate = useNavigate()
  const artworkImageUrl = useEditorStore((s) => s.artworkImageUrl)
  const editorTheme = useEditorStore((s) => s.editorTheme)
  const toggleEditorTheme = useEditorStore((s) => s.toggleEditorTheme)
  const { openFilePicker } = useImageUpload()

  const triggerSave = () => {
    ;(window as any).__frameSave?.()
  }

  return (
    <header
      className="flex h-12 flex-shrink-0 items-center justify-between border-b px-3"
      style={{
        background: 'var(--ed-panel)',
        borderColor: 'var(--ed-border)',
      }}
    >
      {/* Left cluster: back · logo · doc title */}
      <div className="flex items-center gap-2">
        <IconButton label="Back to home" onClick={() => navigate('/')}>
          <ArrowLeft size={16} strokeWidth={1.8} />
        </IconButton>

        <div className="mx-1 flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{ background: 'var(--ed-accent)' }}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.4">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <rect x="7" y="7" width="10" height="10" rx="1" />
            </svg>
          </div>
          <span className="hidden text-sm font-semibold tracking-tight sm:inline" style={{ color: 'var(--ed-fg)' }}>
            FrameIt
          </span>
        </div>

        <div className="ml-2 hidden h-4 w-px md:block" style={{ background: 'var(--ed-border)' }} />

        <span
          className="ml-2 hidden text-xs font-medium md:inline"
          style={{ color: 'var(--ed-fg-muted)' }}
        >
          Untitled design
        </span>
      </div>

      {/* Center cluster: history controls */}
      <div className="flex items-center gap-1">
        <IconButton label="Undo" disabled>
          <Undo2 size={15} strokeWidth={1.8} />
        </IconButton>
        <IconButton label="Redo" disabled>
          <Redo2 size={15} strokeWidth={1.8} />
        </IconButton>
      </div>

      {/* Right cluster: theme · change image · export */}
      <div className="flex items-center gap-1.5">
        <IconButton
          label={editorTheme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
          onClick={toggleEditorTheme}
        >
          {editorTheme === 'light' ? <Moon size={15} strokeWidth={1.8} /> : <Sun size={15} strokeWidth={1.8} />}
        </IconButton>

        {artworkImageUrl && (
          <button
            onClick={openFilePicker}
            className="ml-1 flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
            style={{
              color: 'var(--ed-fg-muted)',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--ed-hover)'
              e.currentTarget.style.color = 'var(--ed-fg)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--ed-fg-muted)'
            }}
          >
            <ImagePlus size={14} strokeWidth={1.8} />
            Change image
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="ml-1 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all"
              style={{
                background: 'var(--ed-accent)',
                color: 'var(--ed-accent-fg)',
                boxShadow: 'var(--ed-shadow)',
              }}
            >
              <Download size={13} strokeWidth={2} />
              Save
              <ChevronDown size={11} className="opacity-70" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Export as</DropdownMenuLabel>
            <DropdownMenuItem onSelect={triggerSave}>
              PNG (transparent)
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={triggerSave}>
              JPG (high quality)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={triggerSave}>
              Quick save
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, Download, ImagePlus, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEditorStore } from '@/store/editorStore'
import { useImageUpload } from '@/hooks/useImageUpload'
import { useIsRtl } from '@/store/langStore'
import { pickLocalized } from '@/lib/localized'
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
  const { t } = useTranslation('editor')
  const navigate = useNavigate()
  const isRtl = useIsRtl()
  const selectedFrame = useEditorStore((s) => s.selectedFrame)
  const frameName = selectedFrame
    ? pickLocalized(selectedFrame.name, selectedFrame.nameAr, isRtl)
    : ''
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
        <IconButton label={t('topbar.backToHome')} onClick={() => navigate('/')}>
          <ArrowLeft size={16} strokeWidth={1.8} className="rtl:-scale-x-100" />
        </IconButton>

        <Link to="/" aria-label={t('topbar.brandHome')} className="mx-1 flex items-center">
          <img src="/images/svg/logo.svg" alt="Cretixone" className="h-6 w-auto" />
        </Link>

        {frameName && (
          <>
            <div className="ml-2 hidden h-4 w-px md:block" style={{ background: 'var(--ed-border)' }} />
            <span
              className="ml-2 hidden max-w-[240px] truncate text-xs font-medium md:inline"
              style={{ color: 'var(--ed-fg)' }}
              title={frameName}
            >
              {frameName}
            </span>
          </>
        )}
      </div>

      {/* Right cluster: theme · change image · export */}
      <div className="flex items-center gap-1.5">
        <IconButton
          label={editorTheme === 'light' ? t('topbar.switchToDark') : t('topbar.switchToLight')}
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
            {t('topbar.changeImage')}
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
              {t('topbar.save')}
              <ChevronDown size={11} className="opacity-70" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>{t('topbar.exportAs')}</DropdownMenuLabel>
            <DropdownMenuItem onSelect={triggerSave}>
              {t('topbar.pngTransparent')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={triggerSave}>
              {t('topbar.jpgHighQuality')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={triggerSave}>
              {t('topbar.quickSave')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

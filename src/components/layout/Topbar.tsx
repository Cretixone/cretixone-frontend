import { ArrowLeft, ChevronDown, Crown, Download } from 'lucide-react'
import { clsx } from 'clsx'
import { useEditorStore } from '@/store/editorStore'
import { useImageUpload } from '@/hooks/useImageUpload'

export default function Topbar() {
  const artworkImageUrl = useEditorStore((s) => s.artworkImageUrl)
  const { openFilePicker } = useImageUpload()

  const handleSave = () => {
    ;(window as any).__frameSave?.()
  }

  return (
    <header className="h-14 flex items-center justify-between px-4 bg-[#0f0f1a]/95 backdrop-blur-sm border-b border-white/5 flex-shrink-0 z-10">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200">
          <ArrowLeft size={18} />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/80 to-emerald-600 flex items-center justify-center shadow-lg shadow-accent/20">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <rect x="7" y="7" width="10" height="10" rx="1" />
            </svg>
          </div>
          <span className="font-display font-semibold text-white text-lg tracking-tight hidden sm:block">
            FrameIt
          </span>
        </div>
      </div>

      {/* Center: PRO banner */}
      <div className="flex items-center gap-2 bg-gradient-to-r from-pro/20 to-purple-900/30 border border-pro/30 rounded-full px-4 py-1.5">
        <Crown size={13} className="text-pro" />
        <span className="text-xs text-gray-300">
          Join{' '}
          <span className="text-pro font-semibold">PRO+</span>
          {' '}to access all features
        </span>
        <button className="ml-2 bg-gradient-to-r from-pro to-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full hover:opacity-90 transition-opacity shadow-lg shadow-pro/30">
          Join PRO+
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {artworkImageUrl && (
          <button
            onClick={openFilePicker}
            className="text-xs text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-all duration-200"
          >
            Change Image
          </button>
        )}

        <button
          onClick={handleSave}
          className={clsx(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
            'bg-accent text-[#0f0f1a] hover:bg-accent/90 shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:scale-105 active:scale-95'
          )}
        >
          <Download size={14} />
          Save
          <ChevronDown size={12} className="opacity-60" />
        </button>
      </div>
    </header>
  )
}

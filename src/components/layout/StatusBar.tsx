import { Image as ImageIcon, Layers, Maximize2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEditorStore } from '@/store/editorStore'

export default function StatusBar() {
  const { t } = useTranslation('editor')
  const selectedFrame = useEditorStore((s) => s.selectedFrame)
  const frameAspectRatio = useEditorStore((s) => s.frameAspectRatio)
  const customWidthCm = useEditorStore((s) => s.customWidthCm)
  const customHeightCm = useEditorStore((s) => s.customHeightCm)
  const designZoom = useEditorStore((s) => s.designZoom)
  const artworkScale = useEditorStore((s) => s.artworkScale)

  const ratioLabel = frameAspectRatio === 'custom'
    ? t('status.sizeCm', { w: customWidthCm, h: customHeightCm })
    : t(`status.ratio.${frameAspectRatio}`)

  const canvasZoomPct = Math.round(designZoom * 100)
  const pictureZoomPct = Math.round(artworkScale * 100)

  return (
    <footer
      className="flex h-7 flex-shrink-0 items-center justify-between border-t px-4 text-[11px]"
      style={{
        background: 'var(--ed-panel)',
        borderColor: 'var(--ed-border)',
        color: 'var(--ed-fg-muted)',
      }}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Layers size={12} strokeWidth={1.8} />
          <span>{selectedFrame ? t('status.frameNum', { id: selectedFrame.id }) : t('status.noFrame')}</span>
        </div>
        <div className="hidden h-3 w-px sm:block" style={{ background: 'var(--ed-border-strong)' }} />
        <div className="flex items-center gap-1.5">
          <Maximize2 size={12} strokeWidth={1.8} />
          <span>{ratioLabel}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-1.5 md:flex">
          <ImageIcon size={12} strokeWidth={1.8} />
          <span>{t('status.picture', { pct: pictureZoomPct })}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ color: 'var(--ed-fg)' }}>{t('status.canvas', { pct: canvasZoomPct })}</span>
        </div>
        <span className="hidden lg:inline" style={{ color: 'var(--ed-fg-subtle)' }}>
          {t('status.hint')}
        </span>
      </div>
    </footer>
  )
}

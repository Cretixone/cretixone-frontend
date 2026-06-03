import { Image as ImageIcon, Layers, Maximize2 } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'

export default function StatusBar() {
  const selectedFrame = useEditorStore((s) => s.selectedFrame)
  const frameAspectRatio = useEditorStore((s) => s.frameAspectRatio)
  const customWidthCm = useEditorStore((s) => s.customWidthCm)
  const customHeightCm = useEditorStore((s) => s.customHeightCm)
  const designZoom = useEditorStore((s) => s.designZoom)
  const artworkScale = useEditorStore((s) => s.artworkScale)

  const ratioLabel = frameAspectRatio === 'custom'
    ? `${customWidthCm} × ${customHeightCm} cm`
    : frameAspectRatio.charAt(0).toUpperCase() + frameAspectRatio.slice(1)

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
          <span>{selectedFrame ? `Frame #${selectedFrame.id}` : 'No frame'}</span>
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
          <span>Picture {pictureZoomPct}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ color: 'var(--ed-fg)' }}>Canvas {canvasZoomPct}%</span>
        </div>
        <span className="hidden lg:inline" style={{ color: 'var(--ed-fg-subtle)' }}>
          Scroll on picture to zoom · scroll outside to zoom canvas · double-click picture to replace
        </span>
      </div>
    </footer>
  )
}

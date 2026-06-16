import { useCallback } from 'react'
import { useEditorStore } from '@/store/editorStore'

export function useImageUpload() {
  const setArtworkImageUrl = useEditorStore((s) => s.setArtworkImageUrl)
  const setFrameAspectRatio = useEditorStore((s) => s.setFrameAspectRatio)

  const handleFile = useCallback(
    (file: File) => {
      if (!file || !file.type.startsWith('image/')) return
      const url = URL.createObjectURL(file)
      setArtworkImageUrl(url)
      // Auto-pick the frame ratio from the uploaded image's natural aspect so
      // the frame adjusts to the image: near-square → Square, wider-than-tall
      // → Landscape, otherwise Portrait. The user can still override via the
      // Ratio tab afterwards. We don't overwrite an active Custom selection
      // (the user picked specific cm dimensions and probably wants those
      // preserved). The artwork rendering itself is unchanged.
      const probe = new Image()
      probe.onload = () => {
        if (!probe.naturalWidth || !probe.naturalHeight) return
        const current = useEditorStore.getState().frameAspectRatio
        if (current === 'custom') return
        const ratio = probe.naturalWidth / probe.naturalHeight
        const next =
          Math.abs(ratio - 1) <= 0.08
            ? 'square'
            : ratio > 1
              ? 'landscape'
              : 'portrait'
        if (current !== next) setFrameAspectRatio(next)
      }
      probe.src = url
    },
    [setArtworkImageUrl, setFrameAspectRatio]
  )

  const openFilePicker = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) handleFile(file)
    }
    input.click()
  }, [handleFile])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  return { openFilePicker, handleDrop, handleDragOver, handleFile }
}

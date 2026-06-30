import { useCallback } from 'react'
import { useEditorStore } from '@/store/editorStore'

export function useImageUpload() {
  const setArtworkImageUrl = useEditorStore((s) => s.setArtworkImageUrl)

  const handleFile = useCallback(
    (file: File) => {
      if (!file || !file.type.startsWith('image/')) return
      const url = URL.createObjectURL(file)
      // Setting the artwork URL drives the inspector's Size-preset auto-select,
      // which picks the frame size matching the image's orientation (landscape /
      // portrait / square). See SizePresetCard in RightInspector.
      setArtworkImageUrl(url)
    },
    [setArtworkImageUrl]
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

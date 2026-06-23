import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useImageUpload } from './useImageUpload'

// "Upload Photo" action shared by the nav bars: pick a file → load it into the
// editor (reusing useImageUpload so the frame/ratio auto-selection logic is
// unchanged) → open the editor. The artwork lives only in the in-memory editor
// store (an object URL), so a refresh clears it — nothing hits localStorage.
export function useUploadPhoto() {
  const { handleFile } = useImageUpload()
  const navigate = useNavigate()
  return useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      handleFile(file)
      navigate('/editor')
    }
    input.click()
  }, [handleFile, navigate])
}

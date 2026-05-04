import { useEffect, useRef, useCallback } from 'react'
import { useEditorStore } from '@/store/editorStore'

export function useCanvasSize() {
  const containerRef = useRef<HTMLDivElement>(null)
  const setCanvasSize = useEditorStore((s) => s.setCanvasSize)

  const update = useCallback(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current
      setCanvasSize(clientWidth, clientHeight)
    }
  }, [setCanvasSize])

  useEffect(() => {
    update()
    const ro = new ResizeObserver(update)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [update])

  return containerRef
}

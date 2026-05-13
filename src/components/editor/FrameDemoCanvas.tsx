import CanvasStage from './CanvasStage'
import { LOCAL_FRAME_1 } from '@/data/localFrames'

// /editor?demo=1 — pins the local 8-piece frame regardless of any
// frame the user may pick in the sidebar. CanvasStage auto-loads the
// piece images and resolves the corner-inset ratio from the registry.
export default function FrameDemoCanvas() {
  return <CanvasStage frameOverride={LOCAL_FRAME_1} />
}

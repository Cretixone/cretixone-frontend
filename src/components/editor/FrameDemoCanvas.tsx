import CanvasStage from './CanvasStage'

// `/editor?demo=1` used to pin a bundled local frame for testing. Now
// that all frames come from the backend it just renders the normal
// CanvasStage — the user picks a frame from the sidebar.
export default function FrameDemoCanvas() {
  return <CanvasStage />
}

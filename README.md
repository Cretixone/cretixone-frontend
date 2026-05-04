# FrameIt — Professional Frame Designer

A full-featured frame designer app replicating [frameitapp.net](https://frameitapp.net/), built with React, Vite, PixiJS v8, Tailwind CSS, and Zustand.

## Tech Stack

| Layer | Technology |
|---|---|
| Build | Vite 5 + React 18 |
| Canvas | PixiJS v8 (direct API) |
| State | Zustand 5 |
| Styling | Tailwind CSS 3 + custom CSS |
| Icons | Lucide React |
| Fonts | DM Sans + Playfair Display |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Features

### Canvas (PixiJS v8)
- **Image upload** — click the canvas or drag & drop any image
- **Scroll to zoom** — mouse wheel zooms artwork (0.1× – 5×)
- **Drag to reposition** — drag artwork within the mat opening
- **Artwork masking** — `PIXI.Graphics` mask clips image to mat aperture
- **Red woven mat** — procedural red texture rendered via `PIXI.TilingSprite`
- **Interior scene** — painted background with wall + floor perspective
- **Frame rendering** — 4-face mitre illusion with lighter/darker faces
- **Shadow system** — multi-layer shadow approximation (bloom-style)
- **Save/export** — `canvas.toDataURL()` downloads PNG

### UI (Tailwind + Lucide)
- **Left sidebar** — icon tabs: Crop, Frames, Interiors, Scenery, Mat, Effect
- **Frame browser** — category tabs (Scandinavian, Metal, Acrylic) with PRO badges
- **Interior picker** — scene thumbnails with wall/floor preview
- **Controls panel** — Style / Width / Shadow tabs
  - Mat color swatches (solid + red texture)
  - Sliders: frame width, mat width, shadow blur, shadow opacity
  - Toggle: mat enabled, shadow enabled
- **Top bar** — back button, PRO banner, Save button

### State (Zustand)
```ts
selectedFrameId, frameWidth,
selectedMatId, matWidth, matEnabled,
shadowEnabled, shadowBlur, shadowOpacity,
artworkImageUrl, artworkScale, artworkX, artworkY,
selectedInteriorId,
activeSidebarTab, activeFrameCategory, activeControlTab
```

## Project Structure

```
src/
├── App.tsx                       # Root layout
├── main.tsx                      # Entry point
├── index.css                     # Tailwind + custom styles
├── store/
│   └── editorStore.ts            # Zustand global state
├── hooks/
│   ├── useCanvasSize.ts          # ResizeObserver → store
│   └── useImageUpload.ts         # File picker + drag-drop
└── components/
    ├── layout/
    │   ├── Topbar.tsx            # Header bar
    │   └── Sidebar.tsx           # Left panel + tabs
    ├── editor/
    │   ├── CanvasStage.tsx       # PixiJS canvas (main)
    │   └── ControlsPanel.tsx     # Style/Width/Shadow controls
    └── ui/
        └── FrameCard.tsx         # Frame thumbnail card
```

## PixiJS Architecture

```
app.stage
├── bg          (PIXI.Graphics)   — interior scene
├── shadowG     (PIXI.Graphics)   — soft shadow layers
├── frameG      (PIXI.Graphics)   — frame with mitre faces
├── matSolidG   (PIXI.Graphics)   — solid-color mat
├── matTileCont (PIXI.Container)  — TilingSprite red mat strips
├── artworkCont (PIXI.Container)  — masked artwork container
│   ├── artMask (PIXI.Graphics)   — rectangular clip mask
│   └── artSprite (PIXI.Sprite)   — uploaded image
└── uploadOverlay (PIXI.Container) — "click to upload" prompt
```

## Extending

- **Add frames**: push to `FRAME_STYLES` array in `editorStore.ts`
- **Add interiors**: push to `INTERIOR_SCENES` array
- **Add mat colors**: push to `MAT_COLORS` array (`color: 'texture'` uses the woven pattern)
- **Real frame images**: replace the SVG preview in `FrameCard.tsx` and load a `PIXI.Sprite` in `CanvasStage.tsx`

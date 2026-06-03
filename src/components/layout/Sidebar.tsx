import { useCallback, useEffect, useMemo } from 'react'
import {
  getNaturalFrameWidthPct,
  loadLocalFrame,
} from '@/data/localFrames'
import { useEditorStore, OSS_PREFIX } from '@/store/editorStore'
import {
  useFetchFramesQuery,
  useFetchFrameCategoriesQuery,
  useFetchInteriorsQuery,
  useFetchSceneryQuery,
  useFetchPaperQuery,
  useFetchEffectsQuery,
} from '@/store/api/apiSlice'
import type { ApiFrame, ApiScene, ApiPaperItem, ApiEffectItem } from '@/types/api'
import ControlsPanel from '@/components/editor/ControlsPanel'
import { clsx } from 'clsx'
import {
  Crop, LayoutGrid, Home, Mountain, Square, Sparkles,
} from 'lucide-react'

const SIDEBAR_TABS = [
  { id: 'crop',      label: 'Crop',      icon: Crop },
  { id: 'frames',    label: 'Frames',    icon: LayoutGrid },
  { id: 'interiors', label: 'Interiors', icon: Home },
  { id: 'scenery',   label: 'Scenery',   icon: Mountain },
  { id: 'mat',       label: 'Mat',       icon: Square },
  { id: 'effect',    label: 'Effect',    icon: Sparkles },
]

// ── Skeleton loaders ──────────────────────────────────────────────────────────

function SkeletonGrid({ count = 6, cols = 3 }: { count?: number; cols?: number }) {
  return (
    <div className={`grid grid-cols-${cols} gap-2`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton aspect-square rounded-xl" />
      ))}
    </div>
  )
}

function SkeletonRow({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton w-10 h-10 rounded-lg" />
      ))}
    </div>
  )
}

// ── Frame thumbnail card ──────────────────────────────────────────────────────

function FrameThumb({ item, selected, onClick }: {
  item: ApiFrame
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'relative aspect-square rounded-xl overflow-hidden transition-all duration-200 group',
        selected
          ? 'ring-2 ring-accent ring-offset-1 ring-offset-[#141427] scale-105'
          : 'ring-1 ring-white/10 hover:ring-white/30 hover:scale-[1.03]',
        item.isVip && !selected && 'opacity-75'
      )}
    >
      <img
        src={item.imgUrl}
        alt={`Frame ${item.id}`}
        className="h-full object-contain"
        draggable={false}
        loading="lazy"
      />

      {/* Overlay showing frame preview shape */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[55%] h-[55%] bg-white/80 rounded-sm shadow-inner" />
      </div>

      {item.isVip && (
        <div className="absolute top-1 right-1 bg-pro text-white text-[7px] font-bold px-1 py-0.5 rounded-sm leading-none">
          PRO+
        </div>
      )}
      {item.isNew && (
        <div className="absolute top-1 left-1 bg-accent text-black text-[7px] font-bold px-1 py-0.5 rounded-sm leading-none">
          NEW
        </div>
      )}
    </button>
  )
}

// ── Scene thumbnail (interiors & scenery) ─────────────────────────────────────

function SceneThumb({ item, selected, onClick }: {
  item: ApiScene
  selected: boolean
  onClick: () => void
}) {
  const bgUrl = item.ossUrl.startsWith('http') ? item.ossUrl : OSS_PREFIX + item.ossUrl
  return (
    <button
      onClick={onClick}
      className={clsx(
        'relative rounded-xl overflow-hidden aspect-[4/3] transition-all duration-200',
        selected
          ? 'ring-2 ring-accent ring-offset-1 ring-offset-[#141427]'
          : 'ring-1 ring-white/10 hover:ring-white/30'
      )}
    >
      <img
        src={bgUrl}
        alt={`Scene ${item.id}`}
        className="w-full h-full object-cover"
        loading="lazy"
        draggable={false}
      />
      {item.isVip && (
        <div className="pro-badge">PRO+</div>
      )}
    </button>
  )
}

// ── Mat item thumbnail ────────────────────────────────────────────────────────

function MatThumb({ item, selected, onClick }: {
  item: ApiPaperItem
  selected: boolean
  onClick: () => void
}) {
  const hasTexture = !!item.ossUrl
  const imgUrl = hasTexture
    ? (item.ossUrl.startsWith('http') ? item.ossUrl : OSS_PREFIX + item.ossUrl)
    : undefined
  const bgStyle = hasTexture
    ? { backgroundImage: `url(${imgUrl})`, backgroundSize: 'cover' }
    : { backgroundColor: item.color ? `#${item.color}` : '#f0f0f0' }

  return (
    <button
      onClick={onClick}
      className={clsx(
        'relative w-10 h-10 rounded-lg border-2 overflow-hidden transition-all duration-200',
        selected
          ? 'border-accent scale-110 shadow-lg shadow-accent/30'
          : 'border-white/20 hover:border-white/50 hover:scale-105'
      )}
      style={bgStyle}
    >
      <div className="absolute inset-[4px] bg-white rounded-sm opacity-90" />
      {item.isVip && (
        <div className="absolute top-0.5 right-0.5 bg-pro text-white text-[6px] font-bold px-0.5 rounded-sm leading-none">
          VIP
        </div>
      )}
    </button>
  )
}

// ── Effect item thumbnail ─────────────────────────────────────────────────────

function EffectThumb({ item, selected, onClick }: {
  item: ApiEffectItem
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'relative rounded-xl overflow-hidden aspect-square transition-all duration-200',
        selected
          ? 'ring-2 ring-accent ring-offset-1 ring-offset-[#141427] scale-105'
          : 'ring-1 ring-white/10 hover:ring-white/30 hover:scale-[1.03]'
      )}
    >
      <img
        src={item.img}
        alt={item.englishName}
        className="w-full h-full object-cover"
        loading="lazy"
        draggable={false}
      />
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent py-1.5 px-1">
        <p className="text-[8px] text-white/90 text-center font-medium leading-tight truncate">
          {item.englishName}
        </p>
      </div>
      {item.isVip && (
        <div className="absolute top-1 right-1 bg-pro text-white text-[7px] font-bold px-1 py-0.5 rounded-sm leading-none">
          PRO+
        </div>
      )}
    </button>
  )
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────

export default function Sidebar() {
  const {
    activeSidebarTab, setActiveSidebarTab,
    selectedFrame, setSelectedFrame,
    selectedInterior, setSelectedInterior,
    selectedScenery, setSelectedScenery,
    selectedMatSize, setSelectedMatSize,
    selectedMatColor, setSelectedMatColor,
    selectedMatTexture, setSelectedMatTexture,
    selectedMatBorder, setSelectedMatBorder,
    activeMatTab, setActiveMatTab,
    selectedEffect, setSelectedEffect,
    activeEffectTab, setActiveEffectTab,
    activeFrameCategorySlug, setActiveFrameCategorySlug,
    setFrameWidth,
  } = useEditorStore()

  // When a user picks a frame, default the moulding thickness slider to
  // the frame's "natural" ratio (the same proportion you get when you tile
  // the source pieces 1:1 in Photoshop). Each frame has its own ratio
  // because the pieces are exported at different scales — without this,
  // tiny-corner frames look chunky and thick-corner frames look hair-thin.
  // The user can still drag the slider afterwards to override.
  const pickFrame = useCallback((frame: ApiFrame) => {
    setSelectedFrame(frame)

    const applyNatural = () => {
      const pct = getNaturalFrameWidthPct(frame.id)
      if (pct == null) return
      // Slider range is 5–30 in the controls panel; clamp so an extreme
      // source ratio doesn't push the slider off the rail.
      const clamped = Math.max(5, Math.min(30, Math.round(pct)))
      setFrameWidth(clamped)
    }

    if (getNaturalFrameWidthPct(frame.id) != null) {
      applyNatural()
    } else {
      // Geometry hasn't measured yet — apply once the alpha-measurement
      // finishes. Safe to call repeatedly: loadLocalFrame caches.
      void loadLocalFrame(frame.id)?.then(applyNatural)
    }
  }, [setSelectedFrame, setFrameWidth])

  // ── API queries (lazy — only fetch when tab is active) ─────────────────────
  const framesQuery = useFetchFramesQuery(undefined, { skip: activeSidebarTab !== 'frames' })
  const frameCategoriesQuery = useFetchFrameCategoriesQuery(undefined, {
    skip: activeSidebarTab !== 'frames',
  })
  const interiorsQuery = useFetchInteriorsQuery(undefined, { skip: activeSidebarTab !== 'interiors' })
  const sceneryQuery = useFetchSceneryQuery(undefined, { skip: activeSidebarTab !== 'scenery' })
  const paperQuery = useFetchPaperQuery(undefined, { skip: activeSidebarTab !== 'mat' })
  const effectsQuery = useFetchEffectsQuery(undefined, { skip: activeSidebarTab !== 'effect' })

  // ── Frame category tabs ───────────────────────────────────────────────────
  const frameCategories = frameCategoriesQuery.data ?? []

  // Default: as soon as categories load and none is selected, pick the first
  // so the user always lands on an active tab.
  useEffect(() => {
    if (!frameCategories.length) return
    if (activeFrameCategorySlug == null) {
      setActiveFrameCategorySlug(frameCategories[0].slug)
      return
    }
    // If the persisted slug no longer exists (e.g. category deleted), fall
    // back to the first available so the panel doesn't show an empty grid.
    const stillExists = frameCategories.some(c => c.slug === activeFrameCategorySlug)
    if (!stillExists) setActiveFrameCategorySlug(frameCategories[0].slug)
  }, [frameCategories, activeFrameCategorySlug, setActiveFrameCategorySlug])

  const filteredFrames = useMemo(() => {
    const all = framesQuery.data ?? []
    if (!activeFrameCategorySlug) return all
    return all.filter(f => f.categorySlug === activeFrameCategorySlug)
  }, [framesQuery.data, activeFrameCategorySlug])

  // ── Mat sub-tabs from API data ──────────────────────────────────────────────
  const matCategories = paperQuery.data ?? []
  const activeMatCategory = matCategories.find(c => c.englishName === activeMatTab)
  const matItems = activeMatCategory?.imgs ?? []

  // ── Effect sub-tabs from API data ───────────────────────────────────────────
  const effectCategories = effectsQuery.data ?? []
  const activeEffectCategory = effectCategories.find(c => c.englishName === activeEffectTab)
  const effectItems = activeEffectCategory?.list ?? []

  return (
    <div className="flex h-full">
      {/* Icon rail */}
      <div className="w-16 flex flex-col items-center py-4 gap-1 bg-[#0f0f1a] border-r border-white/5 flex-shrink-0">
        {SIDEBAR_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={clsx('sidebar-btn', activeSidebarTab === id && 'active')}
            onClick={() => setActiveSidebarTab(id)}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div className="flex flex-col flex-1 bg-[#141427] border-r border-white/5 overflow-hidden min-w-0">

        {/* ── Frames ── */}
        {activeSidebarTab === 'frames' && (
          <>
            <div className="px-3 pt-3 pb-2 border-b border-white/10 flex-shrink-0">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                Picture Frames
              </p>
              <p className="text-[10px] text-gray-600 mt-0.5">
                Select a frame · adjust width below
              </p>
            </div>

            {/* Category tabs — horizontally scrollable so many categories
                don't push the panel wider than the sidebar. */}
            <div className="flex gap-1 px-3 pt-2 pb-1 flex-shrink-0 overflow-x-auto scrollbar-thin">
              {frameCategoriesQuery.isLoading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="skeleton w-14 h-6 rounded-md flex-shrink-0" />
                ))
              ) : (
                frameCategories.map(cat => (
                  <button
                    key={cat.id}
                    className={clsx(
                      'tab-btn text-[10px] flex-shrink-0',
                      activeFrameCategorySlug === cat.slug && 'active',
                    )}
                    onClick={() => setActiveFrameCategorySlug(cat.slug)}
                  >
                    {cat.name}
                  </button>
                ))
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              {framesQuery.isLoading ? (
                <SkeletonGrid count={9} cols={3} />
              ) : framesQuery.isError ? (
                <p className="text-xs text-red-400 text-center py-4">Failed to load frames</p>
              ) : filteredFrames.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8">
                  No frames in this category yet.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {filteredFrames.map(item => (
                    <FrameThumb
                      key={item.id}
                      item={item}
                      selected={selectedFrame?.id === item.id}
                      onClick={() => pickFrame(item)}
                    />
                  ))}
                </div>
              )}
            </div>
            <ControlsPanel />
          </>
        )}

        {/* ── Interiors ── */}
        {activeSidebarTab === 'interiors' && (
          <>
            <div className="px-3 pt-3 pb-2 border-b border-white/10 flex-shrink-0">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                Interior Scenes
              </p>
              <p className="text-[10px] text-gray-600 mt-0.5">
                Selecting an interior removes scenery
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              {interiorsQuery.isLoading ? (
                <SkeletonGrid count={6} cols={2} />
              ) : interiorsQuery.isError ? (
                <p className="text-xs text-red-400 text-center py-4">Failed to load interiors</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {/* None button */}
                  <button
                    onClick={() => setSelectedInterior(null)}
                    className={clsx(
                      'relative rounded-xl overflow-hidden aspect-[4/3] transition-all duration-200 flex items-center justify-center',
                      !selectedInterior
                        ? 'ring-2 ring-accent ring-offset-1 ring-offset-[#141427]'
                        : 'ring-1 ring-white/10 hover:ring-white/30',
                      'bg-[#1a1a2e]'
                    )}
                  >
                    <span className="text-[10px] text-gray-400 font-medium">None</span>
                  </button>
                  {interiorsQuery.data?.map(scene => (
                    <SceneThumb
                      key={scene.id}
                      item={scene}
                      selected={selectedInterior?.id === scene.id}
                      onClick={() => setSelectedInterior(scene)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Scenery ── */}
        {activeSidebarTab === 'scenery' && (
          <>
            <div className="px-3 pt-3 pb-2 border-b border-white/10 flex-shrink-0">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                Scenery
              </p>
              <p className="text-[10px] text-gray-600 mt-0.5">
                Selecting scenery removes interior
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              {sceneryQuery.isLoading ? (
                <SkeletonGrid count={6} cols={2} />
              ) : sceneryQuery.isError ? (
                <p className="text-xs text-red-400 text-center py-4">Failed to load scenery</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {/* None button */}
                  <button
                    onClick={() => setSelectedScenery(null)}
                    className={clsx(
                      'relative rounded-xl overflow-hidden aspect-[4/3] transition-all duration-200 flex items-center justify-center',
                      !selectedScenery
                        ? 'ring-2 ring-accent ring-offset-1 ring-offset-[#141427]'
                        : 'ring-1 ring-white/10 hover:ring-white/30',
                      'bg-[#1a1a2e]'
                    )}
                  >
                    <span className="text-[10px] text-gray-400 font-medium">None</span>
                  </button>
                  {sceneryQuery.data?.map(scene => (
                    <SceneThumb
                      key={scene.id}
                      item={scene}
                      selected={selectedScenery?.id === scene.id}
                      onClick={() => setSelectedScenery(scene)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Mat ── */}
        {activeSidebarTab === 'mat' && (
          <>
            <div className="px-3 pt-3 pb-2 border-b border-white/10 flex-shrink-0">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Mat</p>
              <p className="text-[10px] text-gray-600 mt-0.5">
                Size sets thickness · Color/Texture sets look
              </p>
            </div>

            {/* Mat sub-tabs */}
            <div className="flex gap-1 px-3 pt-2 pb-1 flex-shrink-0">
              {(paperQuery.data ?? []).map(cat => (
                <button
                  key={cat.id}
                  className={clsx('tab-btn text-[10px]', activeMatTab === cat.englishName && 'active')}
                  onClick={() => setActiveMatTab(cat.englishName)}
                >
                  {cat.englishName}
                </button>
              ))}
              {paperQuery.isLoading && (
                <div className="flex gap-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="skeleton w-14 h-6 rounded-md" />
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              {paperQuery.isLoading ? (
                <SkeletonRow count={8} />
              ) : paperQuery.isError ? (
                <p className="text-xs text-red-400 text-center py-4">Failed to load mat options</p>
              ) : activeMatTab === 'Size' ? (
                /* ── Size tab: controls mat thickness via ratio ── */
                <div className="grid grid-cols-2 gap-2">
                  {/* None = no mat */}
                  <button
                    onClick={() => setSelectedMatSize(null)}
                    className={clsx(
                      'relative rounded-xl overflow-hidden aspect-square transition-all duration-200 flex flex-col items-center justify-center gap-1',
                      !selectedMatSize
                        ? 'ring-2 ring-accent ring-offset-1 ring-offset-[#141427]'
                        : 'ring-1 ring-white/10 hover:ring-white/30',
                      'bg-[#2a2a3e]'
                    )}
                  >
                    <div className="w-8 h-8 rounded bg-gray-600 flex items-center justify-center">
                      <span className="text-gray-400 text-lg">∅</span>
                    </div>
                    <span className="text-[9px] text-gray-400">None</span>
                  </button>
                  {matItems.map((item, idx) => {
                    const cmLabel = `${idx + 1} cm`
                    // Visual preview: larger inner border = thicker mat
                    const inset = 8 + idx * 4
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedMatSize(item)}
                        className={clsx(
                          'relative rounded-xl overflow-hidden aspect-square transition-all duration-200 flex flex-col items-center justify-center',
                          selectedMatSize?.id === item.id
                            ? 'ring-2 ring-accent ring-offset-1 ring-offset-[#141427]'
                            : 'ring-1 ring-white/10 hover:ring-white/30',
                          'bg-[#2a2a3e]'
                        )}
                      >
                        {/* Mat preview: gray bg with white border = mat */}
                        <div className="w-14 h-14 bg-gray-600 rounded relative">
                          <div
                            className="absolute bg-white rounded-sm"
                            style={{ inset: `${inset}px` }}
                          />
                        </div>
                        <span className={clsx(
                          'text-[9px] mt-1',
                          selectedMatSize?.id === item.id ? 'text-accent' : 'text-gray-400'
                        )}>{cmLabel}</span>
                      </button>
                    )
                  })}
                </div>
              ) : activeMatTab === 'Border' ? (
                /* ── Border tab: thin decorative line ── */
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedMatBorder(null)}
                    className={clsx(
                      'w-10 h-10 rounded-lg border-2 flex items-center justify-center text-[9px] text-gray-400 font-medium transition-all',
                      !selectedMatBorder
                        ? 'border-accent text-accent'
                        : 'border-white/20 hover:border-white/40'
                    )}
                  >
                    None
                  </button>
                  {matItems.map(item => (
                    <MatThumb
                      key={item.id}
                      item={item}
                      selected={selectedMatBorder?.id === item.id}
                      onClick={() => setSelectedMatBorder(item)}
                    />
                  ))}
                </div>
              ) : (
                /* ── Color / Texture tabs ── */
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      if (activeMatTab === 'Color') setSelectedMatColor(null)
                      else setSelectedMatTexture(null)
                    }}
                    className={clsx(
                      'w-10 h-10 rounded-lg border-2 flex items-center justify-center text-[9px] text-gray-400 font-medium transition-all',
                      (activeMatTab === 'Color' ? !selectedMatColor : !selectedMatTexture)
                        ? 'border-accent text-accent'
                        : 'border-white/20 hover:border-white/40'
                    )}
                  >
                    None
                  </button>
                  {matItems.map(item => (
                    <MatThumb
                      key={item.id}
                      item={item}
                      selected={
                        activeMatTab === 'Color'
                          ? selectedMatColor?.id === item.id
                          : selectedMatTexture?.id === item.id
                      }
                      onClick={() => {
                        if (activeMatTab === 'Color') setSelectedMatColor(item)
                        else setSelectedMatTexture(item)
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            <ControlsPanel />
          </>
        )}

        {/* ── Effect ── */}
        {activeSidebarTab === 'effect' && (
          <>
            <div className="px-3 pt-3 pb-2 border-b border-white/10 flex-shrink-0">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                Effects
              </p>
              <p className="text-[10px] text-gray-600 mt-0.5">
                One effect at a time across all tabs
              </p>
            </div>

            {/* Effect sub-tabs */}
            <div className="flex gap-1 px-3 pt-2 pb-1 flex-shrink-0">
              {(effectsQuery.data ?? []).map(cat => (
                <button
                  key={cat.id}
                  className={clsx('tab-btn text-[10px]', activeEffectTab === cat.englishName && 'active')}
                  onClick={() => setActiveEffectTab(cat.englishName)}
                >
                  {cat.englishName}
                </button>
              ))}
              {effectsQuery.isLoading && (
                <div className="flex gap-1">
                  {[1,2,3].map(i => (
                    <div key={i} className="skeleton w-16 h-6 rounded-md" />
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              {effectsQuery.isLoading ? (
                <SkeletonGrid count={6} cols={3} />
              ) : effectsQuery.isError ? (
                <p className="text-xs text-red-400 text-center py-4">Failed to load effects</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {/* None button to remove effect */}
                  <button
                    onClick={() => setSelectedEffect(null)}
                    className={clsx(
                      'relative rounded-xl overflow-hidden aspect-square transition-all duration-200 flex items-center justify-center',
                      !selectedEffect
                        ? 'ring-2 ring-accent ring-offset-1 ring-offset-[#141427]'
                        : 'ring-1 ring-white/10 hover:ring-white/30',
                      'bg-[#1a1a2e]'
                    )}
                  >
                    <span className="text-[9px] text-gray-400 font-medium">None</span>
                  </button>
                  {effectItems.map(item => (
                    <EffectThumb
                      key={item.id}
                      item={item}
                      selected={selectedEffect?.id === item.id}
                      onClick={() => {
                        // Toggle: clicking selected effect deselects it
                        if (selectedEffect?.id === item.id) {
                          setSelectedEffect(null)
                        } else {
                          setSelectedEffect(item)
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Crop — placeholder ── */}
        {activeSidebarTab === 'crop' && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center px-6">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
              <Crop size={20} className="text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-gray-300 font-medium">Crop</p>
              <p className="text-xs text-gray-500 mt-1">Coming soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

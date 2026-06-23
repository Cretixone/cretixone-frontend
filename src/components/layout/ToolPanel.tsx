import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import { Crop } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────

function SkeletonGrid({ count = 6, cols = 3 }: { count?: number; cols?: number }) {
  return (
    <div className={`grid grid-cols-${cols} gap-2`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton aspect-square rounded-lg"
          style={{ background: 'var(--ed-hover)' }}
        />
      ))}
    </div>
  )
}

function PanelHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="px-4 pt-3 pb-2">
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: 'var(--ed-fg-subtle)' }}
      >
        {title}
      </p>
      {hint && (
        <p className="mt-0.5 text-[11px]" style={{ color: 'var(--ed-fg-muted)' }}>
          {hint}
        </p>
      )}
    </div>
  )
}

function PillTabs({
  items, value, onChange,
}: {
  items: { id: string; label: string }[]
  value: string | null
  onChange: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto px-3 py-2">
      {items.map((it) => {
        const active = value === it.id
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            className={cn(
              'whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ed-ring)]',
            )}
            style={{
              background: active ? 'var(--ed-accent)' : 'var(--ed-hover)',
              color: active ? 'var(--ed-accent-fg)' : 'var(--ed-fg-muted)',
            }}
          >
            {it.label}
          </button>
        )
      })}
    </div>
  )
}

// ── Thumb cards ────────────────────────────────────────────────────────────

function FrameThumb({ item, selected, onClick }: {
  item: ApiFrame; selected: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative aspect-square overflow-hidden rounded-lg transition-transform',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ed-ring)]',
        selected ? 'scale-105' : 'hover:scale-[1.02]',
        item.isVip && !selected && 'opacity-80',
      )}
      style={{
        background: 'var(--ed-canvas)',
        outline: selected
          ? '2px solid var(--ed-accent)'
          : '1px solid var(--ed-border)',
        outlineOffset: selected ? '0px' : '-1px',
      }}
    >
      <img
        src={item.imgUrl}
        alt={`Frame ${item.id}`}
        className="h-full w-full object-contain p-1"
        draggable={false}
        loading="lazy"
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="h-[55%] w-[55%] rounded-sm shadow-inner"
          style={{ background: 'rgba(255,255,255,0.85)' }}
        />
      </div>
      {item.isVip && (
        <div
          className="absolute right-1 top-1 rounded-sm px-1 py-0.5 text-[7px] font-bold leading-none"
          style={{ background: 'var(--ed-accent)', color: 'var(--ed-accent-fg)' }}
        >
          PRO
        </div>
      )}
      {item.isNew && !item.isVip && (
        <div
          className="absolute left-1 top-1 rounded-sm px-1 py-0.5 text-[7px] font-bold leading-none"
          style={{ background: 'var(--ed-fg)', color: 'var(--ed-panel)' }}
        >
          NEW
        </div>
      )}
    </button>
  )
}

function SceneThumb({ item, selected, onClick }: {
  item: ApiScene; selected: boolean; onClick: () => void
}) {
  const bgUrl = item.ossUrl.startsWith('http') ? item.ossUrl : OSS_PREFIX + item.ossUrl
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative aspect-[4/3] overflow-hidden rounded-lg transition-transform',
        selected ? 'scale-105' : 'hover:scale-[1.02]',
      )}
      style={{
        outline: selected
          ? '2px solid var(--ed-accent)'
          : '1px solid var(--ed-border)',
        outlineOffset: selected ? '0px' : '-1px',
      }}
    >
      <img src={bgUrl} alt={`Scene ${item.id}`} className="h-full w-full object-cover" loading="lazy" draggable={false} />
      {item.isVip && (
        <div
          className="absolute right-1 top-1 rounded-sm px-1 py-0.5 text-[7px] font-bold leading-none"
          style={{ background: 'var(--ed-accent)', color: 'var(--ed-accent-fg)' }}
        >
          PRO
        </div>
      )}
    </button>
  )
}

function MatThumb({ item, selected, onClick }: {
  item: ApiPaperItem; selected: boolean; onClick: () => void
}) {
  const hasTexture = !!item.ossUrl
  const imgUrl = hasTexture
    ? (item.ossUrl.startsWith('http') ? item.ossUrl : OSS_PREFIX + item.ossUrl)
    : undefined
  const bgStyle = hasTexture
    ? { backgroundImage: `url(${imgUrl})`, backgroundSize: 'cover' as const }
    : { backgroundColor: item.color ? `#${item.color}` : 'var(--ed-canvas)' }

  return (
    <button
      onClick={onClick}
      className="relative h-9 w-9 overflow-hidden rounded-md transition-transform hover:scale-105"
      style={{
        ...bgStyle,
        outline: selected
          ? '2px solid var(--ed-accent)'
          : '1px solid var(--ed-border)',
        outlineOffset: selected ? '0px' : '-1px',
      }}
    >
      <div className="absolute inset-[3px] rounded-sm bg-white/95" />
      {item.isVip && (
        <div className="absolute right-0 top-0 rounded-sm bg-[var(--ed-accent)] px-0.5 text-[6px] font-bold leading-none text-white">
          P
        </div>
      )}
    </button>
  )
}

function EffectThumb({ item, selected, onClick }: {
  item: ApiEffectItem; selected: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative aspect-square overflow-hidden rounded-lg transition-transform',
        selected ? 'scale-105' : 'hover:scale-[1.02]',
      )}
      style={{
        outline: selected
          ? '2px solid var(--ed-accent)'
          : '1px solid var(--ed-border)',
        outlineOffset: selected ? '0px' : '-1px',
      }}
    >
      <img src={item.img} alt={item.englishName} className="h-full w-full object-cover" loading="lazy" draggable={false} />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-1 py-1.5">
        <p className="truncate text-center text-[9px] font-medium leading-tight text-white/95">
          {item.englishName}
        </p>
      </div>
      {item.isVip && (
        <div
          className="absolute right-1 top-1 rounded-sm px-1 py-0.5 text-[7px] font-bold leading-none"
          style={{ background: 'var(--ed-accent)', color: 'var(--ed-accent-fg)' }}
        >
          PRO
        </div>
      )}
    </button>
  )
}

function NoneTile({
  label, selected, onClick, aspect = 'square',
}: {
  label: string; selected: boolean; onClick: () => void; aspect?: 'square' | '4/3'
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-center rounded-lg text-[10px] font-medium transition-colors',
        aspect === 'square' ? 'aspect-square' : 'aspect-[4/3]',
      )}
      style={{
        background: 'var(--ed-canvas)',
        color: selected ? 'var(--ed-accent)' : 'var(--ed-fg-muted)',
        outline: selected
          ? '2px solid var(--ed-accent)'
          : '1px dashed var(--ed-border-strong)',
        outlineOffset: selected ? '0px' : '-1px',
      }}
    >
      {label}
    </button>
  )
}

// ── Main ToolPanel ────────────────────────────────────────────────────────

export default function ToolPanel() {
  const {
    activeSidebarTab,
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
  } = useEditorStore()

  const [searchParams] = useSearchParams()

  // ── API queries — lazy by active tab ──────────────────────────────────
  const framesQuery = useFetchFramesQuery(undefined, { skip: activeSidebarTab !== 'frames' })
  const frameCategoriesQuery = useFetchFrameCategoriesQuery(undefined, {
    skip: activeSidebarTab !== 'frames',
  })
  const interiorsQuery = useFetchInteriorsQuery(undefined, { skip: activeSidebarTab !== 'interiors' })
  const sceneryQuery = useFetchSceneryQuery(undefined, { skip: activeSidebarTab !== 'scenery' })
  const paperQuery = useFetchPaperQuery(undefined, { skip: activeSidebarTab !== 'mat' })
  const effectsQuery = useFetchEffectsQuery(undefined, { skip: activeSidebarTab !== 'effect' })

  const frameCategories = frameCategoriesQuery.data ?? []

  useEffect(() => {
    if (!frameCategories.length) return
    if (activeFrameCategorySlug == null) {
      setActiveFrameCategorySlug(frameCategories[0].slug)
      return
    }
    const stillExists = frameCategories.some((c) => c.slug === activeFrameCategorySlug)
    if (!stillExists) setActiveFrameCategorySlug(frameCategories[0].slug)
  }, [frameCategories, activeFrameCategorySlug, setActiveFrameCategorySlug])

  const filteredFrames = useMemo(() => {
    const all = framesQuery.data ?? []
    if (!activeFrameCategorySlug) return all
    return all.filter((f) => f.categorySlug === activeFrameCategorySlug)
  }, [framesQuery.data, activeFrameCategorySlug])

  // Auto-select the first frame of the active (first) category when nothing is
  // selected yet — fresh editor open, a refresh, or an "Upload Photo" from the
  // navbar. A ?frame= deep-link takes precedence (resolved in EditorApp), so
  // we skip while that param is present.
  useEffect(() => {
    if (selectedFrame) return
    if (searchParams.get('frame')) return
    const first = filteredFrames[0] ?? (framesQuery.data ?? [])[0]
    if (first) setSelectedFrame(first)
  }, [selectedFrame, filteredFrames, framesQuery.data, searchParams, setSelectedFrame])

  const matCategories = paperQuery.data ?? []
  const activeMatCategory = matCategories.find((c) => c.englishName === activeMatTab)
  const matItems = activeMatCategory?.imgs ?? []

  const effectCategories = effectsQuery.data ?? []
  const activeEffectCategory = effectCategories.find((c) => c.englishName === activeEffectTab)
  const effectItems = activeEffectCategory?.list ?? []

  return (
    <aside
      className="flex h-full w-[300px] flex-shrink-0 flex-col border-r"
      style={{
        background: 'var(--ed-panel)',
        borderColor: 'var(--ed-border)',
      }}
    >
      {/* ── Frames ── */}
      {activeSidebarTab === 'frames' && (
        <>
          <PanelHeader title="Picture frames" hint="Pick a style — control width in the right inspector" />
          <Separator />
          {!frameCategoriesQuery.isLoading && frameCategories.length > 0 && (
            <PillTabs
              items={frameCategories.map((c) => ({ id: c.slug, label: c.name }))}
              value={activeFrameCategorySlug}
              onChange={(slug) => setActiveFrameCategorySlug(slug)}
            />
          )}
          <ScrollArea className="flex-1">
            <div className="px-3 pb-4 pt-1">
              {framesQuery.isLoading ? (
                <SkeletonGrid count={9} cols={3} />
              ) : framesQuery.isError ? (
                <p className="py-4 text-center text-xs text-red-500">Failed to load frames</p>
              ) : filteredFrames.length === 0 ? (
                <p className="py-10 text-center text-xs" style={{ color: 'var(--ed-fg-subtle)' }}>
                  No frames in this category yet.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {filteredFrames.map((item) => (
                    <FrameThumb
                      key={item.id}
                      item={item}
                      selected={selectedFrame?.id === item.id}
                      onClick={() => setSelectedFrame(item)}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </>
      )}

      {/* ── Interiors ── */}
      {activeSidebarTab === 'interiors' && (
        <>
          <PanelHeader title="Interior scenes" hint="Picking an interior removes scenery" />
          <Separator />
          <ScrollArea className="flex-1">
            <div className="px-3 py-3">
              {interiorsQuery.isLoading ? (
                <SkeletonGrid count={6} cols={2} />
              ) : interiorsQuery.isError ? (
                <p className="py-4 text-center text-xs text-red-500">Failed to load interiors</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <NoneTile
                    label="None"
                    aspect="4/3"
                    selected={!selectedInterior}
                    onClick={() => setSelectedInterior(null)}
                  />
                  {interiorsQuery.data?.map((scene) => (
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
          </ScrollArea>
        </>
      )}

      {/* ── Scenery ── */}
      {activeSidebarTab === 'scenery' && (
        <>
          <PanelHeader title="Scenery" hint="Picking scenery removes interior" />
          <Separator />
          <ScrollArea className="flex-1">
            <div className="px-3 py-3">
              {sceneryQuery.isLoading ? (
                <SkeletonGrid count={6} cols={2} />
              ) : sceneryQuery.isError ? (
                <p className="py-4 text-center text-xs text-red-500">Failed to load scenery</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <NoneTile
                    label="None"
                    aspect="4/3"
                    selected={!selectedScenery}
                    onClick={() => setSelectedScenery(null)}
                  />
                  {sceneryQuery.data?.map((scene) => (
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
          </ScrollArea>
        </>
      )}

      {/* ── Mat ── */}
      {activeSidebarTab === 'mat' && (
        <>
          <PanelHeader title="Mat" hint="Size sets thickness · Color/Texture sets look" />
          <Separator />
          {!paperQuery.isLoading && (paperQuery.data?.length ?? 0) > 0 && (
            <PillTabs
              items={(paperQuery.data ?? []).map((c) => ({ id: c.englishName, label: c.englishName }))}
              value={activeMatTab}
              onChange={(id) => setActiveMatTab(id)}
            />
          )}
          <ScrollArea className="flex-1">
            <div className="px-3 py-3">
              {paperQuery.isLoading ? (
                <SkeletonGrid count={8} cols={4} />
              ) : paperQuery.isError ? (
                <p className="py-4 text-center text-xs text-red-500">Failed to load mat options</p>
              ) : activeMatTab === 'Size' ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedMatSize(null)}
                    className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium transition-colors"
                    style={{
                      background: 'var(--ed-canvas)',
                      color: !selectedMatSize ? 'var(--ed-accent)' : 'var(--ed-fg-muted)',
                      outline: !selectedMatSize
                        ? '2px solid var(--ed-accent)'
                        : '1px dashed var(--ed-border-strong)',
                      outlineOffset: !selectedMatSize ? '0px' : '-1px',
                    }}
                  >
                    <span className="text-lg leading-none">∅</span>
                    <span>None</span>
                  </button>
                  {matItems.map((item, idx) => {
                    const cmLabel = `${idx + 1} cm`
                    const inset = 8 + idx * 4
                    const sel = selectedMatSize?.id === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedMatSize(item)}
                        className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg transition-transform hover:scale-[1.02]"
                        style={{
                          background: 'var(--ed-canvas)',
                          outline: sel
                            ? '2px solid var(--ed-accent)'
                            : '1px solid var(--ed-border)',
                          outlineOffset: sel ? '0px' : '-1px',
                        }}
                      >
                        <div className="relative h-12 w-12 rounded" style={{ background: 'var(--ed-border-strong)' }}>
                          <div
                            className="absolute rounded-sm bg-white"
                            style={{ inset: `${inset}px` }}
                          />
                        </div>
                        <span
                          className="text-[10px] font-medium"
                          style={{ color: sel ? 'var(--ed-accent)' : 'var(--ed-fg-muted)' }}
                        >
                          {cmLabel}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : activeMatTab === 'Border' ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedMatBorder(null)}
                    className="flex h-9 w-9 items-center justify-center rounded-md text-[9px] font-medium"
                    style={{
                      color: !selectedMatBorder ? 'var(--ed-accent)' : 'var(--ed-fg-muted)',
                      outline: !selectedMatBorder
                        ? '2px solid var(--ed-accent)'
                        : '1px dashed var(--ed-border-strong)',
                    }}
                  >
                    None
                  </button>
                  {matItems.map((item) => (
                    <MatThumb
                      key={item.id}
                      item={item}
                      selected={selectedMatBorder?.id === item.id}
                      onClick={() => setSelectedMatBorder(item)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      if (activeMatTab === 'Color') setSelectedMatColor(null)
                      else setSelectedMatTexture(null)
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-md text-[9px] font-medium"
                    style={{
                      color: (activeMatTab === 'Color' ? !selectedMatColor : !selectedMatTexture)
                        ? 'var(--ed-accent)' : 'var(--ed-fg-muted)',
                      outline: (activeMatTab === 'Color' ? !selectedMatColor : !selectedMatTexture)
                        ? '2px solid var(--ed-accent)'
                        : '1px dashed var(--ed-border-strong)',
                    }}
                  >
                    None
                  </button>
                  {matItems.map((item) => (
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
          </ScrollArea>
        </>
      )}

      {/* ── Effect ── */}
      {activeSidebarTab === 'effect' && (
        <>
          <PanelHeader title="Effects" hint="One effect at a time across all tabs" />
          <Separator />
          {!effectsQuery.isLoading && (effectsQuery.data?.length ?? 0) > 0 && (
            <PillTabs
              items={(effectsQuery.data ?? []).map((c) => ({ id: c.englishName, label: c.englishName }))}
              value={activeEffectTab}
              onChange={(id) => setActiveEffectTab(id)}
            />
          )}
          <ScrollArea className="flex-1">
            <div className="px-3 py-3">
              {effectsQuery.isLoading ? (
                <SkeletonGrid count={6} cols={3} />
              ) : effectsQuery.isError ? (
                <p className="py-4 text-center text-xs text-red-500">Failed to load effects</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <NoneTile label="None" selected={!selectedEffect} onClick={() => setSelectedEffect(null)} />
                  {effectItems.map((item) => (
                    <EffectThumb
                      key={item.id}
                      item={item}
                      selected={selectedEffect?.id === item.id}
                      onClick={() => {
                        if (selectedEffect?.id === item.id) setSelectedEffect(null)
                        else setSelectedEffect(item)
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </>
      )}

      {/* ── Crop placeholder ── */}
      {activeSidebarTab === 'crop' && (
        <>
          <PanelHeader title="Crop" hint="Coming soon" />
          <Separator />
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: 'var(--ed-hover)' }}
            >
              <Crop size={22} style={{ color: 'var(--ed-fg-subtle)' }} />
            </div>
            <p className="text-xs" style={{ color: 'var(--ed-fg-muted)' }}>
              Crop tools land in the next release.
            </p>
          </div>
        </>
      )}
    </aside>
  )
}

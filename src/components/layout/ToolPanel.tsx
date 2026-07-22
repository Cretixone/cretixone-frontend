import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useEditorStore, OSS_PREFIX } from '@/store/editorStore'
import {
  useFetchFramesQuery,
  useFetchFrameCategoriesQuery,
  useFetchInteriorsQuery,
  useFetchSceneryQuery,
  useFetchMatSizesQuery,
  useFetchMatColorsQuery,
  useFetchMdfQuery,
  useFetchEffectsQuery,
} from '@/store/api/apiSlice'
import type { ApiFrame, ApiScene, ApiMatColor, ApiMdf, ApiEffectItem } from '@/types/api'
import { formatOMR } from '@/lib/format'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useLangStore } from '@/store/langStore'

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
  const { t } = useTranslation('editor')
  return (
    <div className="flex flex-col">
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
          alt={t('panel.frameAlt', { id: item.id })}
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
        {item.isNew && (
          <div
            className="absolute left-1 top-1 rounded-sm px-1 py-0.5 text-[7px] font-bold leading-none"
            style={{ background: 'var(--ed-fg)', color: 'var(--ed-panel)' }}
          >
            {t('panel.badgeNew')}
          </div>
        )}
      </button>
      {/* Per-cm price under each frame */}
      <span
        className="mt-1.5 text-center text-[11px] font-semibold leading-tight tabular-nums"
        style={{ color: selected ? 'var(--ed-accent)' : 'var(--ed-fg)' }}
      >
        {item.pricePerCm > 0 ? `${formatOMR(item.pricePerCm)}/cm` : '—'}
      </span>
    </div>
  )
}

function SceneThumb({ item, selected, onClick }: {
  item: ApiScene; selected: boolean; onClick: () => void
}) {
  const { t } = useTranslation('editor')
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
      <img src={bgUrl} alt={t('panel.sceneAlt', { id: item.id })} className="h-full w-full object-cover" loading="lazy" draggable={false} />
      {item.isVip && (
        <div
          className="absolute right-1 top-1 rounded-sm px-1 py-0.5 text-[7px] font-bold leading-none"
          style={{ background: 'var(--ed-accent)', color: 'var(--ed-accent-fg)' }}
        >
          {t('panel.badgePro')}
        </div>
      )}
    </button>
  )
}

function MatColorThumb({ item, selected, onClick }: {
  item: ApiMatColor; selected: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={item.name}
      aria-label={item.name}
      className="relative h-9 w-9 overflow-hidden rounded-md transition-transform hover:scale-105"
      style={{
        backgroundColor: `#${item.color}`,
        outline: selected
          ? '2px solid var(--ed-accent)'
          : '1px solid var(--ed-border)',
        outlineOffset: selected ? '0px' : '-1px',
      }}
    >
      <div className="absolute inset-[3px] rounded-sm" style={{ background: `#${item.color}` }} />
    </button>
  )
}

function MdfThumb({ item, selected, onClick }: {
  item: ApiMdf; selected: boolean; onClick: () => void
}) {
  const { t } = useTranslation('editor')
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-lg p-1.5 transition-transform hover:scale-[1.02]"
      style={{
        background: 'var(--ed-canvas)',
        outline: selected ? '2px solid var(--ed-accent)' : '1px solid var(--ed-border)',
        outlineOffset: selected ? '0px' : '-1px',
      }}
    >
      <div className="aspect-square w-full overflow-hidden rounded-md" style={{ background: 'var(--ed-hover)' }}>
        {item.imgUrl ? (
          <img src={item.imgUrl} alt={item.name} className="h-full w-full object-cover" loading="lazy" draggable={false} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[9px]" style={{ color: 'var(--ed-fg-subtle)' }}>
            {t('panel.mdf.noPhoto')}
          </div>
        )}
      </div>
      <span
        className="text-[10px] font-medium leading-tight text-center"
        style={{ color: selected ? 'var(--ed-accent)' : 'var(--ed-fg-muted)' }}
      >
        {item.name}
      </span>
    </button>
  )
}

function EffectThumb({ item, selected, onClick }: {
  item: ApiEffectItem; selected: boolean; onClick: () => void
}) {
  const { t } = useTranslation('editor')
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
          {t('panel.badgePro')}
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
  const { t } = useTranslation('editor')
  const isRtl = useLangStore((s) => s.isRtl)
  const {
    activeSidebarTab,
    selectedFrame, setSelectedFrame,
    selectedInterior, setSelectedInterior,
    selectedScenery, setSelectedScenery,
    selectedMatSize, setSelectedMatSize,
    selectedMatColor, setSelectedMatColor,
    selectedMdf, setSelectedMdf,
    activeMatTab, setActiveMatTab,
    selectedEffect, setSelectedEffect,
    activeEffectTab, setActiveEffectTab,
    activeFrameCategorySlug, setActiveFrameCategorySlug,
    toolPanelCollapsed, setToolPanelCollapsed,
  } = useEditorStore()

  const [searchParams] = useSearchParams()

  // ── API queries — lazy by active tab ──────────────────────────────────
  const framesQuery = useFetchFramesQuery(undefined, { skip: activeSidebarTab !== 'frames' })
  const frameCategoriesQuery = useFetchFrameCategoriesQuery(undefined, {
    skip: activeSidebarTab !== 'frames',
  })
  const interiorsQuery = useFetchInteriorsQuery(undefined, { skip: activeSidebarTab !== 'interiors' })
  const sceneryQuery = useFetchSceneryQuery(undefined, { skip: activeSidebarTab !== 'scenery' })
  const matSizesQuery = useFetchMatSizesQuery(undefined, { skip: activeSidebarTab !== 'mat' })
  const matColorsQuery = useFetchMatColorsQuery(undefined, { skip: activeSidebarTab !== 'mat' })
  const mdfQuery = useFetchMdfQuery(undefined, { skip: activeSidebarTab !== 'mdf' })
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
  // we skip while that param is present. If the first category has no frames,
  // fall back to the first available frame and switch the tab to match.
  useEffect(() => {
    if (selectedFrame) return
    if (searchParams.get('frame')) return
    const first = filteredFrames[0] ?? (framesQuery.data ?? [])[0]
    if (!first) return
    setSelectedFrame(first)
    if (first.categorySlug && first.categorySlug !== activeFrameCategorySlug) {
      setActiveFrameCategorySlug(first.categorySlug)
    }
  }, [
    selectedFrame,
    filteredFrames,
    framesQuery.data,
    searchParams,
    setSelectedFrame,
    activeFrameCategorySlug,
    setActiveFrameCategorySlug,
  ])

  const matSizes = matSizesQuery.data ?? []
  const matColors = matColorsQuery.data ?? []
  // Only two tabs remain after Texture / Border were removed. The id stays in
  // English (used for logic); only the visible label is translated.
  const MAT_TABS = ['Size', 'Color']
  const matTabLabel = (id: string) =>
    id === 'Color' ? t('panel.mat.tabColor') : t('panel.mat.tabSize')
  const matLoading = matSizesQuery.isLoading || matColorsQuery.isLoading
  const matError = matSizesQuery.isError || matColorsQuery.isError

  const mdfItems = mdfQuery.data ?? []

  const effectCategories = effectsQuery.data ?? []
  const activeEffectCategory = effectCategories.find((c) => c.englishName === activeEffectTab)
  const effectItems = activeEffectCategory?.list ?? []

  // Friendly title for the panel header — mirrors the active tool.
  const PANEL_TITLES: Record<string, string> = {
    frames: t('panel.titles.frames'),
    interiors: t('panel.titles.interiors'),
    scenery: t('panel.titles.scenery'),
    mat: t('panel.titles.mat'),
    mdf: t('panel.titles.mdf'),
    effect: t('panel.titles.effect'),
  }
  const panelTitle = PANEL_TITLES[activeSidebarTab] ?? t('panel.library')

  // Collapsed → a thin rail with an expand button (mirrors the right Inspector).
  if (toolPanelCollapsed) {
    return (
      <div
        className="flex w-7 flex-shrink-0 flex-col items-center justify-start border-r py-3"
        style={{
          background: 'var(--ed-panel)',
          borderColor: 'var(--ed-border)',
        }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setToolPanelCollapsed(false)}
              aria-label={t('panel.expandPanel')}
              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
              style={{ color: 'var(--ed-fg-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ed-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <ChevronRight size={14} strokeWidth={1.8} className="rtl:-scale-x-100" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{t('panel.expand')}</TooltipContent>
        </Tooltip>
      </div>
    )
  }

  return (
    <aside
      className="flex h-full w-[300px] flex-shrink-0 flex-col"
      style={{
        background: 'var(--ed-panel)',
        borderColor: 'var(--ed-border)',
        borderLeftWidth: isRtl ? '1px' : '0',
        borderRightWidth: isRtl ? '0' : '1px',
      }}
    >
      {/* ── Collapse header ── */}
      <div
        className="flex items-center justify-between border-b px-3 py-2.5"
        style={{ borderColor: 'var(--ed-border)' }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: 'var(--ed-fg-subtle)' }}
        >
          {panelTitle}
        </p>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setToolPanelCollapsed(true)}
              aria-label={t('panel.collapsePanel')}
              className="flex h-6 w-6 items-center justify-center rounded-md transition-colors"
              style={{ color: 'var(--ed-fg-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ed-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <ChevronLeft size={13} strokeWidth={1.8} className="rtl:-scale-x-100" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{t('panel.collapse')}</TooltipContent>
        </Tooltip>
      </div>

      {/* ── Frames ── */}
      {activeSidebarTab === 'frames' && (
        <>
          <PanelHeader title={t('panel.frames.header')} hint={t('panel.frames.hint')} />
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
                <p className="py-4 text-center text-xs text-red-500">{t('panel.frames.error')}</p>
              ) : filteredFrames.length === 0 ? (
                <p className="py-10 text-center text-xs" style={{ color: 'var(--ed-fg-subtle)' }}>
                  {t('panel.frames.empty')}
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
          <PanelHeader title={t('panel.interiors.header')} hint={t('panel.interiors.hint')} />
          <Separator />
          <ScrollArea className="flex-1">
            <div className="px-3 py-3">
              {interiorsQuery.isLoading ? (
                <SkeletonGrid count={6} cols={2} />
              ) : interiorsQuery.isError ? (
                <p className="py-4 text-center text-xs text-red-500">{t('panel.interiors.error')}</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <NoneTile
                    label={t('panel.none')}
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
          <PanelHeader title={t('panel.scenery.header')} hint={t('panel.scenery.hint')} />
          <Separator />
          <ScrollArea className="flex-1">
            <div className="px-3 py-3">
              {sceneryQuery.isLoading ? (
                <SkeletonGrid count={6} cols={2} />
              ) : sceneryQuery.isError ? (
                <p className="py-4 text-center text-xs text-red-500">{t('panel.scenery.error')}</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <NoneTile
                    label={t('panel.none')}
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
          <PanelHeader title={t('panel.mat.header')} hint={t('panel.mat.hint')} />
          <Separator />
          <PillTabs
            items={MAT_TABS.map((id) => ({ id, label: matTabLabel(id) }))}
            value={MAT_TABS.includes(activeMatTab) ? activeMatTab : 'Size'}
            onChange={(id) => setActiveMatTab(id)}
          />
          <ScrollArea className="flex-1">
            <div className="px-3 py-3">
              {matLoading ? (
                <SkeletonGrid count={6} cols={2} />
              ) : matError ? (
                <p className="py-4 text-center text-xs text-red-500">{t('panel.mat.error')}</p>
              ) : activeMatTab === 'Color' ? (
                matColors.length === 0 ? (
                  <p className="py-10 text-center text-xs" style={{ color: 'var(--ed-fg-subtle)' }}>
                    {t('panel.mat.noColors')}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedMatColor(null)}
                      className="flex h-9 w-9 items-center justify-center rounded-md text-[9px] font-medium"
                      style={{
                        color: !selectedMatColor ? 'var(--ed-accent)' : 'var(--ed-fg-muted)',
                        outline: !selectedMatColor
                          ? '2px solid var(--ed-accent)'
                          : '1px dashed var(--ed-border-strong)',
                      }}
                    >
                      {t('panel.none')}
                    </button>
                    {matColors.map((item) => (
                      <MatColorThumb
                        key={item.id}
                        item={item}
                        selected={selectedMatColor?.id === item.id}
                        onClick={() => setSelectedMatColor(item)}
                      />
                    ))}
                  </div>
                )
              ) : matSizes.length === 0 ? (
                <p className="py-10 text-center text-xs" style={{ color: 'var(--ed-fg-subtle)' }}>
                  {t('panel.mat.noSizes')}
                </p>
              ) : (
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
                    <span>{t('panel.none')}</span>
                  </button>
                  {matSizes.map((item) => {
                    const sel = selectedMatSize?.id === item.id
                    // Preview inset scales with the mat width (capped so the
                    // white window stays visible on the 48px tile).
                    const inset = Math.min(20, 6 + item.widthCm * 1.6)
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
                          className="text-[10px] font-medium leading-tight text-center"
                          style={{ color: sel ? 'var(--ed-accent)' : 'var(--ed-fg-muted)' }}
                        >
                          {item.name}
                        </span>
                        {item.price > 0 && (
                          <span className="text-[9px] tabular-nums" style={{ color: 'var(--ed-fg-subtle)' }}>
                            +{formatOMR(item.price)}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </>
      )}

      {/* ── MDF ── */}
      {activeSidebarTab === 'mdf' && (
        <>
          <PanelHeader title={t('panel.mdf.header')} hint={t('panel.mdf.hint')} />
          <Separator />
          <ScrollArea className="flex-1">
            <div className="px-3 py-3">
              {mdfQuery.isLoading ? (
                <SkeletonGrid count={4} cols={2} />
              ) : mdfQuery.isError ? (
                <p className="py-4 text-center text-xs text-red-500">{t('panel.mdf.error')}</p>
              ) : mdfItems.length === 0 ? (
                <p className="py-10 text-center text-xs" style={{ color: 'var(--ed-fg-subtle)' }}>
                  {t('panel.mdf.empty')}
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedMdf(null)}
                    className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium transition-colors"
                    style={{
                      background: 'var(--ed-canvas)',
                      color: !selectedMdf ? 'var(--ed-accent)' : 'var(--ed-fg-muted)',
                      outline: !selectedMdf
                        ? '2px solid var(--ed-accent)'
                        : '1px dashed var(--ed-border-strong)',
                      outlineOffset: !selectedMdf ? '0px' : '-1px',
                    }}
                  >
                    <span className="text-lg leading-none">∅</span>
                    <span>{t('panel.none')}</span>
                  </button>
                  {mdfItems.map((item) => (
                    <MdfThumb
                      key={item.id}
                      item={item}
                      selected={selectedMdf?.id === item.id}
                      onClick={() => setSelectedMdf(selectedMdf?.id === item.id ? null : item)}
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
          <PanelHeader title={t('panel.effect.header')} hint={t('panel.effect.hint')} />
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
                <p className="py-4 text-center text-xs text-red-500">{t('panel.effect.error')}</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <NoneTile label={t('panel.none')} selected={!selectedEffect} onClick={() => setSelectedEffect(null)} />
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
    </aside>
  )
}

import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useEditorStore, OSS_PREFIX } from '@/store/editorStore'
import { sameFrameType } from '@/lib/frame-type'
import {
  useFetchFramesQuery,
  useFetchFrameTypesPublicQuery,
  useFetchInteriorsQuery,
  useFetchSceneryQuery,
  useFetchMatSizesQuery,
  useFetchMatColorsQuery,
  useFetchEffectsQuery,
} from '@/store/api/apiSlice'
import type { ApiFrame, ApiScene, ApiMatColor, ApiEffectItem } from '@/types/api'
import { formatOMR } from '@/lib/format'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useLangStore } from '@/store/langStore'
import { pickLocalized } from '@/lib/localized'

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
        // Same tolerance as the filter: a frame's own spelling of its type
        // may differ in case from the catalogue entry this tab came from.
        const active = sameFrameType(value, it.id)
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
  const isRtl = useLangStore((s) => s.isRtl)
  const frameName = pickLocalized(item.name, item.nameAr, isRtl)
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
      {/* Frame name + per-cm price under each frame */}
      {frameName && (
        <span
          className="mt-1.5 truncate text-center text-[11px] font-medium leading-tight"
          style={{ color: selected ? 'var(--ed-accent)' : 'var(--ed-fg)' }}
          title={frameName}
        >
          {frameName}
        </span>
      )}
      <span
        className={cn(
          'text-center text-[10px] leading-tight tabular-nums',
          !frameName && 'mt-1.5',
        )}
        style={{ color: 'var(--ed-fg-muted)' }}
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

// Shared square-thumbnail picker for the four frame-scoped "value-add"
// options (MDF / Paper Type / Lamination / Glass Type) — same photo + name +
// selection-ring layout, each simply sourced from a different catalog.
interface ThumbItem {
  id: string
  name: string
  imgUrl: string
}
function OptionThumb<T extends ThumbItem>({ item, selected, onClick }: {
  item: T; selected: boolean; onClick: () => void
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

// Full tab body (header + "None" tile + grid) for one of the four
// frame-scoped value-add options. `items` is already the frame's own
// allow-list — an empty list only ever renders here for the brief moment
// between switching frames and the active-tab reset effect firing.
function OptionPickerTab<T extends ThumbItem>({
  header,
  hint,
  emptyMessage,
  items,
  selected,
  onSelect,
}: {
  header: string
  hint: string
  emptyMessage: string
  items: T[]
  selected: T | null
  onSelect: (item: T | null) => void
}) {
  const { t } = useTranslation('editor')
  return (
    <>
      <PanelHeader title={header} hint={hint} />
      <Separator />
      <ScrollArea className="flex-1">
        <div className="px-3 py-3">
          {items.length === 0 ? (
            <p className="py-10 text-center text-xs" style={{ color: 'var(--ed-fg-subtle)' }}>
              {emptyMessage}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onSelect(null)}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium transition-colors"
                style={{
                  background: 'var(--ed-canvas)',
                  color: !selected ? 'var(--ed-accent)' : 'var(--ed-fg-muted)',
                  outline: !selected
                    ? '2px solid var(--ed-accent)'
                    : '1px dashed var(--ed-border-strong)',
                  outlineOffset: !selected ? '0px' : '-1px',
                }}
              >
                <span className="text-lg leading-none">∅</span>
                <span>{t('panel.none')}</span>
              </button>
              {items.map((item) => (
                <OptionThumb
                  key={item.id}
                  item={item}
                  selected={selected?.id === item.id}
                  onClick={() => onSelect(selected?.id === item.id ? null : item)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </>
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
    activeSidebarTab, setActiveSidebarTab,
    selectedFrame, setSelectedFrame,
    selectedInterior, setSelectedInterior,
    selectedScenery, setSelectedScenery,
    selectedMatSize, setSelectedMatSize,
    selectedMatColor, setSelectedMatColor,
    selectedMdf, setSelectedMdf,
    selectedPaperType, setSelectedPaperType,
    selectedLamination, setSelectedLamination,
    selectedGlassType, setSelectedGlassType,
    activeMatTab, setActiveMatTab,
    selectedEffect, setSelectedEffect,
    activeEffectTab, setActiveEffectTab,
    activeFrameType, setActiveFrameType,
    toolPanelCollapsed, setToolPanelCollapsed,
  } = useEditorStore()

  const [searchParams] = useSearchParams()

  // ── API queries — lazy by active tab ──────────────────────────────────
  const framesQuery = useFetchFramesQuery(undefined, { skip: activeSidebarTab !== 'frames' })
  const frameTypesQuery = useFetchFrameTypesPublicQuery(undefined, {
    skip: activeSidebarTab !== 'frames',
  })
  const interiorsQuery = useFetchInteriorsQuery(undefined, { skip: activeSidebarTab !== 'interiors' })
  const sceneryQuery = useFetchSceneryQuery(undefined, { skip: activeSidebarTab !== 'scenery' })
  const matSizesQuery = useFetchMatSizesQuery(undefined, { skip: activeSidebarTab !== 'mat' })
  const matColorsQuery = useFetchMatColorsQuery(undefined, { skip: activeSidebarTab !== 'mat' })
  const effectsQuery = useFetchEffectsQuery(undefined, { skip: activeSidebarTab !== 'effect' })
  // MDF / Paper Type / Lamination / Glass Type are frame-scoped — no query
  // of their own, just the selected frame's own admin-curated allow-list
  // (empty when the frame doesn't offer that catalog at all).
  const mdfItems = selectedFrame?.mdfBoards ?? []
  const paperTypeItems = selectedFrame?.paperTypes ?? []
  const laminationItems = selectedFrame?.laminations ?? []
  const glassTypeItems = selectedFrame?.glassTypes ?? []

  // If the active tab is one of the four above and the newly-selected frame
  // no longer offers it (its rail button just disappeared), fall back to
  // the frame picker instead of leaving an orphaned, now-inaccessible tab
  // open with a stale/empty grid.
  useEffect(() => {
    const frameScopedCount: Partial<Record<string, number>> = {
      mdf: mdfItems.length,
      paperType: paperTypeItems.length,
      lamination: laminationItems.length,
      glassType: glassTypeItems.length,
    }
    if (activeSidebarTab in frameScopedCount && frameScopedCount[activeSidebarTab] === 0) {
      setActiveSidebarTab('frames')
    }
  }, [activeSidebarTab, mdfItems.length, paperTypeItems.length, laminationItems.length, glassTypeItems.length, setActiveSidebarTab])

  const frameTypeTabs = frameTypesQuery.data ?? []

  useEffect(() => {
    if (!frameTypeTabs.length) return
    if (activeFrameType == null) {
      setActiveFrameType(frameTypeTabs[0].name)
      return
    }
    const stillExists = frameTypeTabs.some((t) => sameFrameType(t.name, activeFrameType))
    if (!stillExists) setActiveFrameType(frameTypeTabs[0].name)
  }, [frameTypeTabs, activeFrameType, setActiveFrameType])

  const filteredFrames = useMemo(() => {
    const all = framesQuery.data ?? []
    if (!activeFrameType) return all
    // Case/space-insensitive: the catalogue and the per-frame spec value are
    // maintained separately and their casing does not always agree.
    return all.filter((f) => sameFrameType(f.specifications?.['Frame Type'], activeFrameType))
  }, [framesQuery.data, activeFrameType])

  // Auto-select the first frame of the active (first) Frame Type when nothing
  // is selected yet — fresh editor open, a refresh, or an "Upload Photo" from
  // the navbar. A ?frame= deep-link takes precedence (resolved in EditorApp),
  // so we skip while that param is present. If the first type has no frames,
  // fall back to the first available frame and switch the tab to match.
  useEffect(() => {
    if (selectedFrame) return
    if (searchParams.get('frame')) return
    const first = filteredFrames[0] ?? (framesQuery.data ?? [])[0]
    if (!first) return
    setSelectedFrame(first)
    const firstType = first.specifications?.['Frame Type']
    if (firstType && !sameFrameType(firstType, activeFrameType)) {
      // Snap to the catalogue spelling so the tab highlights.
      const tab = frameTypeTabs.find((t) => sameFrameType(t.name, firstType))
      setActiveFrameType(tab?.name ?? firstType)
    }
  }, [
    selectedFrame,
    filteredFrames,
    framesQuery.data,
    searchParams,
    setSelectedFrame,
    activeFrameType,
    setActiveFrameType,
    frameTypeTabs,
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
    paperType: t('panel.titles.paperType'),
    lamination: t('panel.titles.lamination'),
    glassType: t('panel.titles.glassType'),
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
          {!frameTypesQuery.isLoading && frameTypeTabs.length > 0 && (
            <PillTabs
              items={frameTypeTabs.map((t) => ({ id: t.name, label: t.name }))}
              value={activeFrameType}
              onChange={(name) => setActiveFrameType(name)}
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

      {/* ── MDF / Paper Type / Lamination / Glass Type — frame-scoped ── */}
      {activeSidebarTab === 'mdf' && (
        <OptionPickerTab
          header={t('panel.mdf.header')}
          hint={t('panel.mdf.hint')}
          emptyMessage={t('panel.mdf.empty')}
          items={mdfItems}
          selected={selectedMdf}
          onSelect={setSelectedMdf}
        />
      )}

      {activeSidebarTab === 'paperType' && (
        <OptionPickerTab
          header={t('panel.paperType.header')}
          hint={t('panel.paperType.hint')}
          emptyMessage={t('panel.paperType.empty')}
          items={paperTypeItems}
          selected={selectedPaperType}
          onSelect={setSelectedPaperType}
        />
      )}

      {activeSidebarTab === 'lamination' && (
        <OptionPickerTab
          header={t('panel.lamination.header')}
          hint={t('panel.lamination.hint')}
          emptyMessage={t('panel.lamination.empty')}
          items={laminationItems}
          selected={selectedLamination}
          onSelect={setSelectedLamination}
        />
      )}

      {activeSidebarTab === 'glassType' && (
        <OptionPickerTab
          header={t('panel.glassType.header')}
          hint={t('panel.glassType.hint')}
          emptyMessage={t('panel.glassType.empty')}
          items={glassTypeItems}
          selected={selectedGlassType}
          onSelect={setSelectedGlassType}
        />
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

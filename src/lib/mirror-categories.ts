/**
 * The mirror types shown on /custom-mirrors. Shared with the inquiry page so a
 * tile can carry its selection across in `?type=`, and the inquiry records
 * which mirror the customer asked about rather than a generic "Custom Mirror".
 *
 * `titleKey` resolves under `pages:customMirrors.categories.*`.
 */
export interface MirrorCategory {
  titleKey: string
  img: string
}

export const MIRROR_CATEGORIES: MirrorCategory[] = [
  { titleKey: 'wall', img: '/images/mirors/miror-1.png' },
  { titleKey: 'decorative', img: '/images/mirors/miror-2.png' },
  { titleKey: 'led', img: '/images/mirors/miror-3.png' },
  { titleKey: 'customShapes', img: '/images/mirors/miror-4.png' },
  { titleKey: 'beveled', img: '/images/mirors/miror-6.png' },
  { titleKey: 'framed', img: '/images/mirors/miror-5.png' },
]

export const findMirrorCategory = (titleKey: string | null): MirrorCategory | null =>
  MIRROR_CATEGORIES.find((c) => c.titleKey === titleKey) ?? null

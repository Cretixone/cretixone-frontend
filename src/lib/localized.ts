/**
 * Picks the Arabic value in RTL/Arabic mode when it's set, otherwise falls back
 * to the base (English) value. Use with the global `useIsRtl()`:
 *
 *   const isRtl = useIsRtl()
 *   pickLocalized(frame.name, frame.nameAr, isRtl)
 */
export const pickLocalized = (
  base: string | null | undefined,
  ar: string | null | undefined,
  isRtl: boolean,
): string => (isRtl && ar ? ar : base ?? '')

/**
 * Picks the Arabic name in Arabic/RTL mode when one is set, otherwise falls
 * back to the base (English) name. Use with the global `isRtl` flag:
 *
 *   const isRtl = useIsRtl()
 *   localizedName(frameType, isRtl)
 *
 * Works for any admin-managed catalog record that carries an optional `nameAr`.
 */
export function localizedName(
  item: { name: string; nameAr?: string | null } | null | undefined,
  isRtl: boolean,
): string {
  if (!item) return ''
  return isRtl && item.nameAr ? item.nameAr : item.name
}

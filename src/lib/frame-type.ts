/**
 * Frame Type is stored as free text on each frame's `specifications` and is
 * matched against the admin-managed Frame Types catalogue. The two are edited
 * independently, so their casing and spacing drift apart in practice — live
 * data has "Floating Frames" on the frames but "FLOATING FRAMES" in the
 * catalogue, which made an exact === comparison hide every frame under its tab.
 *
 * Compare through these helpers, never with ===.
 */
export const normalizeFrameType = (value: string | null | undefined): string =>
  (value ?? '').trim().toLowerCase()

export const sameFrameType = (
  a: string | null | undefined,
  b: string | null | undefined,
): boolean => normalizeFrameType(a) === normalizeFrameType(b)

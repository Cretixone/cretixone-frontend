// ── Global number / price formatting ────────────────────────────────────────
// Thousands-separated, always exactly two decimals (never rounded to a whole
// number) — e.g. 1020 → "1,020.00", 12.2 → "12.20".

const amountFmt = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** "1,020.00" — thousands separator, exactly 2 decimals. */
export function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return '0.00'
  return amountFmt.format(value)
}

/** "OMR 1,020.00" — currency-prefixed amount. */
export function formatOMR(value: number): string {
  return `OMR ${formatAmount(value)}`
}

// Per-unit rates (e.g. price per cm) need more precision than a whole amount:
// OMR's subunit is the baisa (1/1000), so allow up to 3 decimals and trim the
// trailing zeros — 0.015 → "OMR 0.015", 0.5 → "OMR 0.5", 2 → "OMR 2".
const rateFmt = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
})

/** "OMR 0.015" — up to 3 decimals, trailing zeros trimmed (for per-unit rates). */
export function formatOMRRate(value: number): string {
  if (!Number.isFinite(value)) return 'OMR 0.00'
  return `OMR ${rateFmt.format(value)}`
}

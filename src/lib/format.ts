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

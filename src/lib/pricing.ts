/**
 * The single pricing formula for every made-to-order product, frames and
 * custom prints alike:
 *
 *   rate × (width + height) × 2      the product's own size price (perimeter)
 * + rate × wasteValue                the waste allowance, flat, not size-scaled
 * + optionsRate × width × height     every selected value-add option (area)
 *
 * The waste allowance deliberately applies to the size price only and never to
 * the options, matching the admin panel's waste calculator.
 *
 * Kept free of imports on purpose: no axios, no stores, no browser APIs, so it
 * stays unit-testable and can't drift between the two product types.
 */
export function productPrice(
  rate: number,
  wasteValue: number,
  widthCm: number,
  heightCm: number,
  optionsPricePerCm: number,
): number {
  return (
    rate * (widthCm + heightCm) * 2 +
    rate * (wasteValue ?? 0) +
    optionsPricePerCm * widthCm * heightCm
  )
}

/**
 * Frame pricing:
 *
 *   rate × (width + height) × 2      the frame's own size price (perimeter)
 * + rate × wasteValue                the waste allowance, flat, not size-scaled
 * + optionsRate × width × height     every selected value-add option (area)
 *
 * The waste allowance deliberately applies to the size price only and never to
 * the options, matching the admin panel's waste calculator.
 *
 * Custom prints use customPrintPrice() below — priced by area, not perimeter.
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

/**
 * Custom print pricing — prints and print categories alike. Unlike frames,
 * this is priced by AREA, not perimeter:
 *
 *   rate × width × height            the printing price
 * + optionsRate × width × height     every selected value-add option
 *
 * `rate` is therefore a per-cm² rate. Worked example from the reference
 * sheet: 0.002 × 84 × 120 = 20.16.
 *
 * The admin-configured waste allowance is NOT charged here: on the prints
 * module it is an internal costing reference only. It takes no `wasteValue`
 * parameter so a call site can't quietly add it back.
 */
export function customPrintPrice(
  rate: number,
  widthCm: number,
  heightCm: number,
  optionsPricePerCm: number,
): number {
  const area = widthCm * heightCm
  return rate * area + optionsPricePerCm * area
}

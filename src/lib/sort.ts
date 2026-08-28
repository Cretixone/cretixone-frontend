/**
 * Natural (human) comparison for names containing numbers, so sizes sort
 * A1, A2, A3, A10 rather than the lexicographic A1, A10, A2.
 *
 * `numeric: true` is what does the work; `sensitivity: 'base'` keeps the order
 * stable regardless of case or accents.
 */
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

export const compareNatural = (a: string, b: string): number => collator.compare(a, b)

/** Sorts a list of named records naturally by `name`, without mutating it. */
export function sortByNameNatural<T extends { name: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => compareNatural(a.name, b.name))
}

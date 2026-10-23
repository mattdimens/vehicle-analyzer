import type { CatalogProduct, Fitment } from "../types"

/** An inclusive model-year range, e.g. a generation. */
export interface YearRange {
  yearStart: number
  yearEnd: number
}

/** The product's fitment entries for this make and model that overlap the years. */
export function fitmentFor(
  product: CatalogProduct,
  make: string,
  model: string,
  years: YearRange
): Fitment[] {
  return product.fitment.filter(
    (f) =>
      f.make === make &&
      f.model === model &&
      f.yearStart <= years.yearEnd &&
      f.yearEnd >= years.yearStart
  )
}

/**
 * Fitment summary for a product card, e.g.
 * "Fits 2016-2023 Tacoma, Double Cab, 5-ft bed. Not for TRD Pro. Drilling required."
 */
export function formatFitment(entries: Fitment[], modelName: string): string {
  return entries
    .map((f) => {
      const years = f.yearStart === f.yearEnd ? `${f.yearStart}` : `${f.yearStart}-${f.yearEnd}`
      const parts = [`${years} ${modelName}`]
      if (f.cab?.length) parts.push(f.cab.join(" or "))
      if (f.bed?.length) parts.push(`${f.bed.join(" or ")} bed`)

      let line = `Fits ${parts.join(", ")}.`
      if (f.excludeTrims?.length) line += ` Not for ${f.excludeTrims.join(" or ")}.`
      if (f.notes) line += ` ${f.notes}`
      return line
    })
    .join(" ")
}

/**
 * Month and year of the oldest check among the products, e.g. "October 2026",
 * so "Fitment checked" holds for every product on the page.
 */
export function fitmentCheckedLabel(products: CatalogProduct[]): string | null {
  if (products.length === 0) return null
  const oldest = products.map((p) => p.verifiedAt).sort()[0]
  return new Date(`${oldest}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
}

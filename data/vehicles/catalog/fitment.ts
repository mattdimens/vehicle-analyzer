import type { CatalogProduct, Fitment, TruckConfigs } from "../types"

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

// ── "Your truck" filter ────────────────────────────────────────────────
//
// Pure and free of catalog imports, so client components can use it.

/** The visitor's truck.  A missing cab or bed means "any". */
export interface Truck {
  cab?: string
  bed?: string
}

export type TruckFit = { fits: true } | { fits: false; reason: string }

const unique = (values: string[]) => Array.from(new Set(values))

/**
 * Whether fitment entries (already narrowed to the make, model and years)
 * fit the truck.  An entry fits when it has no cab list or includes the cab,
 * and no bed list or includes the bed; one fitting entry is enough.  Says why
 * not, e.g. "Double Cab only" or "6-ft bed only".
 */
export function fitsTruckEntries(entries: Fitment[], truck: Truck): TruckFit {
  const cabOk = (f: Fitment) => !truck.cab || !f.cab?.length || f.cab.includes(truck.cab)
  const bedOk = (f: Fitment) => !truck.bed || !f.bed?.length || f.bed.includes(truck.bed)
  if (entries.some((f) => cabOk(f) && bedOk(f))) return { fits: true }

  const cabMatches = entries.filter(cabOk)
  if (cabMatches.length === 0) {
    return { fits: false, reason: `${unique(entries.flatMap((f) => f.cab ?? [])).join(" or ")} only` }
  }
  return { fits: false, reason: `${unique(cabMatches.flatMap((f) => f.bed ?? [])).join(" or ")} bed only` }
}

/** Whether a product fits the truck in these years, and why not when it doesn't. */
export function fitsTruck(
  product: CatalogProduct,
  make: string,
  model: string,
  years: YearRange,
  truck: Truck
): TruckFit {
  return fitsTruckEntries(fitmentFor(product, make, model, years), truck)
}

/** "Double Cab", "6-ft bed", "Double Cab with a 6-ft bed", or "" for any truck. */
export function describeTruck(truck: Truck): string {
  if (truck.cab && truck.bed) return `${truck.cab} with a ${truck.bed} bed`
  if (truck.cab) return truck.cab
  if (truck.bed) return `${truck.bed} bed`
  return ""
}

/** "a Double Cab", "an Access Cab", "a 6-ft bed" */
export function withArticle(phrase: string): string {
  return `${/^[aeiou]/i.test(phrase) ? "an" : "a"} ${phrase}`
}

/**
 * The card's fitment line once a truck is chosen and the product fits it:
 * "Fits your Access Cab." then the exclusions and notes of the entries that
 * fit, e.g. "Fits your Double Cab, 5-ft bed. Front bucket seats only."
 * Null when no truck is chosen or the product doesn't fit.
 */
export function truckFitLine(entries: Fitment[], truck: Truck): string | null {
  if (!truck.cab && !truck.bed) return null
  const fitting = entries.filter((f) => fitsTruckEntries([f], truck).fits)
  if (fitting.length === 0) return null

  const yours = [truck.cab, truck.bed && `${truck.bed} bed`].filter(Boolean).join(", ")
  const extras = unique(
    fitting.flatMap((f) => [
      f.excludeTrims?.length ? `Not for ${f.excludeTrims.join(" or ")}.` : "",
      f.notes ?? "",
    ])
  ).filter(Boolean)
  return [`Fits your ${yours}.`, ...extras].join(" ")
}

/** Lowercase letters and digits only: "Double-Cab" -> "doublecab" */
const squash = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "")

/**
 * The photo result's cab style and bed length in a generation's own words,
 * e.g. "double cab" -> "Double Cab" and `60.5" (Short)` -> "5-ft".  Anything
 * that doesn't match one of the generation's configs is dropped.
 */
export function normalizeTruck(
  configs: TruckConfigs,
  cabStyle: string | null | undefined,
  bedLength: string | null | undefined
): Truck {
  const truck: Truck = {}

  const cabKey = cabStyle ? squash(cabStyle) : ""
  if (cabKey) {
    truck.cab = configs.cabs.find((c) => {
      const config = squash(c)
      return cabKey === config || cabKey === config.replace(/cab$/, "")
    })
  }

  const bed = bedLength?.trim().toLowerCase() ?? ""
  if (bed) {
    // A number: feet when small, inches when large ("5-ft", "5 ft", "60.5\"", "73.7 in")
    const number = bed.match(/(\d+(?:\.\d+)?)/)
    let feet: number | undefined
    if (number) {
      const n = parseFloat(number[1])
      feet = n >= 36 ? Math.round(n / 12) : Math.round(n)
    }
    const byFeet = (ft: number) => configs.beds.find((b) => parseFloat(b) === ft)
    if (feet !== undefined) {
      truck.bed = byFeet(feet)
    } else if (configs.beds.length === 2) {
      // "Short bed" or "Long bed" only means something when there are two lengths
      const [short, long] = [...configs.beds].sort((a, b) => parseFloat(a) - parseFloat(b))
      if (/\bshort\b/.test(bed)) truck.bed = short
      else if (/\blong\b/.test(bed)) truck.bed = long
    }
  }

  if (!truck.cab) delete truck.cab
  if (!truck.bed) delete truck.bed
  return truck
}

/**
 * Supported Vehicles Config
 *
 * This is the single source of truth for vehicles with live catalog pages.
 * It drives:
 *   - Year/Make/Model selector routing
 *   - Which models the Browse by Vehicle section lists
 *   - Catalog stats bar counts
 *
 * Adding a new vehicle family requires only:
 *   1. Create the data file (e.g. data/vehicles/ford.ts)
 *   2. Import it in data/vehicles/index.ts
 *   3. Add an entry to this config
 *   No component code changes needed.
 */

export interface SupportedGeneration {
  /** First model year (inclusive) */
  yearStart: number
  /** Last model year (inclusive). Use a far-future year for "current" gens. */
  yearEnd: number
  /** URL slug matching the generation page, e.g. "4th-gen" */
  slug: string
  /** Short label, e.g. "4th Gen" */
  label: string
  /** Human-readable range for card display, e.g. "2024+" */
  displayRange: string
}

export interface SupportedVehicle {
  /** Display make name, e.g. "Toyota" */
  make: string
  /** Display model name, e.g. "Tacoma" */
  model: string
  /** Route base path, e.g. "/vehicles/toyota/tacoma" */
  routeBase: string
  /** Supported generations, ordered newest-first */
  generations: SupportedGeneration[]
}

/**
 * All vehicles with live catalog pages.
 *
 * Year boundaries determine which generation URL a selected year resolves to.
 * Use yearEnd: 2099 for the newest generation to capture future model years.
 */
export const supportedVehicles: SupportedVehicle[] = [
  {
    make: "Toyota",
    model: "Tacoma",
    routeBase: "/vehicles/toyota/tacoma",
    generations: [
      {
        yearStart: 2024,
        yearEnd: 2099,
        slug: "4th-gen",
        label: "4th Gen",
        displayRange: "2024+",
      },
      {
        yearStart: 2016,
        yearEnd: 2023,
        slug: "3rd-gen",
        label: "3rd Gen",
        displayRange: "2016-2023",
      },
      {
        yearStart: 2005,
        yearEnd: 2015,
        slug: "2nd-gen",
        label: "2nd Gen",
        displayRange: "2005-2015",
      },
      {
        yearStart: 1995,
        yearEnd: 2004,
        slug: "1st-gen",
        label: "1st Gen",
        displayRange: "1995-2004",
      },
    ],
  },
]

// ── Lookup helpers ─────────────────────────────────────────────────────

/**
 * Check if a make + model + year combination has a live catalog page.
 * Returns the full URL path if supported, null otherwise.
 *
 * Matching is case-insensitive on make and model names.
 */
export function resolveVehicleUrl(
  make: string,
  model: string,
  year: number
): string | null {
  const vehicle = supportedVehicles.find(
    (v) =>
      v.make.toLowerCase() === make.toLowerCase() &&
      v.model.toLowerCase() === model.toLowerCase()
  )
  if (!vehicle) return null

  const gen = vehicle.generations.find(
    (g) => year >= g.yearStart && year <= g.yearEnd
  )
  if (!gen) return null

  return `${vehicle.routeBase}/${gen.slug}`
}

/**
 * The catalog generation that holds every year from yearStart to yearEnd,
 * e.g. Toyota Tacoma 2016-2023 is entirely 3rd Gen. Null when the range
 * crosses a generation boundary or the vehicle has no catalog.
 *
 * Only the results page's curated-picks link uses this. resolveVehicleUrl()
 * (and analysis_completed's catalog_match) stay exact-year only.
 */
export function resolveCatalogGeneration(
  make: string,
  model: string,
  yearStart: number,
  yearEnd: number
): { href: string; label: string; model: string } | null {
  if (!Number.isFinite(yearStart) || !Number.isFinite(yearEnd) || yearStart > yearEnd) return null
  const vehicle = supportedVehicles.find(
    (v) =>
      v.make.toLowerCase() === make.trim().toLowerCase() &&
      v.model.toLowerCase() === model.trim().toLowerCase()
  )
  if (!vehicle) return null

  const gen = vehicle.generations.find(
    (g) => yearStart >= g.yearStart && yearEnd <= g.yearEnd
  )
  if (!gen) return null

  return { href: `${vehicle.routeBase}/${gen.slug}`, label: gen.label, model: vehicle.model }
}

/**
 * Check if a given make + model is a supported vehicle (any generation).
 */
export function isVehicleSupported(make: string, model: string): boolean {
  return supportedVehicles.some(
    (v) =>
      v.make.toLowerCase() === make.toLowerCase() &&
      v.model.toLowerCase() === model.toLowerCase()
  )
}

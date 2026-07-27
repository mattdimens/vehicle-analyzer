/**
 * Supported Vehicles Config
 *
 * This is the single source of truth for vehicles with live catalog pages.
 * It drives:
 *   - Year/Make/Model selector routing
 *   - Browse by Vehicle generation grid
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
  /** Descriptive card title for SEO, e.g. "4th Gen Toyota Tacoma Accessories (2024+)" */
  cardTitle: string
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
        cardTitle: "4th Gen Toyota Tacoma Accessories (2024+)",
      },
      {
        yearStart: 2016,
        yearEnd: 2023,
        slug: "3rd-gen",
        label: "3rd Gen",
        displayRange: "2016-2023",
        cardTitle: "3rd Gen Toyota Tacoma Accessories (2016-2023)",
      },
      {
        yearStart: 2005,
        yearEnd: 2015,
        slug: "2nd-gen",
        label: "2nd Gen",
        displayRange: "2005-2015",
        cardTitle: "2nd Gen Toyota Tacoma Accessories (2005-2015)",
      },
      {
        yearStart: 1995,
        yearEnd: 2004,
        slug: "1st-gen",
        label: "1st Gen",
        displayRange: "1995-2004",
        cardTitle: "1st Gen Toyota Tacoma Accessories (1995-2004)",
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
 * Flat list of all supported generation cards for the Browse by Vehicle grid.
 */
export function getSupportedGenerationCards(): Array<
  SupportedGeneration & { make: string; model: string; href: string }
> {
  return supportedVehicles.flatMap((v) =>
    v.generations.map((g) => ({
      ...g,
      make: v.make,
      model: v.model,
      href: `${v.routeBase}/${g.slug}`,
    }))
  )
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

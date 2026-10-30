/**
 * Vehicle Data Registry
 *
 * Central module that imports all make data files and exposes lookup
 * functions consumed by route pages, components, and the sitemap.
 *
 * Adding a new make:
 *   1. Create data/vehicles/{make}.ts exporting a VehicleMake.
 *   2. Import it here and add it to the `makes` array.
 *   That's it -- routes, sitemap, and components pick it up automatically.
 */

import type {
  VehicleMake,
  VehicleModel,
  VehicleGeneration,
} from "./types"

// ── Make imports ───────────────────────────────────────────────────────
import { toyota } from "./toyota"

/** Master list of all registered makes. */
const makes: VehicleMake[] = [toyota]

// ── Lookup helpers ─────────────────────────────────────────────────────

export function getAllMakes(): VehicleMake[] {
  return makes
}

export function getMakeBySlug(slug: string): VehicleMake | undefined {
  return makes.find((m) => m.slug === slug)
}

export function getModelBySlug(
  makeSlug: string,
  modelSlug: string
): { make: VehicleMake; model: VehicleModel } | undefined {
  const make = getMakeBySlug(makeSlug)
  if (!make) return undefined
  const model = make.models.find((m) => m.slug === modelSlug)
  if (!model) return undefined
  return { make, model }
}

export function getGenerationBySlug(
  makeSlug: string,
  modelSlug: string,
  genSlug: string
): {
  make: VehicleMake
  model: VehicleModel
  generation: VehicleGeneration
} | undefined {
  const result = getModelBySlug(makeSlug, modelSlug)
  if (!result) return undefined
  const generation = result.model.generations.find((g) => g.slug === genSlug)
  if (!generation) return undefined
  return { ...result, generation }
}

// ── Years ──────────────────────────────────────────────────────────────

/** Every model year the generations cover, newest first. */
export function modelYears(generations: VehicleGeneration[]): number[] {
  const years = new Set<number>()
  for (const g of generations) {
    for (let y = g.yearStart; y <= g.yearEnd; y++) years.add(y)
  }
  return Array.from(years).sort((a, b) => b - a)
}

/** The generation a model year belongs to. */
export function generationForYear(
  generations: VehicleGeneration[],
  year: number
): VehicleGeneration | undefined {
  return generations.find((g) => year >= g.yearStart && year <= g.yearEnd)
}

// ── Generation specs ───────────────────────────────────────────────────

export const SPEC_ROWS = [
  { key: "cabs", label: "Cabs" },
  { key: "beds", label: "Beds" },
  { key: "engines", label: "Engines" },
  { key: "carriesOver", label: "What carries over" },
] as const

/** The comparison rows every generation has a value for, in table order. */
export function completeSpecRows(generations: VehicleGeneration[]) {
  return SPEC_ROWS.filter((row) => generations.every((g) => g.specs?.[row.key]?.trim()))
}

// ── Route enumeration (for generateStaticParams & sitemap) ─────────────

export interface VehicleRoute {
  make: string
  model?: string
  generation?: string
}

/** Flat list of every registered vehicle route. */
export function getAllVehicleRoutes(): VehicleRoute[] {
  const routes: VehicleRoute[] = []

  for (const make of makes) {
    routes.push({ make: make.slug })

    for (const model of make.models) {
      routes.push({ make: make.slug, model: model.slug })

      for (const gen of model.generations) {
        routes.push({
          make: make.slug,
          model: model.slug,
          generation: gen.slug,
        })
      }
    }
  }

  return routes
}

// ── /go URL builder ────────────────────────────────────────────────────

export interface GoUrlParams {
  categorySlug: string
  vehicleString: string
  brand?: string
  productTitle: string
  /** Amazon product ID for catalog products; without it /go links to a search */
  asin?: string
}

/**
 * Build a /go redirect URL with structured query params.
 * All values are URL-encoded.  The returned path is relative (starts
 * with /go?...) so it works with Next.js Link.
 */
export function buildGoUrl({
  categorySlug,
  vehicleString,
  brand,
  productTitle,
  asin,
}: GoUrlParams): string {
  const params = new URLSearchParams()
  params.set("cat", categorySlug)
  params.set("vehicle", vehicleString)
  if (brand) params.set("brand", brand)
  params.set("product", productTitle)
  if (asin) params.set("asin", asin)
  params.set("source", "vehicle-page")
  return `/go?${params.toString()}`
}

// ── Supported vehicles ─────────────────────────────────────────────────

export { supportedVehicles } from "./supported-vehicles"
export type { SupportedVehicle, SupportedGeneration } from "./supported-vehicles"

// Catalog queries and getCatalogStats live in ./catalog, which only server
// code imports (see the note at the top of ./catalog/index.ts).

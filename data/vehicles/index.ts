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
}: GoUrlParams): string {
  const params = new URLSearchParams()
  params.set("cat", categorySlug)
  params.set("vehicle", vehicleString)
  if (brand) params.set("brand", brand)
  params.set("product", productTitle)
  params.set("source", "vehicle-page")
  return `/go?${params.toString()}`
}

// ── Catalog stats ──────────────────────────────────────────────────────

export { supportedVehicles, getSupportedGenerationCards } from "./supported-vehicles"
export type { SupportedVehicle, SupportedGeneration } from "./supported-vehicles"

/**
 * Compute verifiable catalog stats from actual registered vehicle data.
 *
 * Counts every product rendered on live generation pages and the set of
 * unique category slugs across all generations.  These numbers appear in
 * the homepage stats bar and must match a manual count.
 *
 * Derivation (current):
 *   4 Tacoma generations x 8 categories x 3 products = 96 products
 *   8 unique category slugs
 *   4 generations
 */
export function getCatalogStats(): {
  totalProducts: number
  totalCategories: number
  totalGenerations: number
} {
  let totalProducts = 0
  let totalGenerations = 0
  const categorySet = new Set<string>()

  for (const make of makes) {
    for (const model of make.models) {
      for (const gen of model.generations) {
        totalGenerations++
        for (const cat of gen.categories) {
          categorySet.add(cat.slug)
          totalProducts += cat.products.length
        }
      }
    }
  }

  return {
    totalProducts,
    totalCategories: categorySet.size,
    totalGenerations,
  }
}

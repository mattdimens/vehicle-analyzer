/**
 * Catalog rules.  data/vehicles/catalog/index.ts runs these when it loads,
 * so a research import that breaks one fails the build (and npm test).
 * The rules come from docs/vehicle-pages-plan.md, sections 4.3 and 5.
 */
import { normalizeAsin } from "@/lib/affiliate/merchants"
import { productTypes, SKIPPED_PRODUCT_TYPES } from "../product-types"
import type { CatalogProduct, PickRole, VehicleCatalog, VehicleMake } from "../types"
import { fitmentFor } from "./fitment"

export const MIN_PICKS = 3
export const MAX_PICKS = 5
export const MAX_PICKS_PER_BRAND = 2
/** Distinct products a model needs across generations for a product-type page. */
export const MIN_PRODUCT_TYPE_PAGE_PRODUCTS = 6
export const MIN_BUYING_NOTES = 3

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
const SINGLE_ROLES: PickRole[] = ["best-overall", "budget", "premium"]

/** A real calendar date written as YYYY-MM-DD.  Date.parse turns 2026-02-31 into March 3. */
function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

/** Every rule the catalog breaks, as readable messages.  Empty means valid. */
export function validateCatalog(
  catalog: VehicleCatalog,
  makes: VehicleMake[],
  today: Date = new Date()
): string[] {
  const errors: string[] = []
  const typeSlugs = new Set(productTypes.map((t) => t.slug))
  const todayIso = today.toISOString().slice(0, 10)
  const findModel = (make: string, model: string) =>
    makes.find((m) => m.slug === make)?.models.find((m) => m.slug === model)

  // Products
  const productsById = new Map<string, CatalogProduct>()
  const productIdByAsin = new Map<string, string>()
  for (const p of catalog.products) {
    const where = `product ${p.id}`
    if (!SLUG.test(p.id)) errors.push(`${where}: id must be a lowercase slug`)
    if (productsById.has(p.id)) errors.push(`${where}: duplicate id`)
    productsById.set(p.id, p)

    if (normalizeAsin(p.asin) !== p.asin) {
      errors.push(`${where}: ASIN "${p.asin}" must be 10 uppercase letters or digits`)
    } else if (productIdByAsin.has(p.asin)) {
      errors.push(`${where}: ASIN ${p.asin} is also used by ${productIdByAsin.get(p.asin)}`)
    } else {
      productIdByAsin.set(p.asin, p.id)
    }

    if (!typeSlugs.has(p.category)) errors.push(`${where}: unknown product type "${p.category}"`)
    if (SKIPPED_PRODUCT_TYPES.has(p.category)) {
      errors.push(`${where}: ${p.category} is a skipped product type (see SKIPPED_PRODUCT_TYPES)`)
    }
    if (!p.brand.trim() || !p.name.trim()) errors.push(`${where}: brand and name are required`)
    if (!p.why.trim()) errors.push(`${where}: why is required`)
    if (p.sources.length === 0 || p.sources.some((s) => !/^https?:\/\//.test(s))) {
      errors.push(`${where}: needs at least one source, and every source must be an http(s) URL`)
    }
    if (!isCalendarDate(p.verifiedAt)) {
      errors.push(`${where}: verifiedAt must be a real YYYY-MM-DD date`)
    } else if (p.verifiedAt > todayIso) {
      errors.push(`${where}: verifiedAt ${p.verifiedAt} is in the future`)
    }

    if (p.fitment.length === 0) errors.push(`${where}: needs at least one fitment entry`)
    for (const f of p.fitment) {
      const goodYears =
        Number.isInteger(f.yearStart) &&
        Number.isInteger(f.yearEnd) &&
        f.yearStart >= 1950 &&
        f.yearEnd <= 2100 &&
        f.yearStart <= f.yearEnd
      if (!goodYears) errors.push(`${where}: bad fitment years ${f.yearStart}-${f.yearEnd}`)
    }
  }

  // Picks
  const sectionKeys = new Set<string>()
  for (const s of catalog.picks) {
    const where = `picks ${s.make}/${s.model}/${s.generation}/${s.category}`
    const key = `${s.make}/${s.model}/${s.generation}/${s.category}`
    if (sectionKeys.has(key)) errors.push(`${where}: duplicate section`)
    sectionKeys.add(key)

    const generation = findModel(s.make, s.model)?.generations.find((g) => g.slug === s.generation)
    if (!generation) {
      errors.push(`${where}: unknown make, model or generation`)
      continue
    }
    if (!typeSlugs.has(s.category)) errors.push(`${where}: unknown product type`)
    if (s.picks.length < MIN_PICKS || s.picks.length > MAX_PICKS) {
      errors.push(`${where}: needs ${MIN_PICKS} to ${MAX_PICKS} picks, has ${s.picks.length}`)
    }

    const roleCounts = new Map<PickRole, number>()
    const brandCounts = new Map<string, number>()
    const pickedIds = new Set<string>()
    for (const pick of s.picks) {
      const product = productsById.get(pick.productId)
      if (!product) {
        errors.push(`${where}: unknown product ${pick.productId}`)
        continue
      }
      if (pickedIds.has(product.id)) errors.push(`${where}: ${product.id} is picked twice`)
      pickedIds.add(product.id)

      if (product.status !== "active") errors.push(`${where}: ${product.id} is retired`)
      if (product.category !== s.category) {
        errors.push(`${where}: ${product.id} is a ${product.category} product`)
      }
      const entries = fitmentFor(product, s.make, s.model, generation)
      if (entries.length === 0) {
        errors.push(`${where}: ${product.id} has no fitment for ${generation.displayRange}`)
      }
      // A cab or bed the filter doesn't offer would hide the product for everyone who picks a truck
      if (generation.configs) {
        const { cabs, beds } = generation.configs
        for (const f of entries) {
          for (const cab of f.cab ?? []) {
            if (!cabs.includes(cab)) {
              errors.push(`${where}: ${product.id} cab "${cab}" is not one of ${generation.label}'s cabs (${cabs.join(", ")})`)
            }
          }
          for (const bed of f.bed ?? []) {
            if (!beds.includes(bed)) {
              errors.push(`${where}: ${product.id} bed "${bed}" is not one of ${generation.label}'s beds (${beds.join(", ")})`)
            }
          }
        }
      }
      if (pick.role === "best-for" && !pick.label?.trim()) {
        errors.push(`${where}: best-for pick ${product.id} needs a label`)
      }

      roleCounts.set(pick.role, (roleCounts.get(pick.role) ?? 0) + 1)
      brandCounts.set(product.brand, (brandCounts.get(product.brand) ?? 0) + 1)
    }

    for (const role of SINGLE_ROLES) {
      if ((roleCounts.get(role) ?? 0) > 1) errors.push(`${where}: more than one ${role} pick`)
    }
    for (const [brand, count] of brandCounts) {
      if (count > MAX_PICKS_PER_BRAND) {
        errors.push(`${where}: ${count} picks from ${brand}, max ${MAX_PICKS_PER_BRAND}`)
      }
    }
  }

  // Product-type guides
  const guideKeys = new Set<string>()
  for (const g of catalog.guides) {
    const where = `guide ${g.make}/${g.model}/${g.category}`
    const key = `${g.make}/${g.model}/${g.category}`
    if (guideKeys.has(key)) errors.push(`${where}: duplicate guide`)
    guideKeys.add(key)

    if (!findModel(g.make, g.model)) errors.push(`${where}: unknown make or model`)
    if (!typeSlugs.has(g.category)) errors.push(`${where}: unknown product type`)
    if (!g.intro.trim()) errors.push(`${where}: intro is required`)
    if (g.buyingNotes.filter((n) => n.trim()).length < MIN_BUYING_NOTES) {
      errors.push(`${where}: needs at least ${MIN_BUYING_NOTES} buying notes`)
    }
  }

  return errors
}

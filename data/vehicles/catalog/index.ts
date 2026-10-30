/**
 * Product catalog: researched Amazon products and where they appear.
 *
 * Server-side only.  components/ui/site-header.tsx is a client component that
 * imports data/vehicles/index, so anything that module imports ships to every
 * browser.  Keep the catalog out of it, and import this module only from
 * server components, route handlers and the sitemap.
 *
 * Adding a model's research:
 *   1. Create data/vehicles/catalog/{make}-{model}.ts exporting a VehicleCatalog.
 *   2. Add it to `catalogs` below.
 * The build fails if the data breaks a rule in validate.ts.
 */

import { getAllMakes } from "../index"
import { getProductType, productTypes } from "../product-types"
import type { ProductType } from "../product-types"
import type {
  CatalogProduct,
  Pick,
  PickRole,
  ProductTypeGuide,
  VehicleCatalog,
  VehicleCategory,
  VehicleGeneration,
  VehicleMake,
  VehicleModel,
} from "../types"
import { MIN_PRODUCT_TYPE_PAGE_PRODUCTS, validateCatalog } from "./validate"

// ── Model imports ──────────────────────────────────────────────────────
import { toyotaTacoma } from "./toyota-tacoma"

const catalogs: VehicleCatalog[] = [toyotaTacoma]

// ── Query results ──────────────────────────────────────────────────────

export interface ResolvedPick {
  pick: Pick
  product: CatalogProduct
}

/** One product type's picks on a generation page. */
export interface ProductTypeSection {
  productType: ProductType
  picks: ResolvedPick[]
  note?: string
  /** The model's guide for this product type, when one exists (its buying notes) */
  guide?: ProductTypeGuide
}

/** One generation's picks on a product-type page. */
export interface GenerationSection {
  generation: VehicleGeneration
  picks: ResolvedPick[]
  note?: string
}

export interface ProductTypePageData {
  make: VehicleMake
  model: VehicleModel
  productType: ProductType
  guide: ProductTypeGuide
  /** Generations with picks, newest first */
  sections: GenerationSection[]
}

export interface FeaturedPicks {
  /** Generation with the most product types researched (newest on a tie) */
  generation: VehicleGeneration
  /** The lead pick (best overall when there is one) for each product type */
  items: { productType: ProductType; resolved: ResolvedPick }[]
}

export interface ProductTypeRoute {
  make: string
  model: string
  productType: string
}

// ── Pick order ─────────────────────────────────────────────────────────

const ROLE_ORDER: Record<PickRole, number> = {
  "best-overall": 0,
  budget: 1,
  premium: 2,
  "best-for": 3,
}

/**
 * Display order for a section's picks: best overall, best budget, premium,
 * then the "best for" picks in data order.
 */
export function orderPicks<T extends { pick: Pick }>(picks: T[]): T[] {
  // Array.prototype.sort is stable, so "best for" picks keep their data order.
  return [...picks].sort((a, b) => ROLE_ORDER[a.pick.role] - ROLE_ORDER[b.pick.role])
}

// ── Placeholders beside researched picks ───────────────────────────────

/**
 * Link text for a placeholder search: the title without its "Budget" or
 * "Premium" prefix, e.g. "Budget mud flaps" -> "Mud flaps".  Only the visible
 * text changes; the /go link keeps the full title.
 */
export function placeholderLinkLabel(title: string): string {
  const label = title.replace(/^(budget|premium)\s+/i, "")
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** Items that don't stand in for one of the researched product types. */
export function withoutResearched<T extends { productType?: string }>(
  items: T[],
  researched: ReadonlySet<string>
): T[] {
  return items.filter((item) => !item.productType || !researched.has(item.productType))
}

/**
 * The placeholder categories a page still shows below its researched picks:
 * placeholders for a researched product type are left out, and so is any
 * category left empty.
 */
export function remainingPlaceholders(
  categories: VehicleCategory[],
  researched: ReadonlySet<string>
): VehicleCategory[] {
  return categories.flatMap((cat) => {
    const products = withoutResearched(cat.products, researched)
    return products.length > 0 ? [{ ...cat, products }] : []
  })
}

// ── Queries ────────────────────────────────────────────────────────────

/** Queries over a catalog.  Exported so tests can run them on fixture data. */
export function createCatalogQueries(catalog: VehicleCatalog, makes: VehicleMake[]) {
  const productsById = new Map(catalog.products.map((p) => [p.id, p]))
  const productsByAsin = new Map(catalog.products.map((p) => [p.asin, p]))
  const typeOrder = new Map(productTypes.map((t, i) => [t.slug, i]))

  function findModel(makeSlug: string, modelSlug: string) {
    const make = makes.find((m) => m.slug === makeSlug)
    const model = make?.models.find((m) => m.slug === modelSlug)
    return make && model ? { make, model } : undefined
  }

  function resolve(picks: Pick[]): ResolvedPick[] {
    return orderPicks(
      picks.flatMap((pick) => {
        const product = productsById.get(pick.productId)
        return product ? [{ pick, product }] : []
      })
    )
  }

  function findGuide(makeSlug: string, modelSlug: string, typeSlug: string) {
    return catalog.guides.find(
      (g) => g.make === makeSlug && g.model === modelSlug && g.category === typeSlug
    )
  }

  /** Product-type sections for a generation page, in product-type order. */
  function getGenerationSections(
    makeSlug: string,
    modelSlug: string,
    generationSlug: string
  ): ProductTypeSection[] {
    return catalog.picks
      .filter(
        (s) => s.make === makeSlug && s.model === modelSlug && s.generation === generationSlug
      )
      .flatMap((s) => {
        const productType = getProductType(s.category)
        if (!productType) return []
        const guide = findGuide(makeSlug, modelSlug, s.category)
        return [{ productType, picks: resolve(s.picks), note: s.note, guide }]
      })
      .sort(
        (a, b) =>
          (typeOrder.get(a.productType.slug) ?? 0) - (typeOrder.get(b.productType.slug) ?? 0)
      )
  }

  /**
   * A product-type page, or undefined until it meets the bar: a guide and at
   * least MIN_PRODUCT_TYPE_PAGE_PRODUCTS distinct products across generations.
   */
  function getProductTypePage(
    makeSlug: string,
    modelSlug: string,
    typeSlug: string
  ): ProductTypePageData | undefined {
    const found = findModel(makeSlug, modelSlug)
    const productType = getProductType(typeSlug)
    const guide = findGuide(makeSlug, modelSlug, typeSlug)
    if (!found || !productType || !guide) return undefined

    const sections = found.model.generations.flatMap((generation) => {
      const s = catalog.picks.find(
        (p) =>
          p.make === makeSlug &&
          p.model === modelSlug &&
          p.generation === generation.slug &&
          p.category === typeSlug
      )
      return s ? [{ generation, picks: resolve(s.picks), note: s.note }] : []
    })

    const productIds = new Set(sections.flatMap((s) => s.picks.map((r) => r.product.id)))
    if (productIds.size < MIN_PRODUCT_TYPE_PAGE_PRODUCTS) return undefined

    return { ...found, productType, guide, sections }
  }

  /** Product types that have a page for this model, in product-type order. */
  function getProductTypePages(makeSlug: string, modelSlug: string): ProductType[] {
    return productTypes.filter((t) => getProductTypePage(makeSlug, modelSlug, t.slug))
  }

  /** Every product-type page (for generateStaticParams and the sitemap). */
  function getProductTypeRoutes(): ProductTypeRoute[] {
    return makes.flatMap((make) =>
      make.models.flatMap((model) =>
        getProductTypePages(make.slug, model.slug).map((t) => ({
          make: make.slug,
          model: model.slug,
          productType: t.slug,
        }))
      )
    )
  }

  /**
   * One lead pick per product type, from the generation with the most product
   * types researched (newest on a tie), so a partly researched generation
   * doesn't thin out the model hub.
   */
  function getFeaturedPicks(makeSlug: string, modelSlug: string): FeaturedPicks | undefined {
    const found = findModel(makeSlug, modelSlug)
    if (!found) return undefined

    let best: { generation: VehicleGeneration; sections: ProductTypeSection[] } | undefined
    for (const generation of found.model.generations) {
      const sections = getGenerationSections(makeSlug, modelSlug, generation.slug)
      if (sections.length > (best?.sections.length ?? 0)) best = { generation, sections }
    }
    if (!best) return undefined

    const items = best.sections.flatMap((s) => {
      const resolved = s.picks.find((r) => r.pick.role === "best-overall") ?? s.picks[0]
      return resolved ? [{ productType: s.productType, resolved }] : []
    })
    return { generation: best.generation, items }
  }

  function getCatalogProductByAsin(asin: string): CatalogProduct | undefined {
    return productsByAsin.get(asin)
  }

  /**
   * Verifiable catalog stats for the homepage stats bar.
   *
   * Products count only researched catalog products shown on generation
   * pages, not the placeholder template.  Categories count what generation
   * pages actually show: catalog product types plus the placeholder
   * categories still shown below them.
   */
  function getCatalogStats(): {
    totalProducts: number
    totalCategories: number
    totalGenerations: number
  } {
    const products = new Set<string>()
    const categories = new Set<string>()
    let totalGenerations = 0

    for (const make of makes) {
      for (const model of make.models) {
        for (const gen of model.generations) {
          totalGenerations++
          const sections = getGenerationSections(make.slug, model.slug, gen.slug)
          for (const s of sections) {
            categories.add(s.productType.slug)
            for (const r of s.picks) products.add(r.product.id)
          }
          const researched = new Set(sections.map((s) => s.productType.slug))
          for (const cat of remainingPlaceholders(gen.categories, researched)) {
            categories.add(cat.slug)
          }
        }
      }
    }

    return {
      totalProducts: products.size,
      totalCategories: categories.size,
      totalGenerations,
    }
  }

  return {
    getGenerationSections,
    getProductTypePage,
    getProductTypePages,
    getProductTypeRoutes,
    getFeaturedPicks,
    getCatalogProductByAsin,
    getCatalogStats,
  }
}

// ── The site's catalog ─────────────────────────────────────────────────

export const catalog: VehicleCatalog = {
  products: catalogs.flatMap((c) => c.products),
  picks: catalogs.flatMap((c) => c.picks),
  guides: catalogs.flatMap((c) => c.guides),
}

const catalogErrors = validateCatalog(catalog, getAllMakes())
if (catalogErrors.length > 0) {
  throw new Error(`Invalid product catalog (data/vehicles/catalog):\n${catalogErrors.join("\n")}`)
}

export const {
  getGenerationSections,
  getProductTypePage,
  getProductTypePages,
  getProductTypeRoutes,
  getFeaturedPicks,
  getCatalogProductByAsin,
  getCatalogStats,
} = createCatalogQueries(catalog, getAllMakes())

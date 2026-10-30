/**
 * Vehicle Data Schema
 *
 * Hierarchy: Make > Model > Generation > Category > Product
 *
 * Every vehicle-specific value lives in data files that implement these
 * interfaces.  Components consume the types; they never hardcode vehicle
 * data.  Adding a new model means adding one data file and importing it
 * into the registry -- zero component or route changes.
 */

// ── Product ────────────────────────────────────────────────────────────

export interface VehicleProduct {
  /** Display title, e.g. "Tri-fold tonneau cover" */
  title: string
  /** Optional brand name, e.g. "BAK" */
  brand?: string
  /**
   * One-line editorial blurb.  REQUIRED and must be non-empty for every
   * product, including placeholders.
   */
  blurb: string
  /**
   * Optional local image path (relative to /public).  Never an Amazon or
   * scraped URL.  When absent the UI renders a brand + category icon
   * placeholder.
   */
  image?: string
  /**
   * Product type slug (data/vehicles/product-types.ts) this placeholder
   * stands in for.  Once a page shows researched picks of that type, the
   * placeholder is left out.
   */
  productType?: string
}

// ── Category ───────────────────────────────────────────────────────────

export interface VehicleCategory {
  /** URL slug, e.g. "bed" */
  slug: string
  /** Display name, e.g. "Bed & Tailgate" */
  name: string
  /** Products in this category for the given generation */
  products: VehicleProduct[]
}

// ── Popular Item (editorial or aggregated) ─────────────────────────────

export interface PopularItem {
  /** Product display title */
  title: string
  /** Optional brand */
  brand?: string
  /** One-line blurb */
  blurb: string
  /**
   * "editorial" = hand-curated seed data.
   * "aggregated" = future Supabase-backed real data.
   * Components can render a label based on this flag.
   */
  source: "editorial" | "aggregated"
  /** Slug of the parent category, used for /go link building */
  categorySlug: string
  /** Product type this item stands in for, as on VehicleProduct */
  productType?: string
}

// ── Generation ─────────────────────────────────────────────────────────

export interface VehicleGeneration {
  /** URL slug, e.g. "4th-gen" */
  slug: string
  /** Short label, e.g. "4th Gen" */
  label: string
  /** First model year (inclusive) */
  yearStart: number
  /** Last model year (inclusive) */
  yearEnd: number
  /** Human-readable range, e.g. "2024-2026" */
  displayRange: string
  /** 2-3 sentence intro specific to this generation */
  intro: string
  /** Accessory categories for this generation */
  categories: VehicleCategory[]
  /** Editorially curated popular picks for this generation */
  popular: PopularItem[]
  /**
   * Fitment questions shown as plain text on the generation page.  Matt
   * confirms every answer.  No FAQPage markup without his sign-off.
   */
  faqs?: { q: string; a: string }[]
  /**
   * Cab styles and bed lengths sold in this generation, written exactly as
   * Fitment.cab and Fitment.bed are ("Double Cab", "5-ft").  The "Your
   * truck" filter only shows when a generation has them.
   */
  configs?: TruckConfigs
  /**
   * Facts for the model hub's "How the generations differ" table.  Matt
   * signs off on every value; a row only shows once every generation of
   * the model has it.
   */
  specs?: GenerationSpecs
}

/** One generation's column in the model hub's comparison table. */
export interface GenerationSpecs {
  /** e.g. "Access Cab, Double Cab" */
  cabs?: string
  /** e.g. "5-ft, 6-ft" */
  beds?: string
  /** e.g. "2.4L turbo four-cylinder, i-FORCE MAX hybrid" */
  engines?: string
  /** What fits from or to the neighboring generations */
  carriesOver?: string
}

/** The cab and bed choices for a generation's "Your truck" filter. */
export interface TruckConfigs {
  cabs: string[]
  beds: string[]
}

// ── Model ──────────────────────────────────────────────────────────────

export interface VehicleModel {
  /** URL slug, e.g. "tacoma" */
  slug: string
  /** Display name, e.g. "Tacoma" */
  name: string
  /** H1 heading for the model hub, e.g. "Toyota Tacoma Accessories" */
  h1: string
  /** 2-3 sentence intro commentary for the model hub */
  intro: string
  /** All generations for this model, ordered newest-first */
  generations: VehicleGeneration[]
}

// ── Make ───────────────────────────────────────────────────────────────

export interface VehicleMake {
  /** URL slug, e.g. "toyota" */
  slug: string
  /** Display name, e.g. "Toyota" */
  name: string
  /** All models under this make */
  models: VehicleModel[]
}

// ── Catalog: researched products ───────────────────────────────────────
//
// Real Amazon products live in data/vehicles/catalog/, one file per model.
// Each product is stored once with its fitment; picks place it on a
// generation page in a role.  Research flow and rules:
// docs/vehicle-pages-plan.md, section 4.

/** Rough price tier.  Real prices need the Amazon API (plan section 7). */
export type PriceBand = "budget" | "mid" | "premium"

export interface Fitment {
  /** Make slug, e.g. "toyota" */
  make: string
  /** Model slug, e.g. "tacoma" */
  model: string
  /** First model year (inclusive) */
  yearStart: number
  /** Last model year (inclusive) */
  yearEnd: number
  /** Cab styles it fits, as displayed, e.g. ["Double Cab"].  Omitted = all. */
  cab?: string[]
  /** Bed lengths it fits, as displayed, e.g. ["5-ft"].  Omitted = all. */
  bed?: string[]
  /** Trims it does not fit, as displayed, e.g. ["TRD Pro"] */
  excludeTrims?: string[]
  /** Install or compatibility note, e.g. "Drilling required." */
  notes?: string
}

export interface CatalogProduct {
  /** Stable lowercase slug, unique across the catalog */
  id: string
  /** Amazon ASIN: 10 uppercase letters or digits */
  asin: string
  /** Brand, e.g. "BAK" */
  brand: string
  /** Product name without the brand, e.g. "BAKFlip MX4" */
  name: string
  /** Product type slug from data/vehicles/product-types.ts */
  category: string
  priceBand: PriceBand
  /** Every vehicle and year range the manufacturer confirms */
  fitment: Fitment[]
  /** Why we pick it: 1-2 sentences specific to the vehicle */
  why: string
  /** A catch owners should know before buying */
  gotcha?: string
  /** Fitment guide and owner-source URLs */
  sources: string[]
  /** Date the Amazon listing and fitment were last checked, YYYY-MM-DD */
  verifiedAt: string
  /** Retired products can't be picked, and /go sends old links to a search. */
  status: "active" | "retired"
}

export type PickRole = "best-overall" | "budget" | "premium" | "best-for"

export interface Pick {
  productId: string
  role: PickRole
  /** Required for "best-for", e.g. "Best for the 6-ft bed" */
  label?: string
}

/** The 3-5 picks for one product type on one generation page. */
export interface VehiclePicks {
  /** Make slug */
  make: string
  /** Model slug */
  model: string
  /** Generation slug, e.g. "3rd-gen" */
  generation: string
  /** Product type slug */
  category: string
  picks: Pick[]
  /** A fitment catch for this generation, shown above the picks */
  note?: string
}

/**
 * Vehicle-specific copy for a product-type page, e.g. Tacoma bed racks.
 * The page only exists once it has a guide (and enough products).
 */
export interface ProductTypeGuide {
  /** Make slug */
  make: string
  /** Model slug */
  model: string
  /** Product type slug */
  category: string
  /** 1-3 sentences under the H1, also the meta description */
  intro: string
  /** At least 3 buying notes specific to this vehicle */
  buyingNotes: string[]
}

/** Everything researched for one model. */
export interface VehicleCatalog {
  products: CatalogProduct[]
  picks: VehiclePicks[]
  guides: ProductTypeGuide[]
}

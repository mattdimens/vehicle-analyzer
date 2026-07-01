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

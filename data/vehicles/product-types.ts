/**
 * Product types for catalog picks and /vehicles/{make}/{model}/{type} pages.
 *
 * Listed in order of search demand (Ahrefs, Oct 2026, see
 * docs/research/vehicle-accessory-demand-2026-10.csv), which is the order
 * sections appear on generation pages.  Product-type slugs share a URL level
 * with generation slugs, so they must never collide (unit-tested).
 */

export interface ProductType {
  /** URL slug, e.g. "bed-covers" */
  slug: string
  /** Display name, e.g. "Bed & Tonneau Covers" */
  name: string
  /** Emoji placeholder, like the legacy category icons */
  icon: string
  /** Related blog post slug */
  guideSlug?: string
  /** Photo tool page for this product type */
  toolHref?: string
}

export const productTypes: ProductType[] = [
  {
    slug: "bed-covers",
    name: "Bed & Tonneau Covers",
    icon: "🛻",
    guideSlug: "choosing-the-right-tonneau-cover",
    toolHref: "/truck-bed-covers",
  },
  { slug: "bed-racks", name: "Bed Racks", icon: "🏕️" },
  { slug: "front-bumpers", name: "Front Bumpers & Skid Plates", icon: "🛡️" },
  {
    slug: "wheels",
    name: "Wheels",
    icon: "🛞",
    guideSlug: "what-is-wheel-offset",
    toolHref: "/wheels-rims",
  },
  { slug: "roof-racks", name: "Roof Racks", icon: "🏔️" },
  { slug: "headlights", name: "Headlights & Tail Lights", icon: "💡" },
  {
    slug: "running-boards",
    name: "Running Boards & Rock Sliders",
    icon: "🪜",
    guideSlug: "running-boards-buying-guide",
    toolHref: "/nerf-bars-running-boards",
  },
  {
    slug: "lift-kits",
    name: "Lift & Leveling Kits",
    icon: "🔧",
    guideSlug: "leveling-kit-vs-lift-kit",
  },
  { slug: "seat-covers", name: "Seat Covers", icon: "🪑" },
  { slug: "floor-mats", name: "Floor Mats & Liners", icon: "🧽" },
]

/**
 * Product types we don't research or pick for: Matt works at RealTruck, so
 * bed and tonneau covers stay out to avoid a conflict of interest
 * (docs/vehicle-pages-plan.md, section 4.3).  Pages leave them out of
 * "coming soon" and "researching next".
 */
export const SKIPPED_PRODUCT_TYPES: ReadonlySet<string> = new Set(["bed-covers"])

export function getProductType(slug: string): ProductType | undefined {
  return productTypes.find((t) => t.slug === slug)
}

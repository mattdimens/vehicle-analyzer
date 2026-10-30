import {
  Armchair,
  Disc3,
  Footprints,
  Grid2x2,
  Lightbulb,
  MoveUp,
  Package,
  Shield,
  Tent,
  Truck,
  Mountain,
  type LucideIcon,
} from "lucide-react"

/**
 * Icons for product types on the vehicle pages, keyed by product-type slug.
 * The emoji `icon` field in data/vehicles/product-types.ts stays for other code.
 */
const productTypeIcons: Record<string, LucideIcon> = {
  "bed-covers": Truck,
  "bed-racks": Tent,
  "front-bumpers": Shield,
  wheels: Disc3,
  "roof-racks": Mountain,
  headlights: Lightbulb,
  "running-boards": Footprints,
  "lift-kits": MoveUp,
  "seat-covers": Armchair,
  "floor-mats": Grid2x2,
}

export function ProductTypeIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = productTypeIcons[slug] ?? Package
  return <Icon className={className} aria-hidden="true" />
}

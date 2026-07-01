import { buildGoUrl } from "@/data/vehicles/index"
import { ProductCard } from "./product-card"
import type { VehicleCategory } from "@/data/vehicles/types"

interface CategorySectionProps {
  category: VehicleCategory
  /**
   * Vehicle string for /go links.
   * Model hub: "Toyota Tacoma"
   * Generation page: "2024-2026 Toyota Tacoma"
   */
  vehicleString: string
}

/** Category icon mapping using simple emoji/text fallbacks */
const categoryIcons: Record<string, string> = {
  bed: "🛻",
  "bed-rail": "🔩",
  interior: "🪑",
  exterior: "🎨",
  "off-road": "🏔️",
  lighting: "💡",
  "wheels-tires": "🛞",
  protection: "🛡️",
}

export function CategorySection({
  category,
  vehicleString,
}: CategorySectionProps) {
  const icon = categoryIcons[category.slug] || "📦"

  return (
    <section id={`cat-${category.slug}`} className="scroll-mt-20">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D2818]/5 text-lg" role="img" aria-label={category.name}>
          {icon}
        </span>
        <h3 className="font-heading text-xl font-bold text-foreground md:text-2xl">
          {category.name}
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {category.products.map((product, i) => (
          <ProductCard
            key={`${category.slug}-${i}`}
            product={product}
            categorySlug={category.slug}
            categoryIcon={icon}
            vehicleString={vehicleString}
          />
        ))}
      </div>
    </section>
  )
}

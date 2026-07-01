import { ExternalLink } from "lucide-react"
import { buildGoUrl } from "@/data/vehicles/index"
import type { VehicleProduct } from "@/data/vehicles/types"

interface ProductCardProps {
  product: VehicleProduct
  categorySlug: string
  categoryIcon: string
  vehicleString: string
}

export function ProductCard({
  product,
  categorySlug,
  categoryIcon,
  vehicleString,
}: ProductCardProps) {
  const goUrl = buildGoUrl({
    categorySlug,
    vehicleString,
    brand: product.brand,
    productTitle: product.title,
  })

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-[#E8712B]/30">
      {/* Visual placeholder: brand + category icon (no Amazon images) */}
      <div className="mb-4 flex h-24 items-center justify-center rounded-lg bg-gradient-to-br from-[#0D2818]/5 to-[#1A4D2E]/10">
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-2xl" role="img" aria-label={product.title}>
            {categoryIcon}
          </span>
          {product.brand && (
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1A4D2E]/70">
              {product.brand}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 className="font-heading text-base font-semibold text-foreground leading-snug">
        {product.title}
      </h4>

      {/* Brand badge */}
      {product.brand && (
        <span className="mt-1 inline-block w-fit rounded bg-[#1A4D2E]/10 px-2 py-0.5 text-xs font-medium text-[#1A4D2E]">
          {product.brand}
        </span>
      )}

      {/* Blurb (always present per schema requirement) */}
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {product.blurb}
      </p>

      {/* Shop CTA through /go */}
      <a
        href={goUrl}
        rel="nofollow sponsored"
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-[#E8712B] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#d4652a]"
      >
        Shop
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  )
}

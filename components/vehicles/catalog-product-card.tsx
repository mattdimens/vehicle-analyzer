import { AlertTriangle, ExternalLink } from "lucide-react"
import { buildGoUrl } from "@/data/vehicles/index"
import { fitmentFor, formatFitment } from "@/data/vehicles/catalog/fitment"
import type { YearRange } from "@/data/vehicles/catalog/fitment"
import type { CatalogProduct, Pick, PickRole, PriceBand } from "@/data/vehicles/types"

const roleLabels: Record<Exclude<PickRole, "best-for">, string> = {
  "best-overall": "Best overall",
  budget: "Best budget",
  premium: "Premium pick",
}

const priceBands: Record<PriceBand, { symbol: string; label: string }> = {
  budget: { symbol: "$", label: "Budget price" },
  mid: { symbol: "$$", label: "Mid-range price" },
  premium: { symbol: "$$$", label: "Premium price" },
}

export interface CardVehicle extends YearRange {
  /** Make slug */
  make: string
  /** Model slug */
  model: string
  /** Display name for the fitment line, e.g. "Tacoma" */
  modelName: string
  /** Vehicle string for /go links, e.g. "2016-2023 Toyota Tacoma" */
  vehicleString: string
}

interface CatalogProductCardProps {
  product: CatalogProduct
  /** Shows the pick's role as a badge */
  pick?: Pick
  /** Replaces the role badge, e.g. the product type name on the model hub */
  eyebrow?: string
  /** The vehicle and years the card is shown for */
  vehicle: CardVehicle
  icon: string
}

/** A researched catalog product.  Placeholder products use ProductCard. */
export function CatalogProductCard({
  product,
  pick,
  eyebrow,
  vehicle,
  icon,
}: CatalogProductCardProps) {
  const badge =
    eyebrow ?? (pick ? (pick.role === "best-for" ? pick.label : roleLabels[pick.role]) : undefined)
  const fitment = formatFitment(
    fitmentFor(product, vehicle.make, vehicle.model, vehicle),
    vehicle.modelName
  )
  const price = priceBands[product.priceBand]
  const goUrl = buildGoUrl({
    categorySlug: product.category,
    vehicleString: vehicle.vehicleString,
    brand: product.brand,
    productTitle: product.name,
    asin: product.asin,
  })

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-[#E8712B]/30">
      {/* Visual placeholder: brand + category icon (no Amazon images without the API) */}
      <div className="mb-4 flex h-24 items-center justify-center rounded-lg bg-gradient-to-br from-[#0D2818]/5 to-[#1A4D2E]/10">
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-2xl" aria-hidden="true">
            {icon}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#1A4D2E]/70">
            {product.brand}
          </span>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between gap-2">
        {badge ? (
          <span className="inline-block w-fit rounded-full bg-[#E8712B]/10 px-2.5 py-1 text-xs font-semibold text-[#E8712B]">
            {badge}
          </span>
        ) : (
          <span />
        )}
        <span
          className="text-sm font-semibold text-muted-foreground"
          title={price.label}
          aria-label={price.label}
        >
          {price.symbol}
        </span>
      </div>

      <h3 className="font-heading text-base font-semibold text-foreground leading-snug">
        {product.brand} {product.name}
      </h3>

      {fitment && <p className="mt-2 text-xs font-medium text-[#1A4D2E]">{fitment}</p>}

      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{product.why}</p>

      {product.gotcha && (
        <p className="mt-3 flex gap-2 rounded-lg bg-amber-50 p-2.5 text-xs leading-relaxed text-amber-900">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{product.gotcha}</span>
        </p>
      )}

      {/* Shop CTA through /go */}
      <a
        href={goUrl}
        target="_blank"
        rel="nofollow sponsored noopener"
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-[#E8712B] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#d4652a]"
      >
        Check fit &amp; price on Amazon
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  )
}

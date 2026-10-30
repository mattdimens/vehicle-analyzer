import { ExternalLink, Truck } from "lucide-react"
import { buildGoUrl } from "@/data/vehicles/index"
import { fitmentFor, formatFitment } from "@/data/vehicles/catalog/fitment"
import type { CatalogProduct } from "@/data/vehicles/types"
import { AFFILIATE_LINK_PROPS, bodyTextClass, cardClass, eyebrowClass, mutedTextClass, primaryButtonClass } from "@/components/results/tokens"
import { cn } from "@/lib/utils"
import type { CardVehicle } from "./catalog-product-card"

interface CompactPickCardProps {
  product: CatalogProduct
  /** e.g. "Seat Covers · Best overall" */
  eyebrow: string
  vehicle: CardVehicle
}

/** A lead pick on the model hub: a small tile, name, fitment and the Amazon link. */
export function CompactPickCard({ product, eyebrow, vehicle }: CompactPickCardProps) {
  const fitment = formatFitment(fitmentFor(product, vehicle.make, vehicle.model, vehicle), vehicle.modelName)
  const goUrl = buildGoUrl({
    categorySlug: product.category,
    vehicleString: vehicle.vehicleString,
    brand: product.brand,
    productTitle: product.name,
    asin: product.asin,
  })

  return (
    <article className={cn(cardClass, "flex h-full flex-col gap-3 p-3.5 md:flex-row md:gap-4 md:p-4")}>
      <div className="flex gap-3 md:contents">
        <div
          aria-hidden="true"
          className={cn(
            "flex h-16 w-16 shrink-0 items-center justify-center rounded-[10px] bg-[#EEF2F5] px-1 text-center text-[8px] font-bold uppercase leading-tight tracking-[0.08em] md:h-24 md:w-24 md:rounded-xl md:text-[10px]",
            mutedTextClass
          )}
        >
          {product.brand}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className={eyebrowClass}>{eyebrow}</p>
          <h3 className="font-heading text-base font-semibold leading-snug tracking-normal text-[#17212B] md:text-[17px]">
            {product.brand} {product.name}
          </h3>
          {fitment && (
            <p className={cn("flex gap-1.5 text-[13px] font-medium leading-snug", bodyTextClass)}>
              <Truck className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{fitment}</span>
            </p>
          )}
          <a
            href={goUrl}
            {...AFFILIATE_LINK_PROPS}
            className="mt-auto hidden min-h-10 items-center gap-1.5 self-start text-sm font-semibold text-[#C8460F] hover:text-[#AD3C0C] hover:underline md:inline-flex"
          >
            Check price on Amazon
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
      {/* Phones: a full-width button.  The link above takes over from 768px. */}
      <a href={goUrl} {...AFFILIATE_LINK_PROPS} className={cn(primaryButtonClass, "min-h-12 text-[15px] md:hidden")}>
        Check price on Amazon
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
      </a>
    </article>
  )
}

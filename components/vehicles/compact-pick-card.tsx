import { ExternalLink, Truck } from "lucide-react"
import { fitmentFor, formatFitment } from "@/data/vehicles/catalog/fitment"
import type { CatalogProduct } from "@/data/vehicles/types"
import type { AmazonCardData } from "@/lib/amazon/cache"
import { AFFILIATE_LINK_PROPS, bodyTextClass, cardClass, eyebrowClass, mutedTextClass, primaryButtonClass } from "@/components/results/tokens"
import { cn } from "@/lib/utils"
import { AmazonImage, productGoUrl } from "./catalog-product-card"
import type { CardVehicle } from "./catalog-product-card"

interface CompactPickCardProps {
  product: CatalogProduct
  /** e.g. "Seat Covers · Best overall" */
  eyebrow: string
  vehicle: CardVehicle
  /** Amazon data from the amazon_items cache, when it's fresh */
  amazon?: AmazonCardData | null
}

/** A lead pick on the model hub: a small tile, name, fitment, price when fresh, and the Amazon link. */
export function CompactPickCard({ product, eyebrow, vehicle, amazon }: CompactPickCardProps) {
  const fitment = formatFitment(fitmentFor(product, vehicle.make, vehicle.model, vehicle), vehicle.modelName)
  const live = amazon?.kind === "live" ? amazon : null
  const unavailable = amazon?.kind === "unavailable"
  const goUrl = productGoUrl(product, vehicle, amazon)
  const linkLabel = unavailable ? "Search Amazon for similar" : live ? "View on Amazon" : "Check price on Amazon"

  return (
    <article className={cn(cardClass, "flex h-full flex-col gap-3 p-3.5 md:flex-row md:gap-4 md:p-4")}>
      <div className="flex gap-3 md:contents">
        <div
          aria-hidden="true"
          className={cn(
            "flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[10px] px-1 text-center text-[8px] font-bold uppercase leading-tight tracking-[0.08em] md:h-24 md:w-24 md:rounded-xl md:text-[10px]",
            live?.imageUrl ? "border border-[#EDF1F4] bg-white p-1" : "bg-[#EEF2F5]",
            mutedTextClass
          )}
        >
          {live?.imageUrl ? <AmazonImage src={live.imageUrl} /> : product.brand}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className={eyebrowClass}>{eyebrow}</p>
          <h3 className="font-heading text-base font-semibold leading-snug tracking-normal text-[#17212B] md:text-[17px]">
            {product.brand} {product.name}
          </h3>
          {live && (
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-heading text-lg font-bold text-[#17212B]">{live.priceDisplay}</span>
              <span className={cn("text-xs", mutedTextClass)}>at Amazon · as of {live.asOf}</span>
            </p>
          )}
          {unavailable && <p className="text-[13px] font-semibold text-[#6B4400]">Currently unavailable on Amazon</p>}
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
            {linkLabel}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
      {/* Phones: a full-width button.  The link above takes over from 768px. */}
      <a href={goUrl} {...AFFILIATE_LINK_PROPS} className={cn(primaryButtonClass, "min-h-12 text-[15px] md:hidden")}>
        {linkLabel}
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
      </a>
    </article>
  )
}

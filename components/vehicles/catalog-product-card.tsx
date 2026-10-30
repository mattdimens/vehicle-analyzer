import { ChevronDown, ExternalLink, TriangleAlert } from "lucide-react"
import { buildGoUrl } from "@/data/vehicles/index"
import { fitmentFor, formatFitment } from "@/data/vehicles/catalog/fitment"
import type { YearRange } from "@/data/vehicles/catalog/fitment"
import type { CatalogProduct, Pick, PickRole, PriceBand } from "@/data/vehicles/types"
import { AFFILIATE_LINK_PROPS, bodyTextClass, cardClass, mutedTextClass, primaryButtonClass } from "@/components/results/tokens"
import { cn } from "@/lib/utils"
import { FitLine } from "./fit-line"

const roleLabels: Record<Exclude<PickRole, "best-for">, string> = {
  "best-overall": "Best overall",
  budget: "Best budget",
  premium: "Premium pick",
}

/** "Best overall", "Best budget", "Premium pick" or the best-for label. */
export function pickBadge(pick: Pick): string | undefined {
  return pick.role === "best-for" ? pick.label : roleLabels[pick.role]
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
  /** The section's id in the truck filter, so the fitment line can name the visitor's truck */
  fitSection?: string
}

/**
 * A researched catalog product.  One component, two layouts: a row with a
 * 76px tile on phones, where why and the catch sit behind one disclosure, and
 * a card with a 150px tile from 768px, where they are always open.  The tile
 * is the slot the Amazon image fills once the amazon_items cache exists.
 */
export function CatalogProductCard({ product, pick, eyebrow, vehicle, fitSection }: CatalogProductCardProps) {
  const badge = eyebrow ?? (pick ? pickBadge(pick) : undefined)
  const entries = fitmentFor(product, vehicle.make, vehicle.model, vehicle)
  const fitment = formatFitment(entries, vehicle.modelName)
  const price = priceBands[product.priceBand]
  const goUrl = buildGoUrl({
    categorySlug: product.category,
    vehicleString: vehicle.vehicleString,
    brand: product.brand,
    productTitle: product.name,
    asin: product.asin,
  })

  return (
    <article
      className={cn(
        cardClass,
        "grid h-full grid-cols-[76px_minmax(0,1fr)] content-start gap-x-3 gap-y-3 p-3.5 md:flex md:flex-col md:gap-2.5 md:p-4"
      )}
    >
      {/* Image tile: brand name until the Amazon image is cached */}
      <div
        aria-hidden="true"
        className={cn(
          "row-span-2 flex h-[76px] items-center justify-center rounded-[10px] bg-[#EEF2F5] px-1 text-center text-[9px] font-bold uppercase leading-tight tracking-[0.08em] md:h-[150px] md:rounded-xl md:text-[11px]",
          mutedTextClass
        )}
      >
        {product.brand}
      </div>

      <div className="flex items-start justify-between gap-2 self-end md:self-stretch">
        {badge ? (
          <span className="rounded-full bg-[#FDF0E9] px-2.5 py-0.5 text-xs font-semibold text-[#9A3412]">
            {badge}
          </span>
        ) : (
          <span />
        )}
        <span
          className={cn("text-[13px] font-bold", mutedTextClass)}
          title={price.label}
          aria-label={price.label}
        >
          {price.symbol}
        </span>
      </div>

      <h3 className="self-start font-heading text-base font-semibold leading-snug tracking-normal text-[#17212B] md:text-[17px]">
        {product.brand} {product.name}
      </h3>

      {fitment && <FitLine text={fitment} entries={entries} sectionId={fitSection} />}

      {/* Phones: one disclosure after the button.  768px and up: always open, above it. */}
      <details className="vf-open-md group col-span-2 order-last border-t border-[#EDF1F4] pt-2.5 md:order-none md:border-0 md:pt-0">
        <summary className="vf-hide-md flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-[#17212B] [&::-webkit-details-marker]:hidden">
          {product.gotcha ? "Why we picked it · 1 thing to know" : "Why we picked it"}
          <ChevronDown
            className={cn("h-[18px] w-[18px] shrink-0 transition-transform group-open:rotate-180", mutedTextClass)}
            aria-hidden="true"
          />
        </summary>
        <div className="flex flex-col gap-2.5 pt-1 md:pt-0">
          <p className={cn("text-sm leading-relaxed", bodyTextClass)}>{product.why}</p>
          {product.gotcha && (
            <p className="flex gap-2 rounded-[10px] bg-[#FFF6DD] p-2.5 text-[13px] leading-snug text-[#6B4400]">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{product.gotcha}</span>
            </p>
          )}
        </div>
      </details>

      {/* Shop CTA through /go */}
      <a
        href={goUrl}
        {...AFFILIATE_LINK_PROPS}
        className={cn(primaryButtonClass, "col-span-2 min-h-12 text-[15px] md:mt-auto md:px-2 md:text-sm lg:text-[15px]")}
      >
        Check price on Amazon
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
      </a>
    </article>
  )
}

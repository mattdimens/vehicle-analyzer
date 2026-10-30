import { ChevronDown, ExternalLink, TriangleAlert } from "lucide-react"
import { buildGoUrl } from "@/data/vehicles/index"
import { fitmentFor, formatFitment } from "@/data/vehicles/catalog/fitment"
import type { YearRange } from "@/data/vehicles/catalog/fitment"
import type { CatalogProduct, Pick, PickRole, PriceBand } from "@/data/vehicles/types"
import type { AmazonCardData } from "@/lib/amazon/cache"
import {
  AFFILIATE_LINK_PROPS,
  bodyTextClass,
  cardClass,
  mutedTextClass,
  outlineButtonClass,
  primaryButtonClass,
} from "@/components/results/tokens"
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

/**
 * The card's Amazon link: the product page, or a search for similar products
 * when Amazon says the listing can't be bought right now.
 */
export function productGoUrl(product: CatalogProduct, vehicle: CardVehicle, amazon?: AmazonCardData | null): string {
  return buildGoUrl({
    categorySlug: product.category,
    vehicleString: vehicle.vehicleString,
    brand: product.brand,
    productTitle: product.name,
    asin: amazon?.kind === "unavailable" ? undefined : product.asin,
  })
}

/** Amazon's image for the tile.  Linked from Amazon, never stored or optimized here. */
export function AmazonImage({ src, className }: { src: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- Amazon's image URL as the API returns it; a copy through next/image would store it
    <img src={src} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className={cn("h-full w-full object-contain", className)} />
  )
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
  /** Amazon data from the amazon_items cache, when it's fresh */
  amazon?: AmazonCardData | null
}

/**
 * A researched catalog product.  One component, two layouts: a row with a
 * 76px tile on phones, where why and the catch sit behind one disclosure, and
 * a card with a 150px tile from 768px, where they are always open.
 *
 * With fresh Amazon data the tile shows Amazon's image, and the card shows the
 * price with its time and the stock; when Amazon can't sell it, the button
 * becomes a search for similar products.  Without fresh data it's the
 * editorial card, with a price band instead of a price.
 */
export function CatalogProductCard({ product, pick, eyebrow, vehicle, fitSection, amazon }: CatalogProductCardProps) {
  const badge = eyebrow ?? (pick ? pickBadge(pick) : undefined)
  const entries = fitmentFor(product, vehicle.make, vehicle.model, vehicle)
  const fitment = formatFitment(entries, vehicle.modelName)
  const band = priceBands[product.priceBand]
  const live = amazon?.kind === "live" ? amazon : null
  const unavailable = amazon?.kind === "unavailable"
  const goUrl = productGoUrl(product, vehicle, amazon)

  return (
    <article
      className={cn(
        cardClass,
        "grid h-full grid-cols-[76px_minmax(0,1fr)] content-start gap-x-3 gap-y-3 p-3.5 md:flex md:flex-col md:gap-2.5 md:p-4"
      )}
    >
      {/* Image tile: Amazon's image when the data is fresh, otherwise the brand name */}
      <div
        aria-hidden="true"
        className={cn(
          "row-span-2 flex h-[76px] items-center justify-center overflow-hidden rounded-[10px] px-1 text-center text-[9px] font-bold uppercase leading-tight tracking-[0.08em] md:h-[150px] md:rounded-xl md:text-[11px]",
          live?.imageUrl ? "border border-[#EDF1F4] bg-white p-1.5 md:p-3" : "bg-[#EEF2F5]",
          mutedTextClass
        )}
      >
        {live?.imageUrl ? <AmazonImage src={live.imageUrl} /> : product.brand}
      </div>

      <div className="flex items-start justify-between gap-2 self-end md:self-stretch">
        {badge ? (
          <span className="rounded-full bg-[#FDF0E9] px-2.5 py-0.5 text-xs font-semibold text-[#9A3412]">
            {badge}
          </span>
        ) : (
          <span />
        )}
        {!live && (
          <span
            className={cn("text-[13px] font-bold", mutedTextClass)}
            title={band.label}
            aria-label={band.label}
          >
            {band.symbol}
          </span>
        )}
      </div>

      <h3 className="self-start font-heading text-base font-semibold leading-snug tracking-normal text-[#17212B] md:text-[17px]">
        {product.brand} {product.name}
      </h3>

      {live && (
        <div className="col-span-2 flex flex-col gap-0.5">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-heading text-[22px] font-bold leading-tight text-[#17212B]">{live.priceDisplay}</span>
            <span className={cn("text-xs", mutedTextClass)}>at Amazon · as of {live.asOf}</span>
          </p>
          {live.stockMessage && (
            <p className={cn("text-[13px] font-semibold", live.inStock ? "text-[#166534]" : bodyTextClass)}>
              {live.stockMessage}
            </p>
          )}
        </div>
      )}
      {unavailable && (
        <p className="col-span-2 rounded-[10px] bg-[#FFF6DD] px-2.5 py-2 text-[13px] font-semibold text-[#6B4400]">
          Currently unavailable on Amazon
        </p>
      )}

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
        className={cn(
          unavailable ? outlineButtonClass : primaryButtonClass,
          "col-span-2 min-h-12 text-[15px] md:mt-auto md:px-2 md:text-sm lg:text-[15px]"
        )}
      >
        {unavailable ? "Search Amazon for similar" : live ? "View on Amazon" : "Check price on Amazon"}
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
      </a>
    </article>
  )
}

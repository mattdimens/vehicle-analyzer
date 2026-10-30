import Link from "next/link"
import { ArrowRight, ChevronDown, Info } from "lucide-react"
import type { ResolvedPick } from "@/data/vehicles/catalog"
import { bodyTextClass, cardClass, mutedTextClass, pageSectionTitleClass } from "@/components/results/tokens"
import { cn } from "@/lib/utils"
import { CatalogProductCard } from "./catalog-product-card"
import type { CardVehicle } from "./catalog-product-card"
import { PickGrid } from "./pick-grid"
import { ProductTypeIcon } from "./product-type-icon"

interface CatalogSectionProps {
  /** Anchor id, e.g. "cat-bed-covers" or "3rd-gen" */
  id: string
  title: string
  /** Product-type slug, for the icon */
  productTypeSlug: string
  /** Lowercase noun for "Show 2 more seat covers", e.g. "seat covers" */
  itemNoun: string
  /** "October 2026", shown as "Fitment checked October 2026" */
  checkedLabel: string | null
  /** Fitment catch shown above the picks */
  note?: string
  picks: ResolvedPick[]
  vehicle: CardVehicle
  /** "Before you buy" notes, from the model's product-type guide */
  buyingNotes?: { title: string; notes: string[] }
  /** Optional link under the picks, e.g. to the product-type page */
  more?: { href: string; label: string }
}

/** A product type's (or generation's) 3-5 catalog picks. */
export function CatalogSection({
  id,
  title,
  productTypeSlug,
  itemNoun,
  checkedLabel,
  note,
  picks,
  vehicle,
  buyingNotes,
  more,
}: CatalogSectionProps) {
  const hidden = picks.length - 3
  const subline = [
    `${picks.length} ${picks.length === 1 ? "pick" : "picks"}`,
    checkedLabel && `Fitment checked ${checkedLabel}`,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-32 lg:scroll-mt-20">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF2F5] text-[#17212B]">
          <ProductTypeIcon slug={productTypeSlug} className="h-5 w-5" />
        </span>
        <div>
          <h2 id={`${id}-title`} className={pageSectionTitleClass}>
            {title}
          </h2>
          <p className={cn("text-[13px]", mutedTextClass)}>{subline}</p>
        </div>
      </div>

      {note && (
        <p className={cn("mb-4 flex gap-2.5 rounded-xl bg-[#FDF0E9] px-3.5 py-3 text-sm leading-relaxed", bodyTextClass)}>
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#9A3412]" aria-hidden="true" />
          <span>{note}</span>
        </p>
      )}

      <PickGrid moreLabel={`Show ${hidden} more ${itemNoun}`}>
        {picks.map(({ pick, product }) => (
          <CatalogProductCard key={product.id} product={product} pick={pick} vehicle={vehicle} />
        ))}
      </PickGrid>

      {buyingNotes && buyingNotes.notes.length > 0 && (
        <details className={cn(cardClass, "vf-open-md group mt-4 px-4 py-0")}>
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 text-[15px] font-semibold text-[#17212B] md:pt-3 [&::-webkit-details-marker]:hidden">
            {buyingNotes.title}
            <ChevronDown
              className={cn("vf-hide-md h-[18px] w-[18px] shrink-0 transition-transform group-open:rotate-180", mutedTextClass)}
              aria-hidden="true"
            />
          </summary>
          <ul className={cn("list-disc space-y-2 pb-4 pl-5 text-sm leading-relaxed", bodyTextClass)}>
            {buyingNotes.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </details>
      )}

      {more && (
        <Link
          href={more.href}
          className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[#17212B] underline-offset-2 hover:text-[#9A3412] hover:underline"
        >
          {more.label}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </section>
  )
}

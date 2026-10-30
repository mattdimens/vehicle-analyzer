import { ChevronDown, Search } from "lucide-react"
import { buildGoUrl } from "@/data/vehicles/index"
import { placeholderLinkLabel } from "@/data/vehicles/catalog"
import type { VehicleCategory } from "@/data/vehicles/types"
import { AFFILIATE_LINK_PROPS, bodyTextClass, cardClass, mutedTextClass, pageSectionTitleClass } from "@/components/results/tokens"
import { cn } from "@/lib/utils"

interface MoreToBrowseProps {
  id: string
  /** e.g. "More to browse for your 3rd Gen" */
  title: string
  /** e.g. "2016-2023 Tacoma" */
  searchScope: string
  categories: VehicleCategory[]
  /** Vehicle string for /go links, e.g. "2016-2023 Toyota Tacoma" */
  vehicleString: string
}

/**
 * Categories nobody has researched yet, as plain Amazon search links.  The
 * /go links are the ones the old placeholder cards used, so clicks log the
 * same way.  Phones: one disclosure per category.  768px and up: columns.
 */
export function MoreToBrowse({ id, title, searchScope, categories, vehicleString }: MoreToBrowseProps) {
  if (categories.length === 0) return null

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-32 lg:scroll-mt-20">
      <h2 id={`${id}-title`} className={pageSectionTitleClass}>
        {title}
      </h2>
      <p className={cn("mt-1.5 max-w-2xl text-sm leading-relaxed", bodyTextClass)}>
        We haven&apos;t picked specific products here yet. Each link opens an Amazon search for {searchScope} parts.
      </p>

      <div className={cn(cardClass, "mt-4 px-4 py-1 md:columns-2 md:gap-8 md:p-5 lg:columns-3")}>
        {categories.map((cat, i) => (
          <details
            key={cat.slug}
            open={i === 0 || undefined}
            className="vf-open-md group break-inside-avoid border-t border-[#EDF1F4] first:border-t-0 md:mb-4 md:border-t-0"
          >
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 text-[15px] font-semibold text-[#17212B] md:min-h-0 md:pb-1 md:text-sm md:font-bold [&::-webkit-details-marker]:hidden">
              {cat.name}
              <span className={cn("vf-hide-md flex items-center gap-1 text-[13px] font-medium", mutedTextClass)}>
                {cat.products.length} {cat.products.length === 1 ? "search" : "searches"}
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
              </span>
            </summary>
            <ul className="pb-2 md:pb-0">
              {cat.products.map((product) => (
                <li key={product.title}>
                  <a
                    href={buildGoUrl({
                      categorySlug: cat.slug,
                      vehicleString,
                      brand: product.brand,
                      productTitle: product.title,
                    })}
                    {...AFFILIATE_LINK_PROPS}
                    className="flex min-h-11 items-center gap-2 border-t border-[#EDF1F4] text-sm font-medium text-[#17212B] hover:text-[#9A3412] hover:underline md:min-h-9 md:border-t-0"
                  >
                    <Search className={cn("h-3.5 w-3.5 shrink-0", mutedTextClass)} aria-hidden="true" />
                    {placeholderLinkLabel(product.title)}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  )
}

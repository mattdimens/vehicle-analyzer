import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { ResolvedPick } from "@/data/vehicles/catalog"
import { CatalogProductCard } from "./catalog-product-card"
import type { CardVehicle } from "./catalog-product-card"

interface CatalogSectionProps {
  /** Anchor id, e.g. "cat-bed-covers" or "3rd-gen" */
  id: string
  title: string
  icon: string
  /** Fitment catch shown above the picks */
  note?: string
  picks: ResolvedPick[]
  vehicle: CardVehicle
  /** Optional link under the picks, e.g. to the product-type page */
  more?: { href: string; label: string }
}

/** A heading plus 3-5 catalog picks. */
export function CatalogSection({ id, title, icon, note, picks, vehicle, more }: CatalogSectionProps) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-6 flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D2818]/5 text-lg"
          aria-hidden="true"
        >
          {icon}
        </span>
        <h2 className="font-heading text-xl font-bold text-foreground md:text-2xl">{title}</h2>
      </div>

      {note && (
        <p className="mb-6 max-w-3xl rounded-lg border-l-4 border-[#E8712B] bg-[#E8712B]/5 px-4 py-3 text-sm leading-relaxed text-foreground">
          {note}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {picks.map(({ pick, product }) => (
          <CatalogProductCard
            key={product.id}
            product={product}
            pick={pick}
            vehicle={vehicle}
            icon={icon}
          />
        ))}
      </div>

      {more && (
        <Link
          href={more.href}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1A4D2E] transition-colors hover:text-[#E8712B]"
        >
          {more.label}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </section>
  )
}

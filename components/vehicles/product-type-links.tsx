import Link from "next/link"
import type { ProductType } from "@/data/vehicles/product-types"

interface ProductTypeLinksProps {
  /** Heading, e.g. "Shop Tacoma accessories by type" */
  title: string
  productTypes: ProductType[]
  /** Model base path, e.g. "/vehicles/toyota/tacoma" */
  basePath: string
}

/** Links to a model's product-type pages. */
export function ProductTypeLinks({ title, productTypes, basePath }: ProductTypeLinksProps) {
  if (productTypes.length === 0) return null

  return (
    <section className="w-full border-t border-border/40 bg-white py-10">
      <div className="container max-w-5xl">
        <h2 className="font-heading text-lg font-bold text-foreground mb-4">{title}</h2>
        <div className="flex flex-wrap gap-3">
          {productTypes.map((t) => (
            <Link
              key={t.slug}
              href={`${basePath}/${t.slug}`}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-all hover:shadow-md hover:border-[#E8712B]/40"
            >
              <span aria-hidden="true">{t.icon}</span>
              {t.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

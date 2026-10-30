import type { Metadata } from "next"
import { getProductTypePages } from "@/data/vehicles/catalog"
import type { ProductTypePageData } from "@/data/vehicles/catalog"
import { fitmentCheckedLabel, fitmentFor } from "@/data/vehicles/catalog/fitment"
import type { TruckConfigs } from "@/data/vehicles/types"
import { getPostBySlug } from "@/lib/blog"
import { VehicleHero } from "@/components/vehicles/vehicle-hero"
import { CatalogSection } from "@/components/vehicles/catalog-section"
import { PageNav } from "@/components/vehicles/page-nav"
import { TruckFilterProvider } from "@/components/vehicles/truck-filter"
import type { FitSection } from "@/components/vehicles/truck-filter"
import { TruckBarDesktop, TruckRow } from "@/components/vehicles/truck-bar"
import { ProductTypeLinks } from "@/components/vehicles/product-type-links"
import { RelatedGuides } from "@/components/vehicles/related-guides"
import type { GuideLink } from "@/components/vehicles/related-guides"
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav"
import { AffiliateDisclosure } from "@/components/ui/affiliate-disclosure"

const BASE_URL = "https://visualfitment.com"

interface ProductTypePageProps {
  data: ProductTypePageData
}

/** e.g. "Toyota Tacoma Bed Racks (2005-2026)" */
function productTypeH1({ make, model, productType, sections }: ProductTypePageData) {
  const yearStart = Math.min(...sections.map((s) => s.generation.yearStart))
  const yearEnd = Math.max(...sections.map((s) => s.generation.yearEnd))
  return `${make.name} ${model.name} ${productType.name} (${yearStart}-${yearEnd})`
}

// ── Metadata ───────────────────────────────────────────────────────────

export function productTypeMetadata(data: ProductTypePageData): Metadata {
  const { make, model, productType, guide } = data
  const title = `${productTypeH1(data)} | Visual Fitment`
  const path = `/vehicles/${make.slug}/${model.slug}/${productType.slug}`

  return {
    title,
    description: guide.intro,
    openGraph: {
      title,
      description: guide.intro,
      url: `${BASE_URL}${path}`,
      siteName: "Visual Fitment",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description: guide.intro },
    alternates: { canonical: path },
  }
}

// ── Page ───────────────────────────────────────────────────────────────

export function ProductTypePage({ data }: ProductTypePageProps) {
  const { make, model, productType, guide, sections } = data
  const h1 = productTypeH1(data)
  const basePath = `/vehicles/${make.slug}/${model.slug}`
  const otherTypes = getProductTypePages(make.slug, model.slug).filter(
    (t) => t.slug !== productType.slug
  )
  const checkedLabel = fitmentCheckedLabel(sections.flatMap((s) => s.picks.map((r) => r.product)))

  const post = productType.guideSlug ? getPostBySlug(productType.guideSlug) : null
  const guides: GuideLink[] = post
    ? [{ title: post.frontmatter.title, slug: post.slug, description: post.frontmatter.subtitle }]
    : []

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: make.name, href: `/vehicles/${make.slug}` },
    { label: `${model.name} Accessories`, href: basePath },
    { label: productType.name },
  ]

  // JSON-LD: BreadcrumbList
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: make.name,
        item: `${BASE_URL}/vehicles/${make.slug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${model.name} Accessories`,
        item: `${BASE_URL}${basePath}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: productType.name,
        item: `${BASE_URL}${basePath}/${productType.slug}`,
      },
    ],
  }

  // JSON-LD: ItemList of product names. No Product/Offer markup: we don't sell
  // these items, and Offers without a price are invalid for Google.
  const productNames = Array.from(
    new Set(sections.flatMap((s) => s.picks.map((r) => `${r.product.brand} ${r.product.name}`)))
  )
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: h1,
    numberOfItems: productNames.length,
    itemListElement: productNames.map((name, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
    })),
  }

  // The "Your truck" filter: each generation section uses its own configs,
  // and the bar offers every cab and bed any of them has.
  const fitSections: FitSection[] = sections.map(({ generation, picks }) => ({
    id: generation.slug,
    configs: generation.configs,
    items: picks.map(({ product }) => ({
      id: product.id,
      label: `${product.brand} ${product.name}`,
      priceBand: product.priceBand,
      fitment: fitmentFor(product, make.slug, model.slug, generation),
    })),
  }))
  const withConfigs = sections.flatMap((s) => (s.generation.configs ? [s.generation.configs] : []))
  const barConfigs: TruckConfigs | undefined =
    withConfigs.length > 0
      ? {
          cabs: Array.from(new Set(withConfigs.flatMap((c) => c.cabs))),
          beds: Array.from(new Set(withConfigs.flatMap((c) => c.beds))),
        }
      : undefined
  const navItems = sections.map(({ generation, picks }) => ({
    id: generation.slug,
    label: `${generation.label} (${generation.displayRange})`,
    count: picks.length,
  }))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <BreadcrumbNav items={breadcrumbItems} />

      <VehicleHero
        h1={h1}
        intro={guide.intro}
        ctaLabel={`Upload a photo of your ${model.name} to see what fits`}
        ctaHref={`${productType.toolHref ?? "/"}#upload-zone`}
      />

      {/* Affiliate disclosure - adjacent to product recommendations */}
      <AffiliateDisclosure />

      <TruckFilterProvider
        make={make.slug}
        model={model.slug}
        page="product_type"
        configs={barConfigs}
        sections={fitSections}
      >
        {/* Sticky bar: the truck filter (when a generation has configs) and a chip per generation */}
        <PageNav
          items={navItems}
          variant="bar"
          top={
            barConfigs ? (
              <>
                <TruckRow className="lg:hidden" />
                <TruckBarDesktop embedded className="hidden lg:block" />
              </>
            ) : undefined
          }
        />

        <section className="w-full bg-white py-14 md:py-16">
          <div className="container max-w-5xl space-y-14">
            <div className="rounded-xl border border-border bg-gray-50 p-6">
              <h2 className="font-heading text-lg font-bold text-foreground">
                What to know before you buy
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground">
                {guide.buyingNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              {checkedLabel && (
                <p className="mt-4 text-sm text-muted-foreground">Fitment checked {checkedLabel}.</p>
              )}
            </div>

            {sections.map(({ generation, picks, note }) => (
              <CatalogSection
                key={generation.slug}
                id={generation.slug}
                title={`${generation.label} ${model.name} (${generation.displayRange})`}
                productTypeSlug={productType.slug}
                itemNoun={productType.name.toLowerCase()}
                checkedLabel={fitmentCheckedLabel(picks.map((r) => r.product))}
                note={note}
                picks={picks}
                filtered={Boolean(generation.configs)}
                vehicle={{
                  make: make.slug,
                  model: model.slug,
                  modelName: model.name,
                  yearStart: generation.yearStart,
                  yearEnd: generation.yearEnd,
                  vehicleString: `${generation.displayRange} ${make.name} ${model.name}`,
                }}
                more={{
                  href: `${basePath}/${generation.slug}`,
                  label: `All ${generation.label} ${model.name} accessories`,
                }}
              />
            ))}
          </div>
        </section>
      </TruckFilterProvider>

      <ProductTypeLinks
        title={`More ${model.name} accessories`}
        productTypes={otherTypes}
        basePath={basePath}
      />

      <RelatedGuides guides={guides} />
    </>
  )
}

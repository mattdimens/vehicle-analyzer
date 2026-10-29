import type { Metadata } from "next"
import type { VehicleGeneration, VehicleMake, VehicleModel } from "@/data/vehicles/types"
import {
  getGenerationSections,
  getProductTypePages,
  remainingPlaceholders,
  withoutResearched,
} from "@/data/vehicles/catalog"
import { fitmentCheckedLabel } from "@/data/vehicles/catalog/fitment"
import { VehicleHero } from "@/components/vehicles/vehicle-hero"
import { CategorySection } from "@/components/vehicles/category-section"
import { CatalogSection } from "@/components/vehicles/catalog-section"
import { PopularPicks } from "@/components/vehicles/popular-picks"
import { ProductTypeLinks } from "@/components/vehicles/product-type-links"
import { RelatedGuides } from "@/components/vehicles/related-guides"
import type { GuideLink } from "@/components/vehicles/related-guides"
import { SiblingGenerations } from "@/components/vehicles/sibling-generations"
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav"
import { AffiliateDisclosure } from "@/components/ui/affiliate-disclosure"

const BASE_URL = "https://visualfitment.com"

/** Blog guides relevant to truck accessory pages. */
const truckGuides: GuideLink[] = [
  {
    title: "Choosing the Right Tonneau Cover",
    slug: "choosing-the-right-tonneau-cover",
    description:
      "Tri-fold, roll-up, or retractable? A practical comparison of every bed cover style.",
  },
  {
    title: "Leveling Kit vs. Lift Kit",
    slug: "leveling-kit-vs-lift-kit",
    description:
      "Understand the trade-offs between a simple level and a full suspension lift.",
  },
  {
    title: "What Is Wheel Offset?",
    slug: "what-is-wheel-offset",
    description:
      "How offset affects stance, clearance, and bearing wear on trucks and SUVs.",
  },
  {
    title: "Running Boards Buying Guide",
    slug: "running-boards-buying-guide",
    description:
      "Side steps, nerf bars, and rock sliders: which style fits your cab and use case.",
  },
]

interface GenerationPageProps {
  make: VehicleMake
  model: VehicleModel
  generation: VehicleGeneration
}

function generationH1({ make, model, generation }: GenerationPageProps) {
  return `${generation.displayRange} (${generation.label}) ${make.name} ${model.name} Accessories`
}

// ── Metadata ───────────────────────────────────────────────────────────

export function generationMetadata(props: GenerationPageProps): Metadata {
  const { make, model, generation } = props
  const title = `${generationH1(props)} | Visual Fitment`
  const description = `${generation.intro.split(".").slice(0, 2).join(".")}. Browse accessories for the ${generation.displayRange} ${make.name} ${model.name}.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/vehicles/${make.slug}/${model.slug}/${generation.slug}`,
      siteName: "Visual Fitment",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
    alternates: {
      canonical: `/vehicles/${make.slug}/${model.slug}/${generation.slug}`,
    },
  }
}

// ── Page ───────────────────────────────────────────────────────────────

export function GenerationPage(props: GenerationPageProps) {
  const { make, model, generation } = props
  const h1 = generationH1(props)
  const vehicleString = `${generation.displayRange} ${make.name} ${model.name}`
  const basePath = `/vehicles/${make.slug}/${model.slug}`

  // Researched catalog picks come first.  The placeholder template stays
  // below them for what hasn't been researched yet, minus the placeholders a
  // researched product type replaces.
  const sections = getGenerationSections(make.slug, model.slug, generation.slug)
  const researched = new Set(sections.map((s) => s.productType.slug))
  const placeholders = remainingPlaceholders(generation.categories, researched)
  const popular = withoutResearched(generation.popular, researched)
  const productTypePages = getProductTypePages(make.slug, model.slug)
  const typesWithPages = new Set(productTypePages.map((t) => t.slug))
  const checkedLabel = fitmentCheckedLabel(sections.flatMap((s) => s.picks.map((r) => r.product)))

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: make.name, href: `/vehicles/${make.slug}` },
    { label: `${model.name} Accessories`, href: basePath },
    { label: `${generation.label} ${generation.displayRange}` },
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
        name: `${generation.label} ${generation.displayRange}`,
        item: `${BASE_URL}${basePath}/${generation.slug}`,
      },
    ],
  }

  // JSON-LD: ItemList of product names. No Product/Offer markup: we don't sell
  // these items, and Offers without a price are invalid for Google.
  const allProducts = [
    ...sections.flatMap((s) => s.picks.map((r) => `${r.product.brand} ${r.product.name}`)),
    ...placeholders.flatMap((cat) => cat.products.map((p) => p.title)),
  ]

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: h1,
    numberOfItems: allProducts.length,
    itemListElement: allProducts.map((name, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
    })),
  }

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
        intro={generation.intro}
        ctaLabel={`Upload a photo of your ${generation.displayRange} ${model.name} to confirm what fits`}
        ctaHref="/#upload-zone"
      />

      {/* Affiliate disclosure - adjacent to product recommendations */}
      <AffiliateDisclosure />

      {/* Product sections scoped to this generation */}
      <section className="w-full bg-white py-14 md:py-16">
        <div className="container max-w-5xl space-y-14">
          {checkedLabel && (
            <p className="text-sm text-muted-foreground">Fitment checked {checkedLabel}.</p>
          )}
          {sections.map((s) => (
            <CatalogSection
              key={s.productType.slug}
              id={`cat-${s.productType.slug}`}
              title={s.productType.name}
              icon={s.productType.icon}
              note={s.note}
              picks={s.picks}
              vehicle={{
                make: make.slug,
                model: model.slug,
                modelName: model.name,
                yearStart: generation.yearStart,
                yearEnd: generation.yearEnd,
                vehicleString,
              }}
              more={
                typesWithPages.has(s.productType.slug)
                  ? {
                      href: `${basePath}/${s.productType.slug}`,
                      label: `${model.name} ${s.productType.name.toLowerCase()} for every generation`,
                    }
                  : undefined
              }
            />
          ))}
          {placeholders.map((cat) => (
            <CategorySection key={cat.slug} category={cat} vehicleString={vehicleString} />
          ))}
        </div>
      </section>

      {/* Placeholder popular picks, minus any a researched product type replaces */}
      {popular.length > 0 && (
        <PopularPicks
          modelNamePlural={`${model.name}s`}
          items={popular}
          vehicleString={vehicleString}
        />
      )}

      <ProductTypeLinks
        title={`Shop ${model.name} accessories by type`}
        productTypes={productTypePages}
        basePath={basePath}
      />

      {/* Sibling generations + model hub link */}
      <SiblingGenerations
        generations={model.generations}
        currentSlug={generation.slug}
        basePath={basePath}
        modelHubLabel={`All ${model.name} Accessories`}
      />

      {/* Related guides */}
      <RelatedGuides guides={truckGuides} />
    </>
  )
}

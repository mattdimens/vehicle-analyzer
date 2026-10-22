import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getAllMakes, getModelBySlug } from "@/data/vehicles/index"
import { getFeaturedPicks, getProductTypePages } from "@/data/vehicles/catalog"
import { VehicleHero } from "@/components/vehicles/vehicle-hero"
import { GenerationSelector } from "@/components/vehicles/generation-selector"
import { CategorySection } from "@/components/vehicles/category-section"
import { CatalogProductCard } from "@/components/vehicles/catalog-product-card"
import { ProductTypeLinks } from "@/components/vehicles/product-type-links"
import { PopularPicks } from "@/components/vehicles/popular-picks"
import { RelatedGuides } from "@/components/vehicles/related-guides"
import type { GuideLink } from "@/components/vehicles/related-guides"
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav"
import { AffiliateDisclosure } from "@/components/ui/affiliate-disclosure"

const BASE_URL = "https://visualfitment.com"

/** Blog guides to cross-link on Tacoma (and future truck) pages. */
const tacomaGuides: GuideLink[] = [
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

// ── Static generation ──────────────────────────────────────────────────

export function generateStaticParams() {
  const params: { make: string; model: string }[] = []
  for (const make of getAllMakes()) {
    for (const model of make.models) {
      params.push({ make: make.slug, model: model.slug })
    }
  }
  return params
}

// ── Metadata ───────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ make: string; model: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { make: makeSlug, model: modelSlug } = await params
  const result = getModelBySlug(makeSlug, modelSlug)
  if (!result) return {}

  const { make, model } = result
  const title = `${model.h1} | Visual Fitment`
  const description = `${model.intro.split(".").slice(0, 2).join(".")}. Browse every generation from ${model.generations[model.generations.length - 1]?.displayRange} to ${model.generations[0]?.displayRange}.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/vehicles/${make.slug}/${model.slug}`,
      siteName: "Visual Fitment",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: `/vehicles/${make.slug}/${model.slug}` },
  }
}

// ── Page ───────────────────────────────────────────────────────────────

export default async function ModelHubPage({ params }: PageProps) {
  const { make: makeSlug, model: modelSlug } = await params
  const result = getModelBySlug(makeSlug, modelSlug)
  if (!result) notFound()

  const { make, model } = result
  const vehicleString = `${make.name} ${model.name}`
  const basePath = `/vehicles/${make.slug}/${model.slug}`

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: make.name, href: `/vehicles/${make.slug}` },
    { label: `${model.name} Accessories` },
  ]

  // Merge all generation popular picks for the model-level module
  const allPopular = model.generations.flatMap((g) => g.popular)

  // Merge categories across generations for a model-level overview.
  // Group by slug, combine products (deduped by title).
  const categoryMap = new Map<
    string,
    { slug: string; name: string; products: typeof model.generations[0]["categories"][0]["products"] }
  >()
  for (const gen of model.generations) {
    for (const cat of gen.categories) {
      if (!categoryMap.has(cat.slug)) {
        categoryMap.set(cat.slug, { slug: cat.slug, name: cat.name, products: [...cat.products] })
      }
      // Categories have identical products across gens for the pilot,
      // so we don't duplicate. In the future, this merge becomes smarter.
    }
  }
  const mergedCategories = Array.from(categoryMap.values())

  // Once a generation has researched picks, the hub shows one lead pick per
  // product type (from the most researched generation) instead of the
  // placeholders.
  const featured = getFeaturedPicks(make.slug, model.slug)
  const productTypePages = getProductTypePages(make.slug, model.slug)

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
    ],
  }

  // JSON-LD: ItemList of product names. No Product/Offer markup: we don't sell
  // these items, and Offers without a price are invalid for Google.
  const allProducts = featured
    ? featured.items.map(({ resolved }) => `${resolved.product.brand} ${resolved.product.name}`)
    : mergedCategories.flatMap((cat) => cat.products.map((p) => p.title))

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: model.h1,
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
        h1={model.h1}
        intro={model.intro}
        ctaLabel={`Upload a photo of your ${model.name} to confirm what fits`}
        ctaHref="/#upload-zone"
      />

      {/* Generation selector */}
      <GenerationSelector
        generations={model.generations}
        basePath={basePath}
      />

      <ProductTypeLinks
        title={`Shop ${model.name} accessories by type`}
        productTypes={productTypePages}
        basePath={basePath}
      />

      {/* Affiliate disclosure - adjacent to product recommendations */}
      <AffiliateDisclosure />

      {featured ? (
        /* Top pick per product type from the most researched generation */
        <section className="w-full bg-white py-14 md:py-16">
          <div className="container max-w-5xl">
            <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
              {`Top picks for the ${featured.generation.label} ${model.name} (${featured.generation.displayRange})`}
            </h2>
            <p className="mt-2 text-muted-foreground">
              Pick your generation above for every product we recommend.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.items.map(({ productType, resolved }) => (
                <CatalogProductCard
                  key={productType.slug}
                  product={resolved.product}
                  eyebrow={productType.name}
                  icon={productType.icon}
                  vehicle={{
                    make: make.slug,
                    model: model.slug,
                    modelName: model.name,
                    yearStart: featured.generation.yearStart,
                    yearEnd: featured.generation.yearEnd,
                    vehicleString: `${featured.generation.displayRange} ${make.name} ${model.name}`,
                  }}
                />
              ))}
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* Category sections */}
          <section className="w-full bg-white py-14 md:py-16">
            <div className="container max-w-5xl space-y-14">
              {mergedCategories.map((cat) => (
                <CategorySection
                  key={cat.slug}
                  category={cat}
                  vehicleString={vehicleString}
                />
              ))}
            </div>
          </section>

          {/* Popular picks */}
          <PopularPicks
            modelNamePlural={`${model.name}s`}
            items={allPopular.slice(0, 6)}
            vehicleString={vehicleString}
          />
        </>
      )}

      {/* Related guides */}
      <RelatedGuides guides={tacomaGuides} />
    </>
  )
}

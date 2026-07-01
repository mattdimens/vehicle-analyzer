import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getAllMakes, getGenerationBySlug } from "@/data/vehicles/index"
import { VehicleHero } from "@/components/vehicles/vehicle-hero"
import { CategorySection } from "@/components/vehicles/category-section"
import { PopularPicks } from "@/components/vehicles/popular-picks"
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

// ── Static generation ──────────────────────────────────────────────────

export function generateStaticParams() {
  const params: { make: string; model: string; generation: string }[] = []
  for (const make of getAllMakes()) {
    for (const model of make.models) {
      for (const gen of model.generations) {
        params.push({
          make: make.slug,
          model: model.slug,
          generation: gen.slug,
        })
      }
    }
  }
  return params
}

// ── Metadata ───────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ make: string; model: string; generation: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { make: makeSlug, model: modelSlug, generation: genSlug } = await params
  const result = getGenerationBySlug(makeSlug, modelSlug, genSlug)
  if (!result) return {}

  const { make, model, generation } = result
  const h1 = `${generation.displayRange} (${generation.label}) ${make.name} ${model.name} Accessories`
  const title = `${h1} | Visual Fitment`
  const description = `${generation.intro.split(".").slice(0, 2).join(".")}. Browse fitment-verified accessories for the ${generation.displayRange} ${make.name} ${model.name}.`

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

export default async function GenerationPage({ params }: PageProps) {
  const { make: makeSlug, model: modelSlug, generation: genSlug } = await params
  const result = getGenerationBySlug(makeSlug, modelSlug, genSlug)
  if (!result) notFound()

  const { make, model, generation } = result
  const h1 = `${generation.displayRange} (${generation.label}) ${make.name} ${model.name} Accessories`
  const vehicleString = `${generation.displayRange} ${make.name} ${model.name}`
  const basePath = `/vehicles/${make.slug}/${model.slug}`

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

  // JSON-LD: ItemList + Product
  const allProducts = generation.categories.flatMap((cat) =>
    cat.products.map((p) => ({
      "@type": "Product" as const,
      name: p.title,
      description: p.blurb,
      ...(p.brand ? { brand: { "@type": "Brand" as const, name: p.brand } } : {}),
      offers: {
        "@type": "Offer" as const,
        url: `${BASE_URL}/go?cat=${encodeURIComponent(cat.slug)}&vehicle=${encodeURIComponent(vehicleString)}&product=${encodeURIComponent(p.title)}&source=vehicle-page`,
        availability: "https://schema.org/InStock",
      },
    }))
  )

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: h1,
    numberOfItems: allProducts.length,
    itemListElement: allProducts.map((product, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: product,
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

      {/* Category sections scoped to this generation */}
      <section className="w-full bg-white py-14 md:py-16">
        <div className="container max-w-5xl space-y-14">
          {generation.categories.map((cat) => (
            <CategorySection
              key={cat.slug}
              category={cat}
              vehicleString={vehicleString}
            />
          ))}
        </div>
      </section>

      {/* Popular picks for this generation */}
      <PopularPicks
        modelNamePlural={`${model.name}s`}
        items={generation.popular}
        vehicleString={vehicleString}
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

      {/* Affiliate disclosure */}
      <AffiliateDisclosure />
    </>
  )
}

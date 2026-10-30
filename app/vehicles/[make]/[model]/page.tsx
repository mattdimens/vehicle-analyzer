import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { getAllMakes, getModelBySlug, modelYears } from "@/data/vehicles/index"
import { productTypes, SKIPPED_PRODUCT_TYPES } from "@/data/vehicles/product-types"
import { getFeaturedPicks, getGenerationCards, getGenerationSections, getProductTypePages } from "@/data/vehicles/catalog"
import { GenerationHero } from "@/components/vehicles/generation-hero"
import { YearPicker } from "@/components/vehicles/year-picker"
import { GenerationCards } from "@/components/vehicles/generation-cards"
import { GenerationTabs } from "@/components/vehicles/generation-tabs"
import { CompactPickCard } from "@/components/vehicles/compact-pick-card"
import { pickBadge } from "@/components/vehicles/catalog-product-card"
import { GenerationSpecs } from "@/components/vehicles/generation-specs"
import { ProductTypeIcon } from "@/components/vehicles/product-type-icon"
import { GuideLinks, truckGuides } from "@/components/vehicles/guide-links"
import { AffiliateDisclosure } from "@/components/ui/affiliate-disclosure"
import {
  bodyTextClass,
  cardClass,
  mutedTextClass,
  pageSectionTitleClass,
} from "@/components/results/tokens"
import { cn } from "@/lib/utils"
import { amazonCardsFor } from "@/lib/amazon/cards"

const BASE_URL = "https://visualfitment.com"

// ── Static generation ──────────────────────────────────────────────────

// Regenerate hourly so the cached Amazon prices on the cards stay within
// Amazon's 24-hour window.  The pages stay static between regenerations.
export const revalidate = 3600

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

/** "Bed & Tonneau Covers" -> "bed and tonneau covers" */
const inSentence = (name: string) => name.replace(/&/g, "and").toLowerCase()

/** "a, b and c" */
function listInSentence(items: string[]): string {
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`
}

export default async function ModelHubPage({ params }: PageProps) {
  const { make: makeSlug, model: modelSlug } = await params
  const result = getModelBySlug(makeSlug, modelSlug)
  if (!result) notFound()

  const { make, model } = result
  const basePath = `/vehicles/${make.slug}/${model.slug}`

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: make.name, href: `/vehicles/${make.slug}` },
    { label: `${model.name} Accessories` },
  ]

  // Researched picks per generation (newest first), and the tab to open on:
  // the most researched generation
  const generations = model.generations.map((generation) => ({
    generation,
    href: `${basePath}/${generation.slug}`,
    sections: getGenerationSections(make.slug, model.slug, generation.slug),
  }))
  // Fresh Amazon data for the lead picks, from the amazon_items cache
  const amazon = await amazonCardsFor(
    generations.flatMap(({ sections }) => sections.flatMap((s) => (s.picks[0] ? [s.picks[0].product.asin] : [])))
  )
  const pricesShown = [...amazon.values()].some((a) => a?.kind === "live")
  const featured = getFeaturedPicks(make.slug, model.slug)
  const defaultTab = featured?.generation.slug ?? model.generations[0]?.slug ?? ""

  // Shop by type: product types with picks on any generation
  const productTypePages = new Set(getProductTypePages(make.slug, model.slug).map((t) => t.slug))
  const typeTiles = productTypes.flatMap((type) => {
    const withPicks = generations.flatMap(({ generation, sections }) => {
      const section = sections.find((s) => s.productType.slug === type.slug)
      return section ? [{ generation, count: section.picks.length }] : []
    })
    if (withPicks.length === 0) return []
    const busiest = [...withPicks].sort((a, b) => b.count - a.count)[0].generation
    return [
      {
        type,
        count: withPicks.reduce((n, g) => n + g.count, 0),
        generationLabels: withPicks.map((g) => g.generation.label),
        href: productTypePages.has(type.slug)
          ? `${basePath}/${type.slug}`
          : `${basePath}/${busiest.slug}#cat-${type.slug}`,
      },
    ]
  })
  const researchedTypes = new Set(typeTiles.map((t) => t.type.slug))
  const nextTypes = productTypes
    .filter((t) => !researchedTypes.has(t.slug) && !SKIPPED_PRODUCT_TYPES.has(t.slug))
    .slice(0, 5)

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

  // JSON-LD: ItemList of the researched products on this page (the lead
  // picks), and none when there are none.  No Product/Offer markup: we don't
  // sell these items, and Offers without a price are invalid for Google.
  const productNames = Array.from(
    new Set(
      generations.flatMap(({ sections }) =>
        sections.flatMap((s) => (s.picks[0] ? [`${s.picks[0].product.brand} ${s.picks[0].product.name}`] : []))
      )
    )
  )
  const itemListJsonLd =
    productNames.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: model.h1,
          numberOfItems: productNames.length,
          itemListElement: productNames.map((name, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name,
          })),
        }
      : null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}

      <GenerationHero
        breadcrumb={breadcrumbItems}
        eyebrow={make.name}
        h1={model.h1}
        intro={model.intro}
        asideOnMobile
        aside={
          <YearPicker
            modelName={model.name}
            years={modelYears(model.generations)}
            generations={generations.map(({ generation, href }) => ({
              slug: generation.slug,
              label: generation.label,
              yearStart: generation.yearStart,
              yearEnd: generation.yearEnd,
              displayRange: generation.displayRange,
              href,
            }))}
            fallbackHref="#generations"
            page="hub"
          />
        }
      />

      <div className="w-full bg-white">
        <div className="container max-w-6xl space-y-12 pb-16 pt-8 md:space-y-14 md:pt-10">
          {/* Shop by generation: plain links, so the page works without JavaScript */}
          <section id="generations" aria-labelledby="generations-title" className="scroll-mt-20">
            <h2 id="generations-title" className={pageSectionTitleClass}>
              Shop by generation
            </h2>
            <GenerationCards generations={getGenerationCards(make.slug, model.slug)} className="mt-4" />
          </section>

          {/* Top picks by generation: every tab's content is in the HTML */}
          <section aria-labelledby="top-picks-title">
            <h2 id="top-picks-title" className={pageSectionTitleClass}>
              Top picks by generation
            </h2>
            <GenerationTabs
              label={`${model.name} generation`}
              defaultSlug={defaultTab}
              className="mt-4"
              tabs={generations.map(({ generation, href, sections }) => ({
                slug: generation.slug,
                label: generation.label,
                panel:
                  sections.length > 0 ? (
                    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
                      {sections.map(({ productType, picks }) =>
                        picks[0] ? (
                          <li key={productType.slug}>
                            <CompactPickCard
                              product={picks[0].product}
                              amazon={amazon.get(picks[0].product.asin)}
                              eyebrow={[productType.name, pickBadge(picks[0].pick)].filter(Boolean).join(" · ")}
                              vehicle={{
                                make: make.slug,
                                model: model.slug,
                                modelName: model.name,
                                yearStart: generation.yearStart,
                                yearEnd: generation.yearEnd,
                                vehicleString: `${generation.displayRange} ${make.name} ${model.name}`,
                              }}
                            />
                          </li>
                        ) : null
                      )}
                      <li>
                        <Link
                          href={href}
                          className={cn(
                            cardClass,
                            "flex h-full min-h-14 flex-col justify-center gap-1 border-dashed p-4 transition-colors hover:border-[#17212B]"
                          )}
                        >
                          <span className="font-heading text-[17px] font-bold text-[#17212B]">
                            See every {generation.label} pick
                          </span>
                          <span className={cn("text-sm", mutedTextClass)}>
                            {generation.configs
                              ? "Filter by your cab and bed, and read the fitment catches."
                              : "Read the fitment notes and the catches owners report."}
                          </span>
                        </Link>
                      </li>
                    </ul>
                  ) : (
                    <div className={cn(cardClass, "flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between md:p-5")}>
                      <p className={cn("text-[15px] leading-relaxed", bodyTextClass)}>
                        We&apos;re still researching products for the {generation.label}. Its page has Amazon searches for your years until then.
                      </p>
                      <Link
                        href={href}
                        className="inline-flex min-h-11 shrink-0 items-center gap-1 text-[15px] font-semibold text-[#17212B] underline-offset-2 hover:text-[#9A3412] hover:underline"
                      >
                        Browse {generation.label} accessories
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  ),
              }))}
            />
          </section>

          {/* Shop by type */}
          {typeTiles.length > 0 && (
            <section aria-labelledby="by-type-title">
              <h2 id="by-type-title" className={pageSectionTitleClass}>
                Shop by type
              </h2>
              <ul className="mt-4 grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-4">
                {typeTiles.map(({ type, count, generationLabels, href }) => (
                  <li key={type.slug}>
                    <Link
                      href={href}
                      className={cn(cardClass, "flex min-h-16 items-center gap-3 p-3.5 transition-colors hover:border-[#17212B]")}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#F4F7F9] text-[#17212B]">
                        <ProductTypeIcon slug={type.slug} className="h-5 w-5" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-[15px] font-semibold text-[#17212B]">{type.name}</span>
                        <span className={cn("text-[13px]", mutedTextClass)}>
                          {count} {count === 1 ? "pick" : "picks"} · {generationLabels.join(", ")}
                        </span>
                      </span>
                      <ChevronRight className={cn("h-5 w-5 shrink-0", mutedTextClass)} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
              {nextTypes.length > 0 && (
                <p className={cn("mt-3 text-sm leading-relaxed", mutedTextClass)}>
                  Researching next: {listInSentence(nextTypes.map((t) => inSentence(t.name)))}.
                </p>
              )}
            </section>
          )}

          <GenerationSpecs title={`How the ${model.name} generations differ`} generations={model.generations} />

          <GuideLinks guides={truckGuides} className="max-w-2xl" />

          <AffiliateDisclosure variant="inline" prices={pricesShown} />
        </div>
      </div>
    </>
  )
}

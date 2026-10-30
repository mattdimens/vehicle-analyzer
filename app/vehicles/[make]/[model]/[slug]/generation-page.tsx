import type { Metadata } from "next"
import Link from "next/link"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { VehicleGeneration, VehicleMake, VehicleModel } from "@/data/vehicles/types"
import { productTypes } from "@/data/vehicles/product-types"
import { getGenerationSections, getProductTypePages, remainingPlaceholders } from "@/data/vehicles/catalog"
import { fitmentCheckedLabel } from "@/data/vehicles/catalog/fitment"
import { GenerationHero, PhotoCheckCard } from "@/components/vehicles/generation-hero"
import { CatalogSection } from "@/components/vehicles/catalog-section"
import { MoreToBrowse } from "@/components/vehicles/more-to-browse"
import { PageNav } from "@/components/vehicles/page-nav"
import type { PageNavItem } from "@/components/vehicles/page-nav"
import type { GuideLink } from "@/components/vehicles/related-guides"
import { AffiliateDisclosure } from "@/components/ui/affiliate-disclosure"
import { bodyTextClass, cardClass, mutedTextClass, pageSectionTitleClass } from "@/components/results/tokens"
import { cn } from "@/lib/utils"

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

  // Researched catalog picks come first.  What hasn't been researched yet is
  // listed below them as Amazon searches, minus the placeholders a
  // researched product type replaces.
  const sections = getGenerationSections(make.slug, model.slug, generation.slug)
  const researched = new Set(sections.map((s) => s.productType.slug))
  const placeholders = remainingPlaceholders(generation.categories, researched)
  const typesWithPages = new Set(getProductTypePages(make.slug, model.slug).map((t) => t.slug))
  const comingSoon = productTypes.filter((t) => !researched.has(t.slug)).map((t) => t.name)
  const faqs = generation.faqs ?? []
  const otherGenerations = model.generations.filter((g) => g.slug !== generation.slug)

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

  // JSON-LD: ItemList of researched product names only, and none when there
  // are no researched products.  No Product/Offer markup: we don't sell these
  // items, and Offers without a price are invalid for Google.
  const productNames = sections.flatMap((s) =>
    s.picks.map((r) => `${r.product.brand} ${r.product.name}`)
  )
  const itemListJsonLd =
    productNames.length > 0
      ? {
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
      : null

  const moreId = "more-to-browse"
  const navItems: PageNavItem[] = [
    ...sections.map((s) => ({
      id: `cat-${s.productType.slug}`,
      label: s.productType.name,
      count: s.picks.length,
    })),
    ...(placeholders.length > 0
      ? [{ id: moreId, label: "More to browse", count: placeholders.length }]
      : []),
    ...(faqs.length > 0 ? [{ id: "questions", label: "Questions" }] : []),
    ...(otherGenerations.length > 0 ? [{ id: "other-generations", label: "Other generations" }] : []),
    { id: "guides", label: "Guides" },
  ]

  const photoCard = {
    title: "Not sure which cab and bed you have?",
    line: `Upload a photo of your ${model.name} and we'll identify the cab and bed.`,
    buttonLabel: `Identify my ${model.name}`,
  }

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
        back={{ href: basePath, label: `All ${model.name} accessories` }}
        eyebrow={`${make.name} ${model.name} · ${generation.label}`}
        h1={h1}
        intro={generation.intro}
        generations={{
          label: `${model.name} generations`,
          links: model.generations.map((g) => ({
            href: `${basePath}/${g.slug}`,
            label: g.label,
            years: g.displayRange,
            current: g.slug === generation.slug,
          })),
        }}
        aside={<PhotoCheckCard {...photoCard} />}
      />

      {/* Phones and tablets: sticky chip rail.  1024px and up: the sidebar. */}
      <PageNav items={navItems} variant="bar" className="lg:hidden" />

      <div className="w-full bg-white">
        <div className="container max-w-6xl pb-16 pt-4 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10 lg:pt-8">
          <div className="hidden lg:block">
            <PageNav items={navItems} variant="sidebar" comingSoon={comingSoon} />
          </div>

          <div className="min-w-0">
            {/* Affiliate disclosure - adjacent to product recommendations */}
            <AffiliateDisclosure variant="inline" className="mb-6 md:mb-8" />

            <div className="space-y-12 md:space-y-14">
              {sections.map((s) => (
                <CatalogSection
                  key={s.productType.slug}
                  id={`cat-${s.productType.slug}`}
                  title={s.productType.name}
                  productTypeSlug={s.productType.slug}
                  itemNoun={s.productType.name.toLowerCase()}
                  checkedLabel={fitmentCheckedLabel(s.picks.map((r) => r.product))}
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
                  buyingNotes={
                    s.guide
                      ? {
                          title: `Before you buy ${s.productType.name.toLowerCase()}`,
                          notes: s.guide.buyingNotes,
                        }
                      : undefined
                  }
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

              <MoreToBrowse
                id={moreId}
                title={`More to browse for your ${generation.label}`}
                searchScope={`${generation.displayRange} ${model.name}`}
                categories={placeholders}
                vehicleString={vehicleString}
              />

              {/* Fitment questions, when the generation has them, and the photo card under 1024px */}
              <section
                id={faqs.length > 0 ? "questions" : undefined}
                aria-labelledby={faqs.length > 0 ? "questions-title" : undefined}
                className={cn("scroll-mt-32 lg:scroll-mt-20", faqs.length === 0 && "lg:hidden")}
              >
                {faqs.length > 0 && (
                  <>
                    <h2 id="questions-title" className={pageSectionTitleClass}>
                      {generation.label} {model.name} fitment questions
                    </h2>
                    <div className={cn(cardClass, "mt-4 px-4 py-0")}>
                      {faqs.map((faq) => (
                        <details key={faq.q} className="group border-t border-[#EDF1F4] first:border-t-0">
                          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-2 text-[15px] font-semibold text-[#17212B] [&::-webkit-details-marker]:hidden">
                            {faq.q}
                            <ChevronDown
                              className={cn("h-[18px] w-[18px] shrink-0 transition-transform group-open:rotate-180", mutedTextClass)}
                              aria-hidden="true"
                            />
                          </summary>
                          <p className={cn("pb-4 text-sm leading-relaxed", bodyTextClass)}>{faq.a}</p>
                        </details>
                      ))}
                    </div>
                  </>
                )}
                {/* Under 1024px the photo card moves here from the hero */}
                <PhotoCheckCard {...photoCard} className={cn("lg:hidden", faqs.length > 0 && "mt-4")} />
              </section>

              {/* Footer band: other generations and guides */}
              <div className="grid gap-12 border-t border-[#D5DEE5] pt-10 md:grid-cols-2 md:gap-10">
                {otherGenerations.length > 0 && (
                  <section id="other-generations" aria-labelledby="other-generations-title" className="scroll-mt-32 lg:scroll-mt-20">
                    <h2 id="other-generations-title" className="font-heading text-lg font-bold text-[#17212B]">
                      Other {model.name} generations
                    </h2>
                    <ul className="mt-3 grid grid-cols-3 gap-2">
                      {otherGenerations.map((g) => (
                        <li key={g.slug}>
                          <Link
                            href={`${basePath}/${g.slug}`}
                            className={cn(cardClass, "flex h-full flex-col gap-0.5 p-3 transition-colors hover:border-[#17212B]")}
                          >
                            <span className="text-sm font-semibold text-[#17212B]">{g.label}</span>
                            <span className={cn("text-xs", mutedTextClass)}>{g.displayRange}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <section id="guides" aria-labelledby="guides-title" className="scroll-mt-32 lg:scroll-mt-20">
                  <h2 id="guides-title" className="font-heading text-lg font-bold text-[#17212B]">
                    Guides
                  </h2>
                  <ul className="mt-2">
                    {truckGuides.map((guide) => (
                      <li key={guide.slug} className="border-t border-[#EDF1F4] first:border-t-0">
                        <Link
                          href={`/blog/${guide.slug}`}
                          className="flex min-h-11 items-center justify-between gap-3 text-sm font-medium text-[#17212B] hover:text-[#9A3412]"
                        >
                          {guide.title}
                          <ChevronRight className={cn("h-4 w-4 shrink-0", mutedTextClass)} aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

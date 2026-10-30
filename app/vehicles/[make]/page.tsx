import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getAllMakes, getMakeBySlug } from "@/data/vehicles/index"
import { GenerationHero, PhotoCheckCard } from "@/components/vehicles/generation-hero"
import { ModelBrowseBlock } from "@/components/vehicles/model-browse-block"
import { bodyTextClass, pageSectionTitleClass } from "@/components/results/tokens"
import { cn } from "@/lib/utils"

const BASE_URL = "https://visualfitment.com"

// ── Static generation ──────────────────────────────────────────────────

export function generateStaticParams() {
  return getAllMakes().map((make) => ({ make: make.slug }))
}

// ── Metadata ───────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ make: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { make: makeSlug } = await params
  const make = getMakeBySlug(makeSlug)
  if (!make) return {}

  const title = `${make.name} Accessories & Fitment | Visual Fitment`
  const description = `Browse accessories for your ${make.name} by model and generation. Not sure which generation you have? Upload a photo and we'll identify your vehicle.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/vehicles/${make.slug}`,
      siteName: "Visual Fitment",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: `/vehicles/${make.slug}` },
  }
}

// ── Page ───────────────────────────────────────────────────────────────

export default async function MakeHubPage({ params }: PageProps) {
  const { make: makeSlug } = await params
  const make = getMakeBySlug(makeSlug)
  if (!make) notFound()

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: make.name },
  ]

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: `${make.name} Accessories`,
        item: `${BASE_URL}/vehicles/${make.slug}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <GenerationHero
        breadcrumb={breadcrumbItems}
        back={{ href: "/", label: "Home" }}
        eyebrow={make.name}
        h1={`${make.name} Accessories & Fitment`}
        intro={`Find accessories for your ${make.name} by model and generation. Not sure which generation you have? Upload a photo and we'll identify it.`}
      />

      <div className="w-full bg-white">
        <div className="container max-w-6xl space-y-10 pb-16 pt-8 md:space-y-12 md:pt-10">
          {make.models.map((model) => (
            <section key={model.slug} aria-labelledby={`${model.slug}-title`} className="flex flex-col gap-4">
              <div>
                <h2 id={`${model.slug}-title`} className={pageSectionTitleClass}>
                  {model.name}
                </h2>
                <p className={cn("mt-2 max-w-3xl text-[15px] leading-relaxed md:text-base", bodyTextClass)}>
                  {model.intro.split(".")[0]}.
                </p>
              </div>
              <ModelBrowseBlock make={make} model={model} page="make" />
            </section>
          ))}

          <PhotoCheckCard
            title={`Not sure which ${make.name} you have?`}
            line="Upload a photo and we'll tell you the model, generation, cab and bed."
            buttonLabel={`Identify my ${make.name}`}
            className="max-w-md"
          />
        </div>
      </div>
    </>
  )
}

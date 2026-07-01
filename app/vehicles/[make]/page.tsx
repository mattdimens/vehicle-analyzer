import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { getAllMakes, getMakeBySlug } from "@/data/vehicles/index"
import { VehicleHero } from "@/components/vehicles/vehicle-hero"
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav"

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
  const description = `Browse fitment-verified accessories for your ${make.name}. Find the right parts by model and generation, with every product link routed through our smart shopping layer.`

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

      <BreadcrumbNav items={breadcrumbItems} />

      <VehicleHero
        h1={`${make.name} Accessories & Fitment`}
        intro={`Find accessories matched to your ${make.name} by model and generation. Every product is routed through our fitment-aware shopping layer so you get the right part the first time.`}
        ctaLabel={`Upload a photo of your ${make.name} to confirm what fits`}
        ctaHref="/#upload-zone"
      />

      {/* Model grid */}
      <section className="w-full bg-white py-14 md:py-16">
        <div className="container max-w-5xl">
          <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl mb-8">
            Models
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {make.models.map((model) => (
              <Link
                key={model.slug}
                href={`/vehicles/${make.slug}/${model.slug}`}
                className="group flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-[#E8712B]/40 hover:-translate-y-0.5"
              >
                <h3 className="font-heading text-xl font-bold text-foreground group-hover:text-[#E8712B] transition-colors">
                  {make.name} {model.name}
                </h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground line-clamp-2">
                  {model.intro.split(".")[0]}.
                </p>
                <span className="mt-3 text-xs text-muted-foreground">
                  {model.generations.length} generation{model.generations.length !== 1 ? "s" : ""}
                </span>
                <div className="mt-4 flex items-center text-sm font-medium text-[#E8712B] opacity-0 group-hover:opacity-100 transition-opacity">
                  Browse accessories
                  <ChevronRight className="ml-1 h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { getAllMakes } from "@/data/vehicles/index"
import { VehicleHero } from "@/components/vehicles/vehicle-hero"
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav"

const BASE_URL = "https://visualfitment.com"

export const metadata: Metadata = {
  title: "Vehicle Accessories & Fitment | Visual Fitment",
  description:
    "Browse fitment-verified accessories by make, model, and generation. Find the right parts for your vehicle with every product link routed through our smart shopping layer.",
  openGraph: {
    title: "Vehicle Accessories & Fitment | Visual Fitment",
    description:
      "Browse fitment-verified accessories by make, model, and generation.",
    url: `${BASE_URL}/vehicles`,
    siteName: "Visual Fitment",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vehicle Accessories & Fitment | Visual Fitment",
    description:
      "Browse fitment-verified accessories by make, model, and generation.",
  },
  alternates: { canonical: "/vehicles" },
}

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
    {
      "@type": "ListItem",
      position: 2,
      name: "Vehicles",
      item: `${BASE_URL}/vehicles`,
    },
  ],
}

export default function VehiclesIndexPage() {
  const makes = getAllMakes()

  const breadcrumbItems = [{ label: "Home", href: "/" }, { label: "Vehicles" }]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <BreadcrumbNav items={breadcrumbItems} />

      <VehicleHero
        h1="Vehicle Accessories & Fitment"
        intro="Find accessories matched to your vehicle by make, model, and generation. Every product is routed through our fitment-aware shopping layer so you get the right part the first time."
        ctaLabel="Upload a photo to confirm what fits"
        ctaHref="/#upload-zone"
      />

      <section className="w-full bg-white py-14 md:py-16">
        <div className="container max-w-5xl">
          <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl mb-8">
            Browse by Make
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {makes.map((make) => (
              <Link
                key={make.slug}
                href={`/vehicles/${make.slug}`}
                className="group flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-[#E8712B]/40 hover:-translate-y-0.5"
              >
                <h3 className="font-heading text-xl font-bold text-foreground group-hover:text-[#E8712B] transition-colors">
                  {make.name}
                </h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">
                  {make.models.length} model{make.models.length !== 1 ? "s" : ""} with fitment-verified accessories
                </p>
                <div className="mt-4 flex items-center text-sm font-medium text-[#E8712B] opacity-0 group-hover:opacity-100 transition-opacity">
                  Browse models
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

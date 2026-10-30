import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getAllMakes, getGenerationBySlug } from "@/data/vehicles/index"
import { getProductTypePage, getProductTypeRoutes } from "@/data/vehicles/catalog"
import { GenerationPage, generationMetadata } from "./generation-page"
import { ProductTypePage, productTypeMetadata } from "./product-type-page"

/**
 * /vehicles/{make}/{model}/{slug}: a generation page ("3rd-gen") or a
 * product-type page ("bed-racks").  Next.js allows one dynamic segment per
 * level, so this page dispatches on the slug.  The two slug sets never
 * collide (unit-tested).
 */

// ── Static generation ──────────────────────────────────────────────────

// Regenerate hourly so the cached Amazon prices on the cards stay within
// Amazon's 24-hour window.  The pages stay static between regenerations.
export const revalidate = 3600

export function generateStaticParams() {
  const params: { make: string; model: string; slug: string }[] = []
  for (const make of getAllMakes()) {
    for (const model of make.models) {
      for (const gen of model.generations) {
        params.push({ make: make.slug, model: model.slug, slug: gen.slug })
      }
    }
  }
  for (const route of getProductTypeRoutes()) {
    params.push({ make: route.make, model: route.model, slug: route.productType })
  }
  return params
}

// ── Metadata ───────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ make: string; model: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { make, model, slug } = await params

  const generation = getGenerationBySlug(make, model, slug)
  if (generation) return generationMetadata(generation)

  const productTypePage = getProductTypePage(make, model, slug)
  if (productTypePage) return productTypeMetadata(productTypePage)

  return {}
}

// ── Page ───────────────────────────────────────────────────────────────

export default async function VehicleSlugPage({ params }: PageProps) {
  const { make, model, slug } = await params

  const generation = getGenerationBySlug(make, model, slug)
  if (generation) return <GenerationPage {...generation} />

  const productTypePage = getProductTypePage(make, model, slug)
  if (productTypePage) return <ProductTypePage data={productTypePage} />

  notFound()
}

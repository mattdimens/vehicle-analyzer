import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import type { VehicleGeneration } from "@/data/vehicles/types"

interface SiblingGenerationsProps {
  /** All generations for the model (newest first) */
  generations: VehicleGeneration[]
  /** Slug of the currently active generation */
  currentSlug: string
  /** Base path, e.g. "/vehicles/toyota/tacoma" */
  basePath: string
  /** Model hub label, e.g. "All Tacoma Accessories" */
  modelHubLabel: string
}

export function SiblingGenerations({
  generations,
  currentSlug,
  basePath,
  modelHubLabel,
}: SiblingGenerationsProps) {
  return (
    <section className="w-full border-t border-border/40 bg-white py-10">
      <div className="container max-w-5xl">
        {/* Back to model hub */}
        <Link
          href={basePath}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#1A4D2E] hover:text-[#E8712B] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {modelHubLabel}
        </Link>

        <h3 className="font-heading text-lg font-bold text-foreground mb-4">
          Other generations
        </h3>

        <div className="flex flex-wrap gap-3">
          {generations
            .filter((g) => g.slug !== currentSlug)
            .map((gen) => (
              <Link
                key={gen.slug}
                href={`${basePath}/${gen.slug}`}
                className="group inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium shadow-sm transition-all hover:shadow-md hover:border-[#E8712B]/40"
              >
                <span className="text-foreground">{gen.label}</span>
                <span className="text-muted-foreground">{gen.displayRange}</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#E8712B] opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
        </div>
      </div>
    </section>
  )
}

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import type { VehicleGeneration } from "@/data/vehicles/types"

interface GenerationSelectorProps {
  generations: VehicleGeneration[]
  /** Base path, e.g. "/vehicles/toyota/tacoma" */
  basePath: string
}

export function GenerationSelector({
  generations,
  basePath,
}: GenerationSelectorProps) {
  return (
    <section className="w-full bg-white py-14 md:py-16">
      <div className="container max-w-5xl">
        <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
          Shop by <span className="text-[#E8712B]">Generation</span>
        </h2>
        <p className="mt-2 text-muted-foreground">
          Select your generation to see accessories verified for your year range.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {generations.map((gen) => (
            <Link
              key={gen.slug}
              href={`${basePath}/${gen.slug}`}
              className="group relative flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-[#E8712B]/40 hover:-translate-y-0.5"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-[#E8712B]">
                {gen.label}
              </span>
              <span className="mt-1 font-heading text-xl font-bold text-foreground">
                {gen.displayRange}
              </span>
              <span className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {gen.intro.split(".")[0]}.
              </span>
              <div className="mt-auto flex items-center pt-4 text-sm font-medium text-[#E8712B] opacity-0 transition-opacity group-hover:opacity-100">
                View accessories
                <ChevronRight className="ml-1 h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

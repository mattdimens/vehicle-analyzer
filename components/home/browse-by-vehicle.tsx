import Link from "next/link"
import { ChevronRight, Truck } from "lucide-react"
import { getAllMakes } from "@/data/vehicles/index"

/**
 * "Browse by Vehicle" homepage section.
 *
 * Renders a responsive grid of vehicle model cards, data-driven from the
 * vehicle registry.  Designed to scale: adding a new model to the
 * registry automatically adds a card here.
 *
 * Includes a "More models coming soon" placeholder so the grid does not
 * look incomplete with a single card.
 */
export function BrowseByVehicle() {
  const makes = getAllMakes()

  // Flatten all models across makes for the card grid
  const modelCards = makes.flatMap((make) =>
    make.models.map((model) => ({
      make,
      model,
      href: `/vehicles/${make.slug}/${model.slug}`,
      generationCount: model.generations.length,
      latestRange: model.generations[0]?.displayRange,
    }))
  )

  return (
    <section id="browse-by-vehicle" className="w-full bg-white py-16 md:py-20">
      <div className="container max-w-6xl">
        <div className="mb-12 text-center">
          <Link href="/vehicles" className="group inline-block">
            <h2 className="font-heading text-4xl font-bold text-black md:text-5xl">
              Browse by{" "}
              <span className="text-[#E8712B] italic group-hover:text-[#d4652a] transition-colors">
                Vehicle
              </span>
            </h2>
          </Link>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Shop accessories verified for your exact make, model, and generation.
            Every product links through our fitment-aware shopping layer.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modelCards.map(({ make, model, href, generationCount, latestRange }) => (
            <Link
              key={`${make.slug}-${model.slug}`}
              href={href}
              className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-sm transition-all hover:shadow-md hover:border-[#E8712B]/40 hover:-translate-y-1"
            >
              {/* Visual header band */}
              <div className="flex items-center gap-3 bg-gradient-to-r from-[#0D2818] to-[#1A4D2E] px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
                    {make.name}
                  </span>
                  <h3 className="font-heading text-lg font-bold text-white leading-tight">
                    {model.name} Accessories
                  </h3>
                </div>
              </div>

              {/* Card body */}
              <div className="flex flex-col flex-1 p-5">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {model.intro.split(".")[0]}.
                </p>

                <div className="mt-auto flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      {generationCount} generation{generationCount !== 1 ? "s" : ""}
                    </span>
                    {latestRange && (
                      <span className="text-xs text-muted-foreground/70">
                        Latest: {latestRange}
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#E8712B] opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5">
                    Shop
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {/* "More coming" placeholder card */}
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/30 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8712B]/10 mb-4">
              <Truck className="h-6 w-6 text-[#E8712B]/60" />
            </div>
            <p className="font-heading text-base font-semibold text-muted-foreground/70">
              More models coming soon
            </p>
            <p className="mt-1 text-xs text-muted-foreground/50">
              We are adding new vehicles regularly
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

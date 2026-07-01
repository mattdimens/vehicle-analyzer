import { ExternalLink, Star } from "lucide-react"
import { buildGoUrl } from "@/data/vehicles/index"
import type { PopularItem } from "@/data/vehicles/types"

interface PopularPicksProps {
  /** Model name for the heading, e.g. "Tacomas" */
  modelNamePlural: string
  items: PopularItem[]
  vehicleString: string
}

export function PopularPicks({
  modelNamePlural,
  items,
  vehicleString,
}: PopularPicksProps) {
  if (items.length === 0) return null

  return (
    <section className="w-full bg-gradient-to-b from-[#0D2818] to-[#1A4D2E] py-14 md:py-16">
      <div className="container max-w-5xl">
        <div className="flex items-center gap-3 mb-2">
          <Star className="h-5 w-5 text-[#E8712B]" />
          <h2 className="font-heading text-2xl font-bold text-white md:text-3xl">
            Most popular on real {modelNamePlural}
          </h2>
        </div>
        <p className="text-sm text-white/50 mb-8">
          Editorially curated picks based on community trends and owner feedback.
        </p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const goUrl = buildGoUrl({
              categorySlug: item.categorySlug,
              vehicleString,
              brand: item.brand,
              productTitle: item.title,
            })

            return (
              <div
                key={i}
                className="flex flex-col rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20"
              >
                <span className="mb-3 inline-flex items-center gap-1.5 w-fit rounded-full bg-[#E8712B]/20 px-2.5 py-1 text-xs font-semibold text-[#E8712B]">
                  <Star className="h-3 w-3" />
                  Popular pick
                </span>

                <h3 className="font-heading text-lg font-semibold text-white">
                  {item.title}
                </h3>

                {item.brand && (
                  <span className="mt-1 text-xs font-medium text-white/50">
                    {item.brand}
                  </span>
                )}

                <p className="mt-2 flex-1 text-sm leading-relaxed text-white/70">
                  {item.blurb}
                </p>

                <a
                  href={goUrl}
                  target="_blank"
                  rel="nofollow sponsored noopener"
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-[#E8712B] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#d4652a]"
                >
                  Shop
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

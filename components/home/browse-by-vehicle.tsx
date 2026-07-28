"use client"

import Link from "next/link"
import { ChevronRight, Truck } from "lucide-react"
import { getSupportedGenerationCards } from "@/data/vehicles/supported-vehicles"

/**
 * "Browse by Vehicle" homepage section.
 *
 * Renders a responsive grid of generation cards, data-driven from the
 * supported-vehicles config. Each card has descriptive SEO anchor text
 * and links to its generation page.
 *
 * Designed to scale from 1 to 20+ cards gracefully via CSS grid auto-fill.
 * Adding a new vehicle family to supported-vehicles.ts automatically
 * populates this grid with zero component changes.
 */
export function BrowseByVehicle() {
  const cards = getSupportedGenerationCards()

  const handleCardClick = (generation: string) => {
    import('@/lib/analytics').then(({ trackEvent, setEntryDoor }) => {
      setEntryDoor('browse_by_vehicle')
      trackEvent('browse_by_vehicle_click', { generation })
    })
  }

  return (
    <section id="browse-by-vehicle" className="w-full bg-white py-16 md:py-20">
      <div className="container max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="font-heading text-4xl font-bold text-black md:text-5xl">
            Browse by{" "}
            <span className="text-[#E8712B] italic">
              Vehicle
            </span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Shop accessories verified for your exact make, model, and generation.
            Every product links through our fitment-aware shopping layer.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((card) => (
            <Link
              key={`${card.make}-${card.model}-${card.slug}`}
              href={card.href}
              onClick={() => handleCardClick(card.label)}
              className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-sm transition-all hover:shadow-md hover:border-[#E8712B]/40 hover:-translate-y-1"
            >
              {/* Visual header band */}
              <div className="flex items-center gap-3 bg-gradient-to-r from-[#0D2818] to-[#1A4D2E] px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
                    {card.make} {card.model}
                  </span>
                  <h3 className="font-heading text-base font-bold text-white leading-tight">
                    {card.label} ({card.displayRange})
                  </h3>
                </div>
              </div>

              {/* Card body */}
              <div className="flex flex-col flex-1 p-5">
                <p className="text-sm text-muted-foreground mb-4">
                  Fitment-verified accessories for the {card.displayRange} {card.make} {card.model}.
                </p>

                <div className="mt-auto flex items-center justify-end">
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#E8712B] group-hover:translate-x-0.5 transition-transform">
                    {card.cardTitle.split("(")[0].trim()}
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

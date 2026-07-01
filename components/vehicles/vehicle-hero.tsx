import Link from "next/link"
import { Camera } from "lucide-react"

interface VehicleHeroProps {
  h1: string
  intro: string
  ctaLabel: string
  /** Link destination for the fitment CTA */
  ctaHref: string
}

export function VehicleHero({ h1, intro, ctaLabel, ctaHref }: VehicleHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0D2818] via-[#1A4D2E] to-[#0D2818]">
      {/* Subtle grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="container relative z-10 max-w-5xl py-16 md:py-20">
        <h1 className="font-heading text-4xl font-bold text-white md:text-5xl lg:text-6xl">
          {h1}
        </h1>

        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">
          {intro}
        </p>

        <Link
          href={ctaHref}
          className="mt-8 inline-flex items-center gap-2.5 rounded-lg bg-[#E8712B] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-900/20 transition-all hover:bg-[#d4652a] hover:shadow-xl hover:shadow-orange-900/30 hover:-translate-y-0.5"
        >
          <Camera className="h-5 w-5" />
          {ctaLabel}
        </Link>
      </div>
    </section>
  )
}

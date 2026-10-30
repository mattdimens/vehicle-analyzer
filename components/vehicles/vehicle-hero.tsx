import Link from "next/link"
import { Camera } from "lucide-react"
import { pageBackgroundClass } from "@/components/results/tokens"
import { cn } from "@/lib/utils"

interface VehicleHeroProps {
  h1: string
  intro: string
  ctaLabel: string
  /** Link destination for the fitment CTA */
  ctaHref: string
}

export function VehicleHero({ h1, intro, ctaLabel, ctaHref }: VehicleHeroProps) {
  return (
    <section className={cn("relative overflow-hidden", pageBackgroundClass)}>
      <div className="container relative z-10 max-w-5xl py-16 md:py-20">
        <h1 className="font-heading text-4xl font-bold text-[#17212B] md:text-5xl lg:text-6xl">
          {h1}
        </h1>

        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#2B3742]">
          {intro}
        </p>

        <Link
          href={ctaHref}
          className="mt-8 inline-flex items-center gap-2.5 rounded-lg bg-[#C8460F] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-900/20 transition-all hover:bg-[#AD3C0C] hover:shadow-xl hover:shadow-orange-900/30 hover:-translate-y-0.5"
        >
          <Camera className="h-5 w-5" />
          {ctaLabel}
        </Link>
      </div>
    </section>
  )
}

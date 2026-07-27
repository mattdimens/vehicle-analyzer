"use client"

import { useEffect, useRef, useState } from "react"
import { Package, Grid3X3, Layers } from "lucide-react"

interface CatalogStatsBarProps {
  totalProducts: number
  totalCategories: number
  totalGenerations: number
}

interface StatDisplay {
  icon: React.ComponentType<{ className?: string }>
  value: number
  label: string
}

function useCountUp(target: number, duration: number, start: boolean) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!start) return

    let startTime: number | null = null
    let raf: number

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) {
        raf = requestAnimationFrame(step)
      }
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, start])

  return count
}

function AnimatedStat({
  stat,
  animate,
}: {
  stat: StatDisplay
  animate: boolean
}) {
  const count = useCountUp(stat.value, 1500, animate)
  const Icon = stat.icon

  return (
    <div className="flex flex-col items-center gap-2 px-4">
      <Icon className="w-6 h-6 text-white/60" />
      <div className="text-2xl md:text-3xl font-bold text-white font-heading tabular-nums">
        {animate ? count.toLocaleString() : "0"}
      </div>
      <div className="text-xs md:text-sm text-white/60 font-medium text-center">
        {stat.label}
      </div>
    </div>
  )
}

/**
 * CatalogStatsBar
 *
 * Replacement for the old StatsBar. Shows only verifiable claims
 * computed from real catalog data. Counts are passed in as props
 * from the server-rendered parent so they stay accurate as the
 * catalog grows.
 *
 * The "vetted by enthusiasts" statement appears only in TrustStrip
 * to avoid repetition on the page.
 */
export function CatalogStatsBar({
  totalProducts,
  totalCategories,
  totalGenerations,
}: CatalogStatsBarProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasAnimated])

  const stats: StatDisplay[] = [
    {
      icon: Package,
      value: totalProducts,
      label: "Hand-Curated Products",
    },
    {
      icon: Grid3X3,
      value: totalCategories,
      label: "Accessory Categories",
    },
    {
      icon: Layers,
      value: totalGenerations,
      label: "Vehicle Generations Covered",
    },
  ]

  return (
    <section ref={ref} className="w-full bg-[#003223] py-16">
      <div className="container max-w-5xl">
        <p className="text-[11px] uppercase tracking-[0.08em] text-white/30 font-medium text-center mb-6">
          Our Catalog
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
          {stats.map((stat) => (
            <AnimatedStat
              key={stat.label}
              stat={stat}
              animate={hasAnimated}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

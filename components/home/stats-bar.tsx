"use client"

import { useEffect, useRef, useState } from "react"
import { Car, Cog, Target, Database, ShoppingBag, Flag, Wrench, Sparkles } from "lucide-react"

interface StatItem {
    icon: React.ComponentType<{ className?: string }>
    value: number
    suffix: string
    label: string
}

const stats: StatItem[] = [
    { icon: Car, value: 12847, suffix: "", label: "Vehicles Analyzed" },
    { icon: Cog, value: 4312, suffix: "", label: "Parts Identified" },
    { icon: Target, value: 91, suffix: "%", label: "Average Confidence" },
    { icon: Database, value: 10000, suffix: "+", label: "Vehicle Models Supported" },
]

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

function AnimatedStat({ stat, animate }: { stat: StatItem; animate: boolean }) {
    const count = useCountUp(stat.value, 2000, animate)
    const Icon = stat.icon

    return (
        <div className="flex flex-col items-center gap-2 px-4">
            <Icon className="w-6 h-6 text-white/60" />
            <div className="text-2xl md:text-3xl font-bold text-white font-heading tabular-nums">
                {animate ? count.toLocaleString() : "0"}
                {animate && count >= stat.value ? stat.suffix : ""}
            </div>
            <div className="text-xs md:text-sm text-white/60 font-medium">
                {stat.label}
            </div>
        </div>
    )
}

export function StatsBar() {
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

    return (
        <section ref={ref} className="w-full bg-[#003223] py-16">
            <div className="container max-w-5xl">
                {/* Persona trust strip */}
                <p className="text-[11px] uppercase tracking-[0.08em] text-white/30 font-medium text-center mb-4">
                    Built For
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4">
                    {[
                        { icon: ShoppingBag, label: "Accessory Shoppers" },
                        { icon: Flag, label: "Enthusiasts" },
                        { icon: Wrench, label: "Shops & Detailers" },
                        { icon: Sparkles, label: "Build Inspiration" },
                    ].map(({ icon: Icon, label }) => (
                        <div key={label} className="flex items-center justify-center gap-2.5">
                            <Icon className="w-5 h-5 text-white/60 shrink-0" />
                            <span className="text-sm font-medium text-white/80">{label}</span>
                        </div>
                    ))}
                </div>

                {/* Stats row */}
                <div className="mt-10 pt-8 border-t border-white/10">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-white/30 font-medium text-center mb-3">
                        By the Numbers
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
                        {stats.map((stat) => (
                            <AnimatedStat
                                key={stat.label}
                                stat={stat}
                                animate={hasAnimated}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

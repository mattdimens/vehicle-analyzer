import Link from "next/link"
import { ChevronRight } from "lucide-react"
import type { GenerationCardData } from "@/data/vehicles/catalog"
import { bodyTextClass, cardClass, eyebrowClass, mutedTextClass } from "@/components/results/tokens"
import { cn } from "@/lib/utils"

interface GenerationCardsProps {
  generations: GenerationCardData[]
  /** "compact" leaves out the intro and fits beside a year picker */
  variant?: "hub" | "compact"
  /** Where a year picker's "Go" jumps to before a year is chosen */
  id?: string
  className?: string
}

/**
 * One card per generation: plain links, so they work without JavaScript.
 * Compact rows on phones in both variants.
 */
export function GenerationCards({ generations, variant = "hub", id, className }: GenerationCardsProps) {
  const compact = variant === "compact"

  return (
    <ul id={id} className={cn("grid scroll-mt-20 grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-4 lg:grid-cols-4", compact && "lg:gap-3", className)}>
      {generations.map((generation) => (
        <li key={generation.slug}>
          <Link
            href={generation.href}
            data-browse-generation={generation.label}
            className={cn(
              cardClass,
              "group flex h-full items-center justify-between gap-3 p-4 transition-colors hover:border-[#17212B] md:flex-col md:items-stretch md:justify-start md:gap-1.5 md:p-5",
              compact && "min-h-14 lg:p-3.5"
            )}
          >
            <span className="flex flex-col gap-0.5 md:gap-1.5">
              <span className={cn(eyebrowClass, "hidden md:block")}>{generation.label}</span>
              <span className={cn("font-heading text-base font-bold text-[#17212B]", compact ? "md:text-lg" : "md:text-2xl")}>
                <span className="md:hidden">{generation.label} </span>
                <span className="font-sans font-medium text-[#5A6672] md:font-heading md:font-bold md:text-[#17212B]">
                  {generation.displayRange}
                </span>
              </span>
              {!compact && (
                <span className={cn("hidden text-sm leading-relaxed md:line-clamp-3", bodyTextClass)}>
                  {generation.intro.split(". ")[0].replace(/\.$/, "")}.
                </span>
              )}
              <span
                className={cn(
                  "text-[13px] md:mt-auto md:pt-2",
                  generation.pickCount > 0 ? "font-semibold text-[#166534]" : mutedTextClass
                )}
              >
                {generation.pickCount > 0
                  ? `${generation.pickCount} researched ${generation.pickCount === 1 ? "pick" : "picks"}`
                  : "Picks coming soon"}
              </span>
            </span>
            <ChevronRight className={cn("h-5 w-5 shrink-0 md:hidden", mutedTextClass)} aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  )
}

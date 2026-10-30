"use client"

import { Children, useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { describeTruck, withArticle } from "@/data/vehicles/catalog/fitment"
import { bodyTextClass, cardClass, mutedTextClass, outlineButtonClass } from "@/components/results/tokens"
import { cn } from "@/lib/utils"
import { useTruckFilter } from "./truck-filter"

interface PickGridProps {
  /** The cards, all rendered on the server, in the same order as `ids` */
  children: ReactNode
  /** Product id of each card */
  ids: string[]
  /** The section's id in the truck filter, when the page has one */
  sectionId?: string
  /** Lowercase plural for the labels, e.g. "seat covers" */
  noun: string
  /** Cards shown before "Show more" */
  initial?: number
}

/**
 * The cards of one section.  Every card is in the server HTML.  Cards past
 * `initial`, and cards the truck or price filter leaves out, carry the
 * `hidden` attribute.  Picks that don't fit the truck are listed in a
 * "don't fit" group with the reason, never dropped from the page.
 */
export function PickGrid({ children, ids, sectionId, noun, initial = 3 }: PickGridProps) {
  const [expanded, setExpanded] = useState(false)
  const filter = useTruckFilter()
  const result = sectionId ? filter?.results[sectionId] : undefined
  const cards = Children.toArray(children)

  const visible = result ? new Set(result.visible) : new Set(ids)
  const shownIds = ids.filter((id) => visible.has(id))
  const rank = new Map(shownIds.map((id, i) => [id, i]))
  const more = expanded ? 0 : Math.max(0, shownIds.length - initial)
  const notFit = result?.notFit ?? []

  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        {cards.map((card, i) => {
          const position = rank.get(ids[i])
          const show = position !== undefined && (expanded || position < initial)
          return (
            <div key={ids[i] ?? i} hidden={!show}>
              {card}
            </div>
          )
        })}
      </div>

      {more > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className={cn(outlineButtonClass, "mt-3 md:mx-auto md:mt-4 md:w-auto md:px-6")}
        >
          Show {more} more {noun}
        </button>
      )}

      {result && result.priceHidden > 0 && (
        <p className={cn("mt-3 flex flex-wrap items-center gap-x-2 text-sm", mutedTextClass)}>
          {result.priceHidden} more {result.priceHidden === 1 ? "is" : "are"} outside your price range.
          <button
            type="button"
            onClick={filter?.clearPrices}
            className="min-h-10 font-semibold text-[#9A3412] underline underline-offset-2"
          >
            Show every price
          </button>
        </p>
      )}

      {notFit.length > 0 && result && (
        <details className={cn(cardClass, "group mt-3 bg-[#FAFBFC] px-4 py-0")}>
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-[#2B3742] [&::-webkit-details-marker]:hidden">
            {notFit.length === 1 ? "1 pick doesn't" : `${notFit.length} ${noun} don't`} fit{" "}
            {withArticle(describeTruck(result.truck))}
            <ChevronDown
              className={cn("h-[18px] w-[18px] shrink-0 transition-transform group-open:rotate-180", mutedTextClass)}
              aria-hidden="true"
            />
          </summary>
          <ul className="pb-2">
            {notFit.map((n) => (
              <li
                key={n.id}
                className={cn("flex justify-between gap-3 border-t border-[#EDF1F4] py-2 text-sm", bodyTextClass)}
              >
                <span>{n.label}</span>
                <span className={cn("shrink-0 text-right", mutedTextClass)}>{n.reason}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  )
}

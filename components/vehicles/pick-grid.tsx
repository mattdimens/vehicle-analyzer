"use client"

import { Children, useState, type ReactNode } from "react"
import { outlineButtonClass } from "@/components/results/tokens"
import { cn } from "@/lib/utils"

interface PickGridProps {
  /** The cards, all rendered on the server */
  children: ReactNode
  /** Cards shown before "Show more" */
  initial?: number
  /** e.g. "Show 2 more seat covers" */
  moreLabel: string
}

/**
 * The cards of one section.  Every card is in the server HTML; the ones past
 * `initial` carry the `hidden` attribute until the visitor asks for them.
 */
export function PickGrid({ children, initial = 3, moreLabel }: PickGridProps) {
  const [expanded, setExpanded] = useState(false)
  const cards = Children.toArray(children)
  const hasMore = !expanded && cards.length > initial

  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        {cards.map((card, i) => (
          <div key={i} hidden={!expanded && i >= initial}>
            {card}
          </div>
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className={cn(outlineButtonClass, "mt-3 md:mx-auto md:mt-4 md:w-auto md:px-6")}
        >
          {moreLabel}
        </button>
      )}
    </>
  )
}

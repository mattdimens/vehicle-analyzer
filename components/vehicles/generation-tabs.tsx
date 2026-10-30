"use client"

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface GenerationTab {
  slug: string
  label: string
  /** The panel, rendered on the server */
  panel: ReactNode
}

interface GenerationTabsProps {
  /** Accessible name for the tab list, e.g. "Tacoma generation" */
  label: string
  tabs: GenerationTab[]
  /** Slug of the tab selected at first */
  defaultSlug: string
  className?: string
}

/**
 * Tabs, one per generation.  Every panel is in the server HTML; the ones not
 * selected carry `hidden`.  Arrow keys, Home and End move between tabs.
 */
export function GenerationTabs({ label, tabs, defaultSlug, className }: GenerationTabsProps) {
  const [selected, setSelected] = useState(defaultSlug)
  const baseId = useId()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // The focused tab, so a key pressed right after a click starts from it
    const focused = tabRefs.current.findIndex((el) => el === document.activeElement)
    const index = focused !== -1 ? focused : tabs.findIndex((t) => t.slug === selected)
    const next =
      e.key === "ArrowRight" ? (index + 1) % tabs.length
      : e.key === "ArrowLeft" ? (index - 1 + tabs.length) % tabs.length
      : e.key === "Home" ? 0
      : e.key === "End" ? tabs.length - 1
      : -1
    if (next === -1) return
    e.preventDefault()
    setSelected(tabs[next].slug)
    tabRefs.current[next]?.focus()
  }

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="flex gap-1 rounded-xl bg-[#E6ECF0] p-1 md:inline-flex"
      >
        {tabs.map((tab, i) => {
          const active = tab.slug === selected
          return (
            <button
              key={tab.slug}
              ref={(el) => {
                tabRefs.current[i] = el
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.slug}`}
              aria-selected={active}
              aria-controls={`${baseId}-panel-${tab.slug}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setSelected(tab.slug)}
              className={cn(
                "min-h-11 flex-1 whitespace-nowrap rounded-[9px] px-2 text-sm font-semibold transition-colors md:min-h-10 md:flex-none md:px-4",
                active ? "bg-white text-[#17212B] shadow-[0_1px_3px_rgba(23,33,43,0.15)]" : "text-[#2B3742] hover:text-[#17212B]"
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.slug}
          role="tabpanel"
          id={`${baseId}-panel-${tab.slug}`}
          aria-labelledby={`${baseId}-tab-${tab.slug}`}
          hidden={tab.slug !== selected}
          className="mt-4"
        >
          {tab.panel}
        </div>
      ))}
    </div>
  )
}

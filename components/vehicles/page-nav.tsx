"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { chipClass, mutedTextClass } from "@/components/results/tokens"
import { cn } from "@/lib/utils"
import { useTruckFilter } from "./truck-filter"

export interface PageNavItem {
  /** Section id without the #, e.g. "cat-seat-covers" */
  id: string
  label: string
  count?: number
}

/** The fixed site header's height (h-14). */
const HEADER_HEIGHT = 56

/**
 * Where the sticky bars end once stuck: the header plus the tallest visible
 * element marked data-vf-sticky (the phone bar or the desktop truck bar).
 */
function stickyBottom(): number {
  let tallest = 0
  document.querySelectorAll<HTMLElement>("[data-vf-sticky]").forEach((el) => {
    if (el.getClientRects().length > 0) tallest = Math.max(tallest, el.offsetHeight)
  })
  return HEADER_HEIGHT + tallest
}

/**
 * Keep --vf-sticky (the sections' scroll-margin-top) equal to the sticky bars'
 * height, so a jump link lands each heading just below them.
 */
function useStickyOffsetVar() {
  useEffect(() => {
    const set = () => document.documentElement.style.setProperty("--vf-sticky", `${stickyBottom() + 12}px`)
    set()
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(set)
    document.querySelectorAll("[data-vf-sticky]").forEach((el) => observer?.observe(el))
    window.addEventListener("resize", set)
    return () => {
      observer?.disconnect()
      window.removeEventListener("resize", set)
      document.documentElement.style.removeProperty("--vf-sticky")
    }
  }, [])
}

/** A clicked link stays highlighted until the page has stopped scrolling for this long. */
const SCROLL_SETTLE_MS = 150

/**
 * The section in view: the last one whose top has reached the reading line
 * (just below the sticky bars, or 40% down the viewport if that is lower, so short sections
 * at the end of the page still get their turn), or the last section once the
 * page is scrolled to the bottom.  An IntersectionObserver on the sections and
 * the scroll position say when to look again.  `select` marks a clicked link
 * at once and holds it while the page scrolls there.
 */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | undefined>(ids[0])
  const clickHold = useRef<{ timer?: ReturnType<typeof setTimeout> }>({})
  const key = ids.join()

  const release = useCallback(() => {
    const hold = clickHold.current
    clearTimeout(hold.timer)
    hold.timer = setTimeout(() => {
      hold.timer = undefined
    }, SCROLL_SETTLE_MS)
  }, [])

  useEffect(() => {
    const hold = clickHold.current
    const sections = key
      .split(",")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
    if (sections.length === 0 || typeof IntersectionObserver === "undefined") return

    const update = () => {
      if (hold.timer) {
        // Still scrolling to a clicked section: wait until it settles.
        release()
        return
      }
      const line = Math.max(stickyBottom() + 24, window.innerHeight * 0.4)
      let current = sections[0].id
      for (const el of sections) {
        if (el.getBoundingClientRect().top <= line) current = el.id
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        current = sections[sections.length - 1].id
      }
      setActive(current)
    }

    const observer = new IntersectionObserver(update, { threshold: [0, 0.25, 0.5, 0.75, 1] })
    sections.forEach((el) => observer.observe(el))
    window.addEventListener("scroll", update, { passive: true })
    update()
    return () => {
      observer.disconnect()
      window.removeEventListener("scroll", update)
      clearTimeout(hold.timer)
    }
  }, [key, release])

  const select = useCallback(
    (id: string) => {
      setActive(id)
      release()
    },
    [release]
  )

  return { active, select }
}

interface PageNavProps {
  items: PageNavItem[]
  /** "bar": chip rail for phones and tablets.  "sidebar": the desktop list. */
  variant: "bar" | "sidebar"
  /** Bar only: a row above the chip rail (the "Your truck" row) */
  top?: ReactNode
  /** Sidebar only: product types with no picks yet */
  comingSoon?: string[]
  className?: string
}

/** "On this page" jump links that highlight the section in view. */
export function PageNav({ items, variant, top, comingSoon, className }: PageNavProps) {
  const { active, select } = useActiveSection(items.map((i) => i.id))
  const railRef = useRef<HTMLUListElement>(null)
  useStickyOffsetVar()

  // With a truck filter, each section's count is the picks that fit
  const filter = useTruckFilter()
  const countOf = (item: PageNavItem) => filter?.results[item.id]?.visible.length ?? item.count

  // Keep the active chip in view in the rail, without scrolling the page.
  useEffect(() => {
    if (variant !== "bar" || !active) return
    const rail = railRef.current
    const chip = rail?.querySelector<HTMLElement>(`[data-target="${active}"]`)
    if (!rail || !chip) return
    const left = chip.offsetLeft - (rail.clientWidth - chip.offsetWidth) / 2
    rail.scrollTo({ left: Math.max(0, left), behavior: "smooth" })
  }, [active, variant])

  if (variant === "bar") {
    return (
      <div
        data-vf-sticky
        className={cn("sticky top-14 z-30 border-b border-[#D5DEE5] bg-white/95 backdrop-blur-sm", className)}
      >
        {top}
        <nav aria-label="On this page">
          <ul ref={railRef} className="vf-rail container flex max-w-6xl gap-2 overflow-x-auto py-2">
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={() => select(item.id)}
                  data-target={item.id}
                  aria-current={active === item.id ? "location" : undefined}
                  className={cn(chipClass, "group/chip")}
                >
                  {item.label}
                  {countOf(item) !== undefined && (
                    <span
                      className={cn(
                        "rounded-full bg-[#EEF2F5] px-1.5 text-xs font-bold group-aria-[current]/chip:bg-white/20 group-aria-[current]/chip:text-white",
                        mutedTextClass
                      )}
                    >
                      {countOf(item)}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    )
  }

  return (
    <nav aria-label="On this page" className={cn("sticky top-[calc(var(--vf-sticky,5rem)+0.5rem)]", className)}>
      <p className={cn("mb-2 text-xs font-semibold uppercase tracking-[0.08em]", mutedTextClass)}>On this page</p>
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={() => select(item.id)}
              aria-current={active === item.id ? "location" : undefined}
              className="flex min-h-10 items-center justify-between gap-2 rounded-lg px-3 text-sm font-medium text-[#2B3742] transition-colors hover:bg-[#F4F7F9] hover:text-[#17212B] aria-[current]:bg-[#17212B] aria-[current]:font-semibold aria-[current]:text-white [&[aria-current]>span]:text-white/75"
            >
              {item.label}
              {countOf(item) !== undefined && (
                <span className={cn("text-xs font-bold", mutedTextClass)}>{countOf(item)}</span>
              )}
            </a>
          </li>
        ))}
      </ul>
      {comingSoon && comingSoon.length > 0 && (
        <div className="mt-6 px-3">
          <p className={cn("text-xs font-semibold uppercase tracking-[0.08em]", mutedTextClass)}>Coming soon</p>
          <p className={cn("mt-1.5 text-[13px] leading-relaxed", mutedTextClass)}>{comingSoon.join(", ")}</p>
        </div>
      )}
    </nav>
  )
}

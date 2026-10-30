"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { chipClass, mutedTextClass } from "@/components/results/tokens"
import { cn } from "@/lib/utils"

export interface PageNavItem {
  /** Section id without the #, e.g. "cat-seat-covers" */
  id: string
  label: string
  count?: number
}

/** Below the fixed header (and the bar): a section that reaches this line is being read. */
const SPY_OFFSET = { bar: 140, sidebar: 96 }
/** A clicked link stays highlighted until the page has stopped scrolling for this long. */
const SCROLL_SETTLE_MS = 150

/**
 * The section in view: the last one whose top has reached the reading line
 * (the offset, or 40% down the viewport if that is lower, so short sections
 * at the end of the page still get their turn), or the last section once the
 * page is scrolled to the bottom.  An IntersectionObserver on the sections and
 * the scroll position say when to look again.  `select` marks a clicked link
 * at once and holds it while the page scrolls there.
 */
function useActiveSection(ids: string[], offset: number) {
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
      const line = Math.max(offset, window.innerHeight * 0.4)
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
  }, [key, offset, release])

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
  /** Sidebar only: product types with no picks yet */
  comingSoon?: string[]
  className?: string
}

/** "On this page" jump links that highlight the section in view. */
export function PageNav({ items, variant, comingSoon, className }: PageNavProps) {
  const { active, select } = useActiveSection(
    items.map((i) => i.id),
    SPY_OFFSET[variant]
  )
  const railRef = useRef<HTMLUListElement>(null)

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
      <nav
        aria-label="On this page"
        className={cn("sticky top-14 z-30 border-b border-[#D5DEE5] bg-white/95 backdrop-blur-sm", className)}
      >
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
                {item.count !== undefined && (
                  <span
                    className={cn(
                      "rounded-full bg-[#EEF2F5] px-1.5 text-xs font-bold group-aria-[current]/chip:bg-white/20 group-aria-[current]/chip:text-white",
                      mutedTextClass
                    )}
                  >
                    {item.count}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    )
  }

  return (
    <nav aria-label="On this page" className={cn("sticky top-20", className)}>
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
              {item.count !== undefined && <span className={cn("text-xs font-bold", mutedTextClass)}>{item.count}</span>}
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

"use client"

import type { MouseEvent, ReactNode } from "react"
import { setEntryDoor, trackEvent } from "@/lib/analytics"

/**
 * Sends browse_by_vehicle_click for any link inside it that names a generation
 * in data-browse-generation.  The links stay server-rendered, and the same
 * cards and year picker track nothing on the hub and make pages.
 */
export function BrowseClickTracking({ children }: { children: ReactNode }) {
  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    const generation = (e.target as Element).closest<HTMLElement>("[data-browse-generation]")?.dataset.browseGeneration
    if (!generation) return
    setEntryDoor("browse_by_vehicle")
    trackEvent("browse_by_vehicle_click", { generation })
  }

  return <div onClick={handleClick}>{children}</div>
}

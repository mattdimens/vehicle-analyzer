"use client"

import { Check, Truck as TruckIcon } from "lucide-react"
import { truckFitLine } from "@/data/vehicles/catalog/fitment"
import type { Fitment } from "@/data/vehicles/types"
import { bodyTextClass } from "@/components/results/tokens"
import { cn } from "@/lib/utils"
import { useTruckFilter } from "./truck-filter"

interface FitLineProps {
  /** The full fitment line, shown when no truck is chosen */
  text: string
  /** Fitment entries for the section's make, model and years */
  entries: Fitment[]
  /** The section's id in the truck filter */
  sectionId?: string
}

/** A card's fitment line.  Once the visitor's truck fits, it turns green and names it. */
export function FitLine({ text, entries, sectionId }: FitLineProps) {
  const filter = useTruckFilter()
  const truck = sectionId ? filter?.results[sectionId]?.truck : undefined
  const yours = truck ? truckFitLine(entries, truck) : null

  if (yours) {
    return (
      <p className="col-span-2 flex gap-1.5 rounded-[10px] bg-[#E7F3EC] px-2.5 py-2 text-[13px] font-semibold leading-snug text-[#166534]">
        <Check className="mt-px h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
        <span>{yours}</span>
      </p>
    )
  }
  return (
    <p className={cn("col-span-2 flex gap-1.5 text-[13px] font-medium leading-snug", bodyTextClass)}>
      <TruckIcon className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{text}</span>
    </p>
  )
}

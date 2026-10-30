"use client"

import { useId, useState } from "react"
import Link from "next/link"
import { Camera, Check } from "lucide-react"
import { cardClass, primaryButtonClass } from "@/components/results/tokens"
import { getEntryDoor, trackEvent } from "@/lib/analytics"
import { cn } from "@/lib/utils"

export interface YearPickerGeneration {
  slug: string
  label: string
  yearStart: number
  yearEnd: number
  displayRange: string
  href: string
}

interface YearPickerProps {
  /** e.g. "Tacoma" */
  modelName: string
  /** Every model year, newest first */
  years: number[]
  generations: YearPickerGeneration[]
  /** Where "Go" points before a year is chosen (the generation cards) */
  fallbackHref: string
}

/**
 * "What year is your Tacoma?"  Choosing a year names its generation and
 * points "Go" at that generation's page.  Without JavaScript, "Go" jumps to
 * the generation cards, which are plain links.
 */
export function YearPicker({ modelName, years, generations, fallbackHref }: YearPickerProps) {
  const id = useId()
  const [year, setYear] = useState<number | null>(null)
  const generation = year === null ? undefined : generations.find((g) => year >= g.yearStart && year <= g.yearEnd)

  const pick = (value: string) => {
    const next = value ? Number(value) : null
    setYear(next)
    const g = next === null ? undefined : generations.find((x) => next >= x.yearStart && next <= x.yearEnd)
    if (next !== null && g) {
      trackEvent("vehicle_year_selected", { year: next, generation: g.slug, entry_door: getEntryDoor() })
    }
  }

  return (
    <div className={cn(cardClass, "flex flex-col gap-3 bg-white p-4 md:p-5")}>
      <label htmlFor={id} className="font-heading text-lg font-bold text-[#17212B] md:text-[19px]">
        What year is your {modelName}?
      </label>
      <div className="flex gap-2">
        <select
          id={id}
          value={year ?? ""}
          onChange={(e) => pick(e.target.value)}
          className="min-h-[52px] min-w-0 flex-1 rounded-xl border-[1.5px] border-[#17212B] bg-white px-3 text-base font-medium text-[#17212B]"
        >
          <option value="">Choose a year</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <Link
          href={generation?.href ?? fallbackHref}
          className={cn(primaryButtonClass, "w-auto shrink-0 px-6")}
          aria-label={generation ? `Go to ${generation.label} ${modelName} accessories` : "Go to the generations"}
        >
          Go
        </Link>
      </div>
      <p aria-live="polite" className="min-h-5 text-sm text-[#2B3742]">
        {generation && (
          <span className="flex items-start gap-1.5 font-semibold text-[#166534]">
            <Check className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            A {year} {modelName} is a {generation.label} ({generation.displayRange}).
          </span>
        )}
      </p>
      <Link
        href="/#upload-zone"
        className="-mt-1 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#17212B] hover:underline"
      >
        <Camera className="h-[18px] w-[18px] text-[#C8460F]" aria-hidden="true" />
        Not sure? Identify it from a photo
      </Link>
    </div>
  )
}

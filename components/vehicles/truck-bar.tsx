"use client"

import { useState } from "react"
import Link from "next/link"
import { Camera, SlidersHorizontal, X } from "lucide-react"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { describeTruck } from "@/data/vehicles/catalog/fitment"
import type { PriceBand } from "@/data/vehicles/types"
import { chipClass, mutedTextClass, outlineButtonClass, primaryButtonClass } from "@/components/results/tokens"
import { cn } from "@/lib/utils"
import { useTruckFilter } from "./truck-filter"

/** One line under each cab in the sheet. */
const CAB_HINTS: Record<string, string> = {
  "Access Cab": "Small rear-hinged doors",
  "Double Cab": "Four full doors",
  "Regular Cab": "Two doors, no rear seat",
}

const PRICE_BANDS: { band: PriceBand; symbol: string; label: string }[] = [
  { band: "budget", symbol: "$", label: "Budget" },
  { band: "mid", symbol: "$$", label: "Mid" },
  { band: "premium", symbol: "$$$", label: "Premium" },
]

const labelClass = cn("text-xs font-semibold uppercase tracking-[0.08em]", mutedTextClass)

/** A row of toggle chips: "Any …" plus each value. */
function ChoiceChips({
  label,
  anyLabel,
  values,
  current,
  onPick,
  className,
}: {
  label: string
  anyLabel: string
  values: string[]
  current?: string
  onPick: (value: string | undefined) => void
  className?: string
}) {
  return (
    <div role="group" aria-label={label} className={cn("flex gap-2", className)}>
      <button type="button" aria-pressed={!current} onClick={() => onPick(undefined)} className={chipClass}>
        {anyLabel}
      </button>
      {values.map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={current === value}
          onClick={() => onPick(current === value ? undefined : value)}
          className={chipClass}
        >
          {value}
        </button>
      ))}
    </div>
  )
}

function PriceChips({ className, long }: { className?: string; long?: boolean }) {
  const filter = useTruckFilter()
  if (!filter) return null
  return (
    <div role="group" aria-label="Price" className={cn("flex flex-wrap gap-2", className)}>
      {long && (
        <button
          type="button"
          aria-pressed={filter.prices.length === 0}
          onClick={filter.clearPrices}
          className={cn(chipClass, "min-h-11")}
        >
          Any price
        </button>
      )}
      {PRICE_BANDS.map((p) => (
        <button
          key={p.band}
          type="button"
          aria-pressed={filter.prices.includes(p.band)}
          aria-label={long ? undefined : `${p.label} price`}
          onClick={() => filter.togglePrice(p.band)}
          className={cn(chipClass, long && "min-h-11")}
        >
          {long ? `${p.symbol} ${p.label}` : p.symbol}
        </button>
      ))}
    </div>
  )
}

/**
 * Phones and tablets: the "Your truck" row at the top of the sticky bar, with
 * the cab chips inline and the rest in a bottom sheet.
 */
export function TruckRow({ className }: { className?: string }) {
  const filter = useTruckFilter()
  const [open, setOpen] = useState(false)
  if (!filter) return null
  const { configs, truck } = filter

  return (
    <div className={cn("container max-w-6xl pt-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className={labelClass}>Your truck</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="-mr-2 flex min-h-10 items-center gap-1.5 px-2 text-sm font-semibold text-[#9A3412]"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Bed and price
          {(truck.bed || filter.prices.length > 0) && (
            <span className="rounded-full bg-[#9A3412] px-1.5 text-xs text-white">
              {(truck.bed ? 1 : 0) + filter.prices.length}
            </span>
          )}
        </button>
      </div>
      <ChoiceChips
        label="Cab"
        anyLabel="Any cab"
        values={configs.cabs}
        current={truck.cab}
        onPick={filter.setCab}
        className="vf-rail -mx-4 mt-1 overflow-x-auto px-4"
      />
      <p aria-live="polite" className="mt-1.5 text-[13px] leading-snug text-[#2B3742]">
        {filter.status}
      </p>
      <TruckSheet open={open} onOpenChange={setOpen} />
    </div>
  )
}

/**
 * 1024px and up: one sticky bar under the hero with every choice, and the
 * status under them.  `embedded` drops the bar's own stickiness, for a page
 * that puts it inside its sticky chip rail (the product-type page).
 */
export function TruckBarDesktop({ className, embedded }: { className?: string; embedded?: boolean }) {
  const filter = useTruckFilter()
  if (!filter) return null
  const { configs, truck } = filter

  return (
    <div
      data-vf-sticky={embedded ? undefined : ""}
      className={cn(!embedded && "sticky top-14 z-30 border-b border-[#D5DEE5] bg-white/95 backdrop-blur-sm", className)}
    >
      <div className="container flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1.5 py-2.5">
        <p className={labelClass}>Your truck</p>
        <ChoiceChips label="Cab" anyLabel="Any cab" values={configs.cabs} current={truck.cab} onPick={filter.setCab} />
        <ChoiceChips label="Bed" anyLabel="Any bed" values={configs.beds} current={truck.bed} onPick={filter.setBed} />
        <span aria-hidden="true" className="h-6 w-px bg-[#D5DEE5]" />
        <PriceChips />
        <p aria-live="polite" className="basis-full text-[13px] font-medium text-[#2B3742]">
          {filter.status}
        </p>
      </div>
    </div>
  )
}

/** A large toggle in the sheet, with an optional hint line. */
function OptionButton({ pressed, onClick, label, hint }: { pressed: boolean; onClick: () => void; label: string; hint?: string }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className="group flex min-h-14 flex-col items-start justify-center gap-0.5 rounded-xl border border-[#D5DEE5] bg-white px-3 py-2.5 text-left text-[15px] font-semibold text-[#17212B] aria-pressed:border-[#17212B] aria-pressed:bg-[#17212B] aria-pressed:text-white"
    >
      {label}
      {hint && <span className={cn("text-xs font-medium group-aria-pressed:text-[#D5DEE5]", mutedTextClass)}>{hint}</span>}
    </button>
  )
}

function TruckSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const filter = useTruckFilter()
  if (!filter) return null
  const { configs, truck, photoTruck, visibleCount } = filter
  const photoText = photoTruck ? describeTruck(photoTruck) : ""
  const chosen = Boolean(truck.cab || truck.bed)
  const applyLabel = chosen
    ? `Show ${visibleCount} ${visibleCount === 1 ? "pick that fits" : "picks that fit"}`
    : `Show ${visibleCount} ${visibleCount === 1 ? "pick" : "picks"}`

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] gap-0 rounded-t-[20px] border-0 bg-white p-0 [&>button:last-child]:hidden"
      >
        <div className="flex justify-center pt-2.5" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-[#D5DEE5]" />
        </div>
        <div className="flex items-center justify-between py-1 pl-4 pr-2">
          <SheetTitle className="font-heading text-xl font-bold text-[#17212B]">Your truck</SheetTitle>
          <SheetClose className="flex h-11 w-11 items-center justify-center rounded-full text-[#17212B]" aria-label="Close">
            <X className="h-5 w-5" aria-hidden="true" />
          </SheetClose>
        </div>
        <SheetDescription className="sr-only">Choose your cab, bed and price to see the picks that fit.</SheetDescription>

        <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-4">
          {photoText && (
            <button
              type="button"
              onClick={filter.applyPhotoTruck}
              className="flex min-h-14 items-center gap-3 rounded-xl border border-dashed border-[#166534] bg-[#E7F3EC] px-3 py-2.5 text-left"
            >
              <Camera className="h-5 w-5 shrink-0 text-[#166534]" aria-hidden="true" />
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-[#17212B]">Use the truck from your photo</span>
                <span className="text-[13px] text-[#2B3742]">{photoText}</span>
              </span>
            </button>
          )}

          <fieldset>
            <legend className="mb-2 text-[15px] font-bold text-[#17212B]">Cab</legend>
            <div className="grid grid-cols-2 gap-2">
              {configs.cabs.map((cab) => (
                <OptionButton
                  key={cab}
                  label={cab}
                  hint={CAB_HINTS[cab]}
                  pressed={truck.cab === cab}
                  onClick={() => filter.setCab(truck.cab === cab ? undefined : cab)}
                />
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-[15px] font-bold text-[#17212B]">Bed length</legend>
            <div className="grid grid-cols-2 gap-2">
              {configs.beds.map((bed) => (
                <OptionButton
                  key={bed}
                  label={`${bed} bed`}
                  pressed={truck.bed === bed}
                  onClick={() => filter.setBed(truck.bed === bed ? undefined : bed)}
                />
              ))}
            </div>
          </fieldset>

          <Link
            href="/#upload-zone"
            className="-mt-1 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#17212B] underline-offset-2 hover:underline"
          >
            <Camera className="h-[18px] w-[18px] text-[#C8460F]" aria-hidden="true" />
            Not sure? Identify your cab and bed from a photo
          </Link>

          <fieldset>
            <legend className="mb-2 text-[15px] font-bold text-[#17212B]">Price</legend>
            <PriceChips long />
          </fieldset>

          <p className={cn("text-[13px]", mutedTextClass)}>
            We remember your truck on this device, so these pages start with it next time.
          </p>
        </div>

        <div
          className="flex gap-2.5 border-t border-[#D5DEE5] px-4 pt-3"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
        >
          <button type="button" onClick={filter.clear} className={cn(outlineButtonClass, "min-h-[52px] w-auto px-5")}>
            Clear
          </button>
          <SheetClose className={cn(primaryButtonClass, "flex-1")}>{applyLabel}</SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  )
}

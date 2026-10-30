"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { describeTruck, fitsTruckEntries, withArticle } from "@/data/vehicles/catalog/fitment"
import type { Truck } from "@/data/vehicles/catalog/fitment"
import { TRUCK_PARAMS, truckFromParams } from "@/data/vehicles/truck-handoff"
import type { Fitment, PriceBand, TruckConfigs } from "@/data/vehicles/types"
import { getEntryDoor, getPlatform, trackEvent } from "@/lib/analytics"

/** One pick, as much of it as the filter needs. */
export interface FitItem {
  id: string
  /** "Covercraft Carhartt SeatSaver Rear Seat Covers" */
  label: string
  priceBand: PriceBand
  /** Fitment entries for the section's make, model and years */
  fitment: Fitment[]
}

/** A section of picks the filter applies to. */
export interface FitSection {
  /** The section's anchor id, e.g. "cat-seat-covers" */
  id: string
  /** The section generation's configs.  Without them the section isn't filtered. */
  configs?: TruckConfigs
  items: FitItem[]
}

export interface SectionResult {
  /** The truck as this section reads it: values its generation doesn't offer count as "any" */
  truck: Truck
  /** Ids that fit and match the price filter, in page order */
  visible: string[]
  notFit: { id: string; label: string; reason: string }[]
  /** Picks that fit but are outside the price filter */
  priceHidden: number
}

type Source = "manual" | "photo"

interface Saved {
  cab?: string
  bed?: string
  source?: Source
  /** The truck from the last photo handoff, for "Use the truck from your photo" */
  photo?: Truck
}

interface TruckFilterValue {
  configs: TruckConfigs
  truck: Truck
  source?: Source
  photoTruck?: Truck
  prices: PriceBand[]
  results: Record<string, SectionResult>
  /** Picks shown across every section, and in all */
  visibleCount: number
  totalCount: number
  status: string
  setCab: (cab: string | undefined) => void
  setBed: (bed: string | undefined) => void
  togglePrice: (band: PriceBand) => void
  clearPrices: () => void
  clear: () => void
  applyPhotoTruck: () => void
}

const TruckFilterContext = createContext<TruckFilterValue | null>(null)

/** The filter on this page, or null on pages without one (the model hub). */
export function useTruckFilter(): TruckFilterValue | null {
  return useContext(TruckFilterContext)
}

/** e.g. "vf:truck:toyota/tacoma": one saved truck per model, on this device. */
const storageKey = (make: string, model: string) => `vf:truck:${make}/${model}`

function readSaved(key: string): Saved | null {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as Saved) : null
  } catch {
    return null
  }
}

function writeSaved(key: string, saved: Saved) {
  try {
    window.localStorage.setItem(key, JSON.stringify(saved))
  } catch {
    // Private mode or storage blocked: the filter still works for this visit
  }
}

/** Keep only values the configs offer. */
function inConfigs(truck: Truck | undefined, configs: TruckConfigs): Truck {
  const out: Truck = {}
  if (truck?.cab && configs.cabs.includes(truck.cab)) out.cab = truck.cab
  if (truck?.bed && configs.beds.includes(truck.bed)) out.bed = truck.bed
  return out
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`

interface TruckFilterProviderProps {
  make: string
  model: string
  /** "generation" or "product_type", for vehicle_fit_selected */
  page: "generation" | "product_type"
  /** The cab and bed choices the bar offers.  Without them there is no filter. */
  configs?: TruckConfigs
  sections: FitSection[]
  children: ReactNode
}

/**
 * The "Your truck" filter.  The server HTML is always the "any truck" state,
 * so crawlers and the first paint see every pick; a saved truck or a photo
 * handoff applies after hydration.
 */
export function TruckFilterProvider({ configs, children, ...props }: TruckFilterProviderProps) {
  if (!configs) return <>{children}</>
  return (
    <ActiveTruckFilter configs={configs} {...props}>
      {children}
    </ActiveTruckFilter>
  )
}

function ActiveTruckFilter({
  make,
  model,
  page,
  configs,
  sections,
  children,
}: TruckFilterProviderProps & { configs: TruckConfigs }) {
  const key = storageKey(make, model)
  const [truck, setTruck] = useState<Truck>({})
  const [source, setSource] = useState<Source | undefined>()
  const [photoTruck, setPhotoTruck] = useState<Truck | undefined>()
  const [prices, setPrices] = useState<PriceBand[]>([])
  const router = useRouter()
  const pathname = usePathname()
  const loaded = useRef(false)

  const track = useCallback(
    (next: Truck, method: Source) => {
      trackEvent("vehicle_fit_selected", {
        cab: next.cab ?? "any",
        bed: next.bed ?? "any",
        method,
        page,
        platform: getPlatform(),
        entry_door: getEntryDoor(),
      })
    },
    [page]
  )

  // Once, after hydration: a photo handoff in the URL wins over the saved truck.
  useEffect(() => {
    if (loaded.current) return
    loaded.current = true

    const url = new URL(window.location.href)
    const handoff = truckFromParams(url.searchParams, configs)
    const saved = readSaved(key)

    if (handoff) {
      url.searchParams.delete(TRUCK_PARAMS.cab)
      url.searchParams.delete(TRUCK_PARAMS.bed)
      const query = url.searchParams.toString()
      router.replace(`${pathname}${query ? `?${query}` : ""}${url.hash}`, { scroll: false })
    }

    // Applied after hydration on purpose: the server HTML stays the "any truck" state
    if (handoff && (handoff.cab || handoff.bed)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTruck(handoff)
      setSource("photo")
      setPhotoTruck(handoff)
      writeSaved(key, { ...handoff, source: "photo", photo: handoff })
      track(handoff, "photo")
    } else if (saved) {
      setTruck(inConfigs(saved, configs))
      setSource(saved.source)
      if (saved.photo) setPhotoTruck(inConfigs(saved.photo, configs))
    }
  }, [configs, key, pathname, router, track])

  const choose = useCallback(
    (next: Truck, method: Source) => {
      if (next.cab === truck.cab && next.bed === truck.bed) return
      setTruck(next)
      setSource(method)
      writeSaved(key, { ...next, source: method, photo: photoTruck })
      track(next, method)
    },
    [key, photoTruck, track, truck]
  )

  const results = useMemo(() => {
    const out: Record<string, SectionResult> = {}
    for (const section of sections) {
      const sectionTruck = section.configs ? inConfigs(truck, section.configs) : {}
      const result: SectionResult = { truck: sectionTruck, visible: [], notFit: [], priceHidden: 0 }
      for (const item of section.items) {
        const fit = fitsTruckEntries(item.fitment, sectionTruck)
        if (!fit.fits) result.notFit.push({ id: item.id, label: item.label, reason: fit.reason })
        else if (prices.length > 0 && !prices.includes(item.priceBand)) result.priceHidden++
        else result.visible.push(item.id)
      }
      out[section.id] = result
    }
    return out
  }, [sections, truck, prices])

  const value = useMemo<TruckFilterValue>(() => {
    const all = Object.values(results)
    const visibleCount = all.reduce((n, r) => n + r.visible.length, 0)
    const totalCount = sections.reduce((n, s) => n + s.items.length, 0)
    const truckText = describeTruck(truck)
    const priced = prices.length > 0 ? " in your price range" : ""

    let status: string
    if (truckText) {
      const fitText = `${visibleCount} of ${plural(totalCount, "pick")} ${visibleCount === 1 ? "fits" : "fit"} ${withArticle(truckText)}${priced}.`
      status = source === "photo" ? `From your photo: ${fitText}` : fitText
    } else if (priced) {
      status = `Showing ${visibleCount} of ${plural(totalCount, "pick")}${priced}.`
    } else {
      status = "Showing every pick. Choose your cab to hide what won't fit."
    }

    return {
      configs,
      truck,
      source,
      photoTruck,
      prices,
      results,
      visibleCount,
      totalCount,
      status,
      setCab: (cab) => choose({ ...truck, cab }, "manual"),
      setBed: (bed) => choose({ ...truck, bed }, "manual"),
      togglePrice: (band) =>
        setPrices((current) => (current.includes(band) ? current.filter((b) => b !== band) : [...current, band])),
      clearPrices: () => setPrices([]),
      clear: () => {
        setPrices([])
        choose({}, "manual")
      },
      applyPhotoTruck: () => {
        if (!photoTruck) return
        setTruck(photoTruck)
        setSource("photo")
        writeSaved(key, { ...photoTruck, source: "photo", photo: photoTruck })
        track(photoTruck, "photo")
      },
    }
  }, [choose, configs, key, photoTruck, prices, results, sections, source, track, truck])

  return <TruckFilterContext.Provider value={value}>{children}</TruckFilterContext.Provider>
}

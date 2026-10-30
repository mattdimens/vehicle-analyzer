/**
 * The photo result's truck, handed to a generation page as ?cab=&bed=.
 * The page reads them once, saves them and removes them from the URL, so
 * they never reach an indexable URL.
 */

import { getGenerationBySlug } from "./index"
import { normalizeTruck } from "./catalog/fitment"
import type { Truck } from "./catalog/fitment"
import type { TruckConfigs } from "./types"

export const TRUCK_PARAMS = { cab: "cab", bed: "bed" } as const

/** The generation's configs for a "/vehicles/{make}/{model}/{generation}" path. */
export function configsForPath(path: string): TruckConfigs | undefined {
  const match = path.match(/^\/vehicles\/([^/?#]+)\/([^/?#]+)\/([^/?#]+)\/?$/)
  if (!match) return undefined
  return getGenerationBySlug(match[1], match[2], match[3])?.generation.configs
}

/**
 * The curated-picks link with the photo's cab and bed, normalized to the
 * generation's configs.  Values that don't match are left off, and so is
 * everything when the generation has no configs.
 */
export function catalogHrefWithTruck(
  href: string,
  cabStyle: string | null | undefined,
  bedLength: string | null | undefined
): string {
  const configs = configsForPath(href)
  if (!configs) return href
  const truck = normalizeTruck(configs, cabStyle, bedLength)
  const params = new URLSearchParams()
  if (truck.cab) params.set(TRUCK_PARAMS.cab, truck.cab)
  if (truck.bed) params.set(TRUCK_PARAMS.bed, truck.bed)
  const query = params.toString()
  return query ? `${href}?${query}` : href
}

/** A ?cab=&bed= handoff, kept only where it matches the configs exactly. */
export function truckFromParams(params: URLSearchParams, configs: TruckConfigs): Truck | null {
  const cab = params.get(TRUCK_PARAMS.cab)
  const bed = params.get(TRUCK_PARAMS.bed)
  if (cab === null && bed === null) return null
  const truck: Truck = {}
  if (cab && configs.cabs.includes(cab)) truck.cab = cab
  if (bed && configs.beds.includes(bed)) truck.bed = bed
  return truck
}

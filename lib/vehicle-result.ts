/**
 * Helpers for the vehicle result on /r/[id]. No React, so they can be unit tested.
 */

/** "2016-2023" (or with an en dash) -> [2016, ..., 2023]. Null for a single year or anything odd. */
export function parseYearRange(year: string | null | undefined): number[] | null {
    const match = year?.trim().match(/^(\d{4})\s*[-–]\s*(\d{4})$/)
    if (!match) return null
    const start = parseInt(match[1], 10)
    const end = parseInt(match[2], 10)
    if (start > end || end - start > 30) return null
    const years: number[] = []
    for (let y = start; y <= end; y++) years.push(y)
    return years
}

/**
 * The model's vehicleType as a category label: "Pickup Truck" -> "Pickup truck".
 * Words in capitals (SUV) stay as they are.
 */
export function formatVehicleType(vehicleType: string | null | undefined): string | null {
    const words = vehicleType?.trim().split(/\s+/).filter(Boolean)
    if (!words || words.length === 0) return null
    return words
        .map((word, index) => {
            if (word.length > 1 && word === word.toUpperCase()) return word
            const lower = word.toLowerCase()
            return index === 0 ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower
        })
        .join(" ")
}

/** Trucks get "truck" in the copy; everything else gets "vehicle". */
export function vehicleNoun(vehicleType: string | null | undefined): "truck" | "vehicle" {
    return /truck|pickup/i.test(vehicleType ?? "") ? "truck" : "vehicle"
}

/** "{year} {make} {model} {trim}", skipping blanks. Also the vehicle every /go link searches for. */
export function vehicleTitle(primary: { year?: string | null; make?: string | null; model?: string | null; trim?: string | null }): string {
    // Same expression the /go links have always used, so search queries don't change
    return [primary.year, primary.make, primary.model, primary.trim].filter(Boolean).join(" ")
}

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

/**
 * Parse "Product Name (e.g. Example 1, Example 2)" into name + description.
 */
export function parseRecommendation(text: string): { name: string; description: string | null } {
    const match = text.match(/^(.*?)\s*\(([^)]+)\)$/)
    if (match) return { name: match[1].trim(), description: match[2].trim() }
    return { name: text, description: null }
}

/** Trucks get "truck" in the copy; everything else gets "vehicle". */
export function vehicleNoun(vehicleType: string | null | undefined): "truck" | "vehicle" {
    return /truck|pickup/i.test(vehicleType ?? "") ? "truck" : "vehicle"
}

/** "SuperCrew · 67.0" (Short) bed · 6.2L V8": cab, bed and engine, skipping blanks. Null when there are none. */
export function vehicleSpecLine(
    primary: { cabStyle?: string | null; bedLength?: string | null },
    engineDetails?: string | null
): string | null {
    const specParts: string[] = []
    if (primary.cabStyle) specParts.push(primary.cabStyle)
    if (primary.bedLength) specParts.push(`${primary.bedLength} bed`)
    if (engineDetails) specParts.push(engineDetails)
    return specParts.length > 0 ? specParts.join(" · ") : null
}

/** "{year} {make} {model} {trim}", skipping blanks. Also the vehicle every /go link searches for. */
export function vehicleTitle(primary: { year?: string | null; make?: string | null; model?: string | null; trim?: string | null }): string {
    // Same expression the /go links have always used, so search queries don't change
    return [primary.year, primary.make, primary.model, primary.trim].filter(Boolean).join(" ")
}

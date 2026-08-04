/**
 * Normalizes a vehicle year value (which may be a range string from the AI)
 * into a single integer suitable for the `garage_vehicles.year` column.
 *
 * Rules:
 * - Numeric integer → returned as-is (if within plausible range).
 * - Single-year string (e.g. "2023") → parsed to integer.
 * - Range string (e.g. "2021-2024" or "2021 - 2024") → first year.
 * - Anything else → null.
 *
 * Plausible range: 1900–2099 (generous enough for classic cars and near-future models).
 */

const MIN_YEAR = 1900
const MAX_YEAR = 2099

/**
 * Attempt to extract a single integer year from the AI's year output.
 *
 * @returns A four-digit integer year, or `null` if the input cannot be
 *          resolved to a plausible year.
 */
export function normalizeYear(input: unknown): number | null {
    if (input == null) return null

    // Already a number
    if (typeof input === 'number') {
        if (!Number.isInteger(input)) return null
        return isPlausible(input) ? input : null
    }

    if (typeof input !== 'string') return null

    const trimmed = input.trim()
    if (trimmed.length === 0) return null

    // Try range pattern first: "2021-2024", "2021 – 2024", "2021 - 2024"
    // Supports hyphen, en-dash, and em-dash as separators.
    const rangeMatch = trimmed.match(/^(\d{4})\s*[-–—]\s*(\d{4})$/)
    if (rangeMatch) {
        const firstYear = parseInt(rangeMatch[1], 10)
        return isPlausible(firstYear) ? firstYear : null
    }

    // Try single year
    const singleMatch = trimmed.match(/^(\d{4})$/)
    if (singleMatch) {
        const year = parseInt(singleMatch[1], 10)
        return isPlausible(year) ? year : null
    }

    return null
}

function isPlausible(year: number): boolean {
    return year >= MIN_YEAR && year <= MAX_YEAR
}

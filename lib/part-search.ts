import type { PartIdentification } from "@/app/actions"

/** Longest Amazon query a part link sends. */
export const PART_QUERY_MAX_LENGTH = 100
/** Longest part number a visitor can type. */
export const TYPED_PART_NUMBER_MAX_LENGTH = 40
/** A typed part number shorter than this doesn't make a useful search. */
export const TYPED_PART_NUMBER_MIN_LENGTH = 3

/**
 * Clean a query before it goes to Amazon: brackets, slashes and quotes are
 * dropped (separators become spaces so "Audi/VW" stays two words),
 * whitespace is collapsed, and the result is capped.
 */
export function sanitizePartQuery(value: string): string {
    return value
        .replace(/["']/g, "")
        .replace(/[()[\]/\\]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, PART_QUERY_MAX_LENGTH)
        .trim()
}

/** Keep only what a stamped part number can contain: letters, digits, spaces, "-" and ".". */
export function sanitizeTypedPartNumber(value: string): string {
    return value.replace(/[^A-Za-z0-9 .-]/g, "").slice(0, TYPED_PART_NUMBER_MAX_LENGTH)
}

type PartSearchInput = Pick<PartIdentification, "partName" | "estimatedVehicle" | "amazonSearchTerm">

/**
 * The Amazon query for a part's main shop button. The model's
 * amazonSearchTerm is only trusted when it also identified a vehicle;
 * without one, the term tends to carry an invented vehicle, so the part
 * name is searched alone.
 */
export function buildPartSearch(part: PartSearchInput): string {
    const hasVehicle = Boolean(part.estimatedVehicle?.trim())
    const searchTerm = part.amazonSearchTerm?.trim()
    const query = hasVehicle && searchTerm ? searchTerm : part.partName
    return sanitizePartQuery(query ?? "")
}

/** The query for a part number the visitor typed: the number, then the part name. */
export function buildTypedPartSearch(typed: string, partName: string): string {
    return sanitizePartQuery(`${sanitizeTypedPartNumber(typed).trim()} ${partName}`)
}

/** Same slug the part identifier has always sent as `cat`, so merchant routing is unchanged. */
export function partCategorySlug(category: string): string {
    return category.toLowerCase().replace(/[^a-z0-9]+/g, "-")
}

/**
 * A /go link for a part search. The whole query travels in `product`, so
 * /go's word dedupe can't reorder vehicle and part words.
 */
export function buildPartGoUrl(category: string, query: string, source: string): string {
    return `/go?cat=${encodeURIComponent(partCategorySlug(category))}&product=${encodeURIComponent(query)}&source=${encodeURIComponent(source)}`
}

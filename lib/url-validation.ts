/**
 * Shared URL validation for Supabase storage URLs.
 *
 * All server-side entry points that accept a caller-supplied image URL
 * must run this check before fetching the image or calling Gemini.
 */

const STORAGE_PATH_PREFIX = '/storage/v1/object/'

/**
 * Validates that a URL string is a well-formed URL pointing to our own
 * Supabase storage bucket. Throws a descriptive error if validation fails.
 *
 * @param url  The URL string to validate.
 * @throws {Error} If the URL is not a valid Supabase storage URL.
 */
export function assertSupabaseStorageUrl(url: string): void {
    if (typeof url !== 'string' || url.length === 0) {
        throw new UrlValidationError('Image URL must be a non-empty string')
    }

    let parsed: URL
    try {
        parsed = new URL(url)
    } catch {
        throw new UrlValidationError('Image URL is not a valid URL')
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
        // If the env var is missing we cannot validate — fail closed.
        throw new UrlValidationError('Server configuration error: missing NEXT_PUBLIC_SUPABASE_URL')
    }

    const expectedOrigin = new URL(supabaseUrl).origin

    if (parsed.origin !== expectedOrigin) {
        throw new UrlValidationError('Image URL must originate from the expected storage domain')
    }

    if (!parsed.pathname.startsWith(STORAGE_PATH_PREFIX)) {
        throw new UrlValidationError('Image URL must point to a valid storage object path')
    }
}

/**
 * Validates an array of URL strings. Every URL in the array must pass
 * {@link assertSupabaseStorageUrl}.
 */
export function assertSupabaseStorageUrls(urls: string[]): void {
    for (const url of urls) {
        assertSupabaseStorageUrl(url)
    }
}

/**
 * Dedicated error class so callers can distinguish validation failures
 * from unexpected runtime errors.
 */
export class UrlValidationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'UrlValidationError'
    }
}

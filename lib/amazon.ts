/**
 * Appends Amazon affiliate tag to Amazon URLs
 * @param url - The Amazon URL to append the affiliate tag to
 * @returns The URL with the affiliate tag appended
 */
export function addAmazonAffiliateTag(url: string): string {
    const AMAZON_AFFILIATE_TAG = "visualfitment-20"

    try {
        const urlObj = new URL(url)

        // Only process Amazon URLs
        if (!urlObj.hostname.includes("amazon.com")) {
            return url
        }

        // Add the tag parameter
        urlObj.searchParams.set("tag", AMAZON_AFFILIATE_TAG)

        return urlObj.toString()
    } catch (error) {
        // If URL parsing fails, return original URL
        console.error("Failed to parse URL:", error)
        return url
    }
}

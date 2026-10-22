export type MerchantBuilderParams = {
  vehicle?: string;
  brand?: string;
  product?: string;
  cat?: string;
  /** Amazon product ID. When valid, the link goes to the product page instead of a search. */
  asin?: string | null;
  /** false sends the visitor to the merchant without our affiliate tag (filtered traffic). Defaults to true. */
  tagged?: boolean;
};

export type MerchantBuilder = (params: MerchantBuilderParams) => string;

const ASIN_PATTERN = /^[A-Z0-9]{10}$/;

/** The trimmed, uppercase ASIN, or null when the value isn't one. */
export function normalizeAsin(value: string | null | undefined): string | null {
  const asin = value?.trim().toUpperCase();
  return asin && ASIN_PATTERN.test(asin) ? asin : null;
}

export const merchants: Record<string, MerchantBuilder> = {
  amazon: ({ vehicle, brand, product, asin, tagged = true }) => {
    const tag = process.env.AMAZON_ASSOCIATE_TAG || "visualfitme0b-20";

    const productAsin = normalizeAsin(asin);
    if (productAsin) {
      const url = new URL(`https://www.amazon.com/dp/${productAsin}`);
      if (tagged) {
        url.searchParams.set("tag", tag);
      }
      return url.toString();
    }

    // Compose query: trim, dedupe, encode
    const parts = [vehicle, brand, product]
      .filter((p): p is string => Boolean(p && p.trim()))
      .map(p => p.trim());

    // Dedupe words (e.g., if vehicle has "Ford" and brand is "Ford")
    const words = parts.join(" ").split(/\s+/);
    const dedupedQuery = Array.from(new Set(words)).join(" ");

    const url = new URL("https://www.amazon.com/s");
    url.searchParams.set("k", dedupedQuery);
    if (tagged) {
      url.searchParams.set("tag", tag);
    }

    return url.toString();
  }
};

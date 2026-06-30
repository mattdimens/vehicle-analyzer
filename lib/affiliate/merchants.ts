export type MerchantBuilderParams = {
  vehicle?: string;
  brand?: string;
  product?: string;
  cat?: string;
};

export type MerchantBuilder = (params: MerchantBuilderParams) => string;

export const merchants: Record<string, MerchantBuilder> = {
  amazon: ({ vehicle, brand, product }) => {
    // Compose query: trim, dedupe, encode
    const parts = [vehicle, brand, product]
      .filter((p): p is string => Boolean(p && p.trim()))
      .map(p => p.trim());
    
    // Dedupe words (e.g., if vehicle has "Ford" and brand is "Ford")
    const words = parts.join(" ").split(/\s+/);
    const dedupedQuery = Array.from(new Set(words)).join(" ");
    
    const tag = process.env.AMAZON_ASSOCIATE_TAG || "visualfitment-20";
    const url = new URL("https://www.amazon.com/s");
    url.searchParams.set("k", dedupedQuery);
    url.searchParams.set("tag", tag);
    
    return url.toString();
  }
};

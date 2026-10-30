import { amazonCardData, getAmazonItems } from './cache'
import type { AmazonCardData } from './cache'

/**
 * What each card shows from the amazon_items cache, by ASIN: live data,
 * "unavailable", or null for the editorial card.  Read once per page render.
 */
export async function amazonCardsFor(asins: string[]): Promise<Map<string, AmazonCardData | null>> {
  const rows = await getAmazonItems(asins)
  const now = new Date()
  return new Map(asins.map((asin) => [asin, amazonCardData(rows.get(asin), now)]))
}

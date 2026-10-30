/**
 * The amazon_items cache: Creators API data for catalog products.
 *
 * The cron job (app/api/cron/amazon-items) writes rows with
 * toAmazonItemRow(); vehicle pages read them with getAmazonItems() and turn
 * each row into what a card shows with amazonCardData().  Plan:
 * docs/vehicle-pages-plan.md, sections 6.4 and 8.3.
 */
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import type { AmazonItem } from './creators-api'

type AmazonItemsTable = Database['public']['Tables']['amazon_items']
export type AmazonItemRow = AmazonItemsTable['Row']
export type AmazonItemInsert = AmazonItemsTable['Insert']
export type AmazonItemStatus = 'ok' | 'unavailable' | 'not_found'

/**
 * Price, image and stock are hidden once the data is older than this.
 * Amazon allows 24 hours; pages regenerate hourly and can be served for up
 * to an hour after they render, so they stop showing data at 23 hours and
 * nothing a visitor sees is ever more than 24 hours old.
 */
export const AMAZON_DATA_MAX_AGE_MS = 23 * 60 * 60 * 1000

/** Availability types that mean Amazon won't sell it right now. */
const NOT_SELLING = new Set(['OUT_OF_STOCK', 'UNAVAILABLE'])

/**
 * The cache row for one requested ASIN: what Amazon returned, or not_found
 * when it returned nothing.  "ok" needs a price and an availability that
 * still sells; anything else listed is "unavailable".
 */
export function toAmazonItemRow(asin: string, item: AmazonItem | undefined, fetchedAt: Date): AmazonItemInsert {
  const fetched_at = fetchedAt.toISOString()
  if (!item) return { asin, status: 'not_found', fetched_at }

  const selling = item.price !== null && !NOT_SELLING.has(item.availability ?? '')
  return {
    asin,
    status: selling ? 'ok' : 'unavailable',
    title: item.title,
    brand: item.brand,
    image_url: item.imageUrl,
    price_amount: item.price?.amount ?? null,
    price_display: item.price?.display ?? null,
    currency: item.price?.currency ?? null,
    availability: item.availability,
    availability_message: item.availabilityMessage,
    merchant: item.merchant,
    detail_page_url: item.detailPageUrl,
    fetched_at,
  }
}

/** What a product card shows from the cache, or null for the editorial card. */
export type AmazonCardData =
  | {
      kind: 'live'
      priceDisplay: string
      priceAmount: number
      imageUrl: string | null
      /** e.g. "In Stock", "Only 3 left in stock" */
      stockMessage: string | null
      inStock: boolean
      /** "Oct 30, 2:00 PM ET" */
      asOf: string
    }
  | { kind: 'unavailable'; asOf: string }

/** "Oct 30, 2:00 PM ET": the time the data was fetched, shown next to every price. */
export function formatAsOf(iso: string): string {
  const date = new Date(iso)
  const text = date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  })
  return `${text} ET`
}

/**
 * A row as a card should show it.  Missing, stale (older than
 * AMAZON_DATA_MAX_AGE_MS) and not_found rows give null, so the card falls back
 * to editorial content with no price or image.  Only a listing Amazon returned
 * without an offer, or as out of stock, shows as unavailable.
 */
export function amazonCardData(row: AmazonItemRow | undefined, now: Date = new Date()): AmazonCardData | null {
  if (!row) return null
  const fetched = Date.parse(row.fetched_at)
  if (Number.isNaN(fetched) || now.getTime() - fetched > AMAZON_DATA_MAX_AGE_MS) return null

  // not_found means the API returned nothing, which also happens for listings
  // the brand keeps out of the API ("ItemNotAccessible", e.g. WeatherTech).
  // That says nothing about whether Amazon sells it, so show the editorial card.
  if (row.status === 'not_found') return null
  const asOf = formatAsOf(row.fetched_at)
  if (row.status !== 'ok' || !row.price_display || row.price_amount === null) {
    return { kind: 'unavailable', asOf }
  }
  return {
    kind: 'live',
    priceDisplay: row.price_display,
    priceAmount: Number(row.price_amount),
    imageUrl: row.image_url,
    stockMessage: row.availability_message,
    inStock: row.availability === 'IN_STOCK',
    asOf,
  }
}

/**
 * Cached rows for these ASINs, by ASIN.  Empty when Supabase isn't
 * configured, the table doesn't exist yet, or the read fails: pages then
 * show editorial cards.  Reads with the anon key (the table is public).
 */
export async function getAmazonItems(asins: string[]): Promise<Map<string, AmazonItemRow>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const unique = [...new Set(asins)]
  if (!url || !key || unique.length === 0) return new Map()

  try {
    const supabase = createClient<Database>(url, key, { auth: { persistSession: false } })
    const { data, error } = await supabase.from('amazon_items').select('*').in('asin', unique)
    if (error) {
      console.error('amazon_items read failed:', error.message)
      return new Map()
    }
    return new Map((data ?? []).map((row) => [row.asin, row]))
  } catch (e) {
    console.error('amazon_items read failed:', e instanceof Error ? e.message : e)
    return new Map()
  }
}

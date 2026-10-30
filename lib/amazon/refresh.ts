/**
 * Refreshes the amazon_items cache from the Creators API.
 *
 * Server-only: it uses the Creators API secret and the Supabase service role.
 * Called by the cron route (app/api/cron/amazon-items) and by
 * scripts/amazon-refresh.ts.
 */
import { catalog } from '@/data/vehicles/catalog'
import { getServiceRoleClient } from '@/lib/supabase-server'
import { CreatorsApiError, createCreatorsApiClient, getCreatorsApiConfig } from './creators-api'
import { toAmazonItemRow } from './cache'
import type { AmazonItemInsert } from './cache'

/** Every active catalog product's ASIN: the ones pages link to. */
export function catalogAsins(): string[] {
  return [...new Set(catalog.products.filter((p) => p.status === 'active').map((p) => p.asin))]
}

export type RefreshResult =
  | { ok: true; written: number; counts: Record<string, number> }
  | { ok: false; reason: string }

/**
 * Looks up the ASINs and upserts one row each.  When the API refuses (no
 * credentials, or access suspended because sales fell under the bar), it
 * writes nothing: the existing rows age past 24 hours and pages fall back on
 * their own.
 */
export async function refreshAmazonItems(asins: string[] = catalogAsins(), now: () => Date = () => new Date()): Promise<RefreshResult> {
  const config = getCreatorsApiConfig()
  if (!config) return { ok: false, reason: 'Creators API credentials are not set' }
  if (asins.length === 0) return { ok: true, written: 0, counts: {} }

  let items
  try {
    items = await createCreatorsApiClient(config).getItems(asins)
  } catch (e) {
    const reason = e instanceof CreatorsApiError ? `${e.message} (${e.reason ?? e.status})` : String(e)
    return { ok: false, reason }
  }

  const fetchedAt = now()
  const byAsin = new Map(items.items.map((item) => [item.asin, item]))
  const rows: AmazonItemInsert[] = asins.map((asin) => toAmazonItemRow(asin, byAsin.get(asin), fetchedAt))

  const { error } = await getServiceRoleClient().from('amazon_items').upsert(rows, { onConflict: 'asin' })
  if (error) return { ok: false, reason: `amazon_items upsert failed: ${error.message}` }

  const counts: Record<string, number> = {}
  for (const row of rows) counts[row.status] = (counts[row.status] ?? 0) + 1
  return { ok: true, written: rows.length, counts }
}

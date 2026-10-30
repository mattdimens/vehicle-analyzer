/**
 * Refreshes the amazon_items cache by hand, the same way the cron job does.
 *
 *   npx tsx --env-file=.env.local scripts/amazon-refresh.ts            # every active catalog ASIN
 *   npx tsx --env-file=.env.local scripts/amazon-refresh.ts B01MCRLWD5 # just these
 *
 * Writes to whichever Supabase project .env.local points at.
 */
import { catalogAsins, refreshAmazonItems } from "@/lib/amazon/refresh"

async function main() {
  const asins = process.argv.slice(2)
  const list = asins.length > 0 ? asins : catalogAsins()
  console.log(`Refreshing ${list.length} ASINs...`)
  const result = await refreshAmazonItems(list)
  console.log(JSON.stringify(result))
  if (!result.ok) process.exit(1)
}

main()

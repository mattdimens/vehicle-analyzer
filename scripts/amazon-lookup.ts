/**
 * Look up ASINs with the Amazon Creators API and print a tab-separated table
 * that pastes straight into the research Sheet.
 *
 * Needs the AMAZON_CREATORS_* variables in .env.local (see .env.example).
 * Amazon is blocked from Claude's cloud sessions, so run this on your machine:
 *
 *   npx tsx --env-file=.env.local scripts/amazon-lookup.ts B0B72CHXH3 B0FSCWDP2K
 *   pbpaste | npx tsx --env-file=.env.local scripts/amazon-lookup.ts | pbcopy
 *
 * The second form reads ASINs from the clipboard (one per line, or separated
 * by spaces or commas) and copies the table back.  Messages go to stderr, so
 * only the table lands on the clipboard.
 */
import { normalizeAsin } from '../lib/affiliate/merchants'
import {
  createCreatorsApiClient,
  CreatorsApiError,
  getCreatorsApiConfig,
} from '../lib/amazon/creators-api'
import type { AmazonItem } from '../lib/amazon/creators-api'

const COLUMNS = [
  'ASIN',
  'Status',
  'Title',
  'Brand',
  'Part number',
  'Price',
  'Availability',
  'Sold by',
  'Rating',
  'Ratings count',
  'Amazon URL',
]

async function readInput(): Promise<string[]> {
  const args = process.argv.slice(2)
  if (args.length > 0 || process.stdin.isTTY) return args
  let text = ''
  for await (const chunk of process.stdin) text += chunk
  return text.split(/[\s,]+/).filter(Boolean)
}

/** Keep a value on one Sheet cell: no tabs or line breaks. */
function cell(value: string | number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value).replace(/\s+/g, ' ').trim()
}

function row(asin: string, item: AmazonItem | undefined, problem: string | undefined): string {
  if (!item) return [asin, problem ? `Not found: ${problem}` : 'Not found'].map(cell).join('\t')
  return [
    item.asin,
    'Found',
    item.title,
    item.brand,
    item.partNumber,
    item.price?.display,
    item.availabilityMessage ?? item.availability,
    item.merchant,
    item.rating,
    item.ratingsCount,
    item.detailPageUrl,
  ]
    .map(cell)
    .join('\t')
}

async function main() {
  const config = getCreatorsApiConfig()
  if (!config) {
    console.error(
      'Set AMAZON_CREATORS_CREDENTIAL_ID and AMAZON_CREATORS_CREDENTIAL_SECRET in .env.local ' +
        '(and AMAZON_CREATORS_CREDENTIAL_VERSION if your credential is not version 3.1), then run with --env-file=.env.local.'
    )
    process.exit(1)
  }

  const asins: string[] = []
  for (const token of await readInput()) {
    const asin = normalizeAsin(token)
    if (!asin) console.error(`Skipping "${token}": not an ASIN`)
    else if (!asins.includes(asin)) asins.push(asin)
  }
  if (asins.length === 0) {
    console.error('No ASINs given. Pass them as arguments or pipe them in.')
    process.exit(1)
  }

  console.error(`Looking up ${asins.length} ASIN${asins.length === 1 ? '' : 's'}...`)
  const { items, errors } = await createCreatorsApiClient(config).getItems(asins)
  const byAsin = new Map(items.map((item) => [item.asin, item]))

  console.log(COLUMNS.join('\t'))
  for (const asin of asins) {
    const problem = errors.find((e) => e.message.toUpperCase().includes(asin))?.message
    console.log(row(asin, byAsin.get(asin), problem))
  }
  const missing = asins.length - asins.filter((a) => byAsin.has(a)).length
  console.error(`Done: ${asins.length - missing} found, ${missing} not found.`)
}

main().catch((error) => {
  if (error instanceof CreatorsApiError && error.reason === 'AssociateNotEligible') {
    console.error(
      'Amazon says this Associates account is not eligible for the Creators API right now. ' +
        'Access needs 10 qualifying sales in the past 30 days.'
    )
  } else if (error instanceof CreatorsApiError) {
    console.error(`Creators API error (HTTP ${error.status}${error.reason ? `, ${error.reason}` : ''}): ${error.message}`)
  } else if (error instanceof Error) {
    // fetch() hides network failures in `cause` ("fetch failed").
    const cause = error.cause instanceof Error ? ` (${error.cause.message})` : ''
    console.error(`${error.message}${cause}`)
  } else {
    console.error(error)
  }
  process.exit(1)
})

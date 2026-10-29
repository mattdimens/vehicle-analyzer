/**
 * Creators API client checks, with a fake fetch.  Nothing here calls Amazon.
 *
 * Run: npx tsx test/creators-api-test.ts
 */
import {
  createCreatorsApiClient,
  CreatorsApiError,
  getCreatorsApiConfig,
  MAX_ITEMS_PER_REQUEST,
  MIN_REQUEST_INTERVAL_MS,
  parseItem,
} from '../lib/amazon/creators-api'
import type { CreatorsApiConfig } from '../lib/amazon/creators-api'

let passed = 0
let failed = 0

function assert(condition: boolean, label: string) {
  if (condition) {
    passed++
    console.log(`  ✓ ${label}`)
  } else {
    failed++
    console.error(`  ✗ ${label}`)
  }
}

/** A GetItems item shaped like the Creators API response. */
function rawItem(asin: string, overrides: Record<string, unknown> = {}) {
  return {
    asin,
    detailPageURL: `https://www.amazon.com/dp/${asin}?tag=visualfitme0b-20`,
    itemInfo: {
      title: { displayValue: 'Form Lighting LED Headlights compatible with Toyota Tacoma 2016-2023' },
      byLineInfo: { brand: { displayValue: 'Form Lighting' } },
      manufactureInfo: { itemPartNumber: { displayValue: 'FL0001' } },
    },
    images: { primary: { large: { url: `https://m.media-amazon.com/images/I/${asin}.jpg`, height: 500, width: 500 } } },
    offersV2: {
      listings: [
        {
          isBuyBoxWinner: false,
          price: { money: { amount: 1199, currency: 'USD', displayAmount: '$1,199.00' } },
          availability: { type: 'IN_STOCK', message: 'In Stock' },
          merchantInfo: { name: 'Other Seller' },
        },
        {
          isBuyBoxWinner: true,
          price: { money: { amount: 999.99, currency: 'USD', displayAmount: '$999.99' } },
          availability: { type: 'IN_STOCK', message: 'In Stock' },
          merchantInfo: { name: 'Form Lighting' },
        },
      ],
    },
    customerReviews: { count: 412, starRating: { value: 4.6 } },
    ...overrides,
  }
}

interface Call {
  url: string
  init: RequestInit
  /** Fake clock time when the request was sent */
  at: number
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

/**
 * A fake fetch that answers token requests and replays queued API responses.
 * tokenDelayMs is how long each token request takes on the fake clock.
 */
function fakeApi(apiResponses: Response[] = [], tokenDelayMs = 0) {
  const calls: Call[] = []
  const sleeps: number[] = []
  let clock = 1_000_000
  let tokens = 0
  const fetchFn = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input)
    calls.push({ url, init, at: clock })
    if (url.includes('/token')) {
      clock += tokenDelayMs
      tokens++
      return jsonResponse(200, { access_token: `token-${tokens}`, expires_in: 3600 })
    }
    const next = apiResponses.shift()
    if (next) return next
    const body = JSON.parse(String(init.body)) as { itemIds: string[] }
    return jsonResponse(200, { itemsResult: { items: body.itemIds.map((id) => rawItem(id)) } })
  }
  return {
    calls,
    sleeps,
    apiCalls: () => calls.filter((c) => !c.url.includes('/token')),
    tokenCalls: () => calls.filter((c) => c.url.includes('/token')),
    advance: (ms: number) => {
      clock += ms
    },
    deps: {
      fetch: fetchFn as typeof fetch,
      now: () => clock,
      sleep: async (ms: number) => {
        sleeps.push(ms)
        clock += ms
      },
    },
  }
}

const config: CreatorsApiConfig = {
  credentialId: 'id-123',
  credentialSecret: 'secret-456',
  version: '3.1',
  partnerTag: 'visualfitme0b-20',
}

function header(call: Call, name: string): string | undefined {
  return (call.init.headers as Record<string, string>)[name]
}

async function main() {
  console.log('\ngetCreatorsApiConfig')
  assert(getCreatorsApiConfig({}) === null, 'null without credentials')
  assert(getCreatorsApiConfig({ AMAZON_CREATORS_CREDENTIAL_ID: 'a' }) === null, 'null without a secret')
  const fromEnv = getCreatorsApiConfig({ AMAZON_CREATORS_CREDENTIAL_ID: ' a ', AMAZON_CREATORS_CREDENTIAL_SECRET: 'b' })
  assert(fromEnv?.credentialId === 'a' && fromEnv.version === '3.1', 'trims values and defaults to version 3.1')
  assert(Boolean(fromEnv?.partnerTag), 'carries the Associates tag')
  let unsupported = false
  try {
    getCreatorsApiConfig({ AMAZON_CREATORS_CREDENTIAL_ID: 'a', AMAZON_CREATORS_CREDENTIAL_SECRET: 'b', AMAZON_CREATORS_CREDENTIAL_VERSION: '9.9' })
  } catch {
    unsupported = true
  }
  assert(unsupported, 'throws on an unknown credential version')

  console.log('\nparseItem')
  const item = parseItem(rawItem('B0B72CHXH3'))
  assert(item?.asin === 'B0B72CHXH3', 'keeps the ASIN')
  assert(item?.title?.startsWith('Form Lighting') === true, 'reads the title')
  assert(item?.brand === 'Form Lighting' && item.partNumber === 'FL0001', 'reads brand and part number')
  assert(item?.price?.amount === 999.99 && item.price.display === '$999.99', 'prices from the buy box listing')
  assert(item?.merchant === 'Form Lighting', 'merchant from the buy box listing')
  assert(item?.availability === 'IN_STOCK' && item.availabilityMessage === 'In Stock', 'reads availability')
  assert(item?.rating === 4.6 && item.ratingsCount === 412, 'reads rating and ratings count')
  assert(item?.imageUrl?.endsWith('B0B72CHXH3.jpg') === true, 'reads the large image')
  const bare = parseItem({ asin: 'B00U1OIESK' })
  assert(bare?.price === null && bare.rating === null && bare.title === null, 'missing fields are null')
  const noBuyBox = parseItem(rawItem('B00U1OIESK', {
    offersV2: { listings: [{ price: { money: { amount: 24.5, currency: 'USD' } } }] },
  }))
  assert(noBuyBox?.price?.amount === 24.5 && noBuyBox.price.display === '24.5 USD', 'falls back to the first listing')
  assert(parseItem({ asin: 'not-an-asin' }) === null && parseItem(null) === null, 'rejects items without a valid ASIN')
  const stringNumbers = parseItem(rawItem('B00U1OIESK', { customerReviews: { count: '1,204', starRating: { value: '4.4' } } }))
  assert(stringNumbers?.rating === 4.4 && stringNumbers.ratingsCount === 1204, 'reads ratings sent as text')
  const notNumbers = parseItem(rawItem('B00U1OIESK', { customerReviews: { count: 'many', starRating: { value: '' } } }))
  assert(notNumbers?.rating === null && notNumbers.ratingsCount === null, 'ignores text that is not a number')

  console.log('\ngetItems')
  const api = fakeApi()
  const client = createCreatorsApiClient(config, api.deps)
  const asins = Array.from({ length: 12 }, (_, i) => `B0000000${String(i).padStart(2, '0')}`)
  const result = await client.getItems([...asins, 'b000000000', 'bad'])
  assert(result.items.length === 12, 'returns every item')
  assert(api.tokenCalls().length === 1, 'fetches one token and reuses it')
  const batches = api.apiCalls().map((c) => (JSON.parse(String(c.init.body)) as { itemIds: string[] }).itemIds.length)
  assert(batches.join(',') === `${MAX_ITEMS_PER_REQUEST},2`, 'batches 10 ASINs per request, skipping repeats and invalid ones')
  const first = api.apiCalls()[0]
  assert(first.url === 'https://creatorsapi.amazon/catalog/v1/getItems', 'posts to getItems')
  assert(header(first, 'Authorization') === 'Bearer token-1', 'sends a bearer token (version 3.1)')
  assert(header(first, 'x-marketplace') === 'www.amazon.com', 'sends the US marketplace')
  const sent = JSON.parse(String(first.init.body)) as Record<string, unknown> & { resources: string[] }
  assert(sent.partnerTag === 'visualfitme0b-20', 'sends the partner tag')
  assert(sent.marketplace === 'www.amazon.com' && sent.itemIdType === 'ASIN', 'sends marketplace and itemIdType in the body')
  assert(sent.resources.includes('customerReviews.starRating'), 'asks for ratings')
  const tokenCall = api.tokenCalls()[0]
  const tokenBody = JSON.parse(String(tokenCall.init.body)) as Record<string, string>
  assert(tokenCall.url === 'https://api.amazon.com/auth/o2/token', 'version 3.1 uses Login with Amazon')
  assert(tokenBody.scope === 'creatorsapi::default' && tokenBody.grant_type === 'client_credentials', 'requests the Creators API scope')
  assert(api.sleeps.length === 1 && api.sleeps[0] === MIN_REQUEST_INTERVAL_MS, 'waits between requests to stay at 1 per second')
  const slowToken = fakeApi([], 500)
  await createCreatorsApiClient(config, slowToken.deps).getItems(asins)
  const [firstBatch, secondBatch] = slowToken.apiCalls()
  assert(secondBatch.at - firstBatch.at >= MIN_REQUEST_INTERVAL_MS, 'a slow token request does not shorten the gap between requests')

  api.advance(3_600_000)
  await client.getItems(['B00U1OIESK'])
  assert(api.tokenCalls().length === 2, 'renews the token after it expires')

  const raw = await client.getItemsRaw(['B00U1OIESK', 'B0B72CHXH3'])
  const rawItems = (raw[0]?.itemsResult as { items: { asin: string }[] } | undefined)?.items
  assert(raw.length === 1 && rawItems?.[1]?.asin === 'B0B72CHXH3', 'getItemsRaw returns the responses unparsed')

  console.log('\ngetItems, version 2.1 credentials')
  const legacy = fakeApi()
  await createCreatorsApiClient({ ...config, version: '2.1' }, legacy.deps).getItems(['B00U1OIESK'])
  const legacyToken = legacy.tokenCalls()[0]
  assert(legacyToken.url.includes('amazoncognito.com'), 'uses the Cognito token endpoint')
  assert(String(legacyToken.init.body).includes('scope=creatorsapi%2Fdefault'), 'sends a form-encoded body')
  assert(header(legacy.apiCalls()[0], 'Authorization') === 'Bearer token-1, Version 2.1', 'adds the version to the header')

  console.log('\ngetItems, errors')
  const partial = fakeApi([
    jsonResponse(200, {
      itemsResult: { items: [rawItem('B00U1OIESK')] },
      errors: [{ code: 'InvalidParameterValue', message: 'The ItemId B0000000ZZ is not accessible through the Creators API.' }],
    }),
  ])
  const partialResult = await createCreatorsApiClient(config, partial.deps).getItems(['B00U1OIESK', 'B0000000ZZ'])
  assert(partialResult.items.length === 1 && partialResult.errors[0]?.code === 'InvalidParameterValue', 'returns per-item errors')

  const expired = fakeApi([jsonResponse(401, { type: 'UnauthorizedException', reason: 'TokenExpired' })])
  const retried = await createCreatorsApiClient(config, expired.deps).getItems(['B00U1OIESK'])
  assert(retried.items.length === 1 && expired.tokenCalls().length === 2, 'gets a new token and retries after a 401')

  const throttled = fakeApi([jsonResponse(429, { type: 'ThrottleException', message: 'Rate exceeded' })])
  const afterThrottle = await createCreatorsApiClient(config, throttled.deps).getItems(['B00U1OIESK'])
  assert(afterThrottle.items.length === 1 && throttled.apiCalls().length === 2, 'retries once after a 429')

  const ineligible = fakeApi([
    jsonResponse(403, { type: 'AccessDeniedException', message: 'Not eligible', reason: 'AssociateNotEligible' }),
  ])
  let error: unknown
  try {
    await createCreatorsApiClient(config, ineligible.deps).getItems(['B00U1OIESK'])
  } catch (e) {
    error = e
  }
  assert(error instanceof CreatorsApiError && error.status === 403, 'throws CreatorsApiError on a 403')
  assert(error instanceof CreatorsApiError && error.reason === 'AssociateNotEligible', 'keeps the reason code')
  assert(ineligible.apiCalls().length === 1, 'does not retry a 403')

  const errorList = fakeApi([jsonResponse(400, { errors: [{ code: 'InvalidPartnerTag', message: 'Bad tag' }] })])
  let listError: unknown
  try {
    await createCreatorsApiClient(config, errorList.deps).getItems(['B00U1OIESK'])
  } catch (e) {
    listError = e
  }
  assert(listError instanceof CreatorsApiError && listError.reason === 'InvalidPartnerTag', 'reads the reason from an errors list')

  const empty = fakeApi()
  const none = await createCreatorsApiClient(config, empty.deps).getItems(['bad'])
  assert(none.items.length === 0 && empty.calls.length === 0, 'makes no calls when no ASIN is valid')
}

main()
  .catch((e) => {
    failed++
    console.error(e)
  })
  .finally(() => {
    console.log(`\n${passed} passed, ${failed} failed`)
    if (failed > 0) process.exit(1)
  })

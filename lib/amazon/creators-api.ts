/**
 * Amazon Creators API client (the successor to PA-API 5).
 *
 * Server-only: it holds the credential secret.  Never import it from client
 * components.  Docs:
 * https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction
 *
 * Access needs 10 qualifying sales in the past 30 days and is suspended when
 * sales drop below that, so callers must handle a CreatorsApiError with
 * reason "AssociateNotEligible" and fall back to editorial content.
 */
import { getAssociateTag, normalizeAsin } from '@/lib/affiliate/merchants'

const API_BASE = 'https://creatorsapi.amazon'
const MARKETPLACE = 'www.amazon.com'
export const MAX_ITEMS_PER_REQUEST = 10
/** New credentials get 1 request per second. */
export const MIN_REQUEST_INTERVAL_MS = 1100
const THROTTLE_RETRY_MS = 2000

/**
 * Token endpoint by credential version, shown next to the credential in
 * Associates Central.  US credentials are 3.1 (Login with Amazon) or the
 * older 2.1 (Cognito).
 */
const TOKEN_ENDPOINTS: Record<string, { url: string; lwa: boolean }> = {
  '2.1': { url: 'https://creatorsapi.auth.us-east-1.amazoncognito.com/oauth2/token', lwa: false },
  '3.1': { url: 'https://api.amazon.com/auth/o2/token', lwa: true },
}

/** What GetItems asks for: everything the research Sheet and product cards use. */
export const ITEM_RESOURCES = [
  'itemInfo.title',
  'itemInfo.byLineInfo',
  'itemInfo.manufactureInfo',
  'images.primary.large',
  'offersV2.listings.price',
  'offersV2.listings.availability',
  'offersV2.listings.merchantInfo',
  'offersV2.listings.isBuyBoxWinner',
  'customerReviews.count',
  'customerReviews.starRating',
]

export interface CreatorsApiConfig {
  credentialId: string
  credentialSecret: string
  version: string
  partnerTag: string
}

/** One Amazon listing, flattened.  Fields Amazon didn't return are null. */
export interface AmazonItem {
  asin: string
  title: string | null
  brand: string | null
  partNumber: string | null
  /** Amazon's detail page link, already carrying the partner tag. */
  detailPageUrl: string | null
  imageUrl: string | null
  /** From the buy box listing, or the first listing when none wins it. */
  price: { amount: number; currency: string; display: string } | null
  availability: string | null
  availabilityMessage: string | null
  merchant: string | null
  rating: number | null
  ratingsCount: number | null
}

export interface ItemError {
  code: string
  message: string
}

export interface GetItemsResult {
  items: AmazonItem[]
  /** Per-ASIN problems, such as an ASIN that doesn't exist or isn't offered. */
  errors: ItemError[]
}

export class CreatorsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** Amazon's reason code, e.g. "AssociateNotEligible" or "InvalidPartnerTag". */
    readonly reason: string | null
  ) {
    super(message)
    this.name = 'CreatorsApiError'
  }
}

/**
 * Credentials from the environment, or null when they aren't set.
 * Throws on a credential version this client doesn't know.
 */
export function getCreatorsApiConfig(
  env: Record<string, string | undefined> = process.env
): CreatorsApiConfig | null {
  const credentialId = env.AMAZON_CREATORS_CREDENTIAL_ID?.trim()
  const credentialSecret = env.AMAZON_CREATORS_CREDENTIAL_SECRET?.trim()
  if (!credentialId || !credentialSecret) return null

  const version = env.AMAZON_CREATORS_CREDENTIAL_VERSION?.trim() || '3.1'
  if (!TOKEN_ENDPOINTS[version]) {
    throw new Error(
      `AMAZON_CREATORS_CREDENTIAL_VERSION ${version} isn't supported. Use one of: ${Object.keys(TOKEN_ENDPOINTS).join(', ')}`
    )
  }
  return { credentialId, credentialSecret, version, partnerTag: getAssociateTag() }
}

// ── Response parsing ───────────────────────────────────────────────────

type Json = Record<string, unknown>

function obj(value: unknown): Json | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Json) : undefined
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

/** A number, or a numeric string such as "1,204" (Amazon's SDK converts those, so accept them too). */
function num(value: unknown): number | null {
  const n = typeof value === 'string' && value.trim() ? Number(value.replace(/,/g, '')) : value
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

function displayValue(value: unknown): string | null {
  return str(obj(value)?.displayValue)
}

function list(value: unknown): Json[] {
  return Array.isArray(value) ? value.flatMap<Json>((v) => obj(v) ?? []) : []
}

/** Flatten one item from a GetItems response.  Null when it has no valid ASIN. */
export function parseItem(raw: unknown): AmazonItem | null {
  const item = obj(raw)
  const asin = normalizeAsin(str(item?.asin))
  if (!item || !asin) return null

  const info = obj(item.itemInfo)
  const listings = list(obj(item.offersV2)?.listings)
  const listing = listings.find((l) => l.isBuyBoxWinner === true) ?? listings[0]
  const money = obj(obj(listing?.price)?.money)
  const amount = num(money?.amount)
  const currency = str(money?.currency)
  const availability = obj(listing?.availability)
  const reviews = obj(item.customerReviews)

  return {
    asin,
    title: displayValue(info?.title),
    brand: displayValue(obj(info?.byLineInfo)?.brand),
    partNumber: displayValue(obj(info?.manufactureInfo)?.itemPartNumber),
    detailPageUrl: str(item.detailPageURL),
    imageUrl: str(obj(obj(obj(item.images)?.primary)?.large)?.url),
    price:
      amount !== null && currency
        ? { amount, currency, display: str(money?.displayAmount) ?? `${amount} ${currency}` }
        : null,
    availability: str(availability?.type),
    availabilityMessage: str(availability?.message),
    merchant: str(obj(listing?.merchantInfo)?.name),
    rating: num(obj(reviews?.starRating)?.value),
    ratingsCount: num(reviews?.count),
  }
}

// ── Client ─────────────────────────────────────────────────────────────

export interface CreatorsApiDeps {
  fetch: typeof fetch
  now: () => number
  sleep: (ms: number) => Promise<void>
}

const defaultDeps: CreatorsApiDeps = {
  fetch: (input, init) => fetch(input, init),
  now: () => Date.now(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}

async function readJson(res: Response): Promise<Json | undefined> {
  try {
    return obj(await res.json())
  } catch {
    return undefined
  }
}

export function createCreatorsApiClient(config: CreatorsApiConfig, deps: Partial<CreatorsApiDeps> = {}) {
  const { fetch: doFetch, now, sleep } = { ...defaultDeps, ...deps }
  const endpoint = TOKEN_ENDPOINTS[config.version]
  if (!endpoint) throw new Error(`Unsupported credential version ${config.version}`)

  let token: { value: string; expiresAt: number } | null = null
  let lastRequestAt = Number.NEGATIVE_INFINITY

  async function getToken(): Promise<string> {
    if (token && now() < token.expiresAt) return token.value

    const fields = {
      grant_type: 'client_credentials',
      client_id: config.credentialId,
      client_secret: config.credentialSecret,
      scope: endpoint.lwa ? 'creatorsapi::default' : 'creatorsapi/default',
    }
    const res = await doFetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': endpoint.lwa ? 'application/json' : 'application/x-www-form-urlencoded',
      },
      body: endpoint.lwa ? JSON.stringify(fields) : new URLSearchParams(fields).toString(),
    })
    const data = await readJson(res)
    const accessToken = str(data?.access_token)
    if (!res.ok || !accessToken) {
      throw new CreatorsApiError(
        `Creators API token request failed (HTTP ${res.status})`,
        res.status,
        str(data?.error)
      )
    }
    // Renew 30 seconds early so a request never goes out with a token that expires in flight.
    const expiresIn = num(data?.expires_in) ?? 3600
    token = { value: accessToken, expiresAt: now() + (expiresIn - 30) * 1000 }
    return accessToken
  }

  async function post(path: string, body: Json, retried = false): Promise<Json | undefined> {
    // Get the token first, so time spent fetching it doesn't count toward the interval.
    const accessToken = await getToken()
    const wait = lastRequestAt + MIN_REQUEST_INTERVAL_MS - now()
    if (wait > 0) await sleep(wait)
    lastRequestAt = now()

    const res = await doFetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        Authorization: endpoint.lwa ? `Bearer ${accessToken}` : `Bearer ${accessToken}, Version ${config.version}`,
        'Content-Type': 'application/json',
        'x-marketplace': MARKETPLACE,
      },
      body: JSON.stringify(body),
    })
    const data = await readJson(res)

    // One retry: with a fresh token after a 401, or after a pause when throttled.
    if (!retried && res.status === 401) {
      token = null
      return post(path, body, true)
    }
    if (!retried && res.status === 429) {
      await sleep(THROTTLE_RETRY_MS)
      return post(path, body, true)
    }
    if (!res.ok) {
      throw new CreatorsApiError(
        str(data?.message) ?? `Creators API request failed (HTTP ${res.status})`,
        res.status,
        str(data?.reason) ?? str(list(data?.errors)[0]?.code) ?? str(data?.type)
      )
    }
    return data
  }

  /**
   * GetItems responses as Amazon sent them, one per batch of
   * MAX_ITEMS_PER_REQUEST ASINs.  Invalid and repeated ASINs are skipped.
   */
  async function getItemsRaw(asins: string[]): Promise<(Json | undefined)[]> {
    const ids = [...new Set(asins.flatMap((a) => normalizeAsin(a) ?? []))]
    const responses: (Json | undefined)[] = []

    for (let i = 0; i < ids.length; i += MAX_ITEMS_PER_REQUEST) {
      // Amazon's reference example sends marketplace and itemIdType in the body; its SDK sends the header.
      responses.push(
        await post('/catalog/v1/getItems', {
          partnerTag: config.partnerTag,
          marketplace: MARKETPLACE,
          itemIdType: 'ASIN',
          itemIds: ids.slice(i, i + MAX_ITEMS_PER_REQUEST),
          resources: ITEM_RESOURCES,
        })
      )
    }
    return responses
  }

  /** Look up ASINs and flatten the items. */
  async function getItems(asins: string[]): Promise<GetItemsResult> {
    const result: GetItemsResult = { items: [], errors: [] }

    for (const data of await getItemsRaw(asins)) {
      for (const raw of list(obj(data?.itemsResult)?.items)) {
        const item = parseItem(raw)
        if (item) result.items.push(item)
      }
      for (const e of list(data?.errors)) {
        result.errors.push({ code: str(e.code) ?? 'Unknown', message: str(e.message) ?? '' })
      }
    }
    return result
  }

  return { getItems, getItemsRaw }
}

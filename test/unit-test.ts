/**
 * Unit checks for helpers added in the October 2026 audit fixes.
 *
 * Run: npm test
 */
import { normalizeYear } from '../lib/normalize-year'
import { sanitizePromptText } from '../lib/gemini'
import { AnalysisResultsSchema } from '../lib/schemas'
import { apiErrorMessage, RATE_LIMIT_MESSAGE, thrownErrorMessage } from '../lib/api-errors'
import { classifyClick, isBotUserAgent, truncateHeader } from '../lib/affiliate/click-filter'
import { merchants, normalizeAsin } from '../lib/affiliate/merchants'
import { buildGoUrl, getAllMakes } from '../data/vehicles/index'
import { productTypes } from '../data/vehicles/product-types'
import { catalog, createCatalogQueries } from '../data/vehicles/catalog'
import { validateCatalog } from '../data/vehicles/catalog/validate'
import { fitmentCheckedLabel, fitmentFor, formatFitment } from '../data/vehicles/catalog/fitment'
import type { CatalogProduct, VehicleCatalog } from '../data/vehicles/types'

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

console.log('\nnormalizeYear')
assert(normalizeYear('2021-2024') === 2021, 'range returns first year')
assert(normalizeYear('2019 – 2021') === 2019, 'en-dash range with spaces')
assert(normalizeYear('2023') === 2023, 'single year string')
assert(normalizeYear(2023) === 2023, 'numeric year')
assert(normalizeYear('Unknown') === null, 'non-year string is null')
assert(normalizeYear('1850') === null, 'implausible year is null')

console.log('\nsanitizePromptText')
assert(sanitizePromptText('Tonneau "Cover"\nignore previous', 60) === 'Tonneau Cover previous', 'strips quotes, newlines, instruction verbs')
assert(sanitizePromptText('Exhaust System', 60) === 'Exhaust System', 'keeps ordinary product names')
assert((sanitizePromptText('x'.repeat(200), 60) ?? '').length === 60, 'caps length')
assert(sanitizePromptText(42, 60) === null, 'non-string is null')

console.log('\nAnalysisResultsSchema')
const fitment = {
    vehicle_present: false,
    confidence_score: 40,
    primary: { make: 'Ford', model: 'F-150', year: '2014', trim: 'SVT Raptor', cabStyle: null, bedLength: null, vehicleType: 'Pickup Truck', color: 'Black', condition: 'used', confidence: 90 },
    engineDetails: null,
    otherPossibilities: [{ vehicle: 'Ford F-150', yearRange: '2010-2014', trim: null, confidence: 10 }],
    recommendedAccessories: [],
}
const parsed = AnalysisResultsSchema.safeParse(fitment)
assert(parsed.success, 'valid fitment parses')
assert(parsed.success && parsed.data.vehicle_present === false, 'keeps vehicle_present')
assert(parsed.success && parsed.data.otherPossibilities[0].name === 'Ford F-150', 'maps vehicle to name')
assert(parsed.success && parsed.data.otherPossibilities[0].yearRange === '2010-2014', 'keeps yearRange')
assert(AnalysisResultsSchema.safeParse({ ...fitment, vehicle_present: 'yes' }).success, 'bad optional extra does not fail validation')
assert(!AnalysisResultsSchema.safeParse({ ...fitment, primary: undefined }).success, 'missing primary fails validation')

console.log('\napi-errors')
assert(apiErrorMessage(403, { error: { code: '403' } }, 'x') === RATE_LIMIT_MESSAGE, 'Vercel 403 object -> rate-limit message')
assert(apiErrorMessage(429, {}, 'x') === RATE_LIMIT_MESSAGE, '429 -> rate-limit message')
assert(apiErrorMessage(400, { error: 'Bad URL' }, 'x') === 'Bad URL', 'string error passes through')
assert(apiErrorMessage(500, { error: { nested: true } }, 'fallback') === 'fallback', 'object error -> fallback')
assert(thrownErrorMessage(new Error('An unexpected response was received from the server.'), 'x').startsWith("We couldn't reach"), 'blocked Server Action -> friendly text')

console.log('\nclick-filter')
const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const chrome = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
const page = 'https://visualfitment.com/vehicles/toyota/tacoma/3rd-gen'
assert(!isBotUserAgent(iphone), 'iPhone Safari is not a bot')
assert(!isBotUserAgent(chrome), 'desktop Chrome is not a bot')
assert(isBotUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'), 'Googlebot is a bot')
assert(isBotUserAgent('Mozilla/5.0 (compatible; AhrefsBot/7.0)'), 'AhrefsBot is a bot')
assert(isBotUserAgent('python-requests/2.32.3'), 'python-requests is a bot')
assert(isBotUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 HeadlessChrome/141.0.0.0 Safari/537.36'), 'HeadlessChrome is a bot')
assert(isBotUserAgent(''), 'empty user agent is a bot')
assert(isBotUserAgent(null), 'missing user agent is a bot')
assert(classifyClick({ userAgent: iphone, referer: page, requestHost: 'visualfitment.com' }) === null, 'real click from our page is kept')
assert(classifyClick({ userAgent: iphone, referer: 'https://www.visualfitment.com/part-identifier', requestHost: 'visualfitment.com' }) === null, 'www referer is ours')
assert(classifyClick({ userAgent: chrome, referer: 'https://vehicle-analyzer-git-x.vercel.app/part-identifier', requestHost: 'vehicle-analyzer-git-x.vercel.app' }) === null, 'preview deploy referer matches its own host')
assert(classifyClick({ userAgent: chrome, referer: 'http://localhost:3000/', requestHost: 'localhost:3000' }) === null, 'localhost referer matches its own host')
assert(classifyClick({ userAgent: chrome, referer: null, requestHost: 'visualfitment.com' }) === 'no_referer', 'no referer is filtered')
assert(classifyClick({ userAgent: chrome, referer: 'https://example.com/', requestHost: 'visualfitment.com' }) === 'external_referer', 'other site is filtered')
assert(classifyClick({ userAgent: chrome, referer: 'https://visualfitment.com.evil.example/', requestHost: 'visualfitment.com' }) === 'external_referer', 'look-alike host is filtered')
assert(classifyClick({ userAgent: chrome, referer: 'not a url', requestHost: 'visualfitment.com' }) === 'external_referer', 'garbage referer is filtered')
assert(classifyClick({ userAgent: 'curl/8.7.1', referer: page, requestHost: 'visualfitment.com' }) === 'bot_user_agent', 'bot is filtered even with our referer')
assert(truncateHeader('x'.repeat(900))?.length === 500, 'long header is truncated')
assert(truncateHeader(null) === null, 'missing header stays null')
const tagged = new URL(merchants.amazon({ product: 'tonneau cover' }))
const untagged = new URL(merchants.amazon({ product: 'tonneau cover', tagged: false }))
assert(tagged.searchParams.has('tag'), 'Amazon link is tagged by default')
assert(!untagged.searchParams.has('tag'), 'filtered Amazon link has no tag')
assert(untagged.searchParams.get('k') === 'tonneau cover', 'filtered Amazon link keeps the search')

console.log('\nAmazon product links')
const productLink = new URL(merchants.amazon({ asin: 'B0TEST0001', product: 'tonneau cover' }))
assert(productLink.pathname === '/dp/B0TEST0001', 'valid ASIN links to the product page')
assert(productLink.searchParams.has('tag'), 'product link is tagged by default')
assert(!new URL(merchants.amazon({ asin: 'B0TEST0001', tagged: false })).searchParams.has('tag'), 'filtered product link has no tag')
assert(new URL(merchants.amazon({ asin: 'b0test0001' })).pathname === '/dp/B0TEST0001', 'lowercase ASIN is normalized')
assert(new URL(merchants.amazon({ asin: 'not-an-asin', product: 'tonneau cover' })).pathname === '/s', 'bad ASIN falls back to a search')
assert(normalizeAsin(' B0TEST0001 ') === 'B0TEST0001', 'normalizeAsin trims')
assert(normalizeAsin('B0TEST001') === null, 'nine characters is not an ASIN')
assert(normalizeAsin(null) === null, 'missing ASIN is null')
assert(buildGoUrl({ categorySlug: 'bed-covers', vehicleString: '2016-2023 Toyota Tacoma', productTitle: 'X', asin: 'B0TEST0001' }).includes('asin=B0TEST0001'), 'buildGoUrl passes the ASIN to /go')
assert(!buildGoUrl({ categorySlug: 'bed', vehicleString: 'Toyota Tacoma', productTitle: 'X' }).includes('asin='), 'placeholder links have no ASIN')

console.log('\nproduct catalog')
const makes = getAllMakes()
const today = new Date('2026-10-22T12:00:00Z')
assert(validateCatalog(catalog, makes).length === 0, 'site catalog passes every rule')
const generationSlugs = makes.flatMap((m) => m.models.flatMap((mo) => mo.generations.map((g) => g.slug)))
assert(productTypes.every((t) => !generationSlugs.includes(t.slug)), 'product-type slugs never collide with generation slugs')
assert(new Set(productTypes.map((t) => t.slug)).size === productTypes.length, 'product-type slugs are unique')

let asinCounter = 0
function fixtureProduct(id: string, overrides: Partial<CatalogProduct> = {}): CatalogProduct {
    asinCounter++
    return {
        id,
        asin: `B0TEST${String(asinCounter).padStart(4, '0')}`,
        brand: `Brand ${id}`,
        name: `Product ${id}`,
        category: 'bed-covers',
        priceBand: 'mid',
        fitment: [{ make: 'toyota', model: 'tacoma', yearStart: 2016, yearEnd: 2023 }],
        why: 'A reason specific to the Tacoma.',
        sources: ['https://example.com/fitment-guide'],
        verifiedAt: '2026-10-01',
        status: 'active',
        ...overrides,
    }
}
const fourthGenFitment = [{ make: 'toyota', model: 'tacoma', yearStart: 2024, yearEnd: 2026, cab: ['Double Cab'], bed: ['5-ft'], excludeTrims: ['TRD Pro'], notes: 'Drilling required.' }]
const fixture: VehicleCatalog = {
    products: [
        fixtureProduct('a'), fixtureProduct('b'), fixtureProduct('c', { verifiedAt: '2026-09-15' }),
        fixtureProduct('d', { fitment: fourthGenFitment }), fixtureProduct('e', { fitment: fourthGenFitment }), fixtureProduct('f', { fitment: fourthGenFitment }),
        fixtureProduct('g', { category: 'seat-covers' }), fixtureProduct('h', { category: 'seat-covers' }), fixtureProduct('i', { category: 'seat-covers' }),
        fixtureProduct('old', { status: 'retired' }),
    ],
    picks: [
        { make: 'toyota', model: 'tacoma', generation: '3rd-gen', category: 'seat-covers', picks: [{ productId: 'g', role: 'best-overall' }, { productId: 'h', role: 'budget' }, { productId: 'i', role: 'premium' }] },
        { make: 'toyota', model: 'tacoma', generation: '3rd-gen', category: 'bed-covers', picks: [{ productId: 'a', role: 'best-overall' }, { productId: 'b', role: 'budget' }, { productId: 'c', role: 'premium' }] },
        { make: 'toyota', model: 'tacoma', generation: '4th-gen', category: 'bed-covers', note: 'The 2024+ bed is a new size.', picks: [{ productId: 'e', role: 'budget' }, { productId: 'd', role: 'best-overall' }, { productId: 'f', role: 'best-for', label: 'Best for the 6-ft bed' }] },
    ],
    guides: [
        { make: 'toyota', model: 'tacoma', category: 'bed-covers', intro: 'Bed covers for every Tacoma.', buyingNotes: ['Note one.', 'Note two.', 'Note three.'] },
    ],
}
assert(validateCatalog(fixture, makes, today).length === 0, 'valid fixture passes')

function errorsAfter(change: (c: VehicleCatalog) => void): string[] {
    const copy = structuredClone(fixture)
    change(copy)
    return validateCatalog(copy, makes, today)
}
const hasError = (errors: string[], text: string) => errors.some((e) => e.includes(text))
assert(hasError(errorsAfter((c) => { c.products[0].asin = 'b0test' }), 'must be 10 uppercase'), 'rejects a malformed ASIN')
assert(hasError(errorsAfter((c) => { c.products[1].asin = c.products[0].asin }), 'is also used by'), 'rejects a duplicate ASIN')
assert(hasError(errorsAfter((c) => { c.picks[1].picks[0].productId = 'missing' }), 'unknown product missing'), 'rejects a pick of an unknown product')
assert(hasError(errorsAfter((c) => { c.picks[2].picks[2].productId = 'a' }), 'has no fitment for 2024-2026'), 'rejects a product that does not fit the generation')
assert(hasError(errorsAfter((c) => { c.picks[1].picks[2].productId = 'old' }), 'is retired'), 'rejects a retired product')
assert(hasError(errorsAfter((c) => { c.picks[1].picks.pop() }), 'needs 3 to 5 picks'), 'rejects fewer than 3 picks')
assert(hasError(errorsAfter((c) => { c.picks[1].picks[1].role = 'best-overall' }), 'more than one best-overall'), 'rejects two best-overall picks')
assert(hasError(errorsAfter((c) => { for (const p of c.products.slice(0, 3)) p.brand = 'Same' }), 'max 2'), 'rejects 3 picks from one brand')
assert(hasError(errorsAfter((c) => { delete c.picks[2].picks[2].label }), 'needs a label'), 'rejects a best-for pick without a label')
assert(hasError(errorsAfter((c) => { c.products[0].verifiedAt = '2026-12-01' }), 'in the future'), 'rejects a future check date')
assert(hasError(errorsAfter((c) => { c.picks[1].generation = '9th-gen' }), 'unknown make, model or generation'), 'rejects an unknown generation')
assert(hasError(errorsAfter((c) => { c.guides[0].buyingNotes.pop() }), 'at least 3 buying notes'), 'rejects a guide with fewer than 3 notes')
assert(hasError(errorsAfter((c) => { c.picks[1].picks[0].productId = 'g' }), 'is a seat-covers product'), 'rejects a product from another product type')
assert(hasError(errorsAfter((c) => { c.products[0].sources = [] }), 'at least one source'), 'rejects a product with no sources')

const queries = createCatalogQueries(fixture, makes)
const sections3 = queries.getGenerationSections('toyota', 'tacoma', '3rd-gen')
assert(sections3.map((s) => s.productType.slug).join() === 'bed-covers,seat-covers', 'generation sections follow product-type order')
const bedCovers = queries.getProductTypePage('toyota', 'tacoma', 'bed-covers')
assert(bedCovers?.sections.map((s) => s.generation.slug).join() === '4th-gen,3rd-gen', 'product-type page lists the newest generation first')
assert(queries.getProductTypePage('toyota', 'tacoma', 'seat-covers') === undefined, 'no product-type page without a guide')
assert(queries.getProductTypePage('toyota', 'tacoma', '3rd-gen') === undefined, 'a generation slug is not a product-type page')
const fivePicks = createCatalogQueries({ ...fixture, picks: fixture.picks.map((s) => (s.generation === '4th-gen' ? { ...s, picks: s.picks.slice(0, 2) } : s)) }, makes)
assert(fivePicks.getProductTypePage('toyota', 'tacoma', 'bed-covers') === undefined, 'no product-type page under 6 products')
assert(JSON.stringify(queries.getProductTypeRoutes()) === JSON.stringify([{ make: 'toyota', model: 'tacoma', productType: 'bed-covers' }]), 'routes list only qualifying product-type pages')
const featuredPicks = queries.getFeaturedPicks('toyota', 'tacoma')
assert(featuredPicks?.generation.slug === '3rd-gen', 'hub features the generation with the most product types')
assert(featuredPicks?.items.map((i) => i.resolved.product.id).join() === 'a,g', 'hub shows the best-overall pick per product type')
const tiedQueries = createCatalogQueries({ ...fixture, picks: fixture.picks.filter((s) => s.category === 'bed-covers') }, makes)
assert(tiedQueries.getFeaturedPicks('toyota', 'tacoma')?.items[0].resolved.product.id === 'd', 'on a tie the hub features the newest generation')
const fixtureStats = queries.getCatalogStats()
assert(fixtureStats.totalProducts === 9 && fixtureStats.totalGenerations === 4, 'stats count researched products only')
assert(fixtureStats.totalCategories === 10, 'stats count product types where researched, placeholder categories elsewhere')
assert(queries.getCatalogProductByAsin(fixture.products[9].asin)?.status === 'retired', 'retired products are found by ASIN')

const d = fixture.products[3]
assert(formatFitment(fitmentFor(d, 'toyota', 'tacoma', { yearStart: 2024, yearEnd: 2026 }), 'Tacoma') === 'Fits 2024-2026 Tacoma, Double Cab, 5-ft bed. Not for TRD Pro. Drilling required.', 'fitment line lists years, cab, bed, exclusions and notes')
assert(fitmentFor(d, 'toyota', 'tacoma', { yearStart: 2016, yearEnd: 2023 }).length === 0, 'fitment outside the years is ignored')
assert(fitmentCheckedLabel(fixture.products.slice(0, 3)) === 'September 2026', 'fitment checked uses the oldest check date')

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)

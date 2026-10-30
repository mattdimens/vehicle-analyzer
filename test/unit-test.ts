/**
 * Unit checks for helpers added in the October 2026 audit fixes.
 *
 * Run: npm test
 */
import { normalizeYear } from '../lib/normalize-year'
import { sanitizePromptText } from '../lib/gemini'
import { AnalysisResultsSchema, PartIdentificationSchema } from '../lib/schemas'
import { apiErrorMessage, RATE_LIMIT_MESSAGE, thrownErrorMessage } from '../lib/api-errors'
import { classifyClick, isBotUserAgent, truncateHeader } from '../lib/affiliate/click-filter'
import { merchants, normalizeAsin } from '../lib/affiliate/merchants'
import { buildGoUrl, completeSpecRows, generationForYear, getAllMakes, modelYears } from '../data/vehicles/index'
import { productTypes } from '../data/vehicles/product-types'
import { catalog, createCatalogQueries, getGenerationSections, orderPicks, placeholderLinkLabel, remainingPlaceholders, withoutResearched } from '../data/vehicles/catalog'
import { validateCatalog } from '../data/vehicles/catalog/validate'
import { describeTruck, fitmentCheckedLabel, fitmentFor, fitsTruck, formatFitment, normalizeTruck, truckFitLine, withArticle } from '../data/vehicles/catalog/fitment'
import { catalogHrefWithTruck, configsForPath, truckFromParams } from '../data/vehicles/truck-handoff'
import type { CatalogProduct, Pick, VehicleCatalog } from '../data/vehicles/types'
import { buildExactPartSearch, buildPartGoUrl, buildPartSearch, buildTypedPartSearch, buildVehicleItemSearch, partSearchVehicle, sanitizePartQuery, sanitizeTypedPartNumber } from '../lib/part-search'
import { getPartDisplayBand } from '../config/analysis'
import { detectedVehicleLabel, formatVehicleLabel, initialPartVehicle, parsePartVehicleChoice, partForVehicle } from '../lib/part-vehicle'
import { getUsModels, getUsModelYears } from '../data/vehicles/us-vehicles'
import { resolveCatalogGeneration, resolveVehicleUrl } from '../data/vehicles/supported-vehicles'
import { formatVehicleType, parseRecommendation, parseYearRange, vehicleNoun, vehicleSpecLine, vehicleTitle } from '../lib/vehicle-result'
import { isAnalysisInProgress } from '../types/analysis'
import { amazonCardData, formatAsOf, toAmazonItemRow } from '../lib/amazon/cache'
import type { AmazonItem } from '../lib/amazon/creators-api'

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
        category: 'bed-racks',
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
        { make: 'toyota', model: 'tacoma', generation: '3rd-gen', category: 'bed-racks', picks: [{ productId: 'a', role: 'best-overall' }, { productId: 'b', role: 'budget' }, { productId: 'c', role: 'premium' }] },
        { make: 'toyota', model: 'tacoma', generation: '4th-gen', category: 'bed-racks', note: 'The 2024+ bed is a new size.', picks: [{ productId: 'e', role: 'budget' }, { productId: 'd', role: 'best-overall' }, { productId: 'f', role: 'best-for', label: 'Best for the 6-ft bed' }] },
    ],
    guides: [
        { make: 'toyota', model: 'tacoma', category: 'bed-racks', intro: 'Bed covers for every Tacoma.', buyingNotes: ['Note one.', 'Note two.', 'Note three.'] },
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
assert(hasError(errorsAfter((c) => { c.products[0].verifiedAt = '2026-09-31' }), 'must be a real YYYY-MM-DD date'), 'rejects an impossible calendar date')
assert(hasError(errorsAfter((c) => { c.products[0].verifiedAt = '10/01/2026' }), 'must be a real YYYY-MM-DD date'), 'rejects a date in another format')
assert(validateCatalog({ ...fixture, products: fixture.products.map((p) => (p.id === 'a' ? { ...p, verifiedAt: '2024-02-29' } : p)) }, makes, today).length === 0, 'accepts a leap day')
assert(hasError(errorsAfter((c) => { c.picks[1].generation = '9th-gen' }), 'unknown make, model or generation'), 'rejects an unknown generation')
assert(hasError(errorsAfter((c) => { c.guides[0].buyingNotes.pop() }), 'at least 3 buying notes'), 'rejects a guide with fewer than 3 notes')
assert(hasError(errorsAfter((c) => { c.picks[1].picks[0].productId = 'g' }), 'is a seat-covers product'), 'rejects a product from another product type')
assert(hasError(errorsAfter((c) => { c.products[0].sources = [] }), 'at least one source'), 'rejects a product with no sources')
assert(hasError(errorsAfter((c) => { c.products[0].category = 'bed-covers' }), 'is a skipped product type'), 'rejects a product of a skipped type (bed covers: RealTruck conflict)')

const queries = createCatalogQueries(fixture, makes)
const sections3 = queries.getGenerationSections('toyota', 'tacoma', '3rd-gen')
assert(sections3.map((s) => s.productType.slug).join() === 'bed-racks,seat-covers', 'generation sections follow product-type order')
const bedRacks = queries.getProductTypePage('toyota', 'tacoma', 'bed-racks')
assert(bedRacks?.sections.map((s) => s.generation.slug).join() === '4th-gen,3rd-gen', 'product-type page lists the newest generation first')
assert(queries.getProductTypePage('toyota', 'tacoma', 'seat-covers') === undefined, 'no product-type page without a guide')
assert(queries.getProductTypePage('toyota', 'tacoma', '3rd-gen') === undefined, 'a generation slug is not a product-type page')
const fivePicks = createCatalogQueries({ ...fixture, picks: fixture.picks.map((s) => (s.generation === '4th-gen' ? { ...s, picks: s.picks.slice(0, 2) } : s)) }, makes)
assert(fivePicks.getProductTypePage('toyota', 'tacoma', 'bed-racks') === undefined, 'no product-type page under 6 products')
assert(JSON.stringify(queries.getProductTypeRoutes()) === JSON.stringify([{ make: 'toyota', model: 'tacoma', productType: 'bed-racks' }]), 'routes list only qualifying product-type pages')
const featuredPicks = queries.getFeaturedPicks('toyota', 'tacoma')
assert(featuredPicks?.generation.slug === '3rd-gen', 'hub features the generation with the most product types')
assert(featuredPicks?.items.map((i) => i.resolved.product.id).join() === 'a,g', 'hub shows the best-overall pick per product type')
const tiedQueries = createCatalogQueries({ ...fixture, picks: fixture.picks.filter((s) => s.category === 'bed-racks') }, makes)
assert(tiedQueries.getFeaturedPicks('toyota', 'tacoma')?.items[0].resolved.product.id === 'd', 'on a tie the hub features the newest generation')
const fixtureStats = queries.getCatalogStats()
assert(fixtureStats.totalProducts === 9 && fixtureStats.totalGenerations === 4, 'stats count researched products only')
assert(fixtureStats.totalCategories === 10, 'stats count researched product types plus the placeholder categories still shown')

const thirdGen = makes.find((m) => m.slug === 'toyota')!.models.find((m) => m.slug === 'tacoma')!.generations.find((g) => g.slug === '3rd-gen')!
const leftover = remainingPlaceholders(thirdGen.categories, new Set(['bed-covers', 'seat-covers']))
assert(!leftover.some((c) => c.slug === 'bed'), 'a placeholder category left empty is dropped')
assert(leftover.find((c) => c.slug === 'interior')?.products.map((p) => p.title).join() === 'All-weather floor mats,Premium center console organizer', 'placeholders for a researched product type are dropped, the rest stay')
assert(remainingPlaceholders(thirdGen.categories, new Set()).length === thirdGen.categories.length, 'nothing researched keeps every placeholder category')
assert(withoutResearched([{ productType: 'seat-covers' }, { productType: 'wheels' }, {}], new Set(['seat-covers'])).length === 2, 'popular picks drop researched product types')
const placeholderTypes = makes.flatMap((m) => m.models.flatMap((mo) => mo.generations.flatMap((g) => [...g.categories.flatMap((c) => c.products), ...g.popular].flatMap((p) => p.productType ?? []))))
assert(placeholderTypes.length > 0 && placeholderTypes.every((t) => productTypes.some((pt) => pt.slug === t)), 'placeholder product types are real product-type slugs')
assert(queries.getCatalogProductByAsin(fixture.products[9].asin)?.status === 'retired', 'retired products are found by ASIN')

const d = fixture.products[3]
assert(formatFitment(fitmentFor(d, 'toyota', 'tacoma', { yearStart: 2024, yearEnd: 2026 }), 'Tacoma') === 'Fits 2024-2026 Tacoma, Double Cab, 5-ft bed. Not for TRD Pro. Drilling required.', 'fitment line lists years, cab, bed, exclusions and notes')
assert(fitmentFor(d, 'toyota', 'tacoma', { yearStart: 2016, yearEnd: 2023 }).length === 0, 'fitment outside the years is ignored')
assert(fitmentCheckedLabel(fixture.products.slice(0, 3)) === 'September 2026', 'fitment checked uses the oldest check date')

console.log('\norderPicks')
const rolePicks: { pick: Pick }[] = [
    { pick: { productId: 'for-1', role: 'best-for', label: 'Best for one' } },
    { pick: { productId: 'budget', role: 'budget' } },
    { pick: { productId: 'for-2', role: 'best-for', label: 'Best for two' } },
    { pick: { productId: 'premium', role: 'premium' } },
    { pick: { productId: 'overall', role: 'best-overall' } },
]
assert(orderPicks(rolePicks).map((r) => r.pick.productId).join() === 'overall,budget,premium,for-1,for-2', 'best overall, budget, premium, then best-for picks in data order')
assert(rolePicks[0].pick.productId === 'for-1', 'orderPicks leaves its input alone')
assert(orderPicks([]).length === 0, 'no picks, no order')
assert(queries.getGenerationSections('toyota', 'tacoma', '4th-gen')[0].picks.map((r) => r.product.id).join() === 'd,e,f', 'generation sections list picks in role order')
assert(queries.getProductTypePage('toyota', 'tacoma', 'bed-racks')?.sections[0].picks.map((r) => r.product.id).join() === 'd,e,f', 'product-type pages list picks in role order')
assert(getGenerationSections('toyota', 'tacoma', '3rd-gen')[0].picks.map((r) => r.pick.role).join() === 'best-overall,budget,best-for,best-for,best-for', '3rd Gen seat covers: best overall, then budget, then best-for')
assert(sections3.find((s) => s.productType.slug === 'bed-racks')?.guide?.buyingNotes.length === 3, 'a section carries its product-type guide')
assert(sections3.find((s) => s.productType.slug === 'seat-covers')?.guide === undefined, 'a section without a guide has none')

console.log('\nplaceholderLinkLabel')
assert(placeholderLinkLabel('Budget mud flaps') === 'Mud flaps', 'drops a Budget prefix')
assert(placeholderLinkLabel('Premium grille insert') === 'Grille insert', 'drops a Premium prefix')
assert(placeholderLinkLabel('Fender flares') === 'Fender flares', 'leaves other titles alone')
assert(placeholderLinkLabel('Budget') === 'Budget', 'a bare word is not a prefix')
assert(thirdGen.faqs !== undefined && thirdGen.faqs.length === 3 && thirdGen.faqs.every((f) => f.q.endsWith('?') && f.a.length > 0), '3rd Gen has three fitment questions with answers')

console.log('\nfitsTruck')
const tacomaYears = { yearStart: 2016, yearEnd: 2023 }
const anyCab = fixtureProduct('any-cab', { fitment: [{ make: 'toyota', model: 'tacoma', yearStart: 2016, yearEnd: 2023, notes: 'Front seats.' }] })
const doubleOnly = fixtureProduct('double-only', { fitment: [{ make: 'toyota', model: 'tacoma', yearStart: 2016, yearEnd: 2023, cab: ['Double Cab'], notes: 'Front and rear.' }] })
const sixFoot = fixtureProduct('six-foot', { fitment: [{ make: 'toyota', model: 'tacoma', yearStart: 2016, yearEnd: 2023, bed: ['6-ft'] }] })
const twoEntries = fixtureProduct('two-entries', { fitment: [
    { make: 'toyota', model: 'tacoma', yearStart: 2016, yearEnd: 2023, cab: ['Double Cab'], bed: ['5-ft'] },
    { make: 'toyota', model: 'tacoma', yearStart: 2016, yearEnd: 2023, cab: ['Access Cab'], bed: ['6-ft'], excludeTrims: ['TRD Pro'] },
    { make: 'toyota', model: 'tacoma', yearStart: 2005, yearEnd: 2015, cab: ['Regular Cab'] },
] })
const fit = (p: CatalogProduct, truck: { cab?: string; bed?: string }) => fitsTruck(p, 'toyota', 'tacoma', tacomaYears, truck)
assert([anyCab, doubleOnly, sixFoot, twoEntries].every((p) => fit(p, {}).fits), 'no truck chosen: everything fits')
assert(fit(doubleOnly, { cab: 'Double Cab' }).fits && JSON.stringify(fit(doubleOnly, { cab: 'Access Cab' })) === JSON.stringify({ fits: false, reason: 'Double Cab only' }), 'cab only: a Double Cab product fits a Double Cab, not an Access Cab')
assert(fit(sixFoot, { bed: '6-ft' }).fits && JSON.stringify(fit(sixFoot, { bed: '5-ft' })) === JSON.stringify({ fits: false, reason: '6-ft bed only' }), 'bed only: a 6-ft product does not fit a 5-ft bed')
assert(fit(doubleOnly, { cab: 'Double Cab', bed: '6-ft' }).fits && !fit(sixFoot, { cab: 'Access Cab', bed: '5-ft' }).fits, 'cab and bed: each limit has to match')
assert(fit(twoEntries, { cab: 'Access Cab', bed: '6-ft' }).fits && fit(twoEntries, { cab: 'Double Cab', bed: '5-ft' }).fits, 'two fitment entries: either one is enough')
assert(JSON.stringify(fit(twoEntries, { cab: 'Access Cab', bed: '5-ft' })) === JSON.stringify({ fits: false, reason: '6-ft bed only' }), 'two entries: the reason names the bed that goes with the cab')
assert(JSON.stringify(fit(twoEntries, { cab: 'Regular Cab' })) === JSON.stringify({ fits: false, reason: 'Double Cab or Access Cab only' }), 'entries outside the years are ignored')
assert(fit(anyCab, { cab: 'Access Cab', bed: '5-ft' }).fits, 'a product with no cab or bed limits fits every truck')
assert(truckFitLine(fitmentFor(anyCab, 'toyota', 'tacoma', tacomaYears), { cab: 'Access Cab' }) === 'Fits your Access Cab. Front seats.', 'fit line names the cab, then the notes')
assert(truckFitLine(fitmentFor(twoEntries, 'toyota', 'tacoma', tacomaYears), { cab: 'Access Cab', bed: '6-ft' }) === 'Fits your Access Cab, 6-ft bed. Not for TRD Pro.', 'fit line uses only the entries that fit')
assert(truckFitLine(fitmentFor(doubleOnly, 'toyota', 'tacoma', tacomaYears), {}) === null && truckFitLine(fitmentFor(doubleOnly, 'toyota', 'tacoma', tacomaYears), { cab: 'Access Cab' }) === null, 'no fit line without a truck or when it does not fit')
assert(describeTruck({ cab: 'Double Cab', bed: '6-ft' }) === 'Double Cab with a 6-ft bed' && withArticle('Access Cab') === 'an Access Cab' && withArticle(describeTruck({ bed: '5-ft' })) === 'a 5-ft bed', 'truck descriptions read naturally')
const realSeatCovers = getGenerationSections('toyota', 'tacoma', '3rd-gen')[0].picks.map((r) => r.product)
assert(realSeatCovers.filter((p) => fitsTruck(p, 'toyota', 'tacoma', tacomaYears, { cab: 'Access Cab' }).fits).length === 1, '3rd Gen: one seat cover fits an Access Cab')
assert(realSeatCovers.filter((p) => fitsTruck(p, 'toyota', 'tacoma', tacomaYears, { cab: 'Double Cab' }).fits).length === 5, '3rd Gen: all five fit a Double Cab')

console.log('\nnormalizeTruck')
const tacomaConfigs = { cabs: ['Access Cab', 'Double Cab'], beds: ['5-ft', '6-ft'] }
const norm = (cab: string | null, bed: string | null) => JSON.stringify(normalizeTruck(tacomaConfigs, cab, bed))
assert(norm('Double Cab', '5-ft') === JSON.stringify({ cab: 'Double Cab', bed: '5-ft' }), 'exact values pass through')
assert(norm('double-cab', null) === JSON.stringify({ cab: 'Double Cab' }) && norm('ACCESS', null) === JSON.stringify({ cab: 'Access Cab' }), 'cab: case, punctuation and a missing "Cab"')
assert(norm(null, '60.5" (Short)') === JSON.stringify({ bed: '5-ft' }) && norm(null, '73.7 in') === JSON.stringify({ bed: '6-ft' }), 'bed: inches round to feet')
assert(norm(null, '6 ft') === JSON.stringify({ bed: '6-ft' }) && norm(null, "5'") === JSON.stringify({ bed: '5-ft' }), 'bed: feet in other spellings')
assert(norm(null, 'Short bed') === JSON.stringify({ bed: '5-ft' }) && norm(null, 'Long') === JSON.stringify({ bed: '6-ft' }), 'bed: short and long with two lengths')
assert(norm('SuperCrew', '8 ft') === '{}' && norm('Crew Cab', '') === '{}' && norm(null, null) === '{}', 'anything that does not match is dropped')

console.log('\ntruck handoff')
assert(JSON.stringify(configsForPath('/vehicles/toyota/tacoma/3rd-gen')) === JSON.stringify(tacomaConfigs), '3rd Gen has Access and Double Cab, 5-ft and 6-ft beds')
assert(configsForPath('/vehicles/toyota/tacoma/4th-gen') === undefined, 'generations without configs have none')
assert(catalogHrefWithTruck('/vehicles/toyota/tacoma/3rd-gen', 'Double Cab', '60.5" (Short)') === '/vehicles/toyota/tacoma/3rd-gen?cab=Double+Cab&bed=5-ft', 'photo link carries the normalized cab and bed')
assert(catalogHrefWithTruck('/vehicles/toyota/tacoma/3rd-gen', 'SuperCrew', null) === '/vehicles/toyota/tacoma/3rd-gen', 'no params when nothing matches')
assert(catalogHrefWithTruck('/vehicles/toyota/tacoma/4th-gen', 'Double Cab', '5-ft') === '/vehicles/toyota/tacoma/4th-gen', 'no params for a generation without configs')
assert(JSON.stringify(truckFromParams(new URLSearchParams('cab=Double+Cab&bed=9-ft'), tacomaConfigs)) === JSON.stringify({ cab: 'Double Cab' }), 'page keeps only handoff values in the configs')
assert(truckFromParams(new URLSearchParams('utm_source=x'), tacomaConfigs) === null, 'no handoff without cab or bed')
assert(hasError(errorsAfter((c) => { c.picks[0].picks.forEach((p) => { const prod = c.products.find((x) => x.id === p.productId)!; prod.fitment[0].cab = ['Doubel Cab'] }) }), 'is not one of 3rd Gen\'s cabs'), 'rejects a cab the generation filter does not offer')
assert(hasError(errorsAfter((c) => { const prod = c.products.find((x) => x.id === 'g')!; prod.fitment[0].bed = ['5 ft'] }), 'is not one of 3rd Gen\'s beds'), 'rejects a bed the generation filter does not offer')

console.log('\nmodel hub years and specs')
const tacomaGens = makes.find((m) => m.slug === 'toyota')!.models.find((m) => m.slug === 'tacoma')!.generations
const years = modelYears(tacomaGens)
assert(years[0] === 2026 && years[years.length - 1] === 1995 && years.length === 32, 'model years run newest first, 2026 to 1995')
assert(generationForYear(tacomaGens, 2019)?.slug === '3rd-gen' && generationForYear(tacomaGens, 2016)?.slug === '3rd-gen' && generationForYear(tacomaGens, 2015)?.slug === '2nd-gen', 'a year finds its generation, boundaries included')
assert(generationForYear(tacomaGens, 1990) === undefined, 'a year outside every generation finds none')
assert(completeSpecRows(tacomaGens).length === 0, 'no comparison row shows until every Tacoma generation has it')
const fullSpecs = tacomaGens.map((g) => ({ ...g, specs: { cabs: 'A', beds: 'B', engines: g.slug === '1st-gen' ? ' ' : 'C' } }))
assert(completeSpecRows(fullSpecs).map((r) => r.key).join() === 'cabs,beds', 'rows with a value for every generation show, in table order; blanks count as missing')

console.log('\namazon_items cache')
const fetchedAt = new Date('2026-10-30T18:00:00Z')
const liveItem: AmazonItem = {
    asin: 'B01MCRLWD5', title: 'Carhartt SeatSaver', brand: 'Covercraft', partNumber: 'SSC2509CAGY',
    detailPageUrl: 'https://www.amazon.com/dp/B01MCRLWD5?tag=x', imageUrl: 'https://m.media-amazon.com/images/I/x.jpg',
    price: { amount: 272.97, currency: 'USD', display: '$272.97' }, availability: 'IN_STOCK', availabilityMessage: 'In Stock',
    merchant: 'Amazon.com', rating: null, ratingsCount: null,
}
const liveRow = toAmazonItemRow('B01MCRLWD5', liveItem, fetchedAt)
assert(liveRow.status === 'ok' && liveRow.price_display === '$272.97' && liveRow.price_amount === 272.97 && liveRow.fetched_at === '2026-10-30T18:00:00.000Z', 'a priced, in-stock item is ok')
assert(toAmazonItemRow('B0X', { ...liveItem, price: null }, fetchedAt).status === 'unavailable', 'no price is unavailable')
assert(toAmazonItemRow('B0X', { ...liveItem, availability: 'OUT_OF_STOCK' }, fetchedAt).status === 'unavailable', 'out of stock is unavailable even with a price')
const missing = toAmazonItemRow('B0MISSING1', undefined, fetchedAt)
assert(missing.status === 'not_found' && missing.price_display === undefined, 'nothing returned is not_found, with no data')
assert(formatAsOf('2026-10-30T18:00:00Z') === 'Oct 30, 2:00 PM ET', 'as-of time is shown in Eastern time')
const asRow = (r: ReturnType<typeof toAmazonItemRow>) => ({ title: null, brand: null, image_url: null, price_amount: null, price_display: null, currency: null, availability: null, availability_message: null, merchant: null, detail_page_url: null, ...r, fetched_at: r.fetched_at ?? '' })
const card = amazonCardData(asRow(liveRow), new Date('2026-10-31T10:00:00Z'))
assert(card?.kind === 'live' && card.priceDisplay === '$272.97' && card.inStock && card.asOf === 'Oct 30, 2:00 PM ET', 'fresh ok row shows price, stock and time')
assert(amazonCardData(asRow(liveRow), new Date('2026-10-31T17:00:01Z')) === null, 'a row older than 23 hours shows nothing (pages are served up to an hour after they render)')
assert(amazonCardData(asRow(liveRow), new Date('2026-10-31T16:59:00Z'))?.kind === 'live', 'a row just under 23 hours old still shows')
assert(amazonCardData(undefined) === null, 'no row shows nothing')
assert(amazonCardData(asRow(missing), new Date('2026-10-30T19:00:00Z'))?.kind === 'unavailable', 'a fresh not_found row shows as unavailable')

console.log('\nbuildPartSearch')
const injector = { partName: 'Fuel Injector', estimatedVehicle: 'Audi / Volkswagen (FSI/TFSI engines)', amazonSearchTerm: 'Audi VW 2.0 TFSI fuel injector' }
assert(buildPartSearch(injector) === 'Audi VW 2.0 TFSI fuel injector', 'vehicle known: uses amazonSearchTerm')
assert(buildPartSearch({ ...injector, estimatedVehicle: null, amazonSearchTerm: '2019 Ford F-150 fuel injector' }) === 'Fuel Injector', 'vehicle null: part name alone, model term ignored')
assert(buildPartSearch({ ...injector, estimatedVehicle: '  ' }) === 'Fuel Injector', 'blank vehicle counts as null')
assert(buildPartSearch({ ...injector, amazonSearchTerm: '' }) === 'Fuel Injector', 'empty search term falls back to part name')
assert(buildPartSearch({ ...injector, amazonSearchTerm: 'Audi / Volkswagen (FSI/TFSI) "injector" [OEM] driver\'s \\ side' }) === 'Audi Volkswagen FSI TFSI injector OEM drivers side', 'messy characters removed, words kept apart')
assert(buildPartSearch({ ...injector, estimatedVehicle: null, partName: '  Brake   Caliper\n' }) === 'Brake Caliper', 'whitespace collapsed and trimmed')
const longQuery = buildPartSearch({ ...injector, amazonSearchTerm: 'word '.repeat(40) })
assert(longQuery.length <= 100 && !longQuery.endsWith(' '), 'long input capped at 100 characters with no trailing space')
assert(sanitizePartQuery('x'.repeat(150)).length === 100, 'sanitizePartQuery caps at 100')

console.log('\ntyped part number search')
assert(sanitizeTypedPartNumber('06H 906-036.P<script>') === '06H 906-036.Pscript', 'keeps letters, digits, spaces, - and .')
assert(sanitizeTypedPartNumber('A'.repeat(60)).length === 40, 'caps at 40 characters')
assert(buildTypedPartSearch(' 06H906036P ', 'Fuel Injector') === '06H906036P Fuel Injector', 'number then part name')
assert(buildPartGoUrl('Engine / Fuel', 'Audi VW injector', 'part-vehicle') === '/go?cat=engine-fuel&product=Audi%20VW%20injector&source=part-vehicle', 'go link puts the whole query in product')

console.log('\ngetPartDisplayBand')
assert(getPartDisplayBand(98) === 'strong' && getPartDisplayBand(80) === 'strong', '80 and up is strong')
assert(getPartDisplayBand(79) === 'medium' && getPartDisplayBand(30) === 'medium', '30 to 79 is medium')
assert(getPartDisplayBand(29) === 'low' && getPartDisplayBand(0) === 'low', 'under 30 is low')

console.log('\nPartIdentificationSchema')
const corePart = { partName: 'Fuel Injector', category: 'Engine', function: 'Sprays fuel.', estimatedVehicle: 'Audi / VW', confidence: 92, amazonSearchTerm: 'Audi VW fuel injector', reasoning: 'Blue O-ring.' }
const fullPart = PartIdentificationSchema.safeParse({
    ...corePart,
    partNumber: ' 06H906036P ',
    searchVehicle: 'Audi VW 2.0 TFSI',
    alternatives: [{ partName: 'Fuel Pressure Sensor', confidence: 6 }],
    relatedParts: ['Injector seal kit', 'Injector removal tool'],
    buyingCheck: 'Match the number stamped on the old injector.',
})
assert(fullPart.success, 'all new fields: parses')
assert(fullPart.success && fullPart.data.partNumber === '06H906036P', 'all new fields: part number trimmed')
assert(fullPart.success && fullPart.data.searchVehicle === 'Audi VW 2.0 TFSI', 'all new fields: searchVehicle kept')
assert(fullPart.success && fullPart.data.alternatives.length === 1 && fullPart.data.alternatives[0].confidence === 6, 'all new fields: alternatives kept')
assert(fullPart.success && fullPart.data.relatedParts.length === 2, 'all new fields: relatedParts kept')
assert(fullPart.success && fullPart.data.buyingCheck === 'Match the number stamped on the old injector.', 'all new fields: buyingCheck kept')

const oldPart = PartIdentificationSchema.safeParse(corePart)
assert(oldPart.success, 'old shape (no new fields): parses')
assert(oldPart.success && oldPart.data.partNumber === null && oldPart.data.searchVehicle === null && oldPart.data.buyingCheck === null, 'old shape: missing text fields are null')
assert(oldPart.success && oldPart.data.alternatives.length === 0 && oldPart.data.relatedParts.length === 0, 'old shape: missing lists are empty')

const wrongTypes = PartIdentificationSchema.safeParse({
    ...corePart,
    partNumber: 6123,
    searchVehicle: { make: 'Audi' },
    alternatives: 'Fuel Pressure Sensor',
    relatedParts: { a: 1 },
    buyingCheck: ['check it'],
})
assert(wrongTypes.success, 'wrong types on every new field: still parses')
assert(wrongTypes.success && wrongTypes.data.partNumber === null && wrongTypes.data.searchVehicle === null && wrongTypes.data.buyingCheck === null, 'wrong types: text fields dropped')
assert(wrongTypes.success && wrongTypes.data.alternatives.length === 0 && wrongTypes.data.relatedParts.length === 0, 'wrong types: lists dropped')
assert(wrongTypes.success && wrongTypes.data.partName === 'Fuel Injector' && wrongTypes.data.confidence === 92 && wrongTypes.data.amazonSearchTerm === 'Audi VW fuel injector', 'wrong types: core fields intact')

const tooMany = PartIdentificationSchema.safeParse({
    ...corePart,
    partNumber: '   ',
    searchVehicle: 'x'.repeat(200),
    alternatives: [
        { partName: 'A', confidence: 140 }, { partName: '', confidence: 10 }, { name: 'B', confidence: 5 },
        { partName: 'C', confidence: -3 }, { partName: 'D', confidence: 2 }, { partName: 'E', confidence: 1 },
    ],
    relatedParts: ['Seal', 42, ' ', 'Gasket', 'Bolts', 'Tool', 'Cleaner'],
})
assert(tooMany.success, 'malformed values and 6-item arrays: still parses')
assert(tooMany.success && tooMany.data.partNumber === null, 'blank part number becomes null')
assert(tooMany.success && tooMany.data.searchVehicle === null, 'over-long searchVehicle dropped')
assert(tooMany.success && tooMany.data.alternatives.map(a => a.partName).join() === 'A,C', 'bad alternatives skipped, clamped to 2')
assert(tooMany.success && tooMany.data.alternatives[0].confidence === 100 && tooMany.data.alternatives[1].confidence === 0, 'alternative confidence clamped to 0-100')
assert(tooMany.success && tooMany.data.relatedParts.join() === 'Seal,Gasket,Bolts', 'non-strings and blanks skipped, clamped to 3')
assert(!PartIdentificationSchema.safeParse({ ...corePart, partName: undefined }).success, 'a missing core field still fails')

console.log('\nPhase B part searches')
assert(buildPartSearch({ ...injector, searchVehicle: 'Audi VW 2.0 TFSI' }) === 'Audi VW 2.0 TFSI Fuel Injector', 'searchVehicle + part name comes first')
assert(buildPartSearch({ ...injector, searchVehicle: null }) === 'Audi VW 2.0 TFSI fuel injector', 'no searchVehicle: Phase A rules')
assert(buildPartSearch({ ...injector, estimatedVehicle: null, searchVehicle: 'Ford F-150' }) === 'Ford F-150 Fuel Injector', 'searchVehicle used even when estimatedVehicle is null')
assert(partSearchVehicle({ estimatedVehicle: 'Audi / VW', searchVehicle: null }) === 'Audi / VW', 'search vehicle falls back to estimatedVehicle')
assert(partSearchVehicle({ estimatedVehicle: null }) === null, 'no vehicle at all is null')
assert(buildExactPartSearch('06H906036P', 'Fuel Injector') === '06H906036P Fuel Injector', 'exact part: number then part name')
assert(buildVehicleItemSearch({ estimatedVehicle: null, searchVehicle: 'Audi VW 2.0 TFSI' }, 'Injector seal kit') === 'Audi VW 2.0 TFSI Injector seal kit', 'related item: vehicle then item')
assert(buildVehicleItemSearch({ estimatedVehicle: null }, 'Injector seal kit') === 'Injector seal kit', 'related item without a vehicle: item alone')

console.log('\npart vehicle choice')
assert(detectedVehicleLabel({ estimatedVehicle: 'Audi / Volkswagen (FSI/TFSI engines)', searchVehicle: 'Audi VW 2.0 TFSI' }) === 'Audi VW 2.0 TFSI', 'detected chip prefers searchVehicle')
assert(detectedVehicleLabel({ estimatedVehicle: 'Audi / Volkswagen (FSI/TFSI engines)', searchVehicle: null }) === 'Audi / Volkswagen', 'detected chip drops parenthetical notes')
assert(detectedVehicleLabel({ estimatedVehicle: null }) === null, 'no detected vehicle is null')
assert(parsePartVehicleChoice('{"method":"ymm","label":" 2019 Toyota Tacoma "}')?.label === '2019 Toyota Tacoma', 'stored choice parses and trims')
assert(parsePartVehicleChoice('{"method":"other","label":"x"}') === null, 'unknown method rejected')
assert(parsePartVehicleChoice('not json') === null && parsePartVehicleChoice(null) === null, 'bad or missing storage is null')
const ymmChoice = { method: 'ymm' as const, label: '2019 Toyota Tacoma' }
assert(initialPartVehicle(ymmChoice, 'Audi VW')?.label === '2019 Toyota Tacoma', 'a picked vehicle carries over to the next part')
assert(initialPartVehicle({ method: 'garage', label: '2020 Ford F-150' }, null)?.method === 'garage', 'a garage vehicle carries over even with nothing detected')
assert(initialPartVehicle({ method: 'detected', label: 'Audi VW' }, 'Honda Civic')?.label === 'Honda Civic', 'an earlier detected vehicle does not carry over')
assert(initialPartVehicle(null, null) === null, 'nothing stored or detected starts empty')
const tacomaPart = partForVehicle({ ...corePart, searchVehicle: 'Audi VW 2.0 TFSI' }, ymmChoice)
assert(buildPartSearch(tacomaPart) === '2019 Toyota Tacoma Fuel Injector', 'chosen vehicle replaces the vehicle in the main search')
assert(buildVehicleItemSearch(tacomaPart, 'Injector seal kit') === '2019 Toyota Tacoma Injector seal kit', 'chosen vehicle replaces the vehicle in related searches')
assert(buildPartSearch(partForVehicle(corePart, { method: 'detected', label: 'Audi / VW' })) === 'Audi VW fuel injector', 'detected choice keeps the part\'s own search')
assert(formatVehicleLabel(2019, 'Toyota', 'Tacoma') === '2019 Toyota Tacoma' && formatVehicleLabel(null, 'Toyota', 'Tacoma') === 'Toyota Tacoma', 'vehicle label skips a missing year')

console.log('\nus vehicle lists')
assert(getUsModels('Acura').some(m => m.name === 'MDX') && getUsModels('').length === 0 && getUsModels('Nope').length === 0, 'models for a make')
const ilxYears = getUsModelYears('Acura', 'ILX')
assert(ilxYears[0] === 2022 && ilxYears[ilxYears.length - 1] === 2013, 'years newest first')
assert(getUsModelYears('Acura', '').length === 0 && getUsModelYears('', 'ILX').length === 0, 'years need make and model')

console.log('\nvehicle result helpers')
assert(resolveCatalogGeneration('Toyota', 'Tacoma', 2016, 2023)?.href === '/vehicles/toyota/tacoma/3rd-gen', 'range inside one generation resolves')
assert(resolveCatalogGeneration('toyota', ' tacoma ', 2019, 2019)?.label === '3rd Gen', 'single year resolves, case-insensitive')
assert(resolveCatalogGeneration('Toyota', 'Tacoma', 2015, 2017) === null, 'range across a generation boundary is null')
assert(resolveCatalogGeneration('Ford', 'F-150', 2015, 2017) === null, 'vehicle without a catalog is null')
assert(resolveCatalogGeneration('Toyota', 'Tacoma', 2020, 2018) === null, 'backwards range is null')
assert(resolveVehicleUrl('Toyota', 'Tacoma', 2019) === '/vehicles/toyota/tacoma/3rd-gen', 'resolveVehicleUrl unchanged')
assert(parseYearRange('2016-2023')?.length === 8 && parseYearRange('2021 – 2024')?.[0] === 2021, 'year ranges parse, en dash too')
assert(parseYearRange('2019') === null && parseYearRange('2024-2021') === null && parseYearRange(null) === null, 'single, backwards or missing year is not a range')
assert(formatVehicleType('Pickup Truck') === 'Pickup truck' && formatVehicleType('SUV') === 'SUV' && formatVehicleType('  ') === null, 'vehicle type label')
assert(vehicleNoun('Pickup Truck') === 'truck' && vehicleNoun('SUV') === 'vehicle' && vehicleNoun(null) === 'vehicle', 'truck or vehicle in the copy')
assert(vehicleTitle({ year: '2019', make: 'Toyota', model: 'Tacoma', trim: null }) === '2019 Toyota Tacoma', 'title skips a missing trim')
assert(vehicleSpecLine({ cabStyle: 'SuperCrew', bedLength: '67.0" (Short)' }, '6.2L V8') === 'SuperCrew · 67.0" (Short) bed · 6.2L V8', 'spec line: cab, bed, engine')
assert(vehicleSpecLine({ cabStyle: null, bedLength: null }, null) === null, 'no spec parts is null')
assert(parseRecommendation('Tonneau Cover (e.g. BAKFlip MX4)').name === 'Tonneau Cover' && parseRecommendation('Tonneau Cover (e.g. BAKFlip MX4)').description === 'e.g. BAKFlip MX4', 'recommendation name and e.g. line')
assert(parseRecommendation('Floor Liners').description === null, 'recommendation without e.g. line')

console.log('\nisAnalysisInProgress')
assert(isAnalysisInProgress('identifying'), 'identifying is in progress')
assert(isAnalysisInProgress('verifying'), 'verifying is in progress')
assert(isAnalysisInProgress('detecting_products'), 'detecting_products is in progress')
assert(!isAnalysisInProgress('complete'), 'complete is not in progress')
assert(!isAnalysisInProgress('error'), 'error is not in progress')
assert(!isAnalysisInProgress('') && !isAnalysisInProgress(null) && !isAnalysisInProgress(undefined), 'blank or missing status is not in progress')

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)

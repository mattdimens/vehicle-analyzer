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
import { merchants } from '../lib/affiliate/merchants'

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

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)

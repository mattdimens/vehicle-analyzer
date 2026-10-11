/**
 * Unit checks for helpers added in the October 2026 audit fixes.
 *
 * Run: npm test
 */
import { normalizeYear } from '../lib/normalize-year'
import { sanitizePromptText } from '../lib/gemini'
import { AnalysisResultsSchema } from '../lib/schemas'
import { apiErrorMessage, RATE_LIMIT_MESSAGE, thrownErrorMessage } from '../lib/api-errors'

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

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)

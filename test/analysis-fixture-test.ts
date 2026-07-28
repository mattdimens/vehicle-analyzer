/**
 * Fixture rendering smoke test for the analysis results view.
 *
 * Run: npx tsx test/analysis-fixture-test.ts
 *
 * This is NOT a full React test (no DOM). It validates:
 *   1. The fixture conforms to the AnalysisRecord type
 *   2. All field paths read by the results components exist
 *   3. The minimal fixture (optional fields removed) also conforms
 *   4. Band labels resolve correctly from the authoritative confidence
 *   5. No "%" numeral pattern in band label outputs
 */

import { bbcgw19uFixture, bbcgw19uMinimalFixture } from './fixtures/bbcgw19u'
import type { AnalysisRecord, AnalysisResultData, AnalysisDetectedProduct } from '../types/analysis'
import { getConfidenceBand, getConfidenceBandColor, getConfidenceBarColor } from '../types/analysis'

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

function testRecord(record: AnalysisRecord, label: string) {
    console.log(`\n── ${label} ──`)

    // Top-level fields
    assert(typeof record.id === 'string', 'id is string')
    assert(typeof record.image_url === 'string', 'image_url is string')
    assert(record.status === 'complete', 'status is complete')

    // result_data.primary (authoritative confidence)
    const primary = record.result_data?.primary
    assert(!!primary, 'result_data.primary exists')
    if (primary) {
        assert(typeof primary.make === 'string', 'primary.make is string')
        assert(typeof primary.model === 'string', 'primary.model is string')
        assert(typeof primary.year === 'string', 'primary.year is string')
        assert(typeof primary.confidence === 'number', 'primary.confidence is number')

        // Band label
        const band = getConfidenceBand(primary.confidence)
        assert(['High', 'Medium', 'Low'].includes(band), `band label is valid: ${band}`)
        assert(!/\d+%/.test(band), 'band label contains no percentage')

        const bandColor = getConfidenceBandColor(band)
        assert(typeof bandColor === 'string' && bandColor.length > 0, 'band color resolves')

        const barColor = getConfidenceBarColor(band)
        assert(typeof barColor === 'string' && barColor.length > 0, 'bar color resolves')

        // Optional fields: trim, cabStyle, bedLength should not crash
        // Access them; they are either string, null, or undefined
        const _trim = primary.trim
        const _cabStyle = primary.cabStyle
        const _bedLength = primary.bedLength
        assert(true, 'optional primary fields accessed without error')
    }

    // engineDetails
    const engineDetails = record.result_data?.engineDetails
    assert(engineDetails === undefined || engineDetails === null || typeof engineDetails === 'string', 'engineDetails is string|null|undefined')

    // detected_products
    const dp = record.detected_products
    if (dp && dp.length > 0) {
        assert(Array.isArray(dp), 'detected_products is array')
        const first = dp[0]
        assert(typeof first.type === 'string', 'detected_products[0].type is string')
        assert(typeof first.brand === 'string', 'detected_products[0].brand is string')
        assert(typeof first.model === 'string', 'detected_products[0].model is string')
        assert(typeof first.confidence === 'number', 'detected_products[0].confidence is number')

        // Band label for product
        const pBand = getConfidenceBand(first.confidence)
        assert(!/\d+%/.test(pBand), 'product band label contains no percentage')
    }

    // otherPossibilities shape: .vehicle not .name
    const others = record.result_data?.otherPossibilities
    if (others && others.length > 0) {
        assert(typeof others[0].vehicle === 'string', 'otherPossibilities[0].vehicle is string (not .name)')
        assert((others[0] as any).name === undefined, 'otherPossibilities[0] has no .name field')
    }

    // recommendedAccessories
    const recs = record.result_data?.recommendedAccessories
    if (recs && recs.length > 0) {
        assert(Array.isArray(recs), 'recommendedAccessories is array')
        assert(typeof recs[0] === 'string', 'recommendedAccessories[0] is string')
    }
}

console.log('Analysis Fixture Rendering Test\n================================')

testRecord(bbcgw19uFixture, 'Full fixture (bbcgw19u)')
testRecord(bbcgw19uMinimalFixture, 'Minimal fixture (optional fields removed)')

console.log(`\n================================`)
console.log(`${passed} passed, ${failed} failed`)

if (failed > 0) {
    process.exit(1)
}

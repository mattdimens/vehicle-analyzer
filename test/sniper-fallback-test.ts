/**
 * Timeouts and the sniper fallback (recognition pipeline brief, Task 1), with
 * the Gemini client, Supabase and fetch all faked: no network, no cost.
 *
 * Run: npm test
 */
// Set before anything reads it, so getAI() never sees a real key
process.env.GEMINI_API_KEY = 'test-placeholder-no-network'

import { GoogleGenAI } from '@google/genai'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'
import { getAI, SCOUT_MODEL, SNIPER_MODEL } from '../lib/gemini'
import {
    runFitmentAnalysis,
    refineProduct,
    runPartIdentification,
    SCOUT_TIMEOUT_MS,
    SNIPER_TIMEOUT_MS,
    FALLBACK_CONFIDENCE_CAP,
    type ImagePart,
    type SniperFailure,
} from '../lib/analysis-stages'
import { runPipeline, runPartPipeline } from '../lib/pipeline'
import { classifyAnalysisError } from '../lib/analysis-errors'
import { AnalysisResultsSchema } from '../lib/schemas'
import { getConfidenceBand, STALE_AFTER_MS } from '../types/analysis'

let passed = 0
let failed = 0
function assert(condition: boolean, label: string) {
    if (condition) { passed++; console.log(`  ✓ ${label}`) } else { failed++; console.error(`  ✗ ${label}`) }
}

// --- Fixtures -------------------------------------------------------------
const vehicle = (primaryConfidence: number, confidenceScore: number, model = 'Tacoma') => ({
    vehicle_present: true,
    primary: {
        make: 'Toyota', model, year: '2016-2023', trim: 'SR5', cabStyle: null, bedLength: null,
        vehicleType: 'Pickup Truck', color: 'Gray', condition: 'used', confidence: primaryConfidence,
    },
    engineDetails: null,
    otherPossibilities: [],
    recommendedAccessories: ['Floor Mats (e.g. A, B)'],
    confidence_score: confidenceScore,
    seo_optimized_alt_text: 'Gray pickup truck',
})
const product = (confidence: number, brand: string) => ({ type: 'Wheels', brand, model: 'Six Spoke', confidence, reasoning: 'Spoke pattern.' })
const part = (confidence: number, partName: string) => ({
    partName, category: 'Engine', function: 'Meters air into the engine.', estimatedVehicle: null,
    confidence, amazonSearchTerm: partName, reasoning: 'Shape and connector.',
})

/** What the SDK throws when httpOptions.timeout fires (checked against the real SDK below). */
const sdkTimeout = () => Object.assign(new Error('This operation was aborted'), { name: 'AbortError' })
const billingError = () => Object.assign(
    new Error('{"error":{"code":402,"message":"Your prepayment credits are depleted."}}'),
    { name: 'ApiError', status: 402 }
)

// --- Fakes ----------------------------------------------------------------
type GeminiRequest = {
    model: string
    contents: { parts: { text?: string }[] }[]
    config?: { httpOptions?: { timeout?: number } }
}
type Call = { model: string; timeout: number | undefined }

/** Replaces generateContent. The handler returns the answer object, or throws. */
function stubGemini(handler: (req: GeminiRequest, prompt: string) => unknown): Call[] {
    const calls: Call[] = []
    const models = getAI().models as unknown as { generateContent: (req: GeminiRequest) => Promise<{ text: string }> }
    models.generateContent = async (req) => {
        calls.push({ model: req.model, timeout: req.config?.httpOptions?.timeout })
        const answer = handler(req, req.contents[0].parts[0].text ?? '')
        return { text: typeof answer === 'string' ? answer : JSON.stringify(answer) }
    }
    return calls
}

type Update = { updated_at?: string; status?: string; result_data?: unknown; confidence?: number; detected_products?: unknown }

/** Records analyses updates; the alert queries get `errorRows` and `completeRows`. */
function fakeSupabase(rows: { errorRows?: unknown[]; completeRows?: unknown[] } = {}) {
    const updates: Update[] = []
    const from = () => {
        let status = ''
        const chain = {
            update: (payload: Update) => { updates.push(payload); return chain },
            insert: async () => ({ error: null }),
            select: () => chain,
            eq: (column: string, value: string) => { if (column === 'status') status = value; return chain },
            gte: () => chain,
            order: () => chain,
            limit: async () => ({ data: (status === 'error' ? rows.errorRows : rows.completeRows) ?? [], error: null }),
            // `await supabase.from(..).update(..).eq(..)`
            then: (resolve: (value: { error: null }) => void) => resolve({ error: null }),
        }
        return chain
    }
    return { client: { from } as unknown as SupabaseClient<Database>, updates }
}

const imageParts: ImagePart[] = [{ inlineData: { data: '', mimeType: 'image/jpeg' } }]
const realFetch = globalThis.fetch
const emails: { subject: string }[] = []
/** Serves the photo and swallows Resend calls, recording their subjects. */
function stubFetch() {
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
        if (String(url).includes('api.resend.com')) {
            emails.push(JSON.parse(String(init?.body)))
            return new Response('{"id":"x"}', { status: 200 })
        }
        return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'content-type': 'image/jpeg' } })
    }) as typeof fetch
}

const log = { log: console.log, warn: console.warn, error: console.error }
const warnings: string[] = []
const quiet = () => {
    console.log = () => {}
    console.error = () => {}
    console.warn = (...args: unknown[]) => { warnings.push(args.map(String).join(' ')) }
}
const loud = () => Object.assign(console, log)

async function run() {
    // ----------------------------------------------------------------------
    console.log('\nThe real SDK timeout')
    {
        // A fetch that never answers; only the SDK's own abort can end the call.
        const hang = ((_url: unknown, init?: { signal?: AbortSignal }) => new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(Object.assign(new Error('This operation was aborted'), { name: 'AbortError' })))
        })) as unknown as typeof fetch
        // The SDK's timer is unref'd, so hold the process open while we wait
        const hold = setInterval(() => {}, 1000)
        const started = Date.now()
        let thrown: unknown = null
        try {
            await new GoogleGenAI({ apiKey: 'test-placeholder-no-network' }).models.generateContent({
                model: 'any', contents: 'hi', config: { httpOptions: { timeout: 100, fetch: hang } },
            })
        } catch (err) {
            thrown = err
        }
        clearInterval(hold)
        const elapsed = Date.now() - started
        assert(thrown instanceof Error && thrown.name === 'AbortError', 'httpOptions.timeout aborts a call that never answers')
        assert(elapsed >= 90 && elapsed < 5000, 'it aborts at the timeout, without retrying')
    }

    // ----------------------------------------------------------------------
    console.log('\nSniper timeout keeps the scout result')
    {
        const failures: SniperFailure[] = []
        const calls = stubGemini(req => { if (req.model === SNIPER_MODEL) throw sdkTimeout(); return vehicle(92, 80) })
        quiet()
        const res = await runFitmentAnalysis(imageParts, undefined, { ref: 'abc123', onSniperFailure: f => failures.push(f) })
        loud()
        const data = res.success ? AnalysisResultsSchema.parse(res.data) : null
        assert(calls.length === 2 && calls[0].timeout === SCOUT_TIMEOUT_MS && calls[1].timeout === SNIPER_TIMEOUT_MS, 'vehicle: scout sent 45s, sniper sent 60s')
        assert(SCOUT_TIMEOUT_MS === 45_000 && SNIPER_TIMEOUT_MS === 60_000, 'the limits are 45s and 60s')
        assert(res.success && res.modelUsed === SCOUT_MODEL && data?.primary.model === 'Tacoma', 'vehicle: scout result kept, analysis succeeds')
        assert(data?.primary.confidence === FALLBACK_CONFIDENCE_CAP && data?.confidence_score === FALLBACK_CONFIDENCE_CAP, 'vehicle: primary.confidence and confidence_score capped at 79')
        assert(getConfidenceBand(data?.primary.confidence ?? 100) === 'Medium', 'vehicle: the label reads Medium, not High')
        assert(
            data?.sniperFallback?.reason === 'timeout' && data.sniperFallback.scoutConfidence === 92 && data.sniperFallback.scoutConfidenceScore === 80,
            'vehicle: sniperFallback records the reason and both scout numbers (and survives the schema)'
        )
        assert(failures.length === 1 && failures[0].stage === 'vehicle' && failures[0].reason === 'timeout', 'vehicle: onSniperFailure called once')
        assert(warnings.some(w => /^Sniper fallback \[timeout\] vehicle abc123 after \d+ms/.test(w)), 'vehicle: one searchable log line')
    }
    {
        stubGemini(req => { if (req.model === SNIPER_MODEL) throw sdkTimeout(); return product(70, 'Method') })
        quiet()
        const res = await refineProduct(imageParts, 'Wheels', '2020 Toyota Tacoma')
        loud()
        assert(res.brand === 'Method' && res.confidence === 70, 'product: scout result kept (70 is already under the cap)')
        assert(res.sniperFallback?.reason === 'timeout' && res.sniperFallback.scoutConfidence === 70, 'product: sniperFallback set')
    }
    {
        stubGemini(req => { if (req.model === SNIPER_MODEL) throw sdkTimeout(); return product(84, 'Method') })
        quiet()
        const res = await refineProduct(imageParts, 'Wheels', null)
        loud()
        assert(res.confidence === FALLBACK_CONFIDENCE_CAP && res.sniperFallback?.scoutConfidence === 84, 'product: 84 capped at 79, original kept')
    }
    {
        const calls = stubGemini(req => { if (req.model === SNIPER_MODEL) throw sdkTimeout(); return part(82, 'MAF Sensor') })
        quiet()
        const res = await runPartIdentification(imageParts, { ref: 'p1' })
        loud()
        assert(calls[1]?.timeout === SNIPER_TIMEOUT_MS, 'part: sniper sent 60s')
        assert(res.identification.partName === 'MAF Sensor' && res.modelUsed === SCOUT_MODEL, 'part: scout result kept')
        assert(res.identification.confidence === FALLBACK_CONFIDENCE_CAP, 'part: confidence capped at 79')
        assert(res.identification.sniperFallback?.reason === 'timeout' && res.identification.sniperFallback.scoutConfidence === 82, 'part: sniperFallback set')
        assert(warnings.some(w => /^Sniper fallback \[timeout\] part p1 after \d+ms/.test(w)), 'part: one searchable log line')
    }

    console.log('\nOther sniper failures')
    {
        stubGemini(req => (req.model === SNIPER_MODEL ? 'Sorry, I cannot help with that.' : part(60, 'MAF Sensor')))
        quiet()
        const res = await runPartIdentification(imageParts)
        loud()
        assert(res.identification.partName === 'MAF Sensor' && res.identification.sniperFallback?.reason === 'bad_output', 'invalid JSON: scout kept, marked bad_output')
    }
    {
        stubGemini(req => { if (req.model === SNIPER_MODEL) throw new Error('socket hang up'); return vehicle(60, 60) })
        quiet()
        const res = await runFitmentAnalysis(imageParts)
        loud()
        const fallback = res.success ? (res.data.sniperFallback as { reason?: string } | undefined) : undefined
        assert(res.success && fallback?.reason === 'unknown', 'any other error: scout kept, marked unknown')
    }
    {
        stubGemini(req => (req.model === SNIPER_MODEL ? vehicle(97, 97, 'Tundra') : vehicle(60, 60)))
        quiet()
        const res = await runFitmentAnalysis(imageParts)
        loud()
        const data = res.success ? AnalysisResultsSchema.parse(res.data) : null
        assert(data?.primary.model === 'Tundra' && data.primary.confidence === 97 && data.sniperFallback === undefined, 'sniper answers: its result wins, no cap, no marker')
    }

    // ----------------------------------------------------------------------
    console.log('\nScout timeout is a real failure')
    {
        stubGemini(() => { throw sdkTimeout() })
        quiet()
        const res = await runFitmentAnalysis(imageParts)
        loud()
        assert(!res.success && /timed out after 45000ms/.test(res.error), 'vehicle scout timeout fails the analysis with a clear message')
        assert(!res.success && classifyAnalysisError(res.error) === 'timeout', 'vehicle scout timeout classifies as timeout')
    }
    {
        stubGemini(() => { throw sdkTimeout() })
        quiet()
        let thrown: unknown = null
        try { await runPartIdentification(imageParts) } catch (err) { thrown = err }
        loud()
        assert(thrown instanceof Error && classifyAnalysisError(thrown) === 'timeout', 'part scout timeout throws and classifies as timeout')
    }
    {
        const { client, updates } = fakeSupabase()
        stubFetch()
        stubGemini(() => { throw sdkTimeout() })
        quiet()
        await runPartPipeline('p-timeout', 'https://example.com/a.jpg', client)
        loud()
        const last = updates[updates.length - 1] as Update & { error_details?: string }
        assert(last.status === 'error' && classifyAnalysisError(last.error_details ?? '') === 'timeout', 'pipeline: scout timeout ends as an error row that classifies as timeout')
    }

    // ----------------------------------------------------------------------
    console.log('\nSniper billing error: scout result kept and the alert sent')
    process.env.RESEND_API_KEY = 're_test'
    process.env.ALERT_EMAIL = 'alerts@example.com'
    {
        const { client, updates } = fakeSupabase()
        stubFetch()
        emails.length = 0
        stubGemini(req => { if (req.model === SNIPER_MODEL) throw billingError(); return part(82, 'MAF Sensor') })
        quiet()
        await runPartPipeline('p-billing', 'https://example.com/a.jpg', client)
        loud()
        const done = updates.find(u => u.status === 'complete')
        const stored = done?.result_data as { partName?: string; sniperFallback?: { reason?: string; scoutConfidence?: number } } | undefined
        assert(!updates.some(u => u.status === 'error'), 'part: the analysis does not fail')
        assert(stored?.partName === 'MAF Sensor' && stored.sniperFallback?.reason === 'billing', 'part: scout result stored with reason billing')
        assert(done?.confidence === FALLBACK_CONFIDENCE_CAP && stored?.sniperFallback?.scoutConfidence === 82, 'part: analyses.confidence is the capped 79, the original 82 is in result_data')
        assert(emails.length === 1 && emails[0].subject === 'VisualFitment: second check failing (billing)', 'part: one outage email sent')
    }
    {
        // An earlier fallback of the same kind 30 minutes ago: inside the 6-hour cooldown
        const earlier = { id: 'earlier', updated_at: new Date(Date.now() - 30 * 60_000).toISOString(), result_data: { sniperFallback: { reason: 'billing', scoutConfidence: 70 } }, detected_products: null }
        const { client } = fakeSupabase({ completeRows: [earlier] })
        stubFetch()
        emails.length = 0
        stubGemini(req => { if (req.model === SNIPER_MODEL) throw billingError(); return part(82, 'MAF Sensor') })
        quiet()
        await runPartPipeline('p-billing-2', 'https://example.com/a.jpg', client)
        loud()
        assert(emails.length === 0, 'a second billing fallback within 6 hours sends nothing')
    }
    {
        const { client, updates } = fakeSupabase()
        stubFetch()
        emails.length = 0
        stubGemini((req, prompt) => {
            if (req.model === SNIPER_MODEL) throw billingError()
            if (prompt.includes('minified JSON array of strings')) return []
            return vehicle(92, 80)
        })
        quiet()
        await runPipeline('v-billing', 'https://example.com/a.jpg', client)
        loud()
        const stored = updates.find(u => u.result_data)
        assert(updates[updates.length - 1].status === 'complete' && stored?.confidence === FALLBACK_CONFIDENCE_CAP, 'vehicle: completes, analyses.confidence is the capped 79')
        assert(emails.length === 1 && emails[0].subject === 'VisualFitment: second check failing (billing)', 'vehicle: one outage email sent')
    }
    {
        const { client } = fakeSupabase()
        stubFetch()
        emails.length = 0
        stubGemini(req => { if (req.model === SNIPER_MODEL) throw sdkTimeout(); return part(82, 'MAF Sensor') })
        quiet()
        await runPartPipeline('p-slow', 'https://example.com/a.jpg', client)
        loud()
        assert(emails.length === 0, 'a sniper timeout is not an outage: no email')
    }

    // ----------------------------------------------------------------------
    console.log('\nStale rule: a worst-case run is restamped in time')
    {
        // A clock we move by hand: every scout call takes its full 45s, every
        // sniper call hangs for its full 60s and then times out.
        const realNow = Date.now
        let clock = realNow()
        Date.now = () => clock
        const { client, updates } = fakeSupabase()
        stubFetch()
        const calls = stubGemini((req, prompt) => {
            if (req.model === SNIPER_MODEL) { clock += SNIPER_TIMEOUT_MS; throw sdkTimeout() }
            clock += SCOUT_TIMEOUT_MS
            if (prompt.includes('minified JSON array of strings')) return ['Wheels']
            if (prompt.startsWith('I have detected')) return product(70, 'Method')
            return vehicle(92, 80)
        })
        const started = clock
        quiet()
        await runPipeline('v-slow', 'https://example.com/a.jpg', client)
        loud()
        Date.now = realNow

        const stamps = updates.map(u => Date.parse(u.updated_at ?? ''))
        const gaps = stamps.slice(1).map((at, i) => at - stamps[i])
        const productsStart = Date.parse(updates.find(u => u.status === 'detecting_products')?.updated_at ?? '')
        assert(calls.map(c => c.model).join(',') === [SCOUT_MODEL, SNIPER_MODEL, SCOUT_MODEL, SCOUT_MODEL, SNIPER_MODEL].join(','), 'worst case ran: scout, sniper, detect, product scout, product sniper')
        assert(clock - started === 2 * SNIPER_TIMEOUT_MS + 3 * SCOUT_TIMEOUT_MS, 'the run took the full 255 seconds')
        assert(clock - productsStart === 150_000 && 150_000 > STALE_AFTER_MS, 'the products step alone took 150s, more than the 2-minute rule')
        assert(stamps.every(at => !Number.isNaN(at)), 'every write stamps updated_at')
        assert(Math.max(...gaps) < STALE_AFTER_MS, `the row is never older than 2 minutes (longest gap ${Math.max(...gaps) / 1000}s)`)
        assert(Math.max(...gaps) === SCOUT_TIMEOUT_MS + SNIPER_TIMEOUT_MS, 'the longest stretch is one scout plus one sniper (105s)')
        assert(updates[updates.length - 1].status === 'complete', 'and the analysis completes on the scout answers')
        const products = updates[updates.length - 1].detected_products as { sniperFallback?: { reason?: string } }[]
        assert(products?.[0]?.sniperFallback?.reason === 'timeout', 'the product carries its own sniperFallback')
    }

    globalThis.fetch = realFetch
    console.log(`\n${passed} passed, ${failed} failed`)
    if (failed > 0) process.exit(1)
}

run().catch(err => {
    loud()
    console.error(err)
    process.exit(1)
})
